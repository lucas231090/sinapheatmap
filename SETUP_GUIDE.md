# 🚀 Guia de Configuração - SINAPHEATMAP

Bem-vindo ao time do SINAPHEATMAP! Este guia vai te ajudar a configurar todo o ambiente de desenvolvimento local.

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado na sua máquina:

### Obrigatórios

#### 1. **Node.js e npm** (versão 18 ou superior)

O npm (Node Package Manager) vem automaticamente instalado junto com o Node.js.

**Como instalar:**

1. Acesse [https://nodejs.org/](https://nodejs.org/)
2. Baixe a versão **LTS (Long Term Support)** - recomendado
3. Execute o instalador e siga as instruções
4. Durante a instalação, **deixe marcada** a opção para instalar ferramentas adicionais

**Verificar se instalou corretamente:**

```bash
# Abra o PowerShell ou Terminal e digite:
node --version
# Deve mostrar algo como: v20.x.x

npm --version
# Deve mostrar algo como: 10.x.x
```

#### 2. **MongoDB** (versão 6 ou superior)

- [Download aqui](https://www.mongodb.com/try/download/community)
- Escolha a versão para Windows
- Durante instalação, você pode optar por instalar o MongoDB Compass (interface gráfica)

**Verificar se instalou:**

```bash
mongod --version
# Deve mostrar a versão instalada
```

#### 3. **Git**

- [Download aqui](https://git-scm.com/downloads)
- Durante instalação, use as configurações padrão

**Verificar se instalou:**

```bash
git --version
# Deve mostrar algo como: git version 2.x.x
```

### Recomendados

- **Docker Desktop** - [Download aqui](https://www.docker.com/products/docker-desktop/)
  - Facilita muito a execução do MongoDB e outros serviços
  - Requer reinicialização do computador após instalação
- **Visual Studio Code** - [Download aqui](https://code.visualstudio.com/)
  - Editor de código recomendado para o projeto

---

## 📥 1. Clonando o Repositório

```bash
git clone https://github.com/lucas231090/sinapheatmap.git
cd sinapheatmap
```

---

## ⚙️ 2. Configuração do Backend

### 2.1. Navegue até a pasta do backend

```bash
cd be
```

### 2.2. Instale as dependências

```bash
npm install
```

### 2.3. Configure as variáveis de ambiente

#### Para desenvolvimento local (sem Docker):

Crie um arquivo `.env` na pasta `be/` com o seguinte conteúdo:

```env
PORT=3333
MONGO_URL=mongodb://localhost:27017/sinapheatmap
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_123456
NODE_ENV=development
```

#### Para executar com Docker:

Crie um arquivo `.env` **na raiz do projeto** (pasta `sinapheatmap/`) com:

```env
# Backend Environment Variables
PORT=3333
MONGO_URL=mongodb://root:sinapsense123@mongodb:27017/sinapheatmap?authSource=admin
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_123456
NODE_ENV=production

# MongoDB Environment Variables
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=sinapsense123
MONGO_INITDB_DATABASE=sinapheatmap
```

> ⚠️ **IMPORTANTE**:
>
> - Substitua `seu_jwt_secret_super_seguro_aqui_123456` por uma chave secreta forte e única
> - O arquivo `.env` na raiz é usado pelo Docker Compose
> - O arquivo `.env` em `be/` é usado para desenvolvimento local
> - **Para mudar portas**: edite `PORT=3333` no arquivo `.env` correspondente

### 2.4. Inicie o MongoDB

#### Opção A: Com Docker (Recomendado)

```bash
docker-compose up mongodb
```

#### Opção B: MongoDB instalado localmente

Inicie o serviço do MongoDB pela linha de comando ou pelo MongoDB Compass.

### 2.5. Execute o backend em modo de desenvolvimento

**Em uma nova janela de terminal**, dentro da pasta `be/`:

```bash
npm run dev
```

O backend estará rodando em: **http://localhost:3333**

---

## 🎨 3. Configuração do Frontend

### 3.1. Abra um novo terminal e navegue até a pasta do frontend

```bash
cd fe
```

### 3.2. Instale as dependências

```bash
npm install
```

### 3.3. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `fe/` com o seguinte conteúdo:

```env
VITE_API_BASE_URL=http://localhost:3333
```

### 3.4. Execute o frontend em modo de desenvolvimento

```bash
npm run dev
```

O frontend estará rodando em: **http://localhost:5173** (ou outra porta que o Vite indicar)

---

## ✅ 4. Verificando se está tudo funcionando

1. **Backend**: Acesse http://localhost:3333/api-docs para ver a documentação Swagger da API
2. **Frontend**: Acesse http://localhost:5173 (ou a porta indicada pelo Vite)
3. **Teste de criação de conta**: Tente criar uma nova conta pela interface do frontend

Se conseguir criar uma conta sem erros de CORS, está tudo configurado corretamente! 🎉

---

## 🐛 Resolução de Problemas Comuns

### Erro de CORS ao criar conta

**Causa**: O arquivo `.env` não foi criado no backend ou a URL da API está incorreta.

**Solução**:

1. Verifique se o arquivo `be/.env` existe e contém `PORT=3333`
2. Verifique se o arquivo `fe/.env` existe e contém `VITE_API_BASE_URL=http://localhost:3333`
3. Reinicie ambos os servidores (backend e frontend)

### MongoDB não conecta

**Solução**:

1. Se estiver usando Docker: `docker-compose up mongodb`
2. Se estiver usando MongoDB local: verifique se o serviço está rodando
3. Verifique se a URL no arquivo `be/.env` está correta: `mongodb://localhost:27017/sinapheatmap`

### Porta já em uso

**Solução**:

- Backend (3333): Altere a variável `PORT` no arquivo `be/.env`
- Frontend: O Vite automaticamente escolherá outra porta se 5173 estiver ocupada

### Dependências não instalam

**Solução**:

```bash
# Limpe o cache do npm
npm cache clean --force

# Delete node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Instale novamente
npm install
```

---

## 📁 Estrutura do Projeto

```
sinapheatmap/
├── be/                    # Backend (API Express)
│   ├── src/
│   │   ├── app/
│   │   │   ├── controllers/    # Controladores da API
│   │   │   ├── models/         # Modelos do MongoDB
│   │   │   ├── routes/         # Rotas da API
│   │   │   └── useCases/       # Lógica de negócio
│   │   └── server/
│   ├── .env               # ⚠️ VOCÊ PRECISA CRIAR ESTE ARQUIVO
│   └── package.json
│
├── fe/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Chamadas à API
│   │   └── hooks/         # Custom hooks
│   ├── .env               # ⚠️ VOCÊ PRECISA CRIAR ESTE ARQUIVO
│   └── package.json
│
└── docker-compose.yml     # Configuração Docker
```

---

## 🔧 Scripts Úteis

### Backend (`be/`)

```bash
npm run dev     # Inicia em modo desenvolvimento (com nodemon)
npm start       # Inicia com Docker
npm run build   # Build com Docker
```

### Frontend (`fe/`)

```bash
npm run dev     # Inicia servidor de desenvolvimento
npm run build   # Build para produção
npm run preview # Preview do build de produção
npm test        # Executa os testes
```

---

## 🐳 Executando com Docker (Alternativa)

Se preferir executar tudo com Docker:

### 1. Certifique-se de que o Docker Desktop está rodando

### 2. Pare os containers antigos (se houver)

```bash
docker-compose down
```

### 3. Reconstrua e execute tudo

```bash
docker-compose up --build
```

**Nota**: As variáveis de ambiente já estão configuradas no `docker-compose.yml`. Você não precisa criar arquivos `.env` separados quando usar Docker.

### 4. Acesse a aplicação

Acesse:

- Frontend: http://localhost:3000
- Backend: http://localhost:3333
- MongoDB: localhost:27017

### 5. Para parar os containers

```bash
# Ctrl+C no terminal onde está rodando
# ou em outro terminal:
docker-compose down
```

---

## 📚 Recursos Adicionais

- **Documentação da API**: http://localhost:3333/api-docs (após iniciar o backend)
- **Repositório**: https://github.com/lucas231090/sinapheatmap
- **MongoDB Compass**: Útil para visualizar os dados no banco

---

## 🤝 Precisa de Ajuda?

Se encontrar algum problema que não está listado aqui, entre em contato com a equipe ou abra uma issue no GitHub!

Bom desenvolvimento! 💻✨
