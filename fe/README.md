# 🎨 Frontend — Interface Web SINAPHEATMAP

O **Frontend do SINAPHEATMAP** é uma Single Page Application (SPA) moderna e responsiva construída para a criação de experimentos, condução de testes de rastreamento ocular guiados via webcam e visualização analítica interativa com Heatmaps, Bubble Canvas e Gaze Plots.

---

## 📑 Sumário

- [Tecnologias](#-tecnologias)
- [Executando com Docker (Recomendado)](#-executando-com-docker-recomendado)
- [Executando Localmente (Sem Docker)](#-executando-localmente-sem-docker)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Funcionalidades de Destaque](#-funcionalidades-de-destaque)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Testes Automatizados](#-testes-automatizados)

---

## 🛠️ Tecnologias

- **React 19** + **Vite 6**
- **TailwindCSS 4** + **Material-UI Icons**
- **MediaPipe Tasks Vision** para rastreamento facial e detecção de pupila em tempo real
- **react-zoom-pan-pinch** para navegação e zoom suave sobre as mídias
- **Zustand** para gerenciamento de estado global (autenticação, experimentos, hit-testing de hover)
- **Remotion Player** para reprodução e sincronização de vídeos de teste
- **Axios** para consumo da API REST
- **Vitest** + **@testing-library/react** para testes unitários e de componentes

---

## 🐳 Executando com Docker (Recomendado)

O frontend é construído através de uma imagem multi-stage (`Node.js builder` + `Nginx Alpine`) que otimiza o bundle, habilita compressão gzip e atua como reverse proxy para a API e uploads.

```bash
# Na raiz do projeto:
docker compose up -d frontend
```

Para desenvolvimento com hot-reload ativo:
```bash
docker compose -f docker-compose.dev.yml up -d frontend
```

Acesse em: `http://localhost:3000` (ou `http://localhost:5173` em dev mode).

---

## 💻 Executando Localmente (Sem Docker)

### 1. Instalar dependências
```bash
cd fe
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Conteúdo esperado:
```env
# URL da API backend acessada pelo navegador do usuário
VITE_API_BASE_URL=http://localhost:3333
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O servidor iniciará em `http://localhost:5173`. Certifique-se de que o backend também esteja em execução em `http://localhost:3333`.

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Sim | `http://localhost:3333` | URL pública da API do backend. Usado pelo navegador para disparar requisições. |

> ⚠️ No Vite, apenas variáveis com o prefixo `VITE_` são injetadas no bundle do cliente.

---

## 🌟 Funcionalidades de Destaque

1. **Wizard de Criação de Experimentos**:
   - Definição de amostras, mídias (imagens/vídeos) e tempos de exposição.
   - Ativação seletiva de coleta demográfica de **Gênero** e/ou **Idade**.

2. **Fluxo do Participante (`/test/:id`)**:
   - Formulário de consentimento e coleta demográfica inicial (caso o teste requeira).
   - Tutorial guiado de posicionamento da webcam e calibração de 9 pontos em tela cheia.
   - Captura precisa e envio assíncrono dos dados de fixação ocular.

3. **Análise Interativa de Heatmaps**:
   - **Camadas combináveis**: Heatmap de densidade, Bubble Canvas e Gaze Plot (caminhos sacádicos).
   - **Identificação de Participantes**: Rótulos descritivos por sessão com idade e gênero (ex: `Sessão 1 (30 anos, Masculino)`).
   - **Sistema Centralizado de Hover**: Hit-testing geométrico com coordenadas de canvas, imune a distorções de zoom e pan, com tooltips em Portal React flutuante e auto-alinhado.

---

## 🔧 Scripts Disponíveis

| Script | O que faz |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Vite com hot-reload (HMR) |
| `npm run build` | Compila o bundle otimizado para produção na pasta `dist/` |
| `npm run preview` | Servidor local para inspecionar o build de produção |
| `npm run lint` | Executa análise estática de código com ESLint |
| `npm run test` | Executa os testes automatizados com Vitest |

---

## 🧪 Testes Automatizados

O frontend possui mais de 100 testes unitários e de integração utilizando **Vitest**:

```bash
# Executa todos os testes:
npm run test

# Executa em modo interativo (watch):
npx vitest

# Executa com interface gráfica web:
npx vitest --ui
```
