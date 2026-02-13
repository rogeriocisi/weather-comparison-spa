const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// Estado da aplicação
const state = {
    city1: null,
    city2: null
};

// Elementos do DOM
const inputs = {
    1: document.getElementById('city-input-1'),
    2: document.getElementById('city-input-2')
};
const suggestionLists = {
    1: document.getElementById('suggestions-1'),
    2: document.getElementById('suggestions-2')
};

// Funções Utilitárias

// Debounce para evitar chamadas excessivas na API
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mapeamento de códigos WMO para descrições e ícones (simplificado)
function getWeatherDescription(code) {
    const codes = {
        0: { text: 'Céu limpo', icon: '☀️' },
        1: { text: 'Parcialmente nublado', icon: '🌤️' },
        2: { text: 'Parcialmente nublado', icon: '🌤️' },
        3: { text: 'Nublado', icon: '☁️' },
        45: { text: 'Nevoeiro', icon: '🌫️' },
        48: { text: 'Nevoeiro com geada', icon: '🌫️' },
        51: { text: 'Garoa leve', icon: '🌧️' },
        53: { text: 'Garoa moderada', icon: '🌧️' },
        55: { text: 'Garoa densa', icon: '🌧️' },
        61: { text: 'Chuva fraca', icon: '🌧️' },
        63: { text: 'Chuva moderada', icon: '🌧️' },
        65: { text: 'Chuva forte', icon: '⛈️' },
        80: { text: 'Pancadas de chuva', icon: '🌦️' },
        81: { text: 'Pancadas fortes', icon: '🌦️' },
        82: { text: 'Tempestade violenta', icon: '⛈️' },
        95: { text: 'Tempestade', icon: '⛈️' },
        96: { text: 'Tempestade com granizo', icon: '⛈️' },
        99: { text: 'Tempestade forte com granizo', icon: '⛈️' }
    };
    return codes[code] || { text: 'Desconhecido', icon: '❓' };
}

// Lógica de Autocomplete
async function searchCities(query, cardId) {
    if (query.length < 3) return []; // Mínimo de 3 caracteres

    // Mostrar loading
    const inputWrapper = inputs[cardId].parentElement;
    const existingSpinner = inputWrapper.querySelector('.loading-spinner');
    if (!existingSpinner) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        inputWrapper.appendChild(spinner);
    }

    try {
        const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        // Remover loading
        const spinner = inputWrapper.querySelector('.loading-spinner');
        if (spinner) spinner.remove();

        // Filtra apenas resultados do Brasil, conforme solicitado
        if (!data.results) return [];
        return data.results.filter(city => city.country_code === 'BR');
    } catch (error) {
        console.error('Erro na busca:', error);
        // Remover loading em caso de erro
        const spinner = inputWrapper.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
        return [];
    }
}

function renderSuggestions(suggestions, cardId) {
    const list = suggestionLists[cardId];
    list.innerHTML = '';

    if (suggestions.length === 0) {
        list.classList.add('hidden');
        return;
    }

    suggestions.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';

        // Formatação bonita: Nome da cidade (Estado)
        const region = city.admin1 ? ` - ${city.admin1}` : '';
        item.innerHTML = `
            <span class="suggestion-highlight">${city.name}</span>
            <span class="suggestion-detail">${region}</span>
        `;

        item.addEventListener('click', () => {
            selectCity(city, cardId);
            list.classList.add('hidden');
        });

        list.appendChild(item);
    });

    list.classList.remove('hidden');
}

// Handler de Input
const handleInput = debounce(async (e, cardId) => {
    const query = e.target.value;
    if (query.length < 3) {
        suggestionLists[cardId].classList.add('hidden');
        return;
    }

    const suggestions = await searchCities(query, cardId);
    renderSuggestions(suggestions, cardId);
}, 300);

// Configurar Listeners
[1, 2].forEach(id => {
    inputs[id].addEventListener('input', (e) => handleInput(e, id));

    // Fechar sugestões ao clicar fora
    document.addEventListener('click', (e) => {
        if (!inputs[id].contains(e.target) && !suggestionLists[id].contains(e.target)) {
            suggestionLists[id].classList.add('hidden');
        }
    });
});

// Seleção de Cidade e Busca de Clima
async function selectCity(city, cardId) {
    inputs[cardId].value = city.name;
    state[`city${cardId}`] = city;

    // Atualizar UI básica
    document.getElementById(`name-${cardId}`).textContent = city.name;
    document.getElementById(`state-${cardId}`).textContent = city.admin1 || '';

    await fetchWeatherData(city, cardId);
}

async function fetchWeatherData(city, cardId) {
    try {
        // Pedindo dados atuais e hourly para tentar pegar umidade e sensação térmica mais precisos se possível
        // Mas Open-Meteo fornece current_weather e hourly.
        // Vamos usar current para básico e hourly para refinar se precisar.
        // O parâmetro 'apparent_temperature' em 'hourly' dá a sensação térmica.
        // A umidade relativa também está em 'hourly'.

        const url = `${WEATHER_API}?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo`;

        const response = await fetch(url);
        const data = await response.json();

        updateWeatherCard(data, cardId);
    } catch (error) {
        console.error('Erro ao buscar clima:', error);
        alert('Erro ao buscar dados do clima. Tente novamente.');
    }
}

function updateWeatherCard(data, cardId) {
    const current = data.current;

    const weatherInfo = getWeatherDescription(current.weather_code);

    // Atualizar DOM
    document.getElementById(`temp-${cardId}`).textContent = Math.round(current.temperature_2m);
    document.getElementById(`condition-${cardId}`).textContent = weatherInfo.text;
    document.getElementById(`icon-${cardId}`).textContent = weatherInfo.icon;

    document.getElementById(`wind-${cardId}`).textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById(`humidity-${cardId}`).textContent = `${current.relative_humidity_2m}%`;
    document.getElementById(`feels-like-${cardId}`).textContent = `${Math.round(current.apparent_temperature)}°`;

    // Mostrar conteúdo e esconder placeholder
    document.getElementById(`placeholder-${cardId}`).classList.add('hidden');
    document.getElementById(`weather-content-${cardId}`).classList.remove('hidden');
}
