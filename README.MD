# 👁️ SINAPHEATMAP — Plataforma de Eyetracking e Visualização de Heatmaps

O **SINAPHEATMAP** é uma plataforma completa e integrada voltada a pesquisadores, laboratórios e equipes de UX para criação de experimentos, coleta de dados biométricos de rastreamento ocular (**eyetracking**) diretamente pelo navegador via webcam, e análise visual interativa através de **Heatmaps**, **Bubble Plots** e **Gaze Plots (Caminhos Sacádicos)**.

---

## 📑 Sumário

- [Visão Geral & Tecnologias](#-visão-geral--tecnologias)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Executando Rapidamente com Docker](#-executando-rapidamente-com-docker)
- [Ambiente de Desenvolvimento Local](#-ambiente-de-desenvolvimento-local)
- [🚀 Checklist para Colocar em Produção](#-checklist-para-colocar-em-produção)
- [🚢 Guia Detalhado de Deploy e Decisões de Arquitetura (DEPLOY_GUIDE.md)](DEPLOY_GUIDE.md)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)
- [Testes Automatizados](#-testes-automatizados)
- [Estrutura do Repositório](#-estrutura-do-repositório)

---

## 🌟 Visão Geral & Tecnologias

A aplicação é dividida em dois componentes principais orquestrados por contêineres Docker:

- **Frontend (`fe/`)**:
  - **React 19** + **Vite 6**
  - **TailwindCSS 4** + **Material-UI Icons**
  - **MediaPipe Tasks Vision** para rastreamento facial e ocular em tempo real
  - **react-zoom-pan-pinch** para navegação fluida com zoom e pan
  - **Zustand** para gerenciamento de estado global reativo
  - **Remotion Player** para reprodução e sincronização de vídeo com dados biométricos
  - **Vitest** + **Testing Library** para testes unitários e de integração

- **Backend (`be/`)**:
  - **Node.js 20 LTS** + **Express**
  - **MongoDB 6** com **Mongoose**
  - **JWT (JSON Web Tokens)** + **Bcrypt** para autenticação e RBAC (Pesquisador / Administrador)
  - **Remotion Bundler & Renderer** integrado com **Chromium** no contêiner para compilação e exportação de vídeos mp4 com heatmaps sobrepostos
  - **Multer** para upload seguro de mídias (imagens e vídeos até 50MB)
  - **Swagger (OpenAPI)** para documentação interativa das rotas
  - **Jest** + **Supertest** para testes automatizados

---

## 🎯 Funcionalidades Principais

### 1. Criação e Gestão de Experimentos
- **Assistente em Etapas (Wizard)**: Criação passo a passo com validação de dados básicos, amostras, mídias associadas e regras de ordenação/randomização.
- **Coleta Demográfica Flexível**: Ativação independente de coleta de **Gênero** e/ou **Idade** para os participantes que realizarem o teste.
- **Suporte Multimídia**: Testes sobre imagens estáticas ou vídeos com controle de tempo de exposição por estímulo.
- **Importação de Experimentos Legados**: Compatibilidade com uploads de arquivos CSV históricos.

### 2. Execução de Testes Guiada (`/test/:id`)
- **Acesso Público com Validação Prévia**: Caso o experimento exija idade e/ou gênero, o participante responde às perguntas humanizadas (*"Qual é sua idade?"* e *"Qual gênero você se identifica?"*), contando com campo de texto para especificar o gênero caso selecione *"Outro"*, e sem opção de omissão.
- **Tutorial Interativo**: Instruções claras de posicionamento e postura para o participante.
- **Alinhamento e Calibração Facial**: Detecção facial via MediaPipe e calibração de 9 pontos em tela cheia.
- **Gravação em Tempo Real**: Captura das coordenadas da pupila mapeadas à tela durante a exibição dos estímulos.
- **Envio Resiliente de Dados**: Ciclo de salvamento protegido contra desmontagens/StrictMode com reenvio automático e botão de tentativa manual em caso de falha de rede.

### 3. Visualização e Análise de Heatmaps
- **Heatmaps Estáticos e Dinâmicos**: Renderização por densidade de fixação, com opção de alternar rastro contínuo ou agrupamento em pontos.
- **Bubble Canvas (Bolhas de Fixação)**: Exibição ordenada e numerada das fixações por participante com identificação de tempo acumulado e timestamp exato.
- **Gaze Plot (Caminho Sacádico)**: Traçado de vetores sacádicos direcionais com setas por participante, bolhas numeradas com a **ordem cronológica da fixação** (`1, 2, 3...`) e cálculo de tempo total acumulado quando o olhar retorna a uma mesma região.
- **Identificação Rica de Sessões**: Em vez de rótulos genéricos ("Anônimo"), cada participante é identificado pelo número da sessão e seus dados demográficos (ex: `Sessão 1 (25 anos, Feminino)`).
- **Sistema de Hover e Tooltip Preciso**:
  - Hit-testing geométrico centralizado sensível a zoom e pan.
  - Tooltips renderizados via Portal React, evitando cortes de overflow e distorções de escala do zoom.
  - Destaque visual com halo branco sobre o círculo em foco.
- **Exportação**: Download instantâneo do heatmap combinado com a mídia em imagem de alta resolução (PNG) e renderização assíncrona de vídeo composto (MP4).

---

## 🐳 Executando Rapidamente com Docker

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/) instalado

### 1. Configurar o ambiente
Copie o arquivo de exemplo para `.env`:

```bash
cp .env.example .env
```

Para execução local padrão com Docker, o arquivo `.env.example` já vem pré-configurado para funcionar de imediato.

### 2. Iniciar os contêineres

```bash
# Para subir em modo de produção (usando Nginx otimizado e build compilado):
docker compose up -d --build

# Para modo de desenvolvimento com hot-reload ativo:
docker compose -f docker-compose.dev.yml up -d --build
```

### 3. Acessar a plataforma

| Serviço | URL Local | Descrição |
| :--- | :--- | :--- |
| **Frontend Web** | `http://localhost:3000` | Interface do usuário e pesquisador |
| **Backend API** | `http://localhost:3333` | Servidor Express |
| **Swagger Docs** | `http://localhost:3333/api-docs` | Documentação interativa da API |
| **Health Check** | `http://localhost:3333/health` | Verificação de integridade |

> 👤 **Usuário Administrador Inicial**:
> - **E-mail**: `admin@admin.com`
> - **Senha**: `admin123`
> *(O usuário é provisionado automaticamente na primeira inicialização se o banco estiver vazio)*

---

## 💻 Ambiente de Desenvolvimento Local (Sem Docker)

Caso prefira rodar os serviços nativamente no seu computador:

### 1. Iniciar o Banco de Dados (MongoDB)
Você pode rodar apenas o MongoDB via Docker:
```bash
docker compose up -d mongodb
```
Ou usar uma instância local de MongoDB rodando na porta `27017`.

### 2. Configurar e rodar o Backend
```bash
cd be
cp .env.example .env
npm install
npm run dev
```
O backend iniciará em `http://localhost:3333`.

### 3. Configurar e rodar o Frontend
```bash
cd fe
npm install
npm run dev
```
O Vite iniciará o servidor de desenvolvimento em `http://localhost:5173` (ou porta informada no terminal).

---

## 🚀 Checklist para Colocar em Produção

Antes de colocar o SINAPHEATMAP acessível na internet ou em servidores de produção, siga este checklist de segurança e configuração:

### 1. Configuração do `.env` de Produção
No servidor de produção, edite o arquivo `.env`:

```env
# 1. Defina NODE_ENV como production
NODE_ENV=production

# 2. Defina uma chave JWT segura (mínimo de 32 caracteres aleatórios)
JWT_SECRET=gere_uma_chave_aleatoria_longa_e_criptograficamente_segura_aqui

# 3. Restrinja o CORS ao domínio oficial do frontend
ALLOWED_ORIGINS=https://seuapp.seudominio.com.br

# 4. Defina credenciais fortes para o MongoDB
MONGO_INITDB_ROOT_USERNAME=usuario_seguro
MONGO_INITDB_ROOT_PASSWORD=senha_forte_e_aleatoria_aqui
MONGO_INITDB_DATABASE=sinapheatmap
MONGO_URL=mongodb://usuario_seguro:senha_forte_e_aleatoria_aqui@mongodb:27017/sinapheatmap?authSource=admin

# 5. Defina a URL pública da API utilizada pelo navegador
VITE_API_BASE_URL=https://api.seudominio.com.br
```

### 2. Segurança do Banco de Dados
- No arquivo `docker-compose.yml`, se o MongoDB for acessado **apenas** pelos contêineres internos, comente ou remova o mapeamento `ports: - "27017:27017"` para não expor a porta do banco à internet pública. Se precisar de acesso externo, amarre ao localhost (`127.0.0.1:27017:27017`) ou use firewall (UFW/iptables).

### 3. Troca da Senha do Administrador
- Acesse a plataforma assim que subir o serviço e altere a senha do usuário `admin@admin.com` no painel administrativo, garantindo que a credencial padrão (`admin123`) não permaneça ativa.

### 4. Configuração de HTTPS / SSL
- Coloque uma camada de terminação SSL/TLS na frente dos serviços (via **Nginx**, **Traefik**, **Caddy** ou **Cloudflare**).
- Exemplo de proxy reverso no Nginx do host para o frontend:
  ```nginx
  server {
      listen 443 ssl http2;
      server_name seuapp.seudominio.com.br;

      ssl_certificate /etc/letsencrypt/live/seuapp.seudominio.com.br/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/seuapp.seudominio.com.br/privkey.pem;

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto https;
      }
  }
  ```

### 5. Suporte a Uploads Grandes e Renderização de Vídeos
- O contêiner de frontend já inclui configurações de Nginx preparadas:
  - `client_max_body_size 50M;` para suporte a mídias de alta resolução.
  - `proxy_read_timeout 300s;` para exportações longas de vídeo via Remotion.
- O contêiner de backend inclui dependências do **Chromium** no Alpine Linux para que o Remotion consiga gerar os vídeos sem erros de biblioteca gráfica.

### 6. Persistência de Dados
O `docker-compose.yml` utiliza 3 volumes nativos do Docker com garantia de sobrevivência a restarts e builds:
- `mongo_data`: Banco de dados MongoDB.
- `backend_uploads`: Diretório de arquivos enviados (`/app/uploads`).
- `backend_logs`: Logs de auditoria do sistema (`/app/logs`).

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
| :--- | :---: | :--- | :--- |
| `PORT` | Sim | `3333` | Porta HTTP em que a API escuta no backend. |
| `MONGO_URL` | Sim | — | String de conexão completa com o MongoDB. |
| `JWT_SECRET` | Sim | — | Chave secreta de assinatura dos tokens de autenticação. |
| `NODE_ENV` | Sim | `production` | Ambiente de execução (`production` ou `development`). |
| `ALLOWED_ORIGINS` | Sim | `http://localhost:3000` | Origens autorizadas para requisições CORS (separadas por vírgula). |
| `MONGO_INITDB_ROOT_USERNAME` | Sim | `root` | Nome do usuário administrador do MongoDB. |
| `MONGO_INITDB_ROOT_PASSWORD` | Sim | — | Senha do usuário administrador do MongoDB. |
| `MONGO_INITDB_DATABASE` | Sim | `sinapheatmap` | Nome da base de dados principal. |
| `VITE_API_BASE_URL` | Sim | `http://localhost:3333` | URL pública da API consumida pelo frontend no navegador (ou `/api` para domínio unificado). |
| `INITIAL_ADMIN_EMAIL` | Não | `admin@admin.com` | E-mail do usuário administrador provisionado na primeira inicialização. |
| `INITIAL_ADMIN_PASSWORD` | Não | `admin123` | Senha inicial do administrador provisionado na primeira inicialização. |

---

## 📖 Documentação da API (Swagger)

A API possui especificação OpenAPI completa documentada via Swagger:
- Acesse com o backend em execução em: `http://localhost:3333/api-docs`
- Principais grupos de endpoints:
  - `/sign-in` e `/sign-up`: Autenticação e registro.
  - `/me`: Consulta de sessão ativa e perfil do usuário logado.
  - `/eyetracking`: Criação, listagem, atualização, exclusão e detalhamento de experimentos.
  - `/eyetracking/public/:_id`: Consulta pública de experimentos para realização de testes.
  - `/eyetracking/sessions`: Gravação e consulta de dados de sessões de rastreamento ocular.
  - `/eyetracking/upload`: Upload de mídias de apoio (imagens e vídeos).
  - `/admin/users`: Gerenciamento de pesquisadores e administradores.
  - `/health`: Monitoramento de status do serviço.

---

## 🧪 Testes Automatizados

O projeto conta com suítes de testes unitários e de integração cobrindo fluxos essenciais de backend e frontend.

### Executando testes do Backend
```bash
# Pelo contêiner Docker:
docker exec sinapheatmap-backend-dev npm test

# Ou localmente na pasta be/:
cd be && npm test
```

### Executando testes do Frontend
```bash
# Localmente na pasta fe/:
cd fe && npm run test
```

---

## 📂 Estrutura do Repositório

```text
sinapheatmap/
├── be/                                # Backend da aplicação
│   ├── Dockerfile                     # Imagem Docker de produção (com Chromium)
│   ├── Dockerfile.dev                 # Imagem Docker de desenvolvimento
│   ├── src/
│   │   ├── app/
│   │   │   ├── controllers/           # Controladores das rotas HTTP
│   │   │   ├── models/                # Modelos de dados Mongoose (User, Session, File)
│   │   │   ├── useCases/              # Regras de negócio e validações Zod
│   │   │   ├── repositories/          # Camada de acesso ao banco de dados
│   │   │   └── configs/               # Logger, Multer e variáveis de ambiente
│   │   ├── remotion/                  # Composição e renderização de vídeo
│   │   └── server/                    # Inicialização do Express e conexão Mongo
│   └── tests/                         # Testes automatizados do backend (Jest)
├── fe/                                # Frontend da aplicação
│   ├── Dockerfile                     # Imagem Docker multi-stage (Node builder + Nginx)
│   ├── nginx.conf                     # Configuração de produção do Nginx (gzip, proxy, 50MB)
│   ├── src/
│   │   ├── components/                # Componentes reutilizáveis e Heatmap / GazePlot
│   │   │   └── heatmap/               # BubbleCanvas, GazePlot, HeatmapRenderer, Hover system
│   │   ├── hooks/                     # Custom React Hooks (useHeatmapData, useEyeTracking, etc.)
│   │   ├── pages/                     # Telas (Criar/Editar, Home, Heatmap, Teste público, Login)
│   │   ├── services/                  # Comunicação com a API (Axios)
│   │   └── utils/                     # Cálculos de dispersão, fixações e rótulos
│   └── src/__tests__/                 # Testes automatizados do frontend (Vitest)
├── docker-compose.yml                 # Orquestrador oficial de PRODUÇÃO
├── docker-compose.dev.yml             # Orquestrador oficial de DESENVOLVIMENTO
├── .env.example                       # Modelo documentado de variáveis de ambiente
└── README.MD                          # Este guia
```
