// =================================================================
// ===== VARIÁVEIS GLOBAIS =====
// =================================================================
// Configurações de UI
// let zoomIn = false;           // Controla zoom de imagens
let livroAtual = null;        // Livro sendo visualizado/alterado
let modoEdicao = false;       // Controla modo de edição
let flipbookInicializado = false; // Controla estado do flipbook

// Dados persistentes
let favoritos = []; // Índices dos livros favoritos do usuário atual
let livros = JSON.parse(localStorage.getItem('livros')) || [];       // Lista completa
let curtidasUsuario = JSON.parse(localStorage.getItem('curtidasUsuario')) || {}; // Curtidas por usuário

// =================================================================
// ===== FUNÇÕES INTEGRADAS =====
// =================================================================

// VERIFICAÇÃO DE DEPENDÊNCIAS
window.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando dependências...');
    
    // Verifica se jQuery está carregado
    if (typeof jQuery === 'undefined') {
        console.error('❌ jQuery não está carregado!');
        alert('Erro: jQuery não foi carregado. A aplicação não funcionará corretamente.');
        return;
    }
    
    // Verifica se zoom.js está carregado (se necessário)
    if (typeof $.fn.zoom === 'undefined') {
        console.warn('⚠️ Zoom.js não está disponível');
    }
    
    // Verifica se Turn.js está carregado
    if (typeof $.fn.turn === 'undefined') {
        console.warn('⚠️ Turn.js não está disponível');
    }
    
    console.log('✅ Dependências verificadas com sucesso');
});

/* Função que atualiza a "profundidade" (depth) visual do livro */
function updateDepth(book, newPage) {
    var page = book.turn('page'),
        pages = book.turn('pages'),
        depthWidth = 16 * Math.min(1, page * 2 / pages);

    newPage = newPage || page;

    if (newPage > 3)
        $('.ej-book .front-side .depth').css({
            width: depthWidth,
            left: 20 - depthWidth
        });
    else
        $('.ej-book .front-side .depth').css({ width: 0 });

    depthWidth = 16 * Math.min(1, (pages - page) * 2 / pages);

    if (newPage < pages - 3)
        $('.ej-book .back-side .depth').css({
            width: depthWidth,
            right: 20 - depthWidth
        });
    else
        $('.ej-book .back-side .depth').css({ width: 0 });
}

/* Função que calcula o número de visualizações (views) do livro */
function numberOfViews(book) {
    return book.turn('pages') / 2 + 1;
}

/* Função que obtém o número da visão/visão atual a partir da página */
function getViewNumber(book, page) {
    return parseInt((page || book.turn('page')) / 2 + 1, 10);
}

/* Função simples que detecta se o navegador é Chrome */
function isChrome() {
    return navigator.userAgent.indexOf('Chrome') != -1;
}

/* Função que ajusta o zIndex do handle do slider durante animações */
function moveBar(yes) {
    if (Modernizr && Modernizr.csstransforms) {
        $('#slider .ui-slider-handle').css({
            zIndex: yes ? -1 : 10000
        });
    }
}

/* Função que desfaz o zoom e restaura o livro ao estado normal */
function zoomOut() {
    var transitionEnd = $.cssTransitionEnd(),
        completeTransition = function(e) {
            $('#book-zoom').unbind(transitionEnd);
            $('.ej-book').turn('disable', false);
            $('body').css({ 'overflow': 'auto' });
            moveBar(false);
        };

    $('.ej-book').data().zoomIn = false;
    $(window).unbind('resize', zoomOut);
    moveBar(true);

    $('.zoom-pic').remove();
    $('#book-zoom').transform('scale(1, 1)');
    $('.samples .bar').css({ visibility: 'visible' });
    $('#slider-bar').show();

    if (transitionEnd)
        $('#book-zoom').bind(transitionEnd, completeTransition);
    else
        setTimeout(completeTransition, 1000);
}

// ===== ADICIONAR BOTÕES DE FAVORITO VISUAIS =====
function adicionarBotoesFavoritos() {
    console.log('⭐ Adicionando botões de favorito visuais...');
    
    const todosLivros = document.querySelectorAll('.book');
    console.log(`⭐ Encontrados ${todosLivros.length} livros`);
    
    todosLivros.forEach((livro, index) => {
        // Encontrar o índice real do livro
        const livroElement = livro;
        let livroIndex = -1;
        
        // Tentar encontrar pelo data-index ou pelo título
        if (livroElement.dataset.index) {
            livroIndex = parseInt(livroElement.dataset.index);
        } else {
            // Buscar pelo título na lista de livros
            const titulo = livroElement.querySelector('.titulo')?.textContent;
            if (titulo) {
                livroIndex = livros.findIndex(l => l.titulo === titulo);
            }
        }
        
        if (livroIndex === -1) {
            console.log(`⚠️ Não foi possível encontrar índice para livro: ${livro.querySelector('.titulo')?.textContent}`);
            return;
        }
        
        // Verificar se já tem botão de favorito
        if (livro.querySelector('.btn-favorite')) {
            // Apenas atualizar o estado existente
            const btnFavorito = livro.querySelector('.btn-favorite');
            const isFavorito = favoritos.includes(livroIndex);
            
            btnFavorito.innerHTML = isFavorito ? '😃' : '🤍';
            btnFavorito.className = `btn-favorite ${isFavorito ? 'favorited' : ''}`;
            btnFavorito.title = isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
            return;
        }
        
        const isFavorito = favoritos.includes(livroIndex);
        
        const btnFavorito = document.createElement('button');
        btnFavorito.className = `btn-favorite ${isFavorito ? 'favorited' : ''}`;
        btnFavorito.innerHTML = isFavorito ? '😃' : '🤍';
        btnFavorito.title = isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
        btnFavorito.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(255,255,255,0.9);
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-size: 16px;
            cursor: pointer;
            z-index: 10;
            color: ${isFavorito ? '#ffc107' : '#ccc'};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;
        
        btnFavorito.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('⭐ Botão de favorito clicado para índice:', livroIndex);
            toggleFavoritoNoCard(livroIndex, e);
        });
        
        // Garantir que o livro tenha posição relativa
        if (getComputedStyle(livro).position === 'static') {
            livro.style.position = 'relative';
        }
        
        // Adicionar ao container de ações se existir, senão criar
        let actionsContainer = livro.querySelector('.book-actions-top');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'book-actions-top';
            actionsContainer.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                left: 0;
                display: flex;
                justify-content: flex-end;
                padding: 5px;
                z-index: 5;
            `;
            livro.insertBefore(actionsContainer, livro.firstChild);
        }
        
        actionsContainer.appendChild(btnFavorito);
    });
}

// Observar mudanças na DOM para adicionar botões em livros carregados depois
const observerFavoritos = new MutationObserver(function(mutations) {
    let livrosAdicionados = false;
    
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    if (node.classList && node.classList.contains('book')) {
                        livrosAdicionados = true;
                    } else if (node.querySelector && node.querySelector('.book')) {
                        livrosAdicionados = true;
                    }
                }
            });
        }
    });
    
    if (livrosAdicionados) {
        console.log('⭐ Novos livros detectados, adicionando botões...');
        setTimeout(adicionarBotoesFavoritos, 500);
    }
});

// ===== INICIALIZAÇÃO DOS FAVORITOS =====
function inicializarFavoritos() {
    console.log('⭐ INICIALIZANDO SISTEMA DE FAVORITOS POR USUÁRIO...');
    
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        if (!usuario) {
            console.log('👤 Usuário não logado - favoritos vazios');
            favoritos = [];
            return;
        }
        
        const chaveFavoritos = `minhaObraDigital_favoritos_${usuario.id}`;
        const stored = localStorage.getItem(chaveFavoritos);
        favoritos = stored ? JSON.parse(stored) : [];
        
        if (!Array.isArray(favoritos)) {
            console.warn('Favoritos não era um array, resetando...');
            favoritos = [];
        }
        
        // Garantir que são números válidos
        favoritos = favoritos.map(n => Number(n)).filter(n => !isNaN(n) && n >= 0);
        
        console.log(`✅ Favoritos do usuário carregados: ${favoritos.length} livros`);
        
    } catch (e) {
        console.error('❌ Erro ao inicializar favoritos:', e);
        favoritos = [];
    }
}

// ===== TOGGLE FAVORITO DIRETO NO CARD (VERSÃO CORRIGIDA) =====
function toggleFavoritoNoCard(index, event) {
    if (event) event.stopPropagation();
    console.log('⭐ TOGGLE FAVORITO NO CARD - Índice:', index);
    
    // ✅ VERIFICAÇÃO ROBUSTA DO ÍNDICE
    if (index === undefined || index === null || index < 0 || index >= livros.length) {
        console.error('❌ Índice de livro inválido:', index);
        mostrarNotificacao('Erro: Livro não encontrado', 'warning');
        return;
    }
    
    const livro = livros[index];
    if (!livro) {
        console.error('❌ Livro não encontrado no índice:', index);
        mostrarNotificacao('Erro: Livro não encontrado', 'warning');
        return;
    }
    
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) {
        console.log('❌ Usuário não logado - redirecionando para login');
        mostrarNotificacao('❌ Faça login para adicionar favoritos', 'warning');
        setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
        return;
    }
    
    const isFavorito = favoritos.includes(index);
    
    console.log('📖 Livro:', livro.titulo);
    console.log('🔍 É favorito?', isFavorito);
    console.log('👤 Usuário:', usuario.id);
    
    if (isFavorito) {
        // REMOVER dos favoritos
        const indexNoFavoritos = favoritos.indexOf(index);
        favoritos.splice(indexNoFavoritos, 1);
        console.log('❌ REMOVIDO dos favoritos');
        mostrarNotificacao(`📕 "${livro.titulo}" removido dos favoritos!`, 'warning');
    } else {
        // ADICIONAR aos favoritos
        favoritos.push(index);
        console.log('✅ ADICIONADO aos favoritos');
        mostrarNotificacao(`⭐ "${livro.titulo}" adicionado aos favoritos!`, 'success');
    }
    
    // SALVAR IMEDIATAMENTE
    salvarFavoritos();
    
    // Atualizar a estante atual
    const nomePagina = window.location.pathname.split('/').pop();
    console.log('🔄 Recarregando página:', nomePagina);
    
    if (nomePagina === 'favoritos.html') {
        carregarFavoritos();
    } else {
        carregarEstante();
    }
}

// ===== SALVAR FAVORITOS =====
function salvarFavoritos() {
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        if (!usuario) {
            console.log('⚠️ Usuário não logado, não salvando favoritos');
            return;
        }
        
        const chaveFavoritos = `minhaObraDigital_favoritos_${usuario.id}`;
        
        // Garantir que só salve números válidos e únicos
        const toSave = favoritos
            .map(n => Number(n))
            .filter(n => !isNaN(n) && n >= 0 && n < livros.length)
            .filter((n, index, array) => array.indexOf(n) === index);
        
        localStorage.setItem(chaveFavoritos, JSON.stringify(toSave));
        
        console.log('✅ Favoritos salvos para usuário:', usuario.id, '-', toSave.length, 'livros');
        console.log('📚 Índices salvos:', toSave);
        
    } catch (e) {
        console.error('❌ Erro ao salvar favoritos:', e);
        mostrarNotificacao('Erro ao salvar favoritos', 'warning');
    }
}

// ===== CARREGAR ESTANTE DE FAVORITOS POR USUÁRIO (VERSÃO CORRIGIDA) =====
function carregarFavoritos() {
    console.log('🔄 CARREGANDO PÁGINA DE FAVORITOS DO USUÁRIO...');
    
    const estante = document.getElementById("estante");
    if (!estante) {
        console.error('❌ Elemento estante não encontrado');
        return;
    }
    
    estante.innerHTML = "";
    
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) {
        estante.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔐</div>
                <p>Faça login para ver seus favoritos</p>
                <a href="auth.html" class="btn-criar-livro">🔐 Fazer Login</a>
            </div>
        `;
        return;
    }
    
    console.log('👤 Carregando favoritos do usuário:', usuario.id);
    console.log('⭐ Índices de favoritos:', favoritos);
    console.log('📚 Total de livros disponíveis:', livros.length);
    
    // ✅ VERIFICAÇÃO DE SEGURANÇA: Filtrar apenas índices válidos
    const indicesValidos = favoritos.filter(index => {
        const valido = index >= 0 && index < livros.length && livros[index];
        if (!valido) {
            console.warn(`⚠️ Índice de favorito inválido: ${index}`);
        }
        return valido;
    });
    
    console.log('✅ Índices válidos de favoritos:', indicesValidos);
    
    if (indicesValidos.length === 0) {
        estante.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⭐</div>
                <p>Nenhum livro favorito encontrado.</p>
                <p>Adicione livros aos favoritos na estante principal.</p>
                <a href="index.html" class="btn-criar-livro">📚 Ir para Estante</a>
            </div>
        `;
        return;
    }
    
    // Mostrar livros favoritos do usuário
    indicesValidos.forEach((livroIndex, posicao) => {
        const livro = livros[livroIndex];
        
        if (!livro) {
            console.error(`❌ Livro não encontrado no índice ${livroIndex}`);
            return;
        }
        
        console.log(`📖 Carregando favorito ${posicao + 1}: "${livro.titulo}" (índice: ${livroIndex})`);
        
        const div = document.createElement("div");
        div.className = "book favorito";
        div.title = `${livro.titulo} - ${livro.autor}`;
        
        div.innerHTML = `
            <div class="book-actions-top">
                <button class="btn-favorite favorited" 
                        onclick="toggleFavoritoNoCard(${livroIndex}, event)"
                        title="Remover dos Favoritos">
                    😃
                </button>
                ${SistemaAuth.isAdmin() ? `
                    <button class="btn-edit" onclick="event.stopPropagation(); editarLivro(${livroIndex})" title="Editar livro">🖋</button>
                    <button class="btn-delete" onclick="event.stopPropagation(); excluirLivro(${livroIndex})" title="Excluir livro">🗑️</button>
                ` : ''}
            </div>
            <img src="${livro.capa || 'assets/capa/capa-padrao.jpg'}" alt="${livro.titulo}" onerror="this.src='assets/capa/capa-padrao.jpg'">
            <div class="info">
                <div class="titulo">${livro.titulo}</div>
                <div class="autor">${livro.autor}</div>
                <div class="book-stats">
                    <span class="stat views" title="Visualizações">👁️‍🗨️ ${livro.visualizacoes || 0}</span>
                    <span class="stat likes" title="Curtidas">⭐ ${livro.curtidas || 0}</span>
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => abrirLivro(livroIndex));
        estante.appendChild(div);
    });
    
    console.log(`✅ Estante de favoritos carregada! ${indicesValidos.length} livros favoritos.`);
}

// ===== TOGGLE FAVORITO NO LEITOR =====
function toggleFavorito() {
    if (!livroAtual) return;
    
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) {
        mostrarNotificacao('❌ Faça login para adicionar favoritos', 'warning');
        return;
    }
    
    const indexDoLivro = livroAtual.index;
    const isFavorito = favoritos.includes(indexDoLivro);
    
    console.log('⭐ TOGGLE FAVORITO NO LEITOR - Índice:', indexDoLivro);
    console.log('🔍 É favorito?', isFavorito);
    
    if (isFavorito) {
        // Remover dos favoritos
        const indexNoFavoritos = favoritos.indexOf(indexDoLivro);
        favoritos.splice(indexNoFavoritos, 1);
        mostrarNotificacao(`📕 "${livroAtual.titulo}" removido dos favoritos!`, 'warning');
    } else {
        // Adicionar aos favoritos
        favoritos.push(indexDoLivro);
        mostrarNotificacao(`⭐ "${livroAtual.titulo}" adicionado aos favoritos!`, 'success');
    }
    
    salvarFavoritos();
    atualizarBotaoFavorito();
    
    // Recarregar se estiver na página de favoritos
    const nomePagina = window.location.pathname.split('/').pop();
    if (nomePagina === 'favoritos.html') {
        carregarFavoritos();
    } else {
        carregarEstante();
    }
}

// ===== SISTEMA DE VISUALIZAÇÕES E CURTIDAS =====

// ===== INICIALIZAR SISTEMA DE ESTATÍSTICAS =====
function inicializarEstatisticas() {
    console.log('📊 Inicializando sistema de estatísticas...');
    
    // Garantir que todos os livros tenham campos de estatísticas
    livros.forEach((livro, index) => {
        if (livro.visualizacoes === undefined) {
            livro.visualizacoes = 0;
        }
        if (livro.curtidas === undefined) {
            livro.curtidas = 0;
        }
        if (livro.curtidasPor === undefined) {
            livro.curtidasPor = [];
        }
    });
    
    // Carregar curtidas do usuário atual
    const usuario = SistemaAuth.getUsuarioLogado();
    if (usuario) {
        const chaveCurtidas = `minhaObraDigital_curtidas_${usuario.id}`;
        const storedCurtidas = localStorage.getItem(chaveCurtidas);
        curtidasUsuario = storedCurtidas ? JSON.parse(storedCurtidas) : {};
    }
    
    salvarLivros();
    console.log('✅ Sistema de estatísticas inicializado');
}

// ===== REGISTRAR VISUALIZAÇÃO =====
function registrarVisualizacao(index) {
    if (index < 0 || index >= livros.length) return;
    
    const livro = livros[index];
    if (!livro) return;
    
    // Incrementar visualizações
    livro.visualizacoes = (livro.visualizacoes || 0) + 1;
    
    // Atualizar data da última visualização
    livro.ultimaVisualizacao = new Date().toISOString();
    
    salvarLivros();
    
    console.log(`👁️‍🗨️ Visualização registrada para: "${livro.titulo}" - Total: ${livro.visualizacoes}`);
}

// ===== TOGGLE CURTIDA =====
function toggleCurtida(index, event) {
    if (event) event.stopPropagation();
    
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) {
        mostrarNotificacao('❌ Faça login para curtir livros', 'warning');
        return;
    }
    
    if (index < 0 || index >= livros.length) {
        console.error('❌ Índice de livro inválido para curtida');
        return;
    }
    
    const livro = livros[index];
    if (!livro) return;
    
    const usuarioId = usuario.id;
    const jaCurtiu = livro.curtidasPor && livro.curtidasPor.includes(usuarioId);
    
    if (jaCurtiu) {
        // Remover curtida
        livro.curtidas = Math.max(0, (livro.curtidas || 0) - 1);
        livro.curtidasPor = livro.curtidasPor.filter(id => id !== usuarioId);
        
        // Atualizar curtidas do usuário
        delete curtidasUsuario[index];
        
        mostrarNotificacao(`💔 Você removeu a curtida de "${livro.titulo}"`, 'info');
    } else {
        // Adicionar curtida
        livro.curtidas = (livro.curtidas || 0) + 1;
        if (!livro.curtidasPor) {
            livro.curtidasPor = [];
        }
        livro.curtidasPor.push(usuarioId);
        
        // Atualizar curtidas do usuário
        curtidasUsuario[index] = true;
        
        mostrarNotificacao(`⭐ Você curtiu "${livro.titulo}"!`, 'success');
    }
    
    // Salvar alterações
    salvarLivros();
    salvarCurtidasUsuario();
    
    // Atualizar interface
    const nomePagina = window.location.pathname.split('/').pop();
    if (nomePagina === 'ranking.html') {
        carregarRanking();
    } else {
        carregarEstante();
    }
    
    console.log(`⭐ Curtida atualizada para: "${livro.titulo}" - Total: ${livro.curtidas}`);
}

// ===== SALVAR CURTIDAS DO USUÁRIO =====
function salvarCurtidasUsuario() {
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        if (!usuario) return;
        
        const chaveCurtidas = `minhaObraDigital_curtidas_${usuario.id}`;
        localStorage.setItem(chaveCurtidas, JSON.stringify(curtidasUsuario));
        
        console.log('✅ Curtidas do usuário salvas');
    } catch (e) {
        console.error('❌ Erro ao salvar curtidas do usuário:', e);
    }
}

// ===== VERIFICAR SE USUÁRIO CURTIU O LIVRO =====
function usuarioCurtiuLivro(index) {
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) return false;
    
    return curtidasUsuario[index] === true;
}

// ===== FUNÇÃO GLOBAL PARA ABRIR LIVRO DO RANKING (VERSÃO MELHORADA) =====
function abrirLivroDoRanking(index) {
    console.log('📖 ABRIR LIVRO DO RANKING - Índice:', index);
    
    // ✅ VERIFICAÇÕES DE SEGURANÇA
    if (index === undefined || index === null) {
        console.error('❌ Índice undefined ou null');
        mostrarNotificacao('Erro: Índice do livro inválido', 'warning');
        return;
    }
    
    if (!Array.isArray(livros)) {
        console.error('❌ Array de livros não carregado');
        mostrarNotificacao('Erro: Livros não carregados', 'warning');
        return;
    }
    
    if (index < 0 || index >= livros.length) {
        console.error('❌ Índice fora dos limites:', index, 'Total livros:', livros.length);
        mostrarNotificacao('Erro: Livro não encontrado', 'warning');
        return;
    }
    
    const livro = livros[index];
    if (!livro) {
        console.error('❌ Livro não encontrado no índice:', index);
        mostrarNotificacao('Erro: Livro não encontrado', 'warning');
        return;
    }
    
    console.log('✅ Livro encontrado:', livro.titulo);
    
    // ✅ REGISTRAR VISUALIZAÇÃO
    registrarVisualizacao(index);
    
    // ✅ TENTAR ABRIR NA PRÓPRIA PÁGINA DO RANKING
    if (typeof abrirLivro === 'function') {
        console.log('🎯 Chamando abrirLivro principal no ranking...');
        abrirLivroNoRanking(index);
    } else {
        console.log('⚠️ abrirLivro não disponível, redirecionando para index...');
        redirecionarParaIndexComLivro(index);
    }
}

// ===== ABRIR LIVRO DIRETAMENTE NO RANKING =====
function abrirLivroNoRanking(index) {
    const livro = livros[index];
    
    // Criar overlay de leitura
    const overlayLeitor = document.createElement('div');
    overlayLeitor.id = 'overlay-leitor-ranking';
    overlayLeitor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    overlayLeitor.innerHTML = `
        <div style="background: white; border-radius: 15px; padding: 30px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="fecharOverlayLeitor()" style="position: absolute; top: 15px; right: 15px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c3e50; margin-bottom: 10px;">${livro.titulo}</h2>
                <p style="color: #7f8c8d; font-size: 1.2em;">por ${livro.autor}</p>
            </div>
            
            ${livro.capa ? `
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${livro.capa}" alt="${livro.titulo}" 
                         style="max-width: 300px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                    <span style="color: #3498db;">👁️‍🗨️ ${livro.visualizacoes || 0} visualizações</span>
                    <span style="color: #e74c3c;">⭐ ${livro.curtidas || 0} curtidas</span>
                </div>
                
                <button onclick="redirecionarParaIndexComLivro(${index})" 
                        style="background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%;">
                    📖 Abrir no Leitor Completo
                </button>
            </div>
            
            <div style="line-height: 1.6; font-size: 16px; max-height: 400px; overflow-y: auto;">
                ${livro.paginas && livro.paginas.length > 0 ? 
                    livro.paginas.slice(0, 3).map((pagina, idx) => `
                        <div style="margin-bottom: 25px; padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 8px;">
                            <h4 style="color: #3498db; margin-top: 0; margin-bottom: 10px;">${pagina.titulo || `Página ${idx + 1}`}</h4>
                            <div style="color: #2c3e50;">${pagina.conteudo ? pagina.conteudo.substring(0, 300) + (pagina.conteudo.length > 300 ? '...' : '') : 'Conteúdo não disponível'}</div>
                        </div>
                    `).join('') 
                    : '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Este livro não possui páginas de conteúdo.</p>'
                }
                
                ${livro.paginas && livro.paginas.length > 3 ? `
                    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
                        <p style="color: #3498db; margin: 0;">
                            ... e mais ${livro.paginas.length - 3} páginas
                        </p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlayLeitor);
}

// ===== REDIRECIONAR PARA INDEX COM LIVRO =====
function redirecionarParaIndexComLivro(index) {
    console.log('🔗 Redirecionando para index com livro:', index);
    
    // Fechar overlay se existir
    fecharOverlayLeitor();
    
    // Redirecionar para index.html com parâmetro
    window.location.href = `index.html?abrirLivro=${index}`;
}

// ===== FECHAR OVERLAY =====
function fecharOverlayLeitor() {
    const overlay = document.getElementById('overlay-leitor-ranking');
    if (overlay) {
        overlay.remove();
    }
}

// ===== CARREGAR ESTATÍSTICAS GERAIS (VERSÃO CORRIGIDA) =====
function carregarEstatisticasGerais() {
    console.log('📈 Carregando estatísticas gerais...');
    
    const statsContainer = document.getElementById('estatisticas-gerais');
    if (!statsContainer) {
        console.error('❌ Container de estatísticas não encontrado');
        return;
    }

    // ✅ VERIFICAÇÃO DE SEGURANÇA
    if (!Array.isArray(livros)) {
        statsContainer.innerHTML = `
            <div class="empty-state">
                <p>Erro ao carregar estatísticas</p>
            </div>
        `;
        return;
    }

    const totalLivros = livros.length;
    const totalVisualizacoes = livros.reduce((sum, livro) => sum + (livro.visualizacoes || 0), 0);
    const totalCurtidas = livros.reduce((sum, livro) => sum + (livro.curtidas || 0), 0);
    
    // Encontrar livro mais popular (mais visualizações)
    const livroMaisPopular = [...livros]
        .filter(livro => (livro.visualizacoes || 0) > 0)
        .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))[0];

    console.log('📊 Estatísticas:', {
        totalLivros,
        totalVisualizacoes, 
        totalCurtidas,
        livroMaisPopular: livroMaisPopular?.titulo
    });

    statsContainer.innerHTML = `
        <div class="stat-card total-livros">
            <div class="stat-icon">📚</div>
            <div class="stat-content">
                <div class="stat-number">${totalLivros}</div>
                <div class="stat-label">Livros na Estante</div>
            </div>
        </div>
        
        <div class="stat-card total-visualizacoes">
            <div class="stat-icon">👁️‍🗨️</div>
            <div class="stat-content">
                <div class="stat-number">${totalVisualizacoes}</div>
                <div class="stat-label">Visualizações</div>
            </div>
        </div>
        
        <div class="stat-card total-curtidas">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
                <div class="stat-number">${totalCurtidas}</div>
                <div class="stat-label">Curtidas</div>
            </div>
        </div>
        
        <div class="stat-card livro-popular">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
                <div class="stat-text">${livroMaisPopular ? (livroMaisPopular.titulo || 'Sem título').substring(0, 20) + (livroMaisPopular.titulo.length > 20 ? '...' : '') : 'N/A'}</div>
                <div class="stat-label">Livro Mais Popular</div>
                ${livroMaisPopular ? `
                    <div class="stat-subtext">${livroMaisPopular.visualizacoes || 0} visualizações</div>
                ` : ''}
            </div>
        </div>
    `;
    
    console.log('✅ Estatísticas gerais carregadas');
}

// ===== FUNÇÕES PARA CRIAR LIVROS =====

// Criar novo livro pessoal
function criarNovoLivroPessoal() {
    console.log('📝 Criando novo livro pessoal...');
    
    if (!SistemaAuth.isLogado()) {
        mostrarNotificacao('❌ Faça login para criar livros pessoais', 'warning');
        window.location.href = 'auth.html';
        return;
    }
    
    window.location.href = 'editar.html?novo=pessoal';
}

// Criar novo livro principal (apenas admin)
function criarNovoLivroPrincipal() {
    console.log('👑 Criando novo livro principal...');
    
    if (!SistemaAuth.isLogado()) {
        mostrarNotificacao('❌ Faça login para criar livros', 'warning');
        window.location.href = 'auth.html';
        return;
    }
    
    if (!SistemaAuth.isAdmin()) {
        mostrarNotificacao('❌ Apenas administradores podem criar livros principais', 'warning');
        return;
    }
    
    window.location.href = 'editar.html?novo=principal';
}

// ===== ATUALIZAR BOTÕES DE ADMIN =====
function atualizarBotoesAdmin() {
    const btnLivroPrincipal = document.getElementById('btnLivroPrincipal');
    
    if (btnLivroPrincipal) {
        if (SistemaAuth.isAdmin()) {
            btnLivroPrincipal.classList.remove('oculto');
            console.log('✅ Botão de livro principal mostrado para admin');
        } else {
            btnLivroPrincipal.classList.add('oculto');
        }
    }
}

// ===== SISTEMA DE USUÁRIO LEVE (VERSÃO CORRIGIDA) =====
function inicializarUsuarioLeve() {
    console.log('👤 Inicializando usuário leve...');
    
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        console.log('👤 Usuário no auth:', usuario);
        
        const btnLogin = document.getElementById('btnLogin');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const btnLogout = document.getElementById('btnLogout');
        
        console.log('👤 Elementos encontrados:', {
            btnLogin: !!btnLogin,
            userInfo: !!userInfo, 
            userName: !!userName,
            btnLogout: !!btnLogout
        });
        
        if (btnLogin && userInfo) {
            if (usuario) {
                console.log('✅ Usuário LOGADO - mostrando info');
                btnLogin.classList.add('oculto');
                userInfo.classList.remove('oculto');
                if (userName) {
                    userName.textContent = usuario.nome;
                }
                
                // Configurar evento do logout
                if (btnLogout) {
                    btnLogout.onclick = function() {
                        SistemaAuth.logout();
                    };
                }
                
            } else {
                console.log('ℹ️ Usuário NÃO LOGADO - mostrando botão login');
                btnLogin.classList.remove('oculto');
                userInfo.classList.add('oculto');
            }
        } else {
            console.error('❌ Elementos do header não encontrados!');
        }
    } catch (e) {
        console.error('❌ ERRO em inicializarUsuarioLeve:', e);
    }
}

// ===== ATUALIZAR INTERFACE DO USUÁRIO COMPLETA =====
function atualizarInterfaceUsuario() {
    console.log('👤 Atualizando interface do usuário...');
    
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        const btnLogin = document.getElementById('btnLogin');
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const btnMinhasSubmissoes = document.getElementById('btnMinhasSubmissoes');
        const btnPainelAdmin = document.getElementById('btnPainelAdmin');
        const btnLogout = document.getElementById('btnLogout');
        
        if (usuario) {
            // Usuário logado
            if (btnLogin) btnLogin.classList.add('oculto');
            if (userInfo) userInfo.classList.remove('oculto');
            if (userName) userName.textContent = usuario.nome;
            
            // Mostrar botão de submissões para usuários comuns
            if (btnMinhasSubmissoes && !SistemaAuth.isAdmin()) {
                btnMinhasSubmissoes.classList.remove('oculto');
            } else if (btnMinhasSubmissoes) {
                btnMinhasSubmissoes.classList.add('oculto');
            }
            
            // Mostrar painel admin apenas para administradores
            if (btnPainelAdmin && SistemaAuth.isAdmin()) {
                btnPainelAdmin.classList.remove('oculto');
            } else if (btnPainelAdmin) {
                btnPainelAdmin.classList.add('oculto');
            }
            
            // Configurar evento do logout
            if (btnLogout) {
                btnLogout.onclick = function() {
                    SistemaAuth.logout();
                };
            }
            
        } else {
            // Usuário não logado
            if (btnLogin) btnLogin.classList.remove('oculto');
            if (userInfo) userInfo.classList.add('oculto');
            if (btnMinhasSubmissoes) btnMinhasSubmissoes.classList.add('oculto');
            if (btnPainelAdmin) btnPainelAdmin.classList.add('oculto');
        }
        
        console.log('✅ Interface do usuário atualizada');
    } catch (e) {
        console.error('❌ Erro ao atualizar interface:', e);
    }
}

// ===== INICIALIZAÇÃO SEGURA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 INICIANDO APLICAÇÃO (MODO SEGURO)...');
    
    try {
        // 1. Verificar e inicializar livros
        if (!Array.isArray(livros)) {
            console.warn('⚠️ livros não é array, inicializando...');
            livros = [];
            salvarLivros();
        }
        
        // 2. Inicializar SistemaAuth PRIMEIRO
        if (typeof SistemaAuth !== 'undefined') {
            SistemaAuth.inicializar();
            console.log('✅ SistemaAuth inicializado');
        } else {
            console.error('❌ SistemaAuth não está disponível');
        }

        // 3. ✅ INICIALIZAR FAVORITOS ANTES DE TUDO
        try {
            inicializarFavoritos();
            console.log('✅ Favoritos inicializados:', favoritos);
        } catch (e) {
            console.error('❌ Erro em inicializarFavoritos:', e);
            favoritos = [];
        }

        // 4. ✅ INICIALIZAR SISTEMA DE ESTATÍSTICAS
        try {
            inicializarEstatisticas();
            console.log('✅ Sistema de estatísticas inicializado');
        } catch (e) {
            console.error('❌ Erro em inicializarEstatisticas:', e);
        }
        
        // 5. Sistemas principais
        try {
            carregarEstante();
        } catch (e) {
            console.error('❌ Erro em carregarEstante:', e);
        }
        
        try {
            inicializarEventos();
        } catch (e) {
            console.error('❌ Erro em inicializarEventos:', e);
        }
        
        try {
            inicializarBotoesLeitor();
        } catch (e) {
            console.error('❌ Erro em inicializarBotoesLeitor:', e);
        }
        
        // 6. Sistema de usuário LEVE
        setTimeout(() => {
            try {
                inicializarUsuarioLeve();
                atualizarBotoesAdmin();
                atualizarInterfaceUsuario();
                adicionarBotoesFavoritos();
            } catch (e) {
                console.error('❌ Erro na inicialização do usuário:', e);
            }
        }, 100);

        // 7. Turn.js
        if (typeof loadTurnJsDependencies !== 'undefined') {
            loadTurnJsDependencies();
        }

        // 8. Iniciar observer de favoritos
        setTimeout(() => {
            observerFavoritos.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('⭐ Observer de favoritos iniciado');
        }, 2000);

        // 9. ✅ INICIALIZAR SLIDER QUANDO O LEITOR É ABERTO
        const observerLeitor = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    const leitor = document.getElementById('leitor');
                    if (leitor && !leitor.classList.contains('oculto')) {
                        setTimeout(() => {
                            inicializarSliderPaginas();
                        }, 500);
                    }
                }
            });
        });
        
        observerLeitor.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        console.log('✅ Aplicação inicializada com SEGURANÇA');
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO na inicialização:', error);
        mostrarNotificacao('Erro ao carregar a aplicação', 'warning');
    }
});

// ===== FUNÇÃO DE SEGURANÇA PARA EVITAR ERROS DE UNDEFINED =====
function safeLength(value) {
    if (value === undefined || value === null) {
        console.warn('⚠️ Tentativa de acessar .length de valor undefined/null');
        return 0;
    }
    if (Array.isArray(value)) {
        return value.length;
    }
    if (typeof value === 'string') {
        return value.length;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length;
    }
    return 0;
}

// ===== SISTEMA DE SLIDER PERSONALIZADO =====
function inicializarSliderPersonalizado() {
    console.log('🎚️ Inicializando slider personalizado...');
    
    const slider = document.getElementById('slider');
    const sliderBar = document.getElementById('slider-bar');
    const pages = document.querySelectorAll('.page');
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (!slider || !sliderBar || !pages.length) {
        console.warn('❌ Elementos do slider não encontrados');
        return;
    }
    
    let currentPage = 1;
    const totalPages = pages.length;
    
    // Configurar o total de páginas
    if (totalPagesElement) {
        totalPagesElement.textContent = totalPages;
    }
    
    // Configurar a posição inicial do slider
    updateSliderPosition();
    
    // Eventos de arrastar o slider
    let isDragging = false;
    
    slider.addEventListener('mousedown', startDrag);
    slider.addEventListener('touchstart', startDrag);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    
    function startDrag(e) {
        isDragging = true;
        slider.style.transition = 'none';
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let clientX;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        const barRect = sliderBar.getBoundingClientRect();
        let newLeft = clientX - barRect.left - (slider.offsetWidth / 2);
        
        // Limitar o movimento dentro da barra
        newLeft = Math.max(0, Math.min(newLeft, barRect.width - slider.offsetWidth));
        
        slider.style.left = newLeft + 'px';
        
        // Calcular a página com base na posição do slider
        const pagePosition = newLeft / (barRect.width - slider.offsetWidth);
        const targetPage = Math.floor(pagePosition * (totalPages - 1)) + 1;
        
        if (targetPage !== currentPage) {
            goToPage(targetPage);
        }
    }
    
    function stopDrag() {
        isDragging = false;
        slider.style.transition = 'left 0.3s ease';
        updateSliderPosition();
    }
    
    // Atualizar a posição do slider com base na página atual
    function updateSliderPosition() {
        const barRect = sliderBar.getBoundingClientRect();
        const position = (currentPage - 1) / (totalPages - 1);
        const newLeft = position * (barRect.width - slider.offsetWidth);
        slider.style.left = newLeft + 'px';
    }
    
    // Navegar para uma página específica
    function goToPage(pageNumber) {
        // Validar o número da página
        if (pageNumber < 1 || pageNumber > totalPages) return;
        
        // Ocultar todas as páginas
        pages.forEach(page => {
            page.style.display = 'none';
        });
        
        // Mostrar a página atual
        pages[pageNumber - 1].style.display = 'flex';
        
        // Atualizar a página atual
        currentPage = pageNumber;
        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }
        
        // Atualizar a posição do slider
        if (!isDragging) {
            updateSliderPosition();
        }
        
        // Atualizar o estado dos botões
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
        
        // Disparar evento personalizado
        const event = new CustomEvent('paginaalterada', { 
            detail: { pagina: currentPage } 
        });
        document.dispatchEvent(event);
    }
    
    // Eventos dos botões
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                goToPage(currentPage + 1);
            }
        });
    }
    
    // Inicializar a primeira página
    goToPage(1);
    
    console.log('✅ Slider personalizado inicializado');
}

// =================================================================
// ===== SISTEMA UNIFICADO DE EVENT LISTENERS =====

function inicializarEventos() {
    const caminhoPagina = window.location.pathname;
    const nomePagina = caminhoPagina.split('/').pop() || 'index.html';
    
    console.log("🔗 Inicializando eventos para:", nomePagina);
    
    if (nomePagina === 'index.html' || nomePagina === '' || nomePagina === '/') {
        carregarEstante();
        
        // ✅ APENAS carregar estatísticas se o container existir
        const statsContainer = document.getElementById('estatisticas-gerais');
        if (statsContainer) {
            carregarEstatisticasGerais();
        }
        
    } else if (nomePagina === 'favoritos.html') {
        carregarFavoritos();
    } else if (nomePagina === 'minhas-submissoes.html') {
        carregarMinhasSubmissoes();
    } else if (nomePagina === 'admin-submissoes.html') {
        carregarSubmissoesAdmin();
    } else if (nomePagina === 'ranking.html') {
        carregarRanking();
        
        // ✅ Opcional: carregar estatísticas no ranking também se quiser
        const statsContainer = document.getElementById('estatisticas-gerais');
        if (statsContainer) {
            carregarEstatisticasGerais();
        }
    }
    
    
    configurarEventosFlipbook();
    
    // Eventos existentes mantidos
    document.getElementById('btnFavNav')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'favoritos.html';
    });

    document.getElementById('fecharLeitor')?.addEventListener('click', fecharLeitor);
    document.getElementById('btnFav')?.addEventListener('click', toggleFavorito);
    
    // ✅ NOVO: Botão de curtir no leitor
    document.getElementById('btnCurtir')?.addEventListener('click', function() {
        if (livroAtual) {
            toggleCurtida(livroAtual.index);
        }
    });
    
    // ✅ NOVO: Botão de ranking no nav
    document.getElementById('btnRankingNav')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'ranking.html';
    });
    
    // Inicializar slider personalizado se os elementos existirem
    if (document.getElementById('slider') && document.getElementById('slider-bar')) {
        inicializarSliderPersonalizado();
    }
}

// =================================================================
// ===== SISTEMA DE SUBMISSÃO DE LIVROS - FUNÇÕES DE INTERFACE =====
// =================================================================

// ===== CARREGAR MINHAS SUBMISSÕES =====
function carregarMinhasSubmissoes() {
    console.log('📤 CARREGANDO MINHAS SUBMISSÕES...');
    
    const container = document.getElementById('minhas-submissoes');
    if (!container) return;
    
    container.innerHTML = '';
    
    const usuario = SistemaAuth.getUsuarioLogado();
    if (!usuario) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔐</div>
                <p>Faça login para ver suas submissões</p>
                <a href="auth.html" class="btn-criar-livro">🔐 Fazer Login</a>
            </div>
        `;
        return;
    }
    
    const minhasSubmissoes = SistemaAuth.carregarMinhasSubmissoes();
    console.log('📋 Minhas submissões:', minhasSubmissoes);
    
    if (minhasSubmissoes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📤</div>
                <p>Você ainda não submeteu nenhum livro para aprovação.</p>
                <p>Crie um livro pessoal e envie para o administrador!</p>
                <button onclick="criarNovoLivroPessoal()" class="btn-criar-livro">✍️ Criar Livro Pessoal</button>
            </div>
        `;
        return;
    }
    
    // Agrupar por status
    const pendentes = minhasSubmissoes.filter(s => s.status === 'pendente');
    const aprovados = minhasSubmissoes.filter(s => s.status === 'aprovado');
    const rejeitados = minhasSubmissoes.filter(s => s.status === 'rejeitado');
    
    // Seção de Pendentes
    if (pendentes.length > 0) {
        const secaoPendentes = document.createElement('div');
        secaoPendentes.className = 'secao-submissoes';
        secaoPendentes.innerHTML = `
            <h3 style="color: #f39c12; border-bottom: 2px solid #f39c12; padding-bottom: 8px; margin-bottom: 20px;">
                ⏳ Aguardando Aprovação (${pendentes.length})
            </h3>
            <div class="grid-submissoes">
                ${pendentes.map(livro => `
                    <div class="submissao-card pendente">
                        <div class="submissao-header">
                            <h4>${livro.titulo}</h4>
                            <span class="status-badge pendente">Pendente</span>
                        </div>
                        <div class="submissao-info">
                            <p><strong>Autor:</strong> ${livro.autor}</p>
                            <p><strong>Enviado em:</strong> ${new Date(livro.dataSubmissao).toLocaleDateString()}</p>
                            <p><strong>Páginas:</strong> ${livro.paginas ? livro.paginas.length : 0}</p>
                        </div>
                        <div class="submissao-actions">
                            <button onclick="visualizarSubmissao('${livro.id}')" class="btn-visualizar">👁️‍🗨️ Visualizar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(secaoPendentes);
    }
    
    // Seção de Aprovados
    if (aprovados.length > 0) {
        const secaoAprovados = document.createElement('div');
        secaoAprovados.className = 'secao-submissoes';
        secaoAprovados.innerHTML = `
            <h3 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 8px; margin-bottom: 20px; margin-top: 40px;">
                ✅ Aprovados (${aprovados.length})
            </h3>
            <div class="grid-submissoes">
                ${aprovados.map(livro => `
                    <div class="submissao-card aprovado">
                        <div class="submissao-header">
                            <h4>${livro.titulo}</h4>
                            <span class="status-badge aprovado">Aprovado</span>
                        </div>
                        <div class="submissao-info">
                            <p><strong>Autor:</strong> ${livro.autor}</p>
                            <p><strong>Aprovado em:</strong> ${new Date(livro.dataAprovacao).toLocaleDateString()}</p>
                            <p><strong>Por:</strong> ${livro.administradorAprovador}</p>
                        </div>
                        <div class="submissao-actions">
                            <button onclick="visualizarSubmissao('${livro.id}')" class="btn-visualizar">👁️‍🗨️ Visualizar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(secaoAprovados);
    }
    
    // Seção de Rejeitados
    if (rejeitados.length > 0) {
        const secaoRejeitados = document.createElement('div');
        secaoRejeitados.className = 'secao-submissoes';
        secaoRejeitados.innerHTML = `
            <h3 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 8px; margin-bottom: 20px; margin-top: 40px;">
                ❌ Rejeitados (${rejeitados.length})
            </h3>
            <div class="grid-submissoes">
                ${rejeitados.map(livro => `
                    <div class="submissao-card rejeitado">
                        <div class="submissao-header">
                            <h4>${livro.titulo}</h4>
                            <span class="status-badge rejeitado">Rejeitado</span>
                        </div>
                        <div class="submissao-info">
                            <p><strong>Autor:</strong> ${livro.autor}</p>
                            <p><strong>Rejeitado em:</strong> ${new Date(livro.dataAprovacao).toLocaleDateString()}</p>
                            <p><strong>Por:</strong> ${livro.administradorAprovador}</p>
                            ${livro.motivoRejeicao ? `<p><strong>Motivo:</strong> ${livro.motivoRejeicao}</p>` : ''}
                        </div>
                        <div class="submissao-actions">
                            <button onclick="visualizarSubmissao('${livro.id}')" class="btn-visualizar">👁️‍🗨️ Visualizar</button>
                            <button onclick="reeditarLivroRejeitado('${livro.id}')" class="btn-reeditar">✏️ Re-editar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(secaoRejeitados);
    }
    
    console.log('✅ Minhas submissões carregadas');
}

// ===== CARREGAR PAINEL DE ADMINISTRAÇÃO =====
function carregarSubmissoesAdmin() {
    console.log('👑 CARREGANDO PAINEL DE ADMINISTRAÇÃO...');
    
    const container = document.getElementById('admin-submissoes');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!SistemaAuth.isAdmin()) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔒</div>
                <p>Acesso restrito a administradores</p>
                <a href="index.html" class="btn-criar-livro">📚 Voltar para Estante</a>
            </div>
        `;
        return;
    }
    
    const todasSubmissoes = SistemaAuth.carregarLivrosSubmetidos();
    const submissoesPendentes = todasSubmissoes.filter(s => s.status === 'pendente');
    
    console.log('📋 Total de submissões pendentes:', submissoesPendentes.length);
    
    if (submissoesPendentes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">✅</div>
                <p>Nenhuma submissão pendente para revisão.</p>
                <p>Todos os livros foram revisados!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="admin-header">
            <h2>📋 Painel de Aprovação de Livros</h2>
            <p>${submissoesPendentes.length} livro(s) aguardando aprovação</p>
        </div>
        <div class="grid-submissoes-admin">
            ${submissoesPendentes.map(livro => `
                <div class="submissao-admin-card">
                    <div class="submissao-admin-header">
                        <h3>${livro.titulo}</h3>
                        <span class="status-badge pendente">Pendente</span>
                    </div>
                    
                    <div class="submissao-admin-info">
                        <div class="info-group">
                            <label>Autor do Livro:</label>
                            <span>${livro.autor}</span>
                        </div>
                        <div class="info-group">
                            <label>Submetido por:</label>
                            <span>${livro.usuarioNome} (${livro.usuarioEmail})</span>
                        </div>
                        <div class="info-group">
                            <label>Data de Submissão:</label>
                            <span>${new Date(livro.dataSubmissao).toLocaleDateString()}</span>
                        </div>
                        <div class="info-group">
                            <label>Páginas:</label>
                            <span>${livro.paginas ? livro.paginas.length : 0}</span>
                        </div>
                    </div>
                    
                    <div class="submissao-admin-preview">
                        <img src="${livro.capa || 'assets/capa/capa-padrao.jpg'}" alt="Capa" class="capa-preview">
                        <div class="preview-info">
                            <h4>Pré-visualização</h4>
                            <p>${livro.paginas && livro.paginas[0] ? 
                                livro.paginas[0].conteudo.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
                                'Sem conteúdo disponível'}</p>
                        </div>
                    </div>
                    
                    <div class="submissao-admin-actions">
                        <button onclick="visualizarSubmissaoCompleta('${livro.id}')" class="btn-visualizar-completo">📖 Visualizar Completo</button>
                        <div class="action-buttons">
                            <button onclick="aprovarSubmissao('${livro.id}')" class="btn-aprovar">✅ Aprovar</button>
                            <button onclick="rejeitarSubmissao('${livro.id}')" class="btn-rejeitar">❌ Rejeitar</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    console.log('✅ Painel de admin carregado');
}

// ===== CARREGAR ESTATÍSTICAS DO ADMIN =====
function carregarEstatisticasAdmin() {
    console.log('📊 Carregando estatísticas do admin...');
    
    try {
        const todasSubmissoes = SistemaAuth.carregarLivrosSubmetidos();
        const pendentes = todasSubmissoes.filter(s => s.status === 'pendente').length;
        const aprovados = todasSubmissoes.filter(s => s.status === 'aprovado').length;
        const rejeitados = todasSubmissoes.filter(s => s.status === 'rejeitado').length;
        
        const statsContainer = document.getElementById('admin-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card pendentes">
                    <div class="stat-number">${pendentes}</div>
                    <div class="stat-label">Pendentes</div>
                </div>
                <div class="stat-card aprovados">
                    <div class="stat-number">${aprovados}</div>
                    <div class="stat-label">Aprovados</div>
                </div>
                <div class="stat-card rejeitados">
                    <div class="stat-number">${rejeitados}</div>
                    <div class="stat-label">Rejeitados</div>
                </div>
            `;
        }
        
        console.log('✅ Estatísticas carregadas:', { pendentes, aprovados, rejeitados });
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// ===== VISUALIZAR SUBMISSÃO =====
function visualizarSubmissao(livroId) {
    const todasSubmissoes = SistemaAuth.carregarLivrosSubmetidos();
    const livro = todasSubmissoes.find(s => s.id === livroId);
    
    if (!livro) {
        mostrarNotificacao('Livro não encontrado', 'warning');
        return;
    }
    
    // Abrir em nova aba ou modal (simplificado)
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <html>
            <head>
                <title>Pré-visualização: ${livro.titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .header { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                    .page { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
                    .status-badge { padding: 5px 10px; border-radius: 15px; color: white; font-size: 12px; }
                    .pendente { background: #f39c12; }
                    .aprovado { background: #27ae60; }
                    .rejeitado { background: #e74c3c; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${livro.titulo}</h1>
                    <h2>por ${livro.autor}</h2>
                    <p><strong>Status:</strong> <span class="status-badge ${livro.status}">${livro.status}</span></p>
                    <p><strong>Submetido por:</strong> ${livro.usuarioNome} (${livro.usuarioEmail})</p>
                    <p><strong>Data:</strong> ${new Date(livro.dataSubmissao).toLocaleDateString()}</p>
                    ${livro.dataAprovacao ? `<p><strong>Data de Aprovação/Rejeição:</strong> ${new Date(livro.dataAprovacao).toLocaleDateString()}</p>` : ''}
                    ${livro.administradorAprovador ? `<p><strong>Administrador:</strong> ${livro.administradorAprovador}</p>` : ''}
                    ${livro.motivoRejeicao ? `<p><strong>Motivo da Rejeição:</strong> ${livro.motivoRejeicao}</p>` : ''}
                </div>
                
                ${livro.paginas ? livro.paginas.map((pagina, index) => `
                    <div class="page">
                        <h3>${pagina.titulo || `Página ${index + 1}`}</h3>
                        <div>${pagina.conteudo || 'Sem conteúdo'}</div>
                    </div>
                `).join('') : '<p>Nenhuma página disponível</p>'}
                
                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🖨️ Imprimir
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
            </body>
        </html>
    `);
}

// ===== VISUALIZAR SUBMISSÃO COMPLETA (ADMIN) =====
function visualizarSubmissaoCompleta(livroId) {
    visualizarSubmissao(livroId);
}

// ===== APROVAR SUBMISSÃO (ADMIN) =====
function aprovarSubmissao(livroId) {
    if (!confirm('Tem certeza que deseja aprovar este livro? Ele será adicionado à estante principal.')) {
        return;
    }
    
    try {
        const livroAprovado = SistemaAuth.aprovarLivroSubmetido(livroId);
        mostrarNotificacao('✅ Livro aprovado e adicionado à estante principal!', 'success');
        
        // Recarregar a página
        setTimeout(() => {
            carregarSubmissoesAdmin();
            carregarEstatisticasAdmin();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao aprovar livro:', error);
        mostrarNotificacao('❌ Erro ao aprovar livro: ' + error.message, 'warning');
    }
}

// ===== REJEITAR SUBMISSÃO (ADMIN) =====
function rejeitarSubmissao(livroId) {
    const motivo = prompt('Digite o motivo da rejeição (opcional):');
    
    try {
        const livroRejeitado = SistemaAuth.rejeitarLivroSubmetido(livroId, motivo);
        mostrarNotificacao('❌ Livro rejeitado.', 'warning');
        
        // Recarregar a página
        setTimeout(() => {
            carregarSubmissoesAdmin();
            carregarEstatisticasAdmin();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao rejeitar livro:', error);
        mostrarNotificacao('❌ Erro ao rejeitar livro: ' + error.message, 'warning');
    }
}

// ===== REEDITAR LIVRO REJEITADO =====
function reeditarLivroRejeitado(livroId) {
    const todasSubmissoes = SistemaAuth.carregarLivrosSubmetidos();
    const livroRejeitado = todasSubmissoes.find(s => s.id === livroId);
    
    if (!livroRejeitado) {
        mostrarNotificacao('Livro não encontrado', 'warning');
        return;
    }
    
    // Criar um novo livro pessoal baseado no rejeitado
    const livroParaEditar = {
        ...livroRejeitado,
        id: 'pessoal_' + Date.now(),
        status: undefined,
        dataSubmissao: undefined,
        dataAprovacao: undefined,
        administradorAprovador: undefined,
        motivoRejeicao: undefined
    };
    
    // Salvar como rascunho e redirecionar para edição
    const livrosPessoais = SistemaAuth.carregarLivrosPessoais();
    livrosPessoais.push(livroParaEditar);
    SistemaAuth.salvarLivrosPessoais(livrosPessoais);
    
    const index = livrosPessoais.length - 1;
    window.location.href = `editar.html?edit=pessoal_${index}`;
}

// ===== SUBMETER LIVRO PESSOAL DIRETAMENTE DA ESTANTE =====
function submeterLivroPessoal(index) {
    console.log('📤 Submetendo livro pessoal da estante, índice:', index);
    
    try {
        const usuario = SistemaAuth.getUsuarioLogado();
        if (!usuario) {
            mostrarNotificacao('❌ Faça login para submeter livros', 'warning');
            return;
        }
        
        if (SistemaAuth.isAdmin()) {
            mostrarNotificacao('❌ Administradores não precisam submeter livros', 'warning');
            return;
        }
        
        const livrosPessoais = SistemaAuth.carregarLivrosPessoais();
        const livro = livrosPessoais[index];
        
        if (!livro) {
            mostrarNotificacao('❌ Livro não encontrado', 'warning');
            return;
        }
        
        // Verificar se já foi submetido
        const minhasSubmissoes = SistemaAuth.carregarMinhasSubmissoes();
        const jaSubmetido = minhasSubmissoes.find(s => 
            s.titulo === livro.titulo && s.autor === livro.autor && s.status === 'pendente'
        );
        
        if (jaSubmetido) {
            mostrarNotificacao('📤 Este livro já foi submetido e está aguardando aprovação', 'info');
            return;
        }
        
        if (!confirm(`Deseja enviar o livro "${livro.titulo}" para aprovação do administrador?`)) {
            return;
        }
        
        // Preparar dados do livro para submissão
        const livroParaSubmeter = {
            ...livro,
            id: livro.id || 'pessoal_' + Date.now()
        };
        
        // Submeter via SistemaAuth
        const livroSubmetido = SistemaAuth.submeterLivroParaAprovacao(livroParaSubmeter);
        
        console.log('✅ Livro submetido com sucesso:', livroSubmetido);
        mostrarNotificacao('📤 Livro enviado para aprovação do administrador!', 'success');
        
        // Recarregar a estante para mostrar o badge de submetido
        setTimeout(() => {
            carregarEstante();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao submeter livro:', error);
        mostrarNotificacao('❌ Erro ao submeter livro: ' + error.message, 'warning');
    }
}

// ===== INICIALIZAR BOTÕES DO LEITOR (VERSÃO CORRIGIDA) =====
function inicializarBotoesLeitor() {
    console.log('🎮 Inicializando botões do leitor...');
    
    // Botão Página Anterior
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log('⬅️ Página anterior clicada');
            navegarPagina('previous');
        });
    }

    // Botão Próxima Página
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log('➡️ Próxima página clicada');
            navegarPagina('next');
        });
    }

    // Botão Índice
    const btnIdx = document.getElementById('btnIdx');
    if (btnIdx) {
        btnIdx.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    // ✅ NOVO: Botão de curtir no leitor
    const btnCurtir = document.getElementById('btnCurtir');
    if (btnCurtir) {
        btnCurtir.addEventListener('click', function() {
            if (livroAtual) {
                toggleCurtida(livroAtual.index);
            }
        });
    }
}

// ===== FUNÇÃO DE NAVEGAÇÃO CORRIGIDA - UMA PÁGINA POR VEZ =====
function navegarPagina(direcao) {
    if (!flipbookInicializado) {
        console.warn('⚠️ Flipbook não inicializado');
        return;
    }
    
    const flipbook = $('.ej-book');
    
    // Método 1: Verificar se o Turn.js está realmente funcionando
    if (typeof $.fn.turn !== 'undefined' && flipbook.length && flipbook.hasClass('turnjs')) {
        try {
            const paginaAtual = flipbook.turn('page');
            let novaPagina;
            
            if (direcao === 'previous') {
                novaPagina = Math.max(1, paginaAtual - 1);
            } else {
                novaPagina = Math.min(flipbook.turn('pages'), paginaAtual + 1);
            }
            
            console.log(`🔄 Navegando: ${paginaAtual} → ${novaPagina}`);
            flipbook.turn('page', novaPagina);
            atualizarControles();
            return;
        } catch (error) {
            console.error('❌ Erro ao navegar com Turn.js:', error);
        }
    }
    
    // Método 2: Fallback - navegação manual se Turn.js não funcionar
    console.log('🔄 Usando fallback de navegação manual');
    navegacaoManual(direcao);
}

// ===== FALLBACK DE NAVEGAÇÃO MANUAL - UMA PÁGINA POR VEZ =====
function navegacaoManual(direcao) {
    const flipbook = document.querySelector('.ej-book');
    if (!flipbook) return;
    
    // Obter página atual do slider ou estimar
    const slider = document.getElementById('slider');
    let paginaAtual = 1;
    
    if (slider) {
        const sliderValue = $(slider).slider('value');
        paginaAtual = (sliderValue - 1) * 2 + 1;
    }
    
    // Calcular nova página - UMA PÁGINA POR VEZ
    let novaPagina = direcao === 'previous' ? Math.max(1, paginaAtual - 1) : paginaAtual + 1;
    
    console.log(`🔄 Navegação manual: ${paginaAtual} → ${novaPagina}`);
    
    // Atualizar slider se existir
    if (slider && typeof $.fn.slider !== 'undefined') {
        const novaView = Math.floor((novaPagina + 1) / 2);
        $(slider).slider('value', novaView);
    }
    
    // Disparar evento personalizado para atualizar a interface
    const event = new CustomEvent('paginaalterada', { 
        detail: { pagina: novaPagina } 
    });
    document.dispatchEvent(event);
    
    atualizarControles();
}

// ===== ATUALIZAR CONTROLES (VERSÃO MELHORADA) =====
function atualizarControles() {
    if (!flipbookInicializado) {
        console.log('⏳ Flipbook não inicializado para atualizar controles');
        return;
    }
    
    try {
        const info = obterInfoPaginas();
        atualizarSliderPaginas(info.atual, info.total);
        
        console.log(`📄 Página ${info.atual} de ${info.total}`);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar controles:', error);
        
        // Fallback básico
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        if (prevBtn) prevBtn.style.opacity = '1';
        if (nextBtn) nextBtn.style.opacity = '1';
    }
}

// ===== DETECTAR QUANDO O FLIPBOOK ESTÁ PRONTO =====
document.addEventListener('DOMContentLoaded', function() {
    // Observar mudanças no leitor para detectar quando o flipbook é carregado
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const flipbook = document.querySelector('.ej-book');
                if (flipbook && !flipbookInicializado) {
                    console.log('🔄 Flipbook detectado no DOM, aguardando inicialização...');
                    // Tentar inicializar controles após um delay
                    setTimeout(() => {
                        flipbookInicializado = true;
                        atualizarControles();
                    }, 1000);
                }
            }
        });
    });
    
    const leitor = document.getElementById('leitor');
    if (leitor) {
        observer.observe(leitor, { childList: true, subtree: true });
    }
});

// ===== EVENT LISTENER PARA PÁGINA ALTERADA (CUSTOM) =====
document.addEventListener('paginaalterada', function(e) {
    console.log('📖 Página alterada para:', e.detail.pagina);
    atualizarControles();
});

// =================================================================
// ===== FUNÇÕES DE PERSISTÊNCIA (LOCALSTORAGE) =====
// =================================================================

/**
 * Salva o array de livros no LocalStorage.
 */
function salvarLivros() {
    try {
        if (!Array.isArray(livros)) {
            console.error('❌ Erro: livros não é um array válido, resetando...', livros);
            livros = [];
        }
        localStorage.setItem('livros', JSON.stringify(livros));
        console.log(`💾 Livros salvos no LocalStorage. Total: ${safeLength(livros)}`);
    } catch (error) {
        console.error('❌ Erro ao salvar livros:', error);
    }
}

// ===== CARREGAR ESTANTE - VERSÃO COM ESTATÍSTICAS =====
function carregarEstante() {
    console.log('📚 CARREGANDO ESTANTE (COM ESTATÍSTICAS)...');
    
    const estante = document.getElementById('estante');
    if (!estante) {
        console.error('❌ Elemento estante não encontrado');
        return;
    }
    
    estante.innerHTML = '';

    // ✅ VERIFICAÇÃO DE SEGURANÇA ADICIONADA
    let livrosPrincipais = [];
    try {
        const livrosSalvos = localStorage.getItem('livros');
        livrosPrincipais = livrosSalvos ? JSON.parse(livrosSalvos) : [];
        if (!Array.isArray(livrosPrincipais)) {
            console.warn('⚠️ livrosPrincipais não é array, resetando...');
            livrosPrincipais = [];
        }
    } catch (e) {
        console.error('❌ Erro ao carregar livros principais:', e);
        livrosPrincipais = [];
    }
    
    const usuarioLogado = SistemaAuth.getUsuarioLogado();
    
    console.log('📖 Livros principais encontrados:', safeLength(livrosPrincipais));
    console.log('⭐ Favoritos do usuário:', safeLength(favoritos), '- Índices:', favoritos);
    
    // ✅ VERIFICAÇÃO DE SEGURANÇA PARA LIVROS PESSOAIS
    let livrosPessoais = [];
    if (usuarioLogado) {
        try {
            livrosPessoais = SistemaAuth.carregarLivrosPessoais();
            if (!Array.isArray(livrosPessoais)) {
                console.warn('⚠️ livrosPessoais não é array, resetando...');
                livrosPessoais = [];
            }
        } catch (e) {
            console.error('❌ Erro ao carregar livros pessoais:', e);
            livrosPessoais = [];
        }
    }
    
    console.log('👤 Livros pessoais encontrados:', safeLength(livrosPessoais));
    
    // Se não há livros de nenhum tipo
    if (livrosPrincipais.length === 0 && livrosPessoais.length === 0) {
        estante.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📚</div>
                <p>Nenhum livro na estante</p>
                <p>Crie seu primeiro livro para começar!</p>
                ${usuarioLogado ? 
                    '<button onclick="criarNovoLivroPessoal()" class="btn-criar-livro">✍️ Criar Livro Pessoal</button>' : 
                    '<a href="editar.html" class="btn-criar-livro">✍️ Criar Primeiro Livro</a>'
                }
            </div>
        `;
        return;
    }
    
    // MOSTRAR LIVROS PRINCIPAIS (se houver)
    if (livrosPrincipais.length > 0) {
        const secaoPrincipal = document.createElement('div');
        secaoPrincipal.className = 'secao-estante';
        secaoPrincipal.innerHTML = `
            <h3 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 8px; margin-bottom: 2px;">
                👑 Estante Principal
                ${SistemaAuth.isAdmin() ? '<span style="font-size: 0.8em; color: #7f8c8d;"> (Admin)</span>' : ''}
            </h3>
        `;
        estante.appendChild(secaoPrincipal);
        
        livrosPrincipais.forEach((livro, index) => {
            const isFavorito = favoritos.includes(index);
            const usuarioCurtiu = usuarioCurtiuLivro(index);
            const podeEditar = SistemaAuth.isAdmin();
            
            console.log(`📖 Livro ${index}: "${livro.titulo}" - Favorito: ${isFavorito}`);
            
            const bookItem = document.createElement('div');
            bookItem.className = 'book livro-principal';
            bookItem.title = `${livro.titulo} - ${livro.autor}`;
            
            bookItem.innerHTML = `
                <div class="book-actions-top">
                    ${usuarioLogado ? `
                        <button class="btn-favorite ${isFavorito ? 'favorited' : ''}" 
                                onclick="toggleFavoritoNoCard(${index}, event)"
                                title="${isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}">
                            ${isFavorito ? '😃' : '🤍'}
                        </button>
                        <button class="btn-curtir ${usuarioCurtiu ? 'curtido' : ''}" 
                                onclick="toggleCurtida(${index}, event)"
                                title="${usuarioCurtiu ? 'Remover curtida' : 'Curtir livro'}">
                            ${usuarioCurtiu ? '⭐' : '✭'}
                        </button>
                    ` : '<div style="width: 70px; height: 35px;"></div>'}
                    
                    ${podeEditar ? `
                        <button class="btn-edit" onclick="event.stopPropagation(); editarLivro(${index})" title="Editar livro">🖋</button>
                        <button class="btn-delete" onclick="event.stopPropagation(); excluirLivro(${index})" title="Excluir livro">🗑️</button>
                    ` : ''}
                </div>
                <img src="${livro.capa || 'assets/capa/capa-padrao.jpg'}" alt="${livro.titulo}" 
                     onerror="this.src='assets/capa/capa-padrao.jpg'">
                <div class="info">
                    <div class="titulo">${livro.titulo || 'Livro Sem Título'}</div>
                    <div class="autor">${livro.autor || 'Autor Desconhecido'}</div>
                    <div class="book-stats">
                        <span class="stat views" title="Visualizações">👁️‍🗨️ ${livro.visualizacoes || 0}</span>
                        <span class="stat likes" title="Curtidas">⭐ ${livro.curtidas || 0}</span>
                    </div>
                    <div class="badge-principal">👑 Principal</div>
                </div>
            `;
            
            bookItem.addEventListener('click', () => {
                console.log(`📖 Abrindo livro principal: "${livro.titulo}"`);
                registrarVisualizacao(index);
                abrirLivro(index);
            });
            
            estante.appendChild(bookItem);
        });
    }
    
    // MOSTRAR LIVROS PESSOAIS (se houver e usuário logado)
    if (usuarioLogado && livrosPessoais.length > 0) {
        const secaoPessoal = document.createElement('div');
        secaoPessoal.className = 'secao-estante';
        secaoPessoal.innerHTML = `
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-bottom: 2px; margin-top: 2px;">
                😊 Minha Estante Pessoal
                <button onclick="criarNovoLivroPessoal()" class="control-btn" class="btn-criar-livro" style="float: right; font-size: 1em; padding: 5px 10px;" title="Novo livro Pessoal">
                ✑</button>
            </h3>
        `;
        estante.appendChild(secaoPessoal);
        
        livrosPessoais.forEach((livro, index) => {
            // Verificar se o livro já foi submetido
            const minhasSubmissoes = SistemaAuth.carregarMinhasSubmissoes();
            const jaSubmetido = minhasSubmissoes.find(s => 
                s.titulo === livro.titulo && s.autor === livro.autor && s.status === 'pendente'
            );
            
            const bookItem = document.createElement('div');
            bookItem.className = 'book livro-pessoal';
            bookItem.title = `${livro.titulo} - ${livro.autor}`;
            
            bookItem.innerHTML = `
                <div class="book-actions-top">
                    <button class="btn-submeter" onclick="event.stopPropagation(); submeterLivroPessoal(${index})" title="Enviar para Administrador">📤</button>
                    <button class="btn-edit" onclick="event.stopPropagation(); editarLivroPessoal(${index})" title="Editar livro">🖋</button>
                    <button class="btn-delete" onclick="event.stopPropagation(); excluirLivroPessoal(${index})" title="Excluir livro">🗑️</button>
                </div>
                <img src="${livro.capa || 'assets/capa/capa-padrao.jpg'}" alt="${livro.titulo}" 
                     onerror="this.src='assets/capa/capa-padrao.jpg'">
                <div class="info">
                    <div class="titulo">${livro.titulo || 'Livro Sem Título'}</div>
                    <div class="autor">${livro.autor || 'Autor Desconhecido'}</div>
                    <div class="book-stats">
                        <span class="stat views" title="Visualizações">👁️‍🗨️ ${livro.visualizacoes || 0}</span>
                        <span class="stat likes" title="Curtidas">⭐ ${livro.curtidas || 0}</span>
                    </div>
                    <div class="badge-pessoal">👤 Pessoal</div>
                    ${jaSubmetido ? '<div class="badge-submetido">⏳ Submetido</div>' : ''}
                </div>
            `;
            
            bookItem.addEventListener('click', () => {
                console.log(`📖 Abrindo livro pessoal: "${livro.titulo}"`);
                abrirLivroPessoal(index);
            });
            
            estante.appendChild(bookItem);
        });
    }
    
    // BOTÃO PARA CRIAR LIVRO PESSOAL (se usuário logado mas sem livros pessoais)
    if (usuarioLogado && livrosPessoais.length === 0 && livrosPrincipais.length > 0) {
        const secaoVazia = document.createElement('div');
        secaoVazia.className = 'secao-estante';
        secaoVazia.innerHTML = `
            <div style="text-align: center; margin: 40px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">👤 Sua Estante Pessoal</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px;">Você ainda não tem livros pessoais.</p>
                <button onclick="criarNovoLivroPessoal()" class="btn-criar-livro" title="Crie Primeiro Livro Pessoal">
                    ✑ Criar Primeiro Livro Pessoal
                </button>
            </div>
        `;
        estante.appendChild(secaoVazia);
    }
    
    console.log('✅ Estante carregada com livros principais e pessoais!');
}

function carregarLivros() {
    carregarEstante();
}

// =================================================================
// ===== EDIÇÃO DE LIVROS =====
// =================================================================
function editarLivro(index) {
    console.log('✏️ Tentando editar livro com índice:', index);
    
    // CORREÇÃO: Verificação mais robusta do índice
    if (index === undefined || index === null || index < 0 || index >= livros.length) {
        console.error('❌ Índice de livro inválido:', index);
        mostrarNotificacao('Erro: Livro não encontrado!', 'warning');
        return;
    }

    const livro = livros[index];
    if (!livro) {
        console.error('❌ Livro não encontrado no índice:', index);
        mostrarNotificacao('Erro: Livro não encontrado!', 'warning');
        return;
    }

    console.log('🔗 Redirecionando para editar livro:', livro.titulo, 'com índice:', index);
    
    // CORREÇÃO: Usar encodeURIComponent para garantir que o parâmetro seja passado corretamente
    window.location.href = `editar.html?edit=${encodeURIComponent(index)}`;
}

// ===== EXCLUIR LIVRO CORRIGIDO PARA FAVORITOS =====
function excluirLivro(index) {
    console.log('🗑️ EXCLUINDO LIVRO - Índice:', index);
    
    if (index < 0 || index >= livros.length) {
        console.error('❌ Índice de livro inválido');
        mostrarNotificacao('Erro: Livro não encontrado', 'warning');
        return;
    }

    const livro = livros[index];
    if (!livro) {
        console.error('❌ Livro não encontrado');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o livro "${livro.titulo}"?`)) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return;
    }

    try {
        console.log('📝 Processando exclusão...');
        
        // 1. Remover dos favoritos
        const favIndex = favoritos.indexOf(index);
        if (favIndex !== -1) {
            favoritos.splice(favIndex, 1);
            console.log('✅ Removido dos favoritos');
        }
        
        // 2. Ajustar índices dos outros favoritos
        favoritos = favoritos.map(favIndex => {
            if (favIndex > index) {
                console.log(`🔄 Ajustando índice ${favIndex} para ${favIndex - 1}`);
                return favIndex - 1;
            }
            return favIndex;
        });
        
        salvarFavoritos();
        
        // 3. Remover livro
        livros.splice(index, 1);
        salvarLivros();
        console.log('✅ Livro removido da lista principal');
        
        // 4. Fechar leitor se era o livro aberto
        if (livroAtual && livroAtual.index === index) {
            console.log('✅ Fechando leitor do livro excluído');
            fecharLeitor();
            livroAtual = null;
        }
        
        // 5. Recarregar a página atual
        const nomePagina = window.location.pathname.split('/').pop();
        console.log('🔄 Recarregando página:', nomePagina);
        
        if (nomePagina === 'favoritos.html') {
            carregarFavoritos();
        } else {
            carregarEstante();
        }
        
        mostrarNotificacao('✅ Livro excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        mostrarNotificacao('❌ Erro ao excluir livro', 'warning');
    }
}

// =================================================================
// ===== ABRIR LIVRO NO LEITOR & INICIALIZAR FLIPBOOK =====
// =================================================================
function abrirLivro(index, paginaInicial = 1) {
    if (index < 0 || index >= livros.length || !livros[index]) {
        console.error('❌ Índice de livro inválido:', index);
        mostrarNotificacao('Erro ao abrir livro: livro não encontrado', 'warning');
        return;
    }

    const livro = livros[index];
    console.log('📖 Abrindo livro:', livro.titulo);

    // ✅ REGISTRAR VISUALIZAÇÃO ANTES DE ABRIR
    registrarVisualizacao(index);

    // 1. Destruir Turn.js anterior (se houver) para evitar duplicação de instâncias
    if (typeof $ !== 'undefined' && $.fn.turn && $('.ej-book').data().hasOwnProperty('turn')) {
         $('.ej-book').turn('destroy');
    }

    // 2. Define o livro atual com o índice (para favoritos/edição)
    livroAtual = { ...livro, index };
    modoEdicao = false;

    // 3. Monta o DOM das páginas
    renderizarLivro(livro);

    // 4. Exibe o leitor e atualiza os botões
    document.getElementById('leitor').classList.remove('oculto');
    atualizarBotaoFavorito();
    atualizarBotaoCurtir();
    
    // 5. Inicializa o Turn.js e o Slider com as novas páginas
    if (typeof $ !== 'undefined' && $.fn.turn) {
        setTimeout(() => {
            loadApp(paginaInicial);
            atualizarBotaoFavorito();
            atualizarBotaoCurtir();
            
            // ✅ INICIALIZAR SLIDER APÓS CARREGAR
            setTimeout(() => {
                inicializarSliderPaginas();
                const info = obterInfoPaginas();
                atualizarSliderPaginas(info.atual, info.total);
            }, 800);
        }, 100);
    } else {
        console.warn("Turn.js ainda não carregado.");
    }

    console.log('✅ Livro aberto com sucesso');
}

// ===== ATUALIZAR BOTÃO DO LEITOR =====
function atualizarBotaoFavorito() {
    const btnFav = document.getElementById('btnFav');
    if (!btnFav || !livroAtual) return;
    
    const isFavorito = favoritos.includes(livroAtual.index);
    
    btnFav.innerHTML = isFavorito ? '😃' : '🤍';
    btnFav.title = isFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
    btnFav.style.color = isFavorito ? 'gold' : 'white';
}

// ===== ATUALIZAR BOTÃO DE CURTIR NO LEITOR =====
function atualizarBotaoCurtir() {
    const btnCurtir = document.getElementById('btnCurtir');
    if (!btnCurtir || !livroAtual) return;
    
    const usuarioCurtiu = usuarioCurtiuLivro(livroAtual.index);
    
    btnCurtir.innerHTML = usuarioCurtiu ? '⭐' : '✭';
    btnCurtir.title = usuarioCurtiu ? 'Remover curtida' : 'Curtir livro';
    btnCurtir.style.color = usuarioCurtiu ? '#e74c3c' : 'white';
}

// =================================================================
// ===== RENDERIZAR LIVRO NO FLIPBOOK =====
// =================================================================
function renderizarLivro(livro) {
    const flipbook = document.querySelector('#flipbook .ej-book');
    flipbook.innerHTML = '';

    // LÓGICA ROBUSTA PARA ENCONTRAR O ARRAY DE PÁGINAS
    let paginasReais = [];
    
    if (livro.paginas && Array.isArray(livro.paginas)) {
        paginasReais = livro.paginas;
    } else if (livro.conteudo && Array.isArray(livro.conteudo)) {
        paginasReais = livro.conteudo;
    } else if (livro.texto && Array.isArray(livro.texto)) {
        paginasReais = livro.texto;
    } else {
        console.warn('Livro não possui páginas válidas, usando páginas de exemplo.');
    }
    
    const paginasConteudo = paginasReais.length > 0 ? paginasReais : 
        Array.from({ length: 10 }, (_, i) => ({ 
            titulo: `Página ${i + 1} (Exemplo)`, 
            conteudo: 'Conteúdo de exemplo. Edite o livro para mudar o texto.' 
        }));
    
    // ======== CAPA FRONTAL (hard) ========
   const capaFrontal = criarPagina('hard');
    capaFrontal.innerHTML = `
        <div class="side"></div>
        <div style="position: relative; z-index: 2; border-radius: 8px 8px 8px 8px; text-align: center; padding: 20px; background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; height: 100%;">
            <h1 style="font-size: 2.5em; text-align: center; margin-bottom: 20px; margin-top: 100px; color: white;">${livro.titulo || 'Título'}</h1>
            <h2 style="font-size: 1.5em; margin-bottom: 150px; color: white;">${livro.autor || 'Autor'}</h2>
            ${livro.capa ? `<img src="${livro.capa}" alt="Capa" style="max-width: 200px; margin: 20px auto; border-radius: 5px;">` : ''}
        </div>
    `;
    flipbook.appendChild(capaFrontal);

    // ======== VERSO DA CAPA (hard front-side) ========
    const versoCapa = criarPagina('hard front-side');
    versoCapa.innerHTML = '<div class="depth"></div>';
    flipbook.appendChild(versoCapa);

    // ======== PÁGINAS DE CONTEÚDO (own-size) ========
    paginasConteudo.forEach((paginaData, idx) => {
        let tituloConteudo = `Página ${idx + 1}`;
        let conteudoHtml = 'Conteúdo da página...';
        
        if (typeof paginaData === 'string') {
            conteudoHtml = paginaData;
        } else if (typeof paginaData === 'object' && paginaData !== null) {
            tituloConteudo = paginaData.titulo || `Página ${idx + 1}`;
            conteudoHtml = paginaData.conteudo || paginaData.texto || 'Conteúdo da página...';

            if (Array.isArray(conteudoHtml)) {
                conteudoHtml = conteudoHtml.map(b => b.insert || b.conteudo || b).join('');
            }
        }
        
        if (!conteudoHtml || conteudoHtml.trim() === 'Conteúdo da página...') {
             conteudoHtml = 'Conteúdo não encontrado. Verifique o console para o formato de salvamento.';
        }

        const paginaElement = criarPagina('own-size' + (idx % 2 === 0 ? ' even' : ''));
        paginaElement.innerHTML = `
            <div style="padding: 30px 30px; height: 100%;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 5px;">
                    ${tituloConteudo}
                </h2>
                <div style="line-height: 1.2; font-size: 0.8em;">
                    ${conteudoHtml}
                </div>
                <div style="position: absolute; bottom: 20px; right: 30px; color: #7f8c8d; font-size: 0.7em;">
                    ${idx + 1}
                </div>
            </div>
        `;
        flipbook.appendChild(paginaElement);
    });

    // ======== LÓGICA DE FECHAMENTO ========
    let totalElementosAtuais = 2 + paginasConteudo.length;

    if (totalElementosAtuais % 2 !== 0) {
        const paginaEmBranco = criarPagina('own-size odd');
        paginaEmBranco.innerHTML = '<div style="background-color: #f7f9fb; height: 100%;"></div>'; 
        flipbook.appendChild(paginaEmBranco);
        totalElementosAtuais++;
    }

    const anteversoContracapa = criarPagina('hard fixed back-side');
    anteversoContracapa.innerHTML = '<div class="depth"></div>';
    flipbook.appendChild(anteversoContracapa);
    
    const contracapa = criarPagina('hard');
    contracapa.innerHTML = `
        <div style="position: relative; z-index: 2; border-radius: 8px 8px 8px 8px; text-align: center; padding: 20px; background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); color: white; height: 100%;">
            <div style="margin-top: 150px;">
                <h2 style="margin-bottom: 30px; font-size: 2em; color: white;">📕 Fim</h2>
                <p style="font-size: 1.2em; margin-bottom: 20px;">Obrigado pela leitura!</p>
                <div style="margin-top: 50px;">
                    <p style="font-size: 1.1em;"><strong>${livro.titulo || 'Título'}</strong></p>
                    <p style="font-size: 1em;">por ${livro.autor || 'Autor'}</p>
                </div>
            </div>
        </div>
    `;
    flipbook.appendChild(contracapa);
}

// ===== FUNÇÃO UTILITÁRIA: CRIAR PÁGINA =====
function criarPagina(...classes) {
    const div = document.createElement('div');
    div.className = classes.join(' ');
    return div;
}

// =================================================================
// ===== FECHAR LEITOR (ATUALIZADA) =====
// =================================================================

function fecharLeitor() {
    console.log('🔒 Fechar leitor executado');
    
    // Remove eventos de redimensionamento
    $(window).off('resize');
    
    // Destroi o slider
    if ($("#slider").hasClass('ui-slider')) {
        $("#slider").slider('destroy');
    }
    
    // Destroi a instância do Turn.js
    if (typeof $ !== 'undefined' && $.fn.turn && $('.ej-book').data().hasOwnProperty('turn')) {
        $('.ej-book').turn('destroy');
    }
    
    flipbookInicializado = false;
    livroAtual = null;
    
    document.getElementById('leitor').classList.add('oculto');
    console.log('✅ Leitor fechado com sucesso');
}

// =================================================================
// ===== NAVEGAÇÃO POR TECLADO =====
// =================================================================
document.addEventListener('keydown', function(e) {
    const leitorAberto = !document.getElementById('leitor').classList.contains('oculto');
    
    if (leitorAberto && flipbookInicializado && typeof $ !== 'undefined' && $.fn.turn) {
        switch(e.key) {
            case 'ArrowLeft': 
                $('.ej-book').turn('previous');
                atualizarControles();
                break;
            case 'ArrowRight': 
                $('.ej-book').turn('next');
                atualizarControles();
                break;
            case 'Escape': 
                fecharLeitor();
                break;
        }
    }
});

// =================================================================
// ===== LOAD APP ATUALIZADA COM SLIDER =====
// =================================================================
function loadApp(paginaInicial = 1) {
    var flipbook = $('.ej-book');
    
    if (flipbook.width()==0 || flipbook.height()==0) {
        setTimeout(loadApp, 10);
        return;
    }

    flipbook.addClass('turnjs');

    flipbook.turn({
        elevation: 50,
        acceleration: !isChrome(),
        autoCenter: true,
        gradients: true,
        duration: 1000,
        when: {
            turning: function(e, page, view) {
                var book = $(this),
                    currentPage = book.turn('page'),
                    pages = book.turn('pages');
                
                if (page >= 2)
                    $('.ej-book .front-side').addClass('fixed');
                else
                    $('.ej-book .front-side').removeClass('fixed');
                
                if (page < pages)
                    $('.ej-book .back-side').addClass('fixed');
                else
                    $('.ej-book .back-side').removeClass('fixed');

                updateDepth(book, page);
            },
            turned: function(e, page) {
                var book = $(this);
                updateDepth(book);
                
                // ✅ ATUALIZAR SLIDER QUANDO PÁGINA É VIRADA
                const paginaAtual = book.turn('page');
                const totalPaginas = book.turn('pages');
                atualizarSliderPaginas(paginaAtual, totalPaginas);
                
                book.turn('center');
                
                flipbookInicializado = true;
                atualizarControles();
                
                console.log('✅ Flipbook totalmente inicializado com slider integrado');
            },
            start: function(e, pageObj) { moveBar(true); },
            end: function(e, pageObj) { 
                moveBar(false); 
                flipbookInicializado = true;
            }
        }
    });

    // ✅ INICIALIZAR SLIDER DE PÁGINAS
    setTimeout(() => {
        inicializarSliderPaginas();
        
        // Configurar página inicial
        if (paginaInicial > 1) {
            setTimeout(() => {
                flipbook.turn('page', paginaInicial);
                updateDepth(flipbook, paginaInicial);
                atualizarControles();
            }, 200);
        } else {
            // Atualizar slider com informações iniciais
            const info = obterInfoPaginas();
            atualizarSliderPaginas(info.atual, info.total);
        }
    }, 500);
    
    flipbook.addClass('animated');
    $('#canvas').css({visibility: 'visible'});
    
    flipbookInicializado = true;
    console.log('✅ Flipbook inicializado com slider de páginas');
}

// ===== INICIALIZAR SLIDER DE PÁGINAS =====
function inicializarSliderPaginas() {
    console.log('🎛️ Inicializando slider de páginas...');
    
    const slider = document.getElementById('page-slider');
    const currentPageDisplay = document.getElementById('current-page-display');
    const totalPagesDisplay = document.getElementById('total-pages-display');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!slider || !currentPageDisplay) {
        console.warn('❌ Elementos do slider não encontrados');
        return;
    }
    
    // Configurar eventos dos botões
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navegarPagina('previous'));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navegarPagina('next'));
    }
    
    // Configurar evento do slider
    slider.addEventListener('input', function(e) {
        const targetPage = parseInt(e.target.value);
        console.log(`🔄 Slider movido para página: ${targetPage}`);
        irParaPagina(targetPage);
    });
    
    console.log('✅ Slider de páginas inicializado');
}

// ===== ATUALIZAR SLIDER DE PÁGINAS =====
function atualizarSliderPaginas(paginaAtual, totalPaginas) {
    const slider = document.getElementById('page-slider');
    const currentPageDisplay = document.getElementById('current-page-display');
    const totalPagesDisplay = document.getElementById('total-pages-display');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (!slider || !currentPageDisplay) return;
    
    // Atualizar displays
    currentPageDisplay.textContent = paginaAtual;
    if (totalPagesDisplay) {
        totalPagesDisplay.textContent = totalPaginas;
    }
    
    // Atualizar slider
    slider.max = totalPaginas;
    slider.value = paginaAtual;
    
    // Atualizar estado dos botões
    if (prevBtn) {
        prevBtn.disabled = paginaAtual <= 1;
        prevBtn.style.opacity = paginaAtual <= 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = paginaAtual >= totalPaginas;
        nextBtn.style.opacity = paginaAtual >= totalPaginas ? '0.5' : '1';
    }
    
    // Atualizar fundo do slider (progresso)
    const progress = (paginaAtual / totalPaginas) * 100;
    slider.style.background = `linear-gradient(to right, #3498db ${progress}%, #ddd ${progress}%)`;
    
    console.log(`📊 Slider atualizado: ${paginaAtual}/${totalPaginas}`);
}

// ===== IR PARA PÁGINA ESPECÍFICA =====
function irParaPagina(numeroPagina) {
    if (!flipbookInicializado) {
        console.warn('⚠️ Flipbook não inicializado');
        return;
    }
    
    const flipbook = $('.ej-book');
    
    if (typeof $.fn.turn !== 'undefined' && flipbook.length && flipbook.hasClass('turnjs')) {
        try {
            const paginaAtual = flipbook.turn('page');
            const totalPaginas = flipbook.turn('pages');
            
            // Validar número da página
            const paginaDestino = Math.max(1, Math.min(numeroPagina, totalPaginas));
            
            if (paginaDestino !== paginaAtual) {
                console.log(`🔄 Indo para página: ${paginaDestino}`);
                flipbook.turn('page', paginaDestino);
            }
        } catch (error) {
            console.error('❌ Erro ao ir para página:', error);
            navegacaoManualParaPagina(numeroPagina);
        }
    } else {
        navegacaoManualParaPagina(numeroPagina);
    }
}

// ===== NAVEGAÇÃO MANUAL PARA PÁGINA =====
function navegacaoManualParaPagina(numeroPagina) {
    console.log('🔄 Navegação manual para página:', numeroPagina);
    
    // Aqui você pode implementar navegação alternativa se o Turn.js não estiver funcionando
    const event = new CustomEvent('paginaalterada', { 
        detail: { pagina: numeroPagina } 
    });
    document.dispatchEvent(event);
}

// ===== OBTER INFORMAÇÕES DAS PÁGINAS =====
function obterInfoPaginas() {
    if (!flipbookInicializado) {
        return { atual: 1, total: 1 };
    }
    
    const flipbook = $('.ej-book');
    let paginaAtual = 1;
    let totalPaginas = 1;
    
    if (typeof $.fn.turn !== 'undefined' && flipbook.length && flipbook.hasClass('turnjs')) {
        try {
            paginaAtual = flipbook.turn('page') || 1;
            totalPaginas = flipbook.turn('pages') || 1;
        } catch (error) {
            console.error('❌ Erro ao obter info das páginas:', error);
        }
    }
    
    return { atual: paginaAtual, total: totalPaginas };
}

// ===== INICIALIZAR SLIDER (VERSÃO CORRIGIDA) =====
function inicializarSlider() {
    console.log('🎛️ Inicializando slider...');
    
    const flipbook = $('.ej-book');
    
    if (!flipbook.length || typeof $.fn.slider === 'undefined') {
        console.warn('⚠️ Flipbook ou jQuery UI Slider não encontrados.');
        setTimeout(inicializarSlider, 100);
        return;
    }

    // Aguarda o flipbook estar totalmente inicializado
    if (!flipbook.data('turn')) {
        console.log('⏳ Aguardando flipbook inicializar...');
        setTimeout(inicializarSlider, 100);
        return;
    }

    try {
        const totalPages = flipbook.turn('pages');
        const totalViews = Math.floor((totalPages + 1) / 2);
        
        console.log(`📊 Total de páginas: ${totalPages}, Visualizações: ${totalViews}`);

        // Destrói slider existente para evitar duplicação
        if ($("#slider").hasClass('ui-slider')) {
            $("#slider").slider('destroy');
        }

        // Inicializa o slider
        $("#slider").slider({
            min: 1,
            max: totalViews,
            value: 1,
            range: 'min',
            slide: function(event, ui) {
                const page = (ui.value - 1) * 2 + 1;
                console.log(`🔄 Slider movido para: ${ui.value}, Página: ${page}`);
                flipbook.turn('page', page);
            },
            change: function(event, ui) {
                atualizarControles();
            }
        });

        // Sincroniza slider quando página é virada
        flipbook.bind('turned', function(e, page) {
            if (!page) return;
            
            const viewNum = getViewNumber(flipbook, page);
            const currentSliderValue = $("#slider").slider('value');
            
            if (currentSliderValue !== viewNum) {
                $("#slider").slider('value', viewNum);
            }
            
            console.log(`📖 Página virada: ${page}, View: ${viewNum}`);
            atualizarControles();
        });

        console.log('✅ Slider inicializado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao inicializar slider:', error);
    }
}

// ===== CONFIGURAR EVENTOS FLIPBOOK ATUALIZADA =====
function configurarEventosFlipbook() {
    console.log("🔧 Configurando eventos do flipbook integrado");
    
    $(window).on('resize', function() {
        if (flipbookInicializado && $('.ej-book').data("turn")) {
            $('.ej-book').turn("size", $('.ej-book').width(), $('.ej-book').height());
            setTimeout(inicializarSlider, 300);
        }
    });
}

// ===== VERIFICAR JQUERY UI =====
function verificarJQueryUI(callback) {
    if (typeof $.fn.slider !== 'undefined') {
        callback();
    } else {
        console.log('⏳ Aguardando jQuery UI carregar...');
        setTimeout(() => verificarJQueryUI(callback), 100);
    }
}

// ===== LOAD TURN JS DEPENDENCIES ATUALIZADA =====
function loadTurnJsDependencies() {
    if (typeof yepnope !== 'undefined') {
        yepnope({
            test : Modernizr.csstransforms,
            yep: ['turn.min.js'],
            nope: ['turn.js'],
            both: [
                     'style.css'
            ],
            complete: () => {
                console.log('✅ Todas as dependências carregadas (versão integrada)');
                verificarJQueryUI(() => {
                    if (livroAtual && !document.getElementById('leitor').classList.contains('oculto')) {
                        loadApp();
                    }
                });
            }
        });
    } else {
        console.error("A biblioteca Yepnope não está carregada.");
        // Fallback: tentar carregar diretamente
        setTimeout(() => {
            if (livroAtual && !document.getElementById('leitor').classList.contains('oculto')) {
                loadApp();
            }
        }, 1000);
    }
}

// ===== FUNÇÕES PARA LIVROS PESSOAIS =====

// Editar livro pessoal
function editarLivroPessoal(index) {
    console.log('✏️ Editando livro pessoal:', index);
    
    if (!SistemaAuth.isLogado()) {
        mostrarNotificacao('❌ Faça login para editar livros pessoais', 'warning');
        return;
    }
    
    window.location.href = `editar.html?edit=pessoal_${index}`;
}

// Excluir livro pessoal
function excluirLivroPessoal(index) {
    console.log('🗑️ Excluindo livro pessoal:', index);
    
    if (!SistemaAuth.isLogado()) {
        mostrarNotificacao('❌ Faça login para excluir livros pessoais', 'warning');
        return;
    }
    
    const livrosPessoais = SistemaAuth.carregarLivrosPessoais();
    const livro = livrosPessoais[index];
    
    if (!livro) {
        console.error('❌ Livro pessoal não encontrado');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o livro "${livro.titulo}" da sua estante pessoal?`)) {
        return;
    }
    
    try {
        SistemaAuth.excluirLivroPessoal(index);
        mostrarNotificacao('✅ Livro pessoal excluído com sucesso!', 'success');
        carregarEstante();
    } catch (error) {
        console.error('❌ Erro ao excluir livro pessoal:', error);
        mostrarNotificacao('❌ Erro ao excluir livro pessoal', 'warning');
    }
}

// Abrir livro pessoal no leitor
function abrirLivroPessoal(index) {
    console.log('📖 Abrindo livro pessoal:', index);
    
    if (!SistemaAuth.isLogado()) {
        mostrarNotificacao('❌ Faça login para ler livros pessoais', 'warning');
        return;
    }
    
    const livrosPessoais = SistemaAuth.carregarLivrosPessoais();
    const livro = livrosPessoais[index];
    
    if (!livro) {
        console.error('❌ Livro pessoal não encontrado');
        return;
    }
    
    console.log('📖 Abrindo livro pessoal:', livro.titulo);
    
    // Usar a mesma função de abrir livro, mas marcar como pessoal
    livroAtual = { ...livro, index, tipo: 'pessoal' };
    modoEdicao = false;
    
    renderizarLivro(livro);
    document.getElementById('leitor').classList.remove('oculto');
    atualizarBotaoFavorito();
    atualizarBotaoCurtir();
    
    if (typeof $ !== 'undefined' && $.fn.turn) {
        setTimeout(() => {
            loadApp(1);
        }, 100);
    }
}

// ===== DEBUG DOS FAVORITOS =====
function debugFavoritosCompleto() {
    console.log('=== 🐛 DEBUG COMPLETO DOS FAVORITOS ===');
    const usuario = SistemaAuth.getUsuarioLogado();
    console.log('👤 Usuário logado:', usuario);
    
    if (usuario) {
        const chaveFavoritos = `minhaObraDigital_favoritos_${usuario.id}`;
        const favoritosSalvos = localStorage.getItem(chaveFavoritos);
        console.log('🔑 Chave no localStorage:', chaveFavoritos);
        console.log('💾 Favoritos salvos (RAW):', favoritosSalvos);
        
        try {
            const favoritosParseados = favoritosSalvos ? JSON.parse(favoritosSalvos) : [];
            console.log('📋 Favoritos parseados:', favoritosParseados);
            console.log('🔢 Tipo:', Array.isArray(favoritosParseados) ? 'Array' : typeof favoritosParseados);
        } catch (e) {
            console.error('❌ Erro ao parsear favoritos:', e);
        }
    }
    
    console.log('📚 Livros na memória:', livros.length);
    console.log('⭐ Favoritos em memória:', favoritos);
    console.log('✅ Índices válidos:', favoritos.filter(index => index >= 0 && index < livros.length));
    
    // Verificar cada favorito individualmente
    favoritos.forEach((index, i) => {
        const livro = livros[index];
        console.log(`📖 Favorito ${i}: Índice ${index} -`, livro ? `"${livro.titulo}"` : 'LIVRO NÃO ENCONTRADO');
    });
    
    console.log('=== FIM DEBUG ===');
}

// Chamar esta função no console do navegador para diagnosticar
window.debugFav = debugFavoritosCompleto;

// =================================================================
// ===== NOTIFICAÇÕES =====
// =================================================================
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#27ae60' : tipo === 'warning' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        transform: translateX(100%);
        opacity: 0;
    `;
    notification.textContent = mensagem;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== DEBUG: VERIFICAR LIVROS DISPONÍVEIS =====
function debugLivrosDisponiveis() {
    console.log('🐛 DEBUG LIVROS DISPONÍVEIS:');
    console.log('📚 Total de livros:', livros.length);
    
    livros.forEach((livro, index) => {
        console.log(`📖 Livro ${index}: "${livro.titulo}"`, {
            visualizacoes: livro.visualizacoes || 0,
            curtidas: livro.curtidas || 0,
            capa: livro.capa || 'padrão'
        });
    });
    
    // Testar função abrirLivro
    if (livros.length > 0) {
        console.log('🔧 Testando abrirLivro com índice 0...');
        console.log('📖 Livro para teste:', livros[0].titulo);
    }
}

// Tornar global para debug
window.debugLivros = debugLivrosDisponiveis;

// Adicionar botão de debug temporário
setTimeout(() => {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🐛 Debug Favoritos';
    debugBtn.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; padding: 5px; font-size: 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;';
    debugBtn.onclick = debugFavoritosCompleto;
    document.body.appendChild(debugBtn);
}, 3000);