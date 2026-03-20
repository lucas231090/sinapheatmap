# API do SINAPHEATMAP

A **API REST do SINAPHEATMAP** fornece os recursos necessários para o gerenciamento de experimentos provenientes de sistemas de **eyetracking**, com cadastro e autenticação de usuários.

Para acessar a documentação completa da API, consulte o **Swagger** disponível em: `http://localhost:3333/api-docs`

---

## Rodando com Docker (recomendado)

> Use o `docker-compose.yml` na **raiz do projeto** (`sinapheatmap/`), não o que está dentro desta pasta `be/`.

```bash
# Na raiz do projeto (sinapheatmap/):
docker-compose up --build
```

Isso sobe o MongoDB e a API automaticamente, sem precisar instalar nada localmente.

---

## Rodando localmente (sem Docker)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` **nesta pasta** (`be/`) com:

```env
PORT=3333
MONGO_URL=mongodb://localhost:27017/sinapheatmap
JWT_SECRET=troque_por_uma_chave_secreta
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

> Para subir o MongoDB localmente, você pode usar:
>
> ```bash
> docker run -d -p 27017:27017 --name sinapheatmap-mongo mongo:6
> ```

### 3. Iniciar em modo desenvolvimento

```bash
npm run dev
```

Isso inicia o servidor com **nodemon** (hot-reload automático a cada mudança de arquivo).

A API estará disponível em `http://localhost:3333`.

---

## Scripts disponíveis

| Script                 | O que faz                                            |
| ---------------------- | ---------------------------------------------------- |
| `npm start`            | Inicia o servidor em modo produção (`node` direto)   |
| `npm run dev`          | Inicia com nodemon (hot-reload) para desenvolvimento |
| `npm run docker:build` | Build e sobe todos os containers Docker              |
| `npm run docker:up`    | Sobe containers já buildados                         |

---

## Requisitos do Sistema

- **Node.js** 20+ (para rodar localmente)
- **MongoDB** 6+ (ou via Docker)
- **Docker** (opcional, mas recomendado)

---

## Variáveis de Ambiente

| Variável          | Obrigatória | Descrição                                                 |
| ----------------- | ----------- | --------------------------------------------------------- |
| `PORT`            | Não         | Porta do servidor (padrão: 3333)                          |
| `MONGO_URL`       | **Sim**     | URL de conexão com o MongoDB                              |
| `JWT_SECRET`      | **Sim**     | Chave secreta para assinar tokens JWT                     |
| `NODE_ENV`        | Não         | `development` ou `production`                             |
| `ALLOWED_ORIGINS` | Não         | Origens CORS permitidas (padrão: `http://localhost:3000`) |

---

## Estrutura das Rotas

### Rotas públicas (sem autenticação)

| Método | Rota                       | Descrição                  |
| ------ | -------------------------- | -------------------------- |
| POST   | `/sign-in`                 | Login (retorna JWT)        |
| POST   | `/sign-up`                 | Cadastro de usuário        |
| GET    | `/eyetracking`             | Listar experimentos ativos |
| GET    | `/eyetracking/:id`         | Detalhes de um experimento |
| GET    | `/uploads/media/:filename` | Servir arquivo de mídia    |

### Rotas protegidas (requerem `Authorization: Bearer <token>`)

| Método | Rota               | Descrição                    |
| ------ | ------------------ | ---------------------------- |
| POST   | `/heatmap`         | Upload de CSV + mídia        |
| PUT    | `/heatmap/:id`     | Atualizar experimento        |
| PUT    | `/eyetracking/:id` | Ativar/desativar experimento |
