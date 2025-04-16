/**
 * Arquivo de configuração do Jest para polyfills globais
 * Este arquivo configura o ambiente de teste para simular APIs de navegador e do Vite
 */

// Importa as implementações de TextEncoder e TextDecoder do Node.js
const { TextEncoder, TextDecoder } = require('util');

/**
 * Adiciona TextEncoder/TextDecoder ao objeto global
 * Estas APIs são nativas em navegadores, mas não em ambientes Node.js mais antigos
 * React Router e outras bibliotecas modernas dependem destas APIs
 */
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

/**
 * Mock para o import.meta.env do Vite
 * Em aplicações Vite, variáveis de ambiente são acessadas via import.meta.env
 * Como import.meta é exclusivo de ESM e Jest usa CommonJS, precisamos simulá-lo
 */
global.importMetaEnv = {
    VITE_API_BASE_URL: "http://api.example.com",
};

/**
 * Configura a estrutura import.meta.env no objeto global
 * Object.defineProperty permite criar propriedades não-enumeráveis
 * Isso simula a estrutura exata usada pelo Vite em runtime
 */
Object.defineProperty(global, "import", {
    value: {
        meta: {
            env: global.importMetaEnv,
        },
    },
});

/**
 * Mock para MutationObserver
 * MutationObserver é uma API do navegador para monitorar mudanças no DOM
 * Como não temos um DOM real no ambiente de teste, criamos uma implementação vazia
 * Componentes React modernos frequentemente usam esta API para detectar mudanças no DOM
 */
global.MutationObserver = class {
    constructor(callback) {
        this.callback = callback;
    }
    disconnect() { }
    observe() { }
};
