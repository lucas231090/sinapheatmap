# Plataforma do SINAPHEATMAP

O **SINAPHEATMAP** é uma plataforma desenvolvida para auxiliar pesquisadores no monitoramento e visualização de dados provenientes de experimentos com o sistema de **eyetracking**.

## 🚀 Começando

**Novo no projeto?** Comece aqui: 👉 **[WELCOME.md](WELCOME.md)**

### Guias de Configuração:

- 📥 **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Como instalar Node.js, npm, Git, Docker e outras ferramentas
- 📖 **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Guia completo de configuração do projeto

## Funcionalidades

Com o SINAPHEATMAP é possível:

- Fazer o upload de arquivos **CSV** contendo dados gerados por experimentos de eyetracking.
- Enviar mídias associadas ao experimento, como imagem ou vídeo.
- Gerar visualizações na forma de **heatmaps**, permitindo ajustar a dimensão (em pixels) da exibição para diferentes tamanhos de tela.
- Realizar o download das mídias com o heatmap sobreposto, facilitando o compartilhamento e análise.

### Estrutura da Aplicação

O sistema é composto por duas partes principais: **back-end** e **front-end**. Cada uma delas está organizada em diretórios separados dentro do repositório:

- **`be/`**: Contém a API REST, desenvolvida com o framework **Express**, responsável por gerenciar a lógica da aplicação e comunicação com o banco de dados.
- **`fe/`**: Contém o front-end, desenvolvido com **React**, que fornece uma interface web interativa para os usuários.

Cada diretório possui seu próprio arquivo `README.md`, onde você encontrará instruções para configuração e execução de suas respectivas partes.

## 🐳 Executando com Docker

O SINAPHEATMAP está totalmente configurado para execução com **Docker**, facilitando o deployment e garantindo consistência entre diferentes ambientes.

### Pré-requisitos

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Configuração Rápida

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/lucas231090/sinapheatmap.git
   cd sinapheatmap
   ```

2. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` **na raiz do projeto** (pasta `sinapheatmap/`):

   ```env
   # Backend Environment Variables
   PORT=3333
   MONGO_URL=mongodb://root:sinapsense123@mongodb:27017/sinapheatmap?authSource=admin
   JWT_SECRET=SEU_JWT_SECRET_SUPER_SEGURO
   NODE_ENV=production

   # MongoDB Environment Variables
   MONGO_INITDB_ROOT_USERNAME=root
   MONGO_INITDB_ROOT_PASSWORD=sinapsense123
   MONGO_INITDB_DATABASE=sinapheatmap
   ```

   > 💡 **Dica**: Para mudar portas ou credenciais, basta editar as variáveis neste arquivo!

3. **Execute o sistema:**

   ```bash
   # Build e execução
   docker-compose up --build

   # Ou use o script automatizado (Windows)
   .\deploy.ps1

   # Ou use o script automatizado (Linux/Mac)
   ./deploy.sh
   ```

### Acessos

Após a execução, o sistema estará disponível em:

- **🌐 Frontend (Interface Web)**: http://localhost
- **🔧 Backend (API)**: http://localhost:3333
- **🗄️ MongoDB**: localhost:27017
