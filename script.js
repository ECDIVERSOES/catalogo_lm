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

// ============================================
// FUNÇÕES PARA SALVAR E RESTAURAR ESTADO
// ============================================

function salvarEstadoIndex() {
    try {
        localStorage.setItem('ultimaPaginaIndex', paginaAtual);
        
        const pesquisaInput = document.getElementById('pesquisa');
        if (pesquisaInput && pesquisaInput.value) {
            sessionStorage.setItem('termoPesquisaIndex', pesquisaInput.value);
        } else {
            sessionStorage.removeItem('termoPesquisaIndex');
        }
        
        // ============================================
        // SALVA QUAL BOTÃO DE FILTRO ESTÁ ATIVO
        // ============================================
        const btnTodas = document.getElementById('btn-todas');
        const btnGospel = document.getElementById('btn-gospel');
        const btnKpop = document.getElementById('btn-kpop');
        const btnInfantil = document.getElementById('btn-infantil');
        
        if (btnGospel && btnGospel.classList.contains('ativo')) {
            sessionStorage.setItem('filtroAtivo', 'gospel');
        } else if (btnKpop && btnKpop.classList.contains('ativo')) {
            sessionStorage.setItem('filtroAtivo', 'kpop');
        } else if (btnInfantil && btnInfantil.classList.contains('ativo')) {
            sessionStorage.setItem('filtroAtivo', 'infantil');
        } else {
            sessionStorage.setItem('filtroAtivo', 'todas');
        }
        
        const scrollContainer = document.querySelector('.conteudo-rolavel');
        if (scrollContainer) {
            localStorage.setItem('scrollIndex', scrollContainer.scrollTop);
        }
    } catch(e) {
        console.log('Erro ao salvar estado:', e);
    }
}

function restaurarEstadoIndex() {
    try {
        const ultimaPagina = localStorage.getItem('ultimaPaginaIndex');
        if (ultimaPagina && ultimaPagina !== 'null' && parseInt(ultimaPagina) > 0) {
            paginaAtual = parseInt(ultimaPagina);
        }
        
        const termoPesquisa = sessionStorage.getItem('termoPesquisaIndex');
        const pesquisaInput = document.getElementById('pesquisa');
        
        if (termoPesquisa && pesquisaInput) {
            pesquisaInput.value = termoPesquisa;
            setTimeout(() => {
                const event = new Event('input', { bubbles: true });
                pesquisaInput.dispatchEvent(event);
            }, 200);
        }
        
        // ============================================
        // RESTAURA QUAL BOTÃO DE FILTRO ESTAVA ATIVO
        // ============================================
        const filtroAtivo = sessionStorage.getItem('filtroAtivo');
        if (filtroAtivo && filtroAtivo !== 'todas' && cache) {
            setTimeout(() => {
                if (filtroAtivo === 'gospel') {
                    filtrarPorGenero('gospel');
                } else if (filtroAtivo === 'kpop') {
                    filtrarPorGenero('kpop');
                } else if (filtroAtivo === 'infantil') {
                    filtrarPorGenero('infantil');
                }
            }, 350);
        }
    } catch(e) {
        console.log('Erro ao restaurar estado:', e);
    }
}

function restaurarScrollIndex() {
    const scrollContainer = document.querySelector('.conteudo-rolavel');
    const scrollPosition = localStorage.getItem('scrollIndex');
    if (scrollContainer && scrollPosition && scrollPosition !== 'null') {
        setTimeout(() => {
            scrollContainer.scrollTop = parseInt(scrollPosition);
            localStorage.removeItem('scrollIndex');
        }, 300);
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

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
        restaurarEstadoIndex();
        atualizarCatalogo();
        restaurarScrollIndex();
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
    atualizarContadorFavoritos();
    if (window.location.pathname.endsWith('favoritos.html')) {
        exibirFavoritos();
    }
}

function atualizarCatalogo() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const catalogo = document.getElementById('catalogo');
    
    if (!catalogo) return;
    
    // Salva a posição do scroll antes de recarregar
    const scrollContainer = document.querySelector('.conteudo-rolavel');
    if (scrollContainer) {
        localStorage.setItem('scrollIndex', scrollContainer.scrollTop);
    }
    
    if (itensFiltrados.length === 0) {
        catalogo.innerHTML = '<div style="text-align:center; padding:20px;">Nenhuma música encontrada.</div>';
        atualizarPaginacao();
        return;
    }
    
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

            salvarEstadoIndex();
            abrirDetalhes(numero, cantor, musica, genero);
        });
    });

    atualizarPaginacao();
    salvarEstadoIndex();
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

function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filtrarCatalogo(event) {
    const termo = removerAcentos(event.target.value.trim().toLowerCase());

    if (termo === '') {
        sessionStorage.removeItem('termoPesquisaIndex');
    } else {
        sessionStorage.setItem('termoPesquisaIndex', event.target.value.trim());
    }

    itensFiltrados = cache.filter(item => {
        const numero = removerAcentos(item.numero?.toString().toLowerCase() || '');
        const musica = removerAcentos(item.musica?.toString().toLowerCase() || '');
        const cantor = removerAcentos(item.cantor?.toString().toLowerCase() || '');
        const genero = removerAcentos(item.genero?.toString().toLowerCase() || '');

        return numero.includes(termo) || musica.includes(termo) || cantor.includes(termo) || genero.includes(termo);
    });

    const resultadoPesquisa = document.getElementById('resultado-pesquisa');
    if (resultadoPesquisa) {
        if (termo === '') {
            resultadoPesquisa.textContent = '';
            resultadoPesquisa.style.display = 'none';
        } else {
            resultadoPesquisa.textContent = `${termo.toUpperCase()} - ${itensFiltrados.length} `;
            resultadoPesquisa.style.display = 'block';
        }
    }

    paginaAtual = 1;
    atualizarCatalogo();
}

// ============================================
// BOTÕES DE ATALHO (GOSPEL / K-POP / INFANTIL / TODAS)
// ============================================

function filtrarPorGenero(genero) {
    if (!cache) return;
    
    const resultadoPesquisa = document.getElementById('resultado-pesquisa');
    const btnTodas = document.getElementById('btn-todas');
    const btnGospel = document.getElementById('btn-gospel');
    const btnKpop = document.getElementById('btn-kpop');
    const btnInfantil = document.getElementById('btn-infantil');
    const pesquisaInput = document.getElementById('pesquisa');
    
    // ============================================
    // SALVA A PÁGINA ATUAL E SCROLL ANTES DE FILTRAR
    // ============================================
    if (genero !== 'todas') {
        // Salva a página atual onde estava antes de filtrar
        localStorage.setItem('paginaTodas', paginaAtual);
        // Salva o scroll
        const scrollContainer = document.querySelector('.conteudo-rolavel');
        if (scrollContainer) {
            localStorage.setItem('scrollTodas', scrollContainer.scrollTop);
        }
    }
    
    if (genero === 'gospel') {
        itensFiltrados = cache.filter(item => {
            const generoItem = (item.genero || '').toLowerCase();
            return generoItem === 'gospel' || generoItem.includes('gospel');
        });
        
        if (resultadoPesquisa) {
            resultadoPesquisa.textContent = `✝️ GOSPEL - ${itensFiltrados.length} músicas ✝️`;
            resultadoPesquisa.style.display = 'block';
        }
        
        if (btnGospel) btnGospel.classList.add('ativo');
        if (btnTodas) btnTodas.classList.remove('ativo');
        if (btnKpop) btnKpop.classList.remove('ativo');
        if (btnInfantil) btnInfantil.classList.remove('ativo');
        
        if (pesquisaInput && pesquisaInput.value !== '') {
            pesquisaInput.value = '';
            sessionStorage.removeItem('termoPesquisaIndex');
        }
        
        paginaAtual = 1;
        atualizarCatalogo();
        
    } 
    else if (genero === 'kpop') {
        itensFiltrados = cache.filter(item => {
            const generoItem = (item.genero || '').toLowerCase();
            return generoItem === 'kpop' || generoItem.includes('kpop') || generoItem.includes('k-pop');
        });
        
        if (resultadoPesquisa) {
            resultadoPesquisa.textContent = `🇰🇷 K-POP - ${itensFiltrados.length} músicas 🇰🇷`;
            resultadoPesquisa.style.display = 'block';
        }
        
        if (btnKpop) btnKpop.classList.add('ativo');
        if (btnTodas) btnTodas.classList.remove('ativo');
        if (btnGospel) btnGospel.classList.remove('ativo');
        if (btnInfantil) btnInfantil.classList.remove('ativo');
        
        if (pesquisaInput && pesquisaInput.value !== '') {
            pesquisaInput.value = '';
            sessionStorage.removeItem('termoPesquisaIndex');
        }
        
        paginaAtual = 1;
        atualizarCatalogo();
        
    }
    else if (genero === 'infantil') {
        itensFiltrados = cache.filter(item => {
            const generoItem = (item.genero || '').toLowerCase();
            return generoItem === 'infantil' || 
                   generoItem.includes('infantil') || 
                   generoItem === 'kids' ||
                   generoItem.includes('kids') ||
                   generoItem === 'criança' ||
                   generoItem === 'criancas' ||
                   generoItem === 'infantojuvenil';
        });
        
        if (resultadoPesquisa) {
            resultadoPesquisa.textContent = `🧸 INFANTIL - ${itensFiltrados.length} músicas 🧸`;
            resultadoPesquisa.style.display = 'block';
        }
        
        if (btnInfantil) btnInfantil.classList.add('ativo');
        if (btnTodas) btnTodas.classList.remove('ativo');
        if (btnGospel) btnGospel.classList.remove('ativo');
        if (btnKpop) btnKpop.classList.remove('ativo');
        
        if (pesquisaInput && pesquisaInput.value !== '') {
            pesquisaInput.value = '';
            sessionStorage.removeItem('termoPesquisaIndex');
        }
        
        paginaAtual = 1;
        atualizarCatalogo();
        
    }
    else {
        // ============================================
        // TODAS - RESTAURA A PÁGINA E SCROLL ANTERIORES
        // ============================================
        itensFiltrados = [...cache];
        
        if (resultadoPesquisa) {
            resultadoPesquisa.textContent = '';
            resultadoPesquisa.style.display = 'none';
        }
        
        if (btnTodas) btnTodas.classList.add('ativo');
        if (btnGospel) btnGospel.classList.remove('ativo');
        if (btnKpop) btnKpop.classList.remove('ativo');
        if (btnInfantil) btnInfantil.classList.remove('ativo');
        
        // Restaura a página anterior
        const paginaSalva = localStorage.getItem('paginaTodas');
        if (paginaSalva && parseInt(paginaSalva) > 0) {
            paginaAtual = parseInt(paginaSalva);
            console.log('🔄 Página restaurada:', paginaAtual);
        } else {
            paginaAtual = 1;
        }
        
        atualizarCatalogo();
        
        // Restaura o scroll após a lista carregar
        setTimeout(() => {
            const scrollSalvo = localStorage.getItem('scrollTodas');
            const scrollContainer = document.querySelector('.conteudo-rolavel');
            if (scrollContainer && scrollSalvo && scrollSalvo !== 'null') {
                scrollContainer.scrollTop = parseInt(scrollSalvo);
                console.log('📜 Scroll restaurado:', scrollSalvo);
            }
        }, 150);
    }
    
    salvarEstadoIndex();
}

// ============================================
// EXPORTA A FUNÇÃO PARA USO EXTERNO (HTML)
// ============================================

window.filtrarPorGeneroExterno = filtrarPorGenero;

// ============================================
// DEBOUNCE E EVENTOS
// ============================================

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
const btnTodas = document.getElementById('btn-todas');
const btnGospel = document.getElementById('btn-gospel');
const btnKpop = document.getElementById('btn-kpop');
const btnInfantil = document.getElementById('btn-infantil');

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

if (btnTodas) {
    btnTodas.addEventListener('click', () => filtrarPorGenero('todas'));
}

if (btnGospel) {
    btnGospel.addEventListener('click', () => filtrarPorGenero('gospel'));
}

if (btnKpop) {
    btnKpop.addEventListener('click', () => filtrarPorGenero('kpop'));
}

if (btnInfantil) {
    btnInfantil.addEventListener('click', () => filtrarPorGenero('infantil'));
}

// Escuta eventos personalizados do HTML
window.addEventListener('filtroGenero', (event) => {
    if (event.detail && event.detail.genero) {
        filtrarPorGenero(event.detail.genero);
    }
});

// ============================================
// SERVICE WORKER (PWA)
// ============================================

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

// ============================================
// CONTADOR DE FAVORITOS
// ============================================

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

// ============================================
// INICIALIZAÇÃO
// ============================================

if (window.location.pathname.endsWith('favoritos.html')) {
    if (typeof exibirFavoritos === 'function') exibirFavoritos();
} else {
    carregarCatalogo();
}

// ============================================
// FUNÇÕES GLOBAIS
// ============================================

function enviarPedidoWhatsApp() {
    const numeroWhatsApp = "5522999292436";
    const mensagem = "Olá! Gostaria de solicitar uma música para o catálogo.%0A%0A" +
                     "*Cantor:* %0A" +
                     "*Música:* %0A%0A" +
                     "Os pedidos serão incluídos na próxima atualização.%0A" +
                     "Obrigado por ajudar a manter nosso repertório atualizado! 🎤";
    
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;
    window.open(linkWhatsApp, '_blank');
}

function compartilharWhatsApp() {
    const url = window.location.href;
    const texto = "Confira este conteúdo: ";
    const mensagem = encodeURIComponent(texto + url);
    const linkWhatsApp = 'https://wa.me/?text=' + mensagem;
    window.open(linkWhatsApp, '_blank');
}

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

function exibirFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const catalogo = document.getElementById('catalogo');
    
    if (!catalogo) return;
    
    if (favoritos.length === 0) {
        catalogo.innerHTML = '<div id="mensagem-favoritos">❤️ Nenhum favorito adicionado ainda ❤️</div>';
        return;
    }
    
    catalogo.innerHTML = favoritos.map(musica => `
        <div class="item-lista" data-numero="${musica.numero}" data-cantor="${encodeURIComponent(musica.cantor)}" data-musica="${encodeURIComponent(musica.musica)}">
            <div class="conteudo-item">
                <span class="numero">${musica.numero || ''}</span>
                <span class="musica">${musica.musica || 'Título Desconhecido'}</span>
                <span class="cantor">${musica.cantor || 'Artista Desconhecido'}</span>
            </div>
            <div class="botoes-item">
                <span class="favorito-btn" onclick="toggleFavorito('${musica.numero}')">❤️</span>
            </div>
        </div>
    `).join('');
}
