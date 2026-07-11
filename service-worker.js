// ✅ VERSÃO COM VERIFICAÇÃO COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se Service Worker é suportado
    if (!('serviceWorker' in navigator)) {
        console.log('ℹ️ Service Workers não são suportados');
        return;
    }

    // Verifica se estamos em HTTPS ou localhost (requisito do Service Worker)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.log('ℹ️ Service Worker requer HTTPS ou localhost');
        return;
    }

    // Tenta registrar o Service Worker
    navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('✅ Service Worker registrado com sucesso:', registration);
            
            // Verifica se há atualizações
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Nova versão do Service Worker encontrada:', newWorker);
            });
        })
        .catch(function(error) {
            console.log('❌ Erro no registro do Service Worker:', error);
            
            // Log mais detalhado para debugging
            if (error.name === 'SecurityError') {
                console.log('🔒 Erro de segurança - verifique HTTPS/localhost');
            } else if (error.name === 'TypeError') {
                console.log('📝 Erro de tipo - verifique o arquivo sw.js');
            } else if (error.message.includes('MIME type')) {
                console.log('📄 Erro de MIME type - verifique headers do servidor');
            }
        });

    // Escuta mudanças de Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Controller do Service Worker mudou');
    });
});