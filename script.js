let cache = null;
let itensFiltrados = [];
let paginaAtual = 30;
const itensPorPagina = 500;
let favoritos = [];
try {
    favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
} catch (e) {
    console.error('Erro ao carregar favoritos do localStorage:', e);
    localStorage.setItem('favoritos', JSON.stringify([]));
}

async function carregarCatalogo() {
    const aviso = document.getElementById('aviso');
    aviso.textContent = 'Carregando catálogo...';
    aviso.style.color = '#fff';

    try {
        if (!cache) {
            const response = await fetch('songs.json');
            if (!response.ok) throw new Error('Erro ao carregar dados');
            cache = await response.json();
            itensFiltrados = [...cache];
        }

        aviso.textContent = '';
        atualizarCatalogo();
    } catch (erro) {
        aviso.textContent = 'Erro ao carregar o catálogo. Atualize a página.';
        aviso.style.color = '#ff6f61';
        console.error(erro);
    }
}

function toggleFavorito(numeroStr) {
    if (!cache) {
        console.error('Cache não foi carregado.');
        return;
    }

    const numero = Number(numeroStr);
    const musica = cache.find(m => m.numero === numero);
    
    if (!musica) return;
    
    const index = favoritos.findIndex(fav => fav.numero === numero);
    if (index === -1) {
        favoritos.push(musica);
    } else {
        favoritos.splice(index, 1);
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    atualizarCatalogo();
    atualizarContadorFavoritos(); // Atualiza o contador em tempo real
    if (window.location.pathname.endsWith('favoritos.html')) {
        exibirFavoritos();
    }
}

function atualizarCatalogo() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const catalogo = document.getElementById('catalogo');
    
    catalogo.innerHTML = itensFiltrados
        .slice(inicio, fim)
        .map(musica => `
            <div class="item-lista" data-numero="${musica.numero}" data-cantor="${encodeURIComponent(musica.cantor)}" data-musica="${encodeURIComponent(musica.musica)}" data-genero="${encodeURIComponent(musica.genero || 'Gênero Desconhecido')}">
                <div class="conteudo-item">
                    <span class="numero">${musica.numero || ''}</span>
                    <span class="musica">${musica.musica || 'Título Desconhecido'}</span>
                    <span class="cantor">${musica.cantor || 'Artista Desconhecido'}</span>
                    <span class="genero">${musica.genero || 'Gênero Desconhecido'}</span>
                </div>
                <div class="botoes-item">
                    <span class="favorito-btn" onclick="toggleFavorito('${musica.numero}')">
                        ${favoritos.some(fav => fav.numero === musica.numero) ? '❤️' : '🤍'}
                    </span>
                </div>
            </div>
        `).join('');

    const itensLista = document.querySelectorAll('.item-lista');
    itensLista.forEach(item => {
        item.addEventListener('click', function (event) {
            if (event.target.closest('.favorito-btn') || event.target.closest('.assistir-btn')) {
                return;
            }

            const numero = this.getAttribute('data-numero');
            const cantor = decodeURIComponent(this.getAttribute('data-cantor'));
            const musica = decodeURIComponent(this.getAttribute('data-musica'));
            const genero = decodeURIComponent(this.getAttribute('data-genero'));

            abrirDetalhes(numero, cantor, musica, genero);
        });
    });

    atualizarPaginacao();
}

function abrirDetalhes(numero, cantor, musica, genero) {
    const url = `detalhes.html?numero=${numero}&cantor=${encodeURIComponent(cantor)}&musica=${encodeURIComponent(musica)}&genero=${encodeURIComponent(genero)}`;
    window.location.href = url;
}

function atualizarPaginacao() {
    const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
    
    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.textContent = " " + paginaAtual + " de " + totalPaginas;
    }

    const btnAnterior = document.getElementById('anterior');
    const btnProximo = document.getElementById('proximo');

    if (btnAnterior) btnAnterior.disabled = paginaAtual <= 1;
    if (btnProximo) btnProximo.disabled = paginaAtual >= totalPaginas;
}

// Função para remover acentos
function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filtrarCatalogo(event) {
    const termo = removerAcentos(event.target.value.trim().toLowerCase());

    itensFiltrados = cache.filter(item => {
        const numero = removerAcentos(item.numero?.toString().toLowerCase() || '');
        const musica = removerAcentos(item.musica?.toString().toLowerCase() || '');
        const cantor = removerAcentos(item.cantor?.toString().toLowerCase() || '');
        const genero = removerAcentos(item.genero?.toString().toLowerCase() || '');

        return numero.includes(termo) || musica.includes(termo) || cantor.includes(termo) || genero.includes(termo);
    });

    // Atualiza o resultado da pesquisa
    const resultadoPesquisa = document.getElementById('resultado-pesquisa');
    if (resultadoPesquisa) {
        if (termo === '') {
            resultadoPesquisa.textContent = ''; // Limpa o resultado se não houver pesquisa
            resultadoPesquisa.style.display = 'none'; // Oculta o elemento
        } else {
            resultadoPesquisa.textContent = `${termo.toUpperCase()} - ${itensFiltrados.length} encontradas`;
            resultadoPesquisa.style.display = 'block'; // Exibe o elemento
        }
    }

    paginaAtual = 1;
    atualizarCatalogo();
}

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const pesquisaInput = document.getElementById('pesquisa');
const btnAnterior = document.getElementById('anterior');
const btnProximo = document.getElementById('proximo');

if (pesquisaInput) {
    pesquisaInput.addEventListener('input', debounce(filtrarCatalogo, 300));
}

if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            atualizarCatalogo();
        }
    });
}

if (btnProximo) {
    btnProximo.addEventListener('click', () => {
        if (paginaAtual < Math.ceil(itensFiltrados.length / itensPorPagina)) {
            paginaAtual++;
            atualizarCatalogo();
        }
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch((error) => {
                console.log('Falha ao registrar o Service Worker:', error);
            });
    });
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    setTimeout(() => {
        if (deferredPrompt) {
            showInstallPromotion();
        }
    }, 5000);
});

function showInstallPromotion() {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.innerHTML = '📲 Install';
    installButton.style.position = 'fixed';
    installButton.style.top = '10px';
    installButton.style.left = '0px';
    installButton.style.padding = '5px 5px';
    installButton.style.backgroundColor = '#4CAF50';
    installButton.style.color = 'white';
    installButton.style.fontSize = '14px';
    installButton.style.fontWeight = 'bold';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '30px';
    installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';
    installButton.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    installButton.style.zIndex = '10000';

    installButton.addEventListener('mouseover', () => {
        installButton.style.transform = 'scale(1.1)';
        installButton.style.boxShadow = '0px 8px 12px rgba(0, 0, 0, 0.3)';
    });

    installButton.addEventListener('mouseout', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';
    });

    installButton.addEventListener('click', async () => {
        installButton.style.display = 'none';
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
            }
            deferredPrompt = null;
        }
    });
    
    document.body.appendChild(installButton);
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", atualizarFavoritos);

function atualizarFavoritos() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    document.querySelector(".favoritos-link .counter").textContent = favoritos.length;
}

function adicionarFavorito() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos.push("novo_item");
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    location.reload();
}

function removerFavorito() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    if (favoritos.length > 0) {
        favoritos.pop();
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
    }
    location.reload();
}

function compartilharWhatsApp() {
    const url = window.location.href;
    const texto = "Confira este conteúdo: ";
    const mensagem = encodeURIComponent(texto + url);
    const linkWhatsApp = 'https://wa.me/?text=' + mensagem;
    window.open(linkWhatsApp, '_blank');
}

function atualizarContadorFavoritos() {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    let contadorElemento = document.querySelector('.favoritos-link .counter');
    if (contadorElemento) {
        contadorElemento.textContent = favoritos.length;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    atualizarContadorFavoritos();
});

if (window.location.pathname.endsWith('favoritos.html')) {
    exibirFavoritos();
} else {
    carregarCatalogo();
}