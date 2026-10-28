# 🚢 Guia de Arquitetura e Decisões de Deploy — SINAPHEATMAP

Este documento detalha a arquitetura do **SINAPHEATMAP**, as decisões de engenharia adotadas para viabilizar e estabilizar o deploy em produção, e o passo a passo prático para qualquer pessoa da equipe realizar a implantação da aplicação.

---

## 🏛️ 1. Arquitetura da Solução

O SINAPHEATMAP é composto por 3 camadas principais orquestradas via contêineres Docker:

```text
       ┌────────────────────────────────────────────────────────┐
       │                Navegador do Usuário                    │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
              HTTP / HTTPS (Porta 80/443)  API REST / Uploads
                      │                          │
       ┌──────────────▼─────────────┐     ┌──────▼─────────────────────┐
       │     Frontend (Nginx)       │     │     Backend (Node.js 20)   │
       │  - SPA React 19 compilada  │     │  - Express REST API        │
       │  - Gzip + Cache Imutável   ├────►│  - MediaPipe / Remotion    │
       │  - Proxy Reverso /api/     │     │  - Chromium Headless       │
       └────────────────────────────┘     └──────────────┬─────────────┘
                                                         │
                                                  Conexão Mongoose
                                                         │
                                          ┌──────────────▼─────────────┐
                                          │      Banco de Dados        │
                                          │     MongoDB 6 (Database)   │
                                          └────────────────────────────┘
```

1. **Frontend (`fe/`)**:
   - Compilação estática com **Vite 6** e **React 19**.
   - Servido por **Nginx Alpine**, configurado com compressão gzip, headers de cache para assets com hash e proxy reverso para `/api/` e `/uploads/`.
   - Limite de corpo de requisição configurado em **50MB** para upload de mídias pesadas.
2. **Backend (`be/`)**:
   - API REST em **Node.js 20** com **Express** e validação de contratos com **Zod**.
   - Integração com **Remotion Bundler & Renderer** e **Chromium headless** no container Alpine Linux para composição e exportação assíncrona de vídeos MP4 com heatmaps sobrepostos.
   - Autenticação JWT com controle de papéis (RBAC).
   - Gerenciamento de arquivos multipart via **Multer**.
3. **Banco de Dados (`mongodb`)**:
   - Instância de **MongoDB 6** com persistência em volume Docker nomeado (`mongo_data`).

---

## 🧠 2. Decisões de Engenharia & Preparação para o Deploy

Durante a preparação do sistema para produção, foram tomadas decisões arquiteturais e correções críticas:

### A. Salvamento Resiliente da Sessão de Eyetracking (`NTestStepResult.jsx`)
* **Problema diagnosticado**: Ao concluir a visualização dos estímulos, o método `stopCamera()` dispara alterações de estado assíncronas no componente pai (`NTestPage.jsx`). Em versões modernas do React (e em ambientes sob StrictMode ou re-renderizações rápidas), o componente era desmontado/remontado ou re-renderizado enquanto a requisição HTTP `POST /eyetracking/sessions` já estava trafegando. A lógica antiga utilizava uma flag `let ignore = false` que era marcada como `true` no cleanup, e uma flag booleana `hasSubmittedRef = true` que bloqueava nova execução. O backend salvava os dados com sucesso, mas a UI descartava a resposta e permanecia indefinidamente no estado `"saving"` ("Salvando seus resultados...").
* **Decisão adotada**:
  1. **Promessa em andamento via Ref (`inFlightPromiseRef`)**: Armazena a Promise ativa da requisição. Se o componente for re-renderizado ou remontado enquanto os dados trafegam, a nova renderização não duplica a chamada de rede e vincula seus callbacks à mesma promessa já aberta.
  2. **Ciclo de vida rastreado (`isMountedRef`)**: Garante que o estado seja atualizado para `"success"` assim que a promessa resolver.
  3. **Idempotência no Backend**: O modelo `EyeTrackingSession` possui índice único no campo `sessao_id`. Se a mesma sessão for enviada mais de uma vez, o backend reutiliza o registro existente sem corromper os dados.
  4. **Fallback de `crypto.randomUUID`**: Em ambientes HTTP locais ou navegadores legados onde a API de criptografia não está disponível, foi implementado um gerador seguro de ID de sessão com fallback baseado em timestamp e entropia pseudoaleatória.
  5. **Mecanismo de Retry amigável**: Caso haja instabilidade real de conexão durante o envio, a interface exibe os detalhes do erro e um botão **"Tentar novamente"**, impedindo que o participante perca seu esforço caso queira reenviar.

### B. Numeração Sequencial nos Gaze Plots (`GazePlot.jsx` e `AnimatedGazePlotFixations.jsx`)
* **Problema**: No interior das bolhas de fixação, era renderizado `{fix.pointCount}`, exibindo a contagem bruta de frames amostrados (ex: 24, 48, 120), o que confundia os pesquisadores que esperavam a ordem cronológica do olhar.
* **Decisão adotada**: O número impresso dentro do círculo foi alterado para `(fix.localIndex + 1)` (1, 2, 3...), representando a ordem cronológica em que a pessoa olhou para cada ponto da tela. A métrica de pontos brutos (`pointCount`) foi mantida apenas nos tooltips informativos de detalhamento.

### C. Formulário Demográfico Inclusivo e Preciso (`NTestStepWelcome.jsx`)
* **Decisão adotada**:
  1. Perguntas formuladas de forma humanizada: `"Qual é sua idade? *"` e `"Qual gênero você se identifica? *"`.
  2. A opção de omissão `"Prefiro não informar"` foi removida.
  3. Ao selecionar a opção `"Outro"`, abre-se dinamicamente um campo de texto adicional exigindo que o usuário descreva sua identificação de gênero, validando o preenchimento antes do início do experimento e persistindo a descrição textual diretamente no registro da sessão.

### D. Roteamento e Proxy Nginx para Domínio Único ou Múltiplo (`nginx.conf` e `vite.config.js`)
* **Problema**: Quando o frontend e o backend rodam em contêineres diferentes, configurar URLs absolutas no build do frontend (`VITE_API_BASE_URL=http://localhost:3333`) causa falhas de CORS caso o deploy seja feito sob um único domínio (ex: `https://meuapp.com`). Além disso, o backend Express escuta rotas na raiz (`/sign-in`, `/eyetracking`), e não em `/api/sign-in`.
* **Decisão adotada**:
  1. O arquivo `fe/nginx.conf` foi configurado com rewrite automático:
     ```nginx
     location /api/ {
         rewrite ^/api/(.*) /$1 break;
         proxy_pass http://backend:3333;
     }
     ```
  2. O `fe/vite.config.js` também recebeu a regra de rewrite no proxy local:
     ```javascript
     "/api": {
       target: apiTarget,
       changeOrigin: true,
       secure: false,
       rewrite: (path) => path.replace(/^\/api/, ""),
     }
     ```
  3. Isso permite dois modelos de deploy com **zero alteração de código**:
     - **Modelo A (Domínio Único - Recomendado)**: Frontend e Backend sob `https://meuapp.com`, com chamadas para `/api/...` sendo automaticamente encaminhadas ao backend sem problemas de CORS.
     - **Modelo B (Domínios Separados)**: Frontend em `https://app.meudominio.com` e Backend em `https://api.meudominio.com`, usando a variável `ALLOWED_ORIGINS` no backend para liberar CORS.

### E. Inicialização e Segurança do Administrador (`seedAdmin.js`)
* **Decisão adotada**: O provisionamento automático do administrador não possui mais credenciais estáticas hardcoded no código. Agora ele lê `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` definidas no arquivo `.env`. Se o usuário administrador já existir no MongoDB, a rotina não sobrescreve os dados.

### F. Criação Automática de Diretórios de Uploads e Logs (`uploadsPaths.js` e `logger.js`)
* **Decisão adotada**: Em novos servidores, volumes Docker vazios montados em `/app/uploads` e `/app/logs` não possuem subpastas pré-existentes. Foi adicionada a rotina de criação recursiva (`fs.mkdirSync(..., { recursive: true })`) para:
  - `/app/uploads/tmp`
  - `/app/uploads/media`
  - `/app/uploads/json`
  - `/app/logs`
  Isso elimina qualquer erro do tipo `ENOENT: no such file or directory` durante uploads ou geração de logs.

### G. Logs Visíveis em Produção via Docker (`logger.js`)
* **Decisão adotada**: O Winston estava desativando o console em produção (`NODE_ENV === "production"`), deixando `docker logs` vazio. Foi adicionado o transporte de `Console` em JSON estruturado para produção e colorido para desenvolvimento, garantindo monitoramento e diagnóstico em tempo real via terminal.

---

## 📋 3. Passo a Passo para Deploy em Produção

### 1. Requisitos do Servidor (Host)
- **Sistema Operacional**: Linux (Ubuntu 22.04 LTS ou superior recomendado)
- **Hardware Mínimo**:
  - 2 vCPUs (4 vCPUs recomendados para exportação frequente de vídeos MP4 com Remotion)
  - 4 GB de RAM
  - 20 GB de espaço em disco (SSD)
- **Softwares Instalados**:
  - Docker Engine 24+
  - Docker Compose v2+

### 2. Clonando o Repositório no Servidor
```bash
git clone https://github.com/lucas231090/sinapheatmap.git /opt/sinapheatmap
cd /opt/sinapheatmap
```

### 3. Configurando as Variáveis de Ambiente
Copie o template oficial:
```bash
cp .env.example .env
```

Edite o arquivo `.env` para produção:
```bash
nano .env
```

**Exemplo de configuração de produção recomendada:**
```env
# ─── Backend ───
PORT=3333
NODE_ENV=production
JWT_SECRET=troque_por_uma_chave_longa_e_aleatoria_com_mais_de_32_caracteres_123456
ALLOWED_ORIGINS=https://sinapheatmap.seudominio.com.br

# ─── MongoDB ───
MONGO_INITDB_ROOT_USERNAME=sinap_admin
MONGO_INITDB_ROOT_PASSWORD=senha_super_segura_do_banco_aqui
MONGO_INITDB_DATABASE=sinapheatmap
MONGO_URL=mongodb://sinap_admin:senha_super_segura_do_banco_aqui@mongodb:27017/sinapheatmap?authSource=admin

# ─── Frontend ───
# Se usar domínio único com Nginx reverso para /api:
VITE_API_BASE_URL=https://sinapheatmap.seudominio.com.br/api
# Se usar subdomínio próprio para a API:
# VITE_API_BASE_URL=https://api.sinapheatmap.seudominio.com.br

# ─── Credenciais Iniciais do Administrador ───
INITIAL_ADMIN_EMAIL=coordenador@ufpr.br
INITIAL_ADMIN_PASSWORD=SenhaForteInicial@2026
```

### 4. Build e Execução dos Contêineres
Suba todos os serviços em segundo plano:
```bash
docker compose up -d --build
```

Verifique se todos os contêineres subiram com saúde:
```bash
docker compose ps
```

Saída esperada:
```text
NAME                     IMAGE                  STATUS                   PORTS
sinapheatmap-backend     sinapheatmap-backend   Up (healthy)             0.0.0.0:3333->3333/tcp
sinapheatmap-frontend    sinapheatmap-frontend  Up                       0.0.0.0:3000->80/tcp
sinapheatmap-mongo       mongo:6                Up                       0.0.0.0:27017->27017/tcp
```

### 5. Configuração de HTTPS / SSL com Nginx no Servidor Host (Recomendado)
Para expor a aplicação na internet de forma segura com certificado SSL gratuito Let's Encrypt:

Instale o Nginx e o Certbot no host:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Crie o arquivo de configuração `/etc/nginx/sites-available/sinapheatmap`:
```nginx
server {
    listen 80;
    server_name sinapheatmap.seudominio.com.br;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Ative o site e emita o certificado SSL:
```bash
sudo ln -s /etc/nginx/sites-available/sinapheatmap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d sinapheatmap.seudominio.com.br
```

---

## 🔍 4. Comandos de Diagnóstico e Manutenção

| Ação | Comando |
| :--- | :--- |
| **Ver logs do backend em tempo real** | `docker compose logs -f backend` |
| **Ver logs do frontend Nginx** | `docker compose logs -f frontend` |
| **Ver logs do MongoDB** | `docker compose logs -f mongodb` |
| **Reiniciar todos os serviços** | `docker compose restart` |
| **Aplicar alterações e reconstruir** | `docker compose up -d --build` |
| **Testar integridade da API** | `curl -i http://localhost:3333/health` |
| **Acessar shell dentro do backend** | `docker compose exec backend sh` |
| **Fazer backup do MongoDB** | `docker compose exec mongodb mongodump --archive=/data/db/backup_$(date +%F).gz --gzip` |

---

## 🔒 5. Checklist Pós-Deploy

- [ ] Acessar `https://sinapheatmap.seudominio.com.br` e verificar o carregamento da tela de login.
- [ ] Entrar com as credenciais do `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` definidas no `.env`.
- [ ] Acessar o perfil ou painel de usuários e alterar a senha inicial para uma nova senha de uso contínuo.
- [ ] Criar um experimento de teste (inserindo uma imagem ou vídeo).
- [ ] Acessar o link público do teste (`/test/:id`), preencher idade e gênero (testar seleção padrão e opção "Outro").
- [ ] Realizar a calibração de 9 pontos e concluir o teste, conferindo se a tela de finalização exibe *"Muito obrigado por participar!"* sem travamentos.
- [ ] Acessar a visualização de Heatmap do experimento criado e validar:
  - Visualização Heatmap estático/dinâmico.
  - Bubble Canvas com tempo acumulado.
  - Gaze Plot com bolhas numeradas (1, 2, 3...) e setas sacádicas.
  - Exportação de imagem PNG e renderização de vídeo MP4.
- [ ] Fechar a porta `27017` no firewall do host (UFW/Security Group) para que o MongoDB não seja exposto diretamente à internet.
