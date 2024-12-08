# API do SINAPHEATMAP

A **API REST do SINAPHEATMAP** fornece os recursos necessários para o gerenciamento de experimentos provenientes de sistemas de **eyetracking**. Além disso, inclui funcionalidades para cadastro e autenticação de usuários, garantindo um ambiente seguro e personalizado para cada pesquisador.

Para acessar a documentação completa da API, consulte o **Swagger** disponível no endpoint: `/api-docs`.

---

## Requisitos do Sistema

Antes de executar o projeto, verifique se os seguintes requisitos estão atendidos:

- **Node.js** (obrigatório - versão 18 ou superior [recomendado])
- **MongoDB** (obrigatório)
- **Docker** (opcional, sugerido para inicializar os serviços rapidamente)

---

## Configuração e Execução

### 1. Dependências

Instale as dependências do projeto utilizando o **npm**:

```bash
npm install
```

### 2. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```makefile
PORT=3333
MONGO_URL=mongodb://localhost:27017/sinapheatmap
JWT_SECRET=sua_chave_secreta_aqui
```

Substitua `sua_chave_secreta_aqui` por uma chave segura para autenticação via JWT.

### 3. Iniciando o Projeto

#### Pré-requisitos

Considerando que o Docker já esteja instalado. Certifique-se de estar dentro da pasta do projeto.

Caso não tenha a imagem do container de compilação, ou precise reconstruir a imagem do Docker execute o seguinte comando:

```sh
npm run build
```

Obs.: Só é necessário gerar a imagem uma vez.

Para iniciar a aplicação, você tem duas opções:

#### 3.1. Usando Docker

Caso prefira utilizar o **Docker** para rodar os serviços, execute o seguinte comando para iniciar a aplicação e o banco de dados MongoDB:

```bash
npm run start
```

Este comando vai subir tanto o MongoDB quanto a API em containers Docker.

##### Portas Expostas

- **API**: `localhost:3333`
- **MongoDB**: `localhost:27017`

#### 3.2. Sem Docker

Caso prefira rodar sem o Docker, você pode iniciar o servidor diretamente com:

```bash
npm run dev
```

Esse comando irá iniciar a API no modo de desenvolvimento e ficará monitorando as mudanças no código.
