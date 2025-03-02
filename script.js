let cache = null;
let itensFiltrados = [];
let paginaAtual = 30; // Onde a lista será iniciada
const itensPorPagina = 500; // Número de músicas na tela
// Armazenar favoritos no localStorage
let favoritos = [];
try {
    favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
} catch (e) {
    console.error('Erro ao carregar favoritos do localStorage:', e);
    localStorage.setItem('favoritos', JSON.stringify([])); // Reseta o localStorage se estiver corrompido
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

// Unificação da função toggleFavorito
function toggleFavorito(numeroStr) {
    if (!cache) {
        console.error('Cache não foi carregado.');
        return;
    }

    const numero = Number(numeroStr);
    const musica = cache.find(m => m.numero === numero);
    
    if (!musica) return; // Se não encontrar, sai da função
    
    const index = favoritos.findIndex(fav => fav.numero === numero);
    if (index === -1) {
        favoritos.push(musica); // Adiciona aos favoritos
    } else {
        favoritos.splice(index, 1); // Remove dos favoritos
    }
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos)); // Atualiza o localStorage
    atualizarCatalogo(); // Atualiza a exibição no catálogo
    if (window.location.pathname.endsWith('favoritos.html')) {
        exibirFavoritos(); // Atualiza a página de favoritos também
    }
}

function atualizarCatalogo() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const catalogo = document.getElementById('catalogo');
    
    // Renderiza os itens da lista no DOM
    catalogo.innerHTML = itensFiltrados
        .slice(inicio, fim)
		
		
        .map(musica => `
    <div class="item-lista" data-numero="${musica.numero}" data-cantor="${encodeURIComponent(musica.cantor)}" data-musica="${encodeURIComponent(musica.musica)}">
        <!-- Conteúdo principal do item -->
        <div class="conteudo-item">
            <span class="numero">${musica.numero || ''}</span>
            <span class="musica">${musica.musica || 'Título Desconhecido'}</span>
            <span class="cantor">${musica.cantor || 'Artista Desconhecido'}</span>
        </div>
        <!-- Botões do item -->
        <div class="botoes-item">
            <!-- Botão de Favoritos -->
            <span class="favorito-btn" onclick="toggleFavorito('${musica.numero}')">
                ${favoritos.some(fav => fav.numero === musica.numero) ? '❤️' : '🤍'}
            </span>
        </div>
    </div>
`).join('');

    // Adiciona eventos de clique aos itens da lista
    const itensLista = document.querySelectorAll('.item-lista');
    itensLista.forEach(item => {
        item.addEventListener('click', function (event) {
            // Verifica se o clique foi em um botão (YouTube ou Favoritos)
            if (event.target.closest('.favorito-btn') || event.target.closest('.assistir-btn')) {
                return; // Ignora o clique nos botões
            }

            // Captura os dados do item clicado
            const numero = this.getAttribute('data-numero');
            const cantor = decodeURIComponent(this.getAttribute('data-cantor'));
            const musica = decodeURIComponent(this.getAttribute('data-musica'));

            // Redireciona para a página de detalhes
            abrirDetalhes(numero, cantor, musica);
        });
    });

    // Atualiza a paginação
    atualizarPaginacao();
}

function abrirDetalhes(numero, cantor, musica) {
    const url = `detalhes.html?numero=${numero}&cantor=${encodeURIComponent(cantor)}&musica=${encodeURIComponent(musica)}`;
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

function filtrarCatalogo(event) {
    const termo = event.target.value.trim().toLowerCase();

    itensFiltrados = cache.filter(item => {
        const numero = item.numero?.toString().toLowerCase() || '';
        const musica = item.musica?.toString().toLowerCase() || '';
        const cantor = item.cantor?.toString().toLowerCase() || '';

        return numero.includes(termo) || musica.includes(termo) || cantor.includes(termo);
    });

    paginaAtual = 1;
    atualizarCatalogo();
}

// Função de debounce para otimizar a pesquisa
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

// Event Listeners com verificação de existência
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

// Registrar o Service Worker
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

// script.js
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
   // installButton.innerHTML = '📲 Instalar App';
    
    // Estilo do botão
    installButton.style.position = 'fixed';
    installButton.style.top = '10px';
    installButton.style.left = '0px';  // Alinhado à esquerda
    installButton.style.padding = '5px 5px';
    installButton.style.backgroundColor = '#4CAF50';  // Cor de fundo
    installButton.style.color = 'white';  // Cor do texto
    installButton.style.fontSize = '14px';
    installButton.style.fontWeight = 'bold';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '30px';  // Borda arredondada
    installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';  // Sombra sutil
    installButton.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';  // Transição suave
    installButton.style.zIndex = '10000';  // Garantindo que o botão fique acima de outros elementos
    
    // Efeito ao passar o mouse
    installButton.addEventListener('mouseover', () => {
        installButton.style.transform = 'scale(1.1)';
        installButton.style.boxShadow = '0px 8px 12px rgba(0, 0, 0, 0.3)';
    });

    installButton.addEventListener('mouseout', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.2)';
    });

    // Ação de clique
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

// Atualizar Service Worker quando nova versão estiver disponível
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
    favoritos.push("novo_item"); // Simula a adição de um item
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    
    location.reload(); // Atualiza a página após adicionar um favorito
}

function removerFavorito() {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    if (favoritos.length > 0) {
        favoritos.pop(); // Simula a remoção de um item
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
    }

    location.reload(); // Atualiza a página após remover um favorito
}

function compartilharWhatsApp() {
    const url = window.location.href;  // URL da página
    const texto = "Confira este conteúdo: ";  // Texto adicional
    const mensagem = encodeURIComponent(texto + url);  // Prepara a mensagem para o WhatsApp

    // URL de compartilhamento do WhatsApp
    const linkWhatsApp = 'https://wa.me/?text=' + mensagem;

    // Abre a URL do WhatsApp em uma nova aba
    window.open(linkWhatsApp, '_blank');
}









// Função para atualizar o contador de favoritos
function atualizarContadorFavoritos() {
    // Recupera a lista de favoritos do localStorage
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    // Encontra o elemento do contador no DOM
    let contadorElemento = document.querySelector('.favoritos-link .counter');
    
    // Atualiza o texto do contador com o número de favoritos
    if (contadorElemento) {
        contadorElemento.textContent = favoritos.length;
    }
}

// Função existente para alternar favoritos
function toggleFavorito(numeroStr) {
    if (!cache) {
        console.error('Cache não foi carregado.');
        return;
    }

    const numero = Number(numeroStr);
    const musica = cache.find(m => m.numero === numero);
    
    if (!musica) return; // Se não encontrar, sai da função
    
    const index = favoritos.findIndex(fav => fav.numero === numero);
    if (index === -1) {
        favoritos.push(musica);  // Adiciona aos favoritos
    } else {
        favoritos.splice(index, 1); // Remove dos favoritos
    }
    
    // Atualiza o localStorage
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    
    // Atualiza a exibição no catálogo
    atualizarCatalogo();
    
    // Atualiza o contador de favoritos
    atualizarContadorFavoritos();
    
    // Atualiza a página de favoritos, se estiver nela
    if (window.location.pathname.endsWith('favoritos.html')) {
        exibirFavoritos();
    }
}

// Inicialização: Atualiza o contador ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
    atualizarContadorFavoritos();
});










function mostrarMiniPlayer(botao, videoUrl) {
    // Fecha todos os mini players abertos
    const todosMiniPlayers = document.querySelectorAll('.mini-player-container');
    todosMiniPlayers.forEach(player => {
        fecharMiniPlayer(player);
    });

    // Encontra o contêiner do mini player associado ao botão clicado
    const container = botao.nextElementSibling;

    // Cria o botão de fechar
    const fecharBtn = document.createElement('button');
    fecharBtn.className = 'fechar-btn';
    fecharBtn.innerHTML = '×'; // Símbolo de "X" para fechar
    fecharBtn.addEventListener('click', () => {
        fecharMiniPlayer(container); // Fecha o mini player ao clicar no botão
    });

    // Cria o iframe do YouTube
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.width = '250';
    iframe.height = '140';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    // Limpa o conteúdo anterior do mini player
    container.innerHTML = '';

    // Adiciona o botão de fechar e o iframe ao mini player
    container.appendChild(fecharBtn);
    container.appendChild(iframe);
    container.style.display = 'block'; // Exibe o mini player
}

// Função para fechar o mini player
function fecharMiniPlayer(player) {
    const iframe = player.querySelector('iframe');
    if (iframe) {
        iframe.src = ''; // Para o vídeo
        player.removeChild(iframe); // Remove o iframe
    }
    player.style.display = 'none'; // Oculta o mini player
}






document.addEventListener('DOMContentLoaded', () => {
    // Adiciona um event listener para todos os links do YouTube na lista de favoritos
    const youtubeLinks = document.querySelectorAll('.youtube-link');
    youtubeLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o comportamento padrão de abrir o link em uma nova aba
            const videoUrl = link.getAttribute('href'); // Obtém o URL do vídeo
            mostrarMiniPlayer(link, videoUrl); // Chama a função para exibir o mini player
        });
    });
});

// Verifica se o Service Worker está disponível
if ('serviceWorker' in navigator) {
  // Registra o Service Worker
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registrado com sucesso:', registration);
    })
    .catch(error => {
      console.error('Falha ao registrar o Service Worker:', error);
    });

  // Escuta mensagens do Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.action === 'reload') {
      console.log('Nova versão disponível. Recarregando a página...');
      window.location.reload(); // Recarrega a página
    }
  });
}



// Inicialização
if (window.location.pathname.endsWith('favoritos.html')) {
    exibirFavoritos();
} else {
    carregarCatalogo();
}