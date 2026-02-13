# 2Climas - Comparador de Clima 🌦️

2Climas é uma Single Page Application (SPA) moderna e interativa que permite comparar o clima de duas cidades brasileiras em tempo real. Desenvolvida com HTML5, CSS3 e JavaScript Vanilla, ela utiliza a API Open-Meteo para fornecer dados precisos e atualizados.


## ✨ Funcionalidades

- **Comparação Lado a Lado**: visualize as condições climáticas de duas cidades simultaneamente.
- **Busca Inteligente**: Pesquise cidades brasileiras com sugestões automáticas enquanto digita.
- **Dados Detalhados**:
    - Temperatura atual
    - Condição do tempo (com ícones descritivos)
    - Velocidade do vento
    - Umidade relativa
    - Sensação térmica
- **Interface Responsiva**: Design moderno com efeito "Glassmorphism" que se adapta a diferentes tamanhos de tela.
- **Micro-interações**: Feedback visual ao navegar e buscar cidades.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+)
- **API de Dados**: [Open-Meteo API](https://open-meteo.com/) (Gratuita e open-source)
    - Endpoint de Geocoding para busca de cidades
    - Endpoint de Forecast para dados meteorológicos
- **Estilização**: CSS Custom Properties (Variáveis), Flexbox, CSS Grid.

## 🚀 Como Executar Localmente

Você pode rodar este projeto de duas formas simples:

### Opção 1: Abrir diretamente no navegador
Basta abrir o arquivo `index.html` em seu navegador preferido (Chrome, Firefox, Edge, etc).

### Opção 2: Servidor Local (Recomendado)
Para evitar limitações de CORS ou problemas com carregamento de recursos locais, recomenda-se usar um servidor HTTP simples.

Se você tem Python instalado:
```bash
# Na pasta do projeto
python -m http.server 8000
```
Depois, acesse `http://localhost:8000` no seu navegador.

Se você tem Node.js/NPM instalado:
```bash
npx live-server
```

## 📂 Estrutura do Projeto

```
/
├── index.html      # Estrutura principal da página
├── style.css       # Estilos e design visual
├── script.js       # Lógica da aplicação e comunicação com API
└── README.md       # Documentação do projeto
```

## 📝 Notas
- A busca está configurada para filtrar apenas cidades do **Brasil** (`country_code=BR`).
- A aplicação utiliza `localStorage` ou apenas estado em memória (verificar implementação) para manter a fluidez.

---
Desenvolvido com 💙 por [@rogeriocisi]


[def]: placeholder_seria_legal_ter_um_screenshot_aqui.png