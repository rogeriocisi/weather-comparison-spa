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

// Inicialização do Date Picker
const dateInput = document.getElementById('forecast-date');
const now = new Date();
const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

dateInput.value = today;
dateInput.min = today;

// Max date: 15 days from now
const maxDate = new Date();
maxDate.setDate(now.getDate() + 15);
const maxDateString = maxDate.getFullYear() + '-' + String(maxDate.getMonth() + 1).padStart(2, '0') + '-' + String(maxDate.getDate()).padStart(2, '0');
dateInput.max = maxDateString;

dateInput.addEventListener('change', () => {
    if (state.city1) fetchWeatherData(state.city1, 1);
    if (state.city2) fetchWeatherData(state.city2, 2);
});

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

// Função para obter bandeira do país (emoji)
function getCountryFlag(countryCode) {
    if (!countryCode) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
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

        // Filtra apenas resultados do Brasil, conforme solicitado - REMOVIDO
        if (!data.results) return [];
        return data.results;
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

        // Formatação bonita: Nome da cidade (Estado, País)
        const region = city.admin1 ? `${city.admin1}, ` : '';
        const country = city.country || city.country_code || '';
        item.innerHTML = `
            <span class="suggestion-highlight">${city.name}</span>
            <span class="suggestion-detail">${region}${country}</span>
            <span class="suggestion-flag">${getCountryFlag(city.country_code)}</span>
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
        const dateInput = document.getElementById('forecast-date');
        const selectedDate = dateInput.value;
        // Recalculate today string to ensure match
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const isToday = selectedDate === today;

        let url = `${WEATHER_API}?latitude=${city.latitude}&longitude=${city.longitude}&timezone=auto`;

        if (isToday) {
            url += `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`;
        } else {
            url += `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,wind_speed_10m_max&start_date=${selectedDate}&end_date=${selectedDate}`;
            // Fetch hourly for humidity estimation (noon)
            url += `&hourly=relative_humidity_2m`;
        }

        const response = await fetch(url);
        const data = await response.json();

        updateWeatherCard(data, cardId, isToday);
    } catch (error) {
        console.error('Erro ao buscar clima:', error);
        alert('Erro ao buscar dados do clima. Tente novamente.');
    }
}

function updateWeatherCard(data, cardId, isToday) {
    let temp, conditionCode, wind, humidity, feelsLike;

    if (isToday && data.current) {
        const current = data.current;
        temp = Math.round(current.temperature_2m);
        conditionCode = current.weather_code;
        wind = current.wind_speed_10m;
        humidity = current.relative_humidity_2m;
        feelsLike = Math.round(current.apparent_temperature);
    } else if (data.daily) {
        const daily = data.daily;
        // Show Max / Min for forecast
        const max = Math.round(daily.temperature_2m_max[0]);
        const min = Math.round(daily.temperature_2m_min[0]);
        temp = `${max}° / ${min}`;
        
        conditionCode = daily.weather_code[0];
        wind = daily.wind_speed_10m_max[0];
        
        // Estimate humidity from hourly (noon = index 12)
        if (data.hourly && data.hourly.relative_humidity_2m) {
             humidity = data.hourly.relative_humidity_2m[12];
        } else {
             humidity = '--';
        }

        feelsLike = Math.round(daily.apparent_temperature_max[0]);
    }

    const weatherInfo = getWeatherDescription(conditionCode);

    // Atualizar DOM
    const tempEl = document.getElementById(`temp-${cardId}`);
    tempEl.textContent = temp;
    
    // Adjust font size for longer forecast string
    if (typeof temp === 'string' && temp.includes('/')) {
        tempEl.style.fontSize = '2.5rem';
    } else {
        tempEl.style.removeProperty('font-size'); // Reset to CSS default
    }

    document.getElementById(`condition-${cardId}`).textContent = weatherInfo.text;
    document.getElementById(`icon-${cardId}`).textContent = weatherInfo.icon;

    document.getElementById(`wind-${cardId}`).textContent = `${wind} km/h`;
    document.getElementById(`humidity-${cardId}`).textContent = `${humidity}%`;
    document.getElementById(`feels-like-${cardId}`).textContent = `${feelsLike}°`;

    // Mostrar conteúdo e esconder placeholder
    document.getElementById(`placeholder-${cardId}`).classList.add('hidden');
    document.getElementById(`weather-content-${cardId}`).classList.remove('hidden');
}
