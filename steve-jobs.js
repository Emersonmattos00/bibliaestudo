/* ===== Arquivo: steve-jobs.js (modificado: p2 -> front-side, p111 -> back-side) ===== */

/* Função que atualiza a "profundidade" (depth) visual do livro */
function updateDepth(book, newPage) {                         // Declara a função updateDepth com parâmetros 'book' e 'newPage'
    var page = book.turn('page'),                             // Obtém a página atual do livro via API do turn.js
        pages = book.turn('pages'),                           // Obtém o total de páginas do livro
        depthWidth = 16 * Math.min(1, page * 2 / pages);      // Calcula largura inicial da profundidade (frente) proporcional à posição

    newPage = newPage || page;                                // Se newPage não informado, usa a página atual

    if (newPage > 3)                                          // Se a nova página (ou atual) for além das primeiras páginas (evita aplicar depth na capa externa)
        $('.ej-book .front-side .depth').css({                // Seleciona o elemento .depth dentro de .front-side (verso da capa) e aplica css
            width: depthWidth,                                // Define a largura da profundidade
            left: 20 - depthWidth                             // Posicionamento esquerdo para simular deslocamento da sombra/espessura
        });
    else                                                      // Caso esteja nas primeiras páginas (capa muito aberta/fechada)
        $('.ej-book .front-side .depth').css({ width: 0 });  // Zera a largura da profundidade no verso da capa

    depthWidth = 16 * Math.min(1, (pages - page) * 2 / pages); // Recalcula a largura da profundidade para o lado traseiro (contracapa)

    if (newPage < pages - 3)                                  // Se ainda não estiver nas últimas páginas
        $('.ej-book .back-side .depth').css({                 // Seleciona .depth dentro de .back-side (anteverso da contracapa) e aplica css
            width: depthWidth,                                // Define a largura da profundidade para o lado traseiro
            right: 20 - depthWidth                            // Posicionamento direito para simular deslocamento da sombra/espessura oposta
        });
    else                                                      // Caso esteja nas últimas páginas
        $('.ej-book .back-side .depth').css({ width: 0 });    // Zera a largura da profundidade no anteverso da contracapa
}                                                            // Fim da função updateDepth


/* Função que carrega o conteúdo HTML de uma página via AJAX */
function loadPage(page) {                                     // Declara a função loadPage que recebe o número da página
    $.ajax({ url: 'pages/page' + page + '.html' })           // Faz requisição AJAX para 'pages/pageX.html'
        .done(function(pageHtml) {                           // Quando receber resposta com sucesso
            $('.ej-book .p' + page).html(                     // Seleciona o contêiner .p{n} do livro e insere o HTML
                pageHtml.replace('samples/steve-jobs/', '')   // Remove prefixo de caminho do exemplo original (ajuste local)
            );
        });                                                  // Fim do .done
}                                                            // Fim da função loadPage


/* Função que adiciona uma página vazia (loader) dinamicamente ao livro */
function addPage(page, book) {                                // Declara função addPage com parâmetros 'page' e 'book'
    var id, pages = book.turn('pages');                       // 'pages' recebe total de páginas do livro

    if (!book.turn('hasPage', page)) {                        // Se o livro ainda não tem a página solicitada
        var element = $('<div />', {                          // Cria um novo elemento div jQuery
            'class': 'own-size',                              // Atribui a classe 'own-size' (estilo de página)
            css: { width: 460, height: 582 }                  // Define dimensões padrão (mesmas do exemplo original)
        }).html('<div class="loader"></div>');                // Insere um loader dentro da página enquanto carrega

        if (book.turn('addPage', element, page))              // Tenta adicionar a página ao livro via API do turn.js
            loadPage(page);                                   // Se adicionado com sucesso, carrega o conteúdo via AJAX
    }                                                        // Fim do if hasPage
}                                                            // Fim da função addPage


/* Função que calcula o número de visualizações (views) do livro */
function numberOfViews(book) {                               // Declara função numberOfViews
    return book.turn('pages') / 2 + 1;                       // Retorna total de views (páginas duplas) = páginas/2 + 1
}                                                            // Fim da função numberOfViews


/* Função que obtém o número da visão/visão atual a partir da página */
function getViewNumber(book, page) {                         // Declara função getViewNumber com 'book' e 'page' opcionais
    return parseInt((page || book.turn('page')) / 2 + 1, 10); // Calcula e retorna a visão atual (ex: págs 4-5 => view 3)
}                                                            // Fim da função getViewNumber


/* Função que trata eventos de clique/ativação do zoom */
function zoomHandle(e) {                                     // Declara função zoomHandle recebendo evento 'e'
    if ($('.ej-book').data().zoomIn)                         // Se já estiver com zoom ativo (flag)
        zoomOut();                                           // Chama zoomOut para desativar
    else if (e.target && $(e.target).hasClass('zoom-this'))  // Se o alvo do evento tem classe 'zoom-this'
        zoomThis($(e.target));                               // Chama zoomThis passando o elemento alvo
}                                                            // Fim da função zoomHandle


/* Função que aplica o zoom em uma imagem/elemento dentro da página */
function zoomThis(pic) {                                     // Declara função zoomThis que recebe o elemento jQuery 'pic'
    var position, translate,                                 // Variáveis para cálculo de posicionamento e tradução
        tmpContainer = $('<div />', { 'class': 'zoom-pic' }),// Cria container temporário para a imagem ampliada
        transitionEnd = $.cssTransitionEnd(),                // Detecta evento de fim de transição CSS suportado
        tmpPic = $('<img />'),                               // Elemento de imagem temporário
        zCenterX = $('#book-zoom').width() / 2,             // Centro em X do contêiner #book-zoom
        zCenterY = $('#book-zoom').height() / 2,            // Centro em Y do contêiner #book-zoom
        bookPos = $('#book-zoom').offset(),                 // Offset do contêiner #book-zoom na página
        picPos = {                                          // Calcula posição da imagem relativa ao livro
            left: pic.offset().left - bookPos.left,         // left relativo
            top: pic.offset().top - bookPos.top             // top relativo
        },
        completeTransition = function() {                   // Função a ser executada quando a transição terminar
            $('#book-zoom').unbind(transitionEnd);          // Remove o listener de transição
            if ($('.ej-book').data().zoomIn) {             // Se o estado zoomIn ainda estiver ativo
                tmpContainer.appendTo($('body'));          // Anexa o container temporário ao body
                $('body').css({ 'overflow': 'hidden' });   // Bloqueia rolagem do body enquanto zoom ativo
                tmpPic.css({                               
                    margin: position.top + 'px ' + position.left + 'px' // Posiciona a imagem ampliada no centro calculado
                }).appendTo(tmpContainer)                  // Insere a imagem no container temporário
                  .fadeOut(0)                              // Força redraw imediato
                  .fadeIn(500);                            // Efeito de fade-in da imagem (500ms)
            }
        };                                                  // Fim da completeTransition

    $('.ej-book').data().zoomIn = true;                     // Marca estado zoomIn = true no data do livro
    $('.ej-book').turn('disable', true);                     // Desabilita interação de virar páginas enquanto zoom ativo
    $(window).resize(zoomOut);                               // Vincula resize da janela para fechar o zoom automaticamente
    tmpContainer.click(zoomOut);                             // Fechar o zoom também ao clicar no container temporário

    tmpPic.load(function() {                                 // Quando a imagem temporária terminar de carregar
        var realWidth = $(this)[0].width,                    // Largura real da imagem carregada
            realHeight = $(this)[0].height,                  // Altura real da imagem carregada
            zoomFactor = realWidth / pic.width(),            // Fator de zoom relativo ao elemento original
            picPosition = {                                  // Calcula a posição final da imagem ampliada no viewport
                top: (picPos.top - zCenterY) * zoomFactor + zCenterY + bookPos.top, // top após escalar
                left: (picPos.left - zCenterX) * zoomFactor + zCenterX + bookPos.left // left após escalar
            };

        position = {                                         // Calcula posição onde a imagem ficará centralizada na janela
            top: ($(window).height() - realHeight) / 2,     // top central
            left: ($(window).width() - realWidth) / 2       // left central
        };

        translate = {                                       // Calcula o deslocamento necessário para animar do local original ao centro
            top: position.top - picPosition.top,            // deslocamento vertical
            left: position.left - picPosition.left          // deslocamento horizontal
        };

        $('.samples .bar').css({ visibility: 'hidden' });  // Esconde barra de samples (se existir)
        $('#slider-bar').hide();                           // Esconde a barra de slider durante o zoom

        $('#book-zoom').transform(                          // Aplica transformação CSS (translate + scale) ao contêiner de zoom
            'translate(' + translate.left + 'px, ' + translate.top + 'px)' +
            'scale(' + zoomFactor + ', ' + zoomFactor + ')'
        );

        if (transitionEnd)                                 // Se o evento de transição for suportado
            $('#book-zoom').bind(transitionEnd, completeTransition); // Vincula completeTransition ao fim da transição
        else
            setTimeout(completeTransition, 1000);          // Senão, chama a função após 1s como fallback
    });

    tmpPic.attr('src', pic.attr('src'));                   // Atribui a src ao tmpPic para iniciar o carregamento
}                                                         // Fim da função zoomThis


/* Função que desfaz o zoom e restaura o livro ao estado normal */
function zoomOut() {                                       // Declara função zoomOut
    var transitionEnd = $.cssTransitionEnd(),              // Verifica evento de fim de transição CSS
        completeTransition = function(e) {                 // Callback de finalização da animação de saída do zoom
            $('#book-zoom').unbind(transitionEnd);         // Remove listener de transição
            $('.ej-book').turn('disable', false);          // Reativa a interação do livro
            $('body').css({ 'overflow': 'auto' });        // Restaura rolagem do body
            moveBar(false);                                // Restaura a posição/z-index da barra
        };                                                 // Fim do completeTransition

    $('.ej-book').data().zoomIn = false;                  // Marca estado zoomIn = false
    $(window).unbind('resize', zoomOut);                  // Remove listener de resize
    moveBar(true);                                        // Move a barra durante a transição de saída

    $('.zoom-pic').remove();                              // Remove elementos temporários de zoom do DOM
    $('#book-zoom').transform('scale(1, 1)');             // Restaura escala do container de zoom para 1
    $('.samples .bar').css({ visibility: 'visible' });   // Torna visível a barra de samples novamente
    $('#slider-bar').show();                              // Mostra a barra de slider novamente

    if (transitionEnd)                                    // Se há evento de transição suportado
        $('#book-zoom').bind(transitionEnd, completeTransition); // Vincula callback de finalização
    else
        setTimeout(completeTransition, 1000);             // Caso contrário, fallback por timeout
}                                                         // Fim da função zoomOut


/* Função que ajusta o zIndex do handle do slider durante animações */
function moveBar(yes) {                                    // Declara função moveBar com parâmetro booleano 'yes'
    if (Modernizr && Modernizr.csstransforms) {            // Checa se Modernizr existe e suporta transforms
        $('#slider .ui-slider-handle').css({               // Ajusta zIndex do handle do slider
            zIndex: yes ? -1 : 10000                       // Se 'yes' verdadeiro coloca atrás, senão muito à frente
        });
    }
}                                                         // Fim da função moveBar


/* Função que atualiza a pré-visualização (thumbnail) do slider */
function setPreview(view) {                                // Declara função setPreview que recebe o número da view
    var previewWidth = 115,                                // Largura da pré-visualização (px)
        previewHeight = 73,                                // Altura da pré-visualização (px)
        previewSrc = 'pages/preview.jpg',                  // Fonte da imagem que contém miniaturas empilhadas verticalmente
        preview = $(_thumbPreview.children(':first')),     // Seleciona o elemento de preview interno dentro do _thumbPreview global
        numPages = (view == 1 || view == $('#slider').slider('option', 'max')) ? 1 : 2, // Se for primeira ou última view mostra 1 página
        width = (numPages == 1) ? previewWidth / 2 : previewWidth; // Ajusta largura do preview se for single page

    _thumbPreview.                                         // Manipula o elemento _thumbPreview (criado no slider.start)
        addClass('no-transition').                          // Adiciona classe para evitar transições enquanto reposiciona
        css({                                              // Ajusta css do contêiner do preview
            width: width + 15,                             // Largura + margem interna
            height: previewHeight + 15,                    // Altura + margem interna
            top: -previewHeight - 30,                      // Posiciona acima do handle do slider
            left: ($($('#slider').children(':first')).width() - width - 15) / 2 // Centraliza horizontalmente no handle
        });

    preview.css({                                          // Ajusta css do elemento de preview interno
        width: width,                                      // Define largura do preview
        height: previewHeight                              // Define altura do preview
    });

    if (preview.css('background-image') === '' ||          // Se ainda não existia background-image definido
        preview.css('background-image') == 'none') {       // ou estava none
        preview.css({ backgroundImage: 'url(' + previewSrc + ')' }); // Define o background com a imagem de previews
        setTimeout(function() {                            // Timeout mínimo para permitir aplicação de estilos
            _thumbPreview.removeClass('no-transition');    // Remove classe de bloqueio de transição
        }, 0);
    }

    preview.css({                                          // Ajusta a posição de background para escolher a miniatura certa
        backgroundPosition:
            '0px -' + ((view - 1) * previewHeight) + 'px' // Move verticalmente a imagem de previews conforme a view
    });
}                                                         // Fim da função setPreview


/* Função simples que detecta se o navegador é Chrome (usado para ajustar aceleração) */
function isChrome() {                                      // Declara função isChrome
    // Chrome's unsolved bug
    // http://code.google.com/p/chromium/issues/detail?id=128488
    return navigator.userAgent.indexOf('Chrome') != -1;   // Retorna true se 'Chrome' aparece no userAgent
}                                                         // Fim da função isChrome
