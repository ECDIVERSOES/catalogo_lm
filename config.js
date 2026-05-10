// config.js
const CONFIG = {
    modoFull: true,      // ← agora começa como true (FULL)
    rangeMin: 1001,
    rangeMax: 50001
};

function loadConfig() {
    const saved = localStorage.getItem('modoFull');
    if (saved !== null) {
        CONFIG.modoFull = saved === 'true';
    }
    return CONFIG.modoFull;
}

function setModoFull(ativado) {
    CONFIG.modoFull = ativado;
    localStorage.setItem('modoFull', ativado);
}

function toggleModoFull() {
    const novoModo = !loadConfig();
    setModoFull(novoModo);
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return novoModo;
}

function isModoFull() {
    return loadConfig();
}
