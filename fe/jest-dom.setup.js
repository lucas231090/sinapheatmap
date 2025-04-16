/**
 * Arquivo de configuração secundário do Jest para extensões do expect
 *
 * Este arquivo é carregado APÓS o Jest estar inicializado (setupFilesAfterEnv)
 * Diferente do jest.setup.js que é carregado ANTES do Jest (setupFiles)
 *
 * O @testing-library/jest-dom adiciona matchers personalizados ao expect do Jest
 * que facilitam o teste de elementos do DOM, como:
 * - toBeInTheDocument
 * - toHaveTextContent
 * - toBeDisabled
 * - toHaveClass
 * entre outros
 *
 * Separamos este import em um arquivo diferente porque:
 * 1. Ele precisa ser carregado DEPOIS que o Jest inicializa o 'expect'
 * 2. Se incluído no jest.setup.js, causará erro "expect is not defined"
 * 3. A separação respeita o fluxo de inicialização do Jest
 */
import '@testing-library/jest-dom';