# Plataforma do SINAPHEATMAP

O **SINAPHEATMAP** é uma plataforma desenvolvida para auxiliar pesquisadores no monitoramento e visualização de dados provenientes de experimentos com o sistema de **eyetracking**.

## 🚀 Rodando o Projeto (Docker)

A forma mais rápida de rodar todo o sistema (backend + frontend + banco de dados) é pelo Docker Compose na raiz do repositório.

### Pré-requisitos

- [Docker](https://www.docker.com/get-started) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

---

### Passo 1 — Configurar o arquivo `.env`

Copie o arquivo de exemplo e edite com os valores corretos:

```bash
cp .env.example .env
```

Abra o `.env` e ajuste:

| Variável                     | Descrição                                                                   | Exemplo                                                               |
| ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `PORT`                       | Porta do backend                                                            | `3333`                                                                |
| `MONGO_URL`                  | URL de conexão com o MongoDB                                                | `mongodb://root:senha123@mongodb:27017/sinapheatmap?authSource=admin` |
| `JWT_SECRET`                 | Chave secreta para gerar tokens JWT — **troque por algo longo e aleatório** | `minha_chave_super_secreta_123`                                       |
| `NODE_ENV`                   | Ambiente de execução                                                        | `production`                                                          |
| `ALLOWED_ORIGINS`            | Domínio(s) que podem acessar a API                                          | `http://localhost:3000`                                               |
| `MONGO_INITDB_ROOT_USERNAME` | Usuário root do MongoDB                                                     | `root`                                                                |
| `MONGO_INITDB_ROOT_PASSWORD` | Senha root do MongoDB — **deve bater com a da MONGO_URL**                   | `senha123`                                                            |
| `MONGO_INITDB_DATABASE`      | Nome do banco de dados                                                      | `sinapheatmap`                                                        |
| `VITE_API_BASE_URL`          | URL que o **navegador** usa para acessar a API                              | `http://localhost:3333`                                               |

> ⚠️ **Atenção:** `MONGO_INITDB_ROOT_PASSWORD` e a senha na `MONGO_URL` precisam ser **iguais**.

---

### Passo 2 — Subir o sistema

```bash
# Primeira vez ou após mudanças no código/Dockerfile:
docker-compose up --build

# Nas próximas vezes (sem mudanças no código):
docker-compose up
```

### Passo 3 — Acessar

| Serviço                        | URL                            |
| ------------------------------ | ------------------------------ |
| **Frontend**                   | http://localhost:3000          |
| **API (backend)**              | http://localhost:3333          |
| **Documentação API (Swagger)** | http://localhost:3333/api-docs |

---

## 🔄 Mudando para Produção

Para colocar em produção, basta alterar **apenas o `.env`**:

1. `VITE_API_BASE_URL` → URL pública da sua API (ex: `https://api.seudominio.com`)
2. `ALLOWED_ORIGINS` → Domínio público do frontend (ex: `https://seudominio.com`)
3. `JWT_SECRET` → Uma chave aleatória longa e segura
4. `MONGO_INITDB_ROOT_PASSWORD` / `MONGO_URL` → Credenciais seguras do banco

Depois execute novamente `docker-compose up --build` para rebuildar o frontend com a nova URL da API.

---

## 🛠️ Desenvolvimento Local (sem Docker)

Para rodar cada parte separadamente durante o desenvolvimento:

**Backend:**

```bash
cd be
cp .env.example .env   # já existe, só confirmar os valores
npm install
npm run dev            # nodemon com hot-reload
```

**Frontend:**

```bash
cd fe
# Crie fe/.env com: VITE_API_BASE_URL=http://localhost:3333
npm install
npm run dev            # servidor Vite em http://localhost:5173
```

**Banco de dados** (opcional via Docker):

```bash
docker-compose up mongodb
```

---

## Funcionalidades

- Upload de arquivos **CSV** com dados de eyetracking
- Envio de mídias associadas (imagem ou vídeo)
- Geração de **heatmaps** sobrepostos à mídia
- Download da mídia com heatmap sobreposto
- Autenticação com JWT

### Estrutura do Repositório

- **`be/`** — API REST (Node.js + Express + MongoDB)
- **`fe/`** — Frontend (React + Vite + TailwindCSS)
- **`docker-compose.yml`** — Orquestração de todos os serviços
- **`.env.example`** — Template de variáveis de ambiente

### Acessos

Após a execução, o sistema estará disponível em:

- **🌐 Frontend (Interface Web)**: http://localhost
- **🔧 Backend (API)**: http://localhost:3333
- **🗄️ MongoDB**: localhost:27017
