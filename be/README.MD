# ⚙️ Backend — API REST SINAPHEATMAP

A **API REST do SINAPHEATMAP** fornece os serviços de autenticação, persistência de experimentos, gestão de sessões de rastreamento ocular (**eyetracking**), upload de mídias de alta resolução e compilação de vídeos com heatmaps sobrepostos usando **Remotion**.

---

## 📑 Sumário

- [Tecnologias](#-tecnologias)
- [Executando com Docker (Recomendado)](#-executando-com-docker-recomendado)
- [Executando Localmente (Sem Docker)](#-executando-localmente-sem-docker)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Rotas da API](#-rotas-da-api)
- [Renderização de Vídeo (Remotion & Chromium)](#-renderização-de-vídeo-remotion--chromium)
- [Testes Automatizados](#-testes-automatizados)

---

## 🛠️ Tecnologias

- **Node.js 20 LTS** & **Express**
- **MongoDB 6** com modelagem via **Mongoose**
- **JWT (JSON Web Tokens)** + **Bcrypt** para autenticação e RBAC (Pesquisador / Administrador)
- **Zod** para validação estrita de esquemas e entradas
- **Multer** configurado com limite de 50MB para upload de imagens e vídeos
- **Remotion (@remotion/bundler, @remotion/renderer)** integrado com Chromium para exportação de vídeo MP4
- **Swagger UI** (`/api-docs`) para documentação interativa
- **Jest** + **Supertest** para testes de controladores e casos de uso

---

## 🐳 Executando com Docker (Recomendado)

Recomenda-se utilizar o `docker-compose.yml` da raiz do repositório:

```bash
# Na raiz do projeto:
docker compose up -d backend
```

Para subir em ambiente de desenvolvimento (com nodemon e volumes mapeados):
```bash
docker compose -f docker-compose.dev.yml up -d backend
```

---

## 💻 Executando Localmente (Sem Docker)

### 1. Instalar dependências
```bash
cd be
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Conteúdo esperado:
```env
PORT=3333
MONGO_URL=mongodb://localhost:27017/sinapheatmap
JWT_SECRET=sua_chave_secreta_super_segura
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> Caso precise de uma instância MongoDB rápida via Docker:
> ```bash
> docker run -d -p 27017:27017 --name sinapheatmap-mongo mongo:6
> ```

### 3. Iniciar o servidor
```bash
# Modo desenvolvimento (com nodemon):
npm run dev

# Modo produção:
npm start
```

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
| :--- | :---: | :--- | :--- |
| `PORT` | Não | `3333` | Porta HTTP da API. |
| `MONGO_URL` | **Sim** | — | URI de conexão com o banco MongoDB. |
| `JWT_SECRET` | **Sim** | — | Chave criptográfica para assinatura dos tokens JWT. |
| `NODE_ENV` | Não | `development` | Ambiente de execução (`development` ou `production`). |
| `ALLOWED_ORIGINS` | Não | `http://localhost:3000` | Origens CORS permitidas (separadas por vírgula). |

---

## 🛣️ Rotas da API

Consulte a documentação completa no Swagger em: `http://localhost:3333/api-docs`

### Autenticação & Perfil
| Método | Rota | Autenticado | Descrição |
| :--- | :--- | :---: | :--- |
| `POST` | `/sign-in` | Não | Autenticação com e-mail e senha. |
| `POST` | `/sign-up` | Não | Cadastro de novo pesquisador. |
| `GET` | `/me` | **Sim** | Retorna o perfil do usuário logado. |

### Experimentos de Eyetracking
| Método | Rota | Autenticado | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/eyetracking` | **Sim** | Lista todos os experimentos. |
| `POST` | `/eyetracking` | **Sim** | Criação de novo experimento (com opções de gênero/idade). |
| `GET` | `/eyetracking/:id` | **Sim** | Detalhes completos do experimento. |
| `PUT` | `/eyetracking/:id` | **Sim** | Atualização de experimento. |
| `DELETE` | `/eyetracking/:id` | **Sim** | Exclusão de experimento. |
| `PATCH` | `/eyetracking/:id/status` | **Sim** | Ativação ou desativação de experimento. |
| `GET` | `/eyetracking/public/:_id` | Não | Consulta pública de experimento para realização do teste. |

### Sessões & Coleta de Dados
| Método | Rota | Autenticado | Descrição |
| :--- | :--- | :---: | :--- |
| `POST` | `/eyetracking/sessions` | Não | Gravação de dados de rastreamento ocular e dados demográficos (`idade`, `genero`). |
| `GET` | `/eyetracking/sessions/:id` | **Sim** | Consulta de sessões registradas de um experimento. |

### Uploads & Exportação
| Método | Rota | Autenticado | Descrição |
| :--- | :--- | :---: | :--- |
| `POST` | `/eyetracking/upload` | **Sim** | Upload de mídias de teste (imagens/vídeos até 50MB). |
| `GET` | `/uploads/media/:filename` | Não | Servir arquivo de mídia armazenado. |
| `POST` | `/video/export` | **Sim** | Dispara renderização assíncrona de vídeo com heatmap via Remotion. |

### Sistema & Administração
| Método | Rota | Autenticado | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Não | Health check de disponibilidade e banco de dados. |
| `GET` | `/admin/users` | **Admin** | Listagem de usuários do sistema. |
| `PUT` | `/admin/users/:id/role` | **Admin** | Alteração de permissão/cargo de usuário. |

---

## 🎬 Renderização de Vídeo (Remotion & Chromium)

O backend utiliza o Remotion para renderizar vídeos com heatmaps sobrepostos quadro a quadro:
- No Docker de produção (`be/Dockerfile`), pacotes do Chromium (`chromium`, `nss`, `freetype`, `harfbuzz`, `ttf-freefont`) são instalados na imagem Alpine.
- As variáveis de ambiente `PUPPETEER_EXECUTABLE_PATH` e `REMOTION_CHROMIUM_EXECUTABLE_PATH` apontam para `/usr/bin/chromium-browser`.
- Em ambiente de desenvolvimento local, o Remotion utilizará o Chromium instalado pelo Puppeteer ou o navegador do sistema operacional.

---

## 🧪 Testes Automatizados

O backend conta com testes automatizados utilizando Jest e Supertest.

```bash
# Executa todos os testes:
npm test

# Executa em modo watch:
npm run test:watch

# Gera relatório de cobertura:
npm run test:coverage
```
