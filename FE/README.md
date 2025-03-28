## Sinapheatmap Web

O **SinapHeatmap WEB** é a interface de usuário da aplicação SinapHeatmap, projetada para visualização de mapas de calor baseados em dados de rastreamento ocular (**eyetracking**). Esta aplicação permite aos pesquisadores analisar visualmente os dados coletados, ajustar a escala dos mapas de calor e fazer o download dos resultados para uma análise mais detalhada.

## Requisitos do Sistema

Antes de executar o projeto, verifique se os seguintes requisitos estão atendidos:

- **Node.js** (obrigatório - versão 18 ou superior [recomendado])

## Configuração e Execução

### 1. Dependências

Instale as dependências do projeto utilizando o **npm**:

```bash
npm install
```

Para instalar o Node.js, visite [Node.js Downloads](https://nodejs.org/) e siga as instruções para o seu sistema operacional.

### 2. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```makefile
REACT_APP_API_URL=http://localhost:3333
```

### 3. Iniciando o Projeto

##### Rodando o Projeto

Rodar `npm install` seguido de `npx vite`

##### Portas Expostas

- **Web**: `localhost:3000`

### Comentários

Desde essa data -> "28/03/2025" o heatmap.js não corrigiu um erro no qual alguns navegadores proibiam a edição direta do objeto ImageData no qual a biblioteca usa (Erro especifico: Uncaught TypeError: Cannot assign to read only property 'data' of object '#<ImageData>').
Por isso está sendo utilizado um fork, o "@mars3d/heatmap.js", no qual solucionou o problema.
As duas bibliotecas vão ficar instalados até a original resolver o problema, no qual o fork será desinstalado do projeto.
