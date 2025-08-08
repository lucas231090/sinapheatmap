/**
 * Configuração do Jest para o projeto
 * Este arquivo define como o Jest vai executar os testes na aplicação
 */
export default {
  /**
   * Define o ambiente de teste como jsdom
   * jsdom simula um ambiente de navegador em Node.js, permitindo testar código que usa APIs do DOM
   */
  testEnvironment: "jsdom",

  /**
   * Configuração de setup para matchers customizados do testing-library
   * Arquivo separado para garantir ordem correta de inicialização
   */

  /**
   * Mapeamento de módulos para mock
   * Quando o código importa arquivos CSS/SCSS, Jest não sabe como interpretá-los
   * Este mapeamento substitui estas importações pelo pacote identity-obj-proxy
   * que retorna um objeto vazio ou o nome da classe que foi importada
   */
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/../config$": "<rootDir>/src/__mocks__/config.js",
    "^../../config$": "<rootDir>/src/__mocks__/config.js",
    "^../../../config$": "<rootDir>/src/__mocks__/config.js",
    "^../../../../config$": "<rootDir>/src/__mocks__/config.js",
    "^../../../../../config$": "<rootDir>/src/__mocks__/config.js"
  },

  /**
   * Define como os arquivos serão transformados antes de executar os testes
   * Arquivos .js e .jsx são processados pelo babel-jest para converter
   * código moderno (ES6+, JSX, etc.) para código que o Node.js entenda
   */
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  /**
   * Arquivos executados ANTES da inicialização do ambiente de teste
   * jest.setup.js configura polyfills e mocks globais necessários
   * para simular APIs do navegador e variáveis de ambiente do Vite
   */
  setupFiles: ['./jest.setup.js'],

  /**
   * Arquivos executados APÓS a inicialização do framework de teste
   * jest-dom.setup.js importa @testing-library/jest-dom que adiciona
   * matchers personalizados ao Jest para testar elementos do DOM
   * Esse arquivo precisa ser carregado depois que o Jest está pronto
   */
  setupFilesAfterEnv: ['./jest-dom.setup.js'],
};