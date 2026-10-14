# 🚀 Guia de Configuração e Execução — SINAPHEATMAP

Bem-vindo ao projeto **SINAPHEATMAP**! Este guia passo a passo foi elaborado para que você configure e execute todo o ecossistema da aplicação (Frontend, Backend e Banco de Dados MongoDB) de forma rápida e descomplicada.

---

## 📋 Pré-requisitos

Você pode executar o projeto de duas formas:
1. **Com Docker (Recomendado)**: Necessita apenas do Docker e Docker Compose instalados.
2. **Localmente sem Docker**: Necessita do Node.js (versão 20 LTS ou superior) e uma instância do MongoDB 6+.

---

## 🐳 Opção 1: Executando com Docker (Mais Fácil & Rápido)

Com o Docker Desktop aberto na sua máquina:

### 1. Clonar o repositório
```bash
git clone https://github.com/lucas231090/sinapheatmap.git
cd sinapheatmap
```

### 2. Configurar o arquivo `.env`
Copie o template de ambiente na raiz do projeto:
```bash
cp .env.example .env
```

*(O arquivo `.env.example` já vem pré-configurado com valores padrão funcionais para desenvolvimento local)*.

### 3. Iniciar os serviços
Para rodar em **modo de desenvolvimento** (com hot-reload de código ativo):
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Ou para rodar a versão de **produção** (com bundle otimizado e Nginx):
```bash
docker compose up -d --build
```

### 4. Acessar a aplicação
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3333](http://localhost:3333)
- **Swagger Docs**: [http://localhost:3333/api-docs](http://localhost:3333/api-docs)

> 👤 **Credenciais Iniciais do Administrador**:
> - E-mail: `admin@admin.com`
> - Senha: `admin123`

---

## 💻 Opção 2: Executando Localmente (Sem Docker)

### 1. Iniciar o MongoDB
Se você tiver o Docker instalado, pode rodar apenas o banco de dados com:
```bash
docker run -d -p 27017:27017 --name sinapheatmap-mongo mongo:6
```
Ou inicie o serviço do MongoDB instalado localmente na sua máquina (porta `27017`).

---

### 2. Configurar e Executar o Backend (`be/`)

Abra um terminal e acesse a pasta `be/`:
```bash
cd be
npm install
cp .env.example .env
```

Verifique o arquivo `be/.env`:
```env
PORT=3333
MONGO_URL=mongodb://localhost:27017/sinapheatmap
JWT_SECRET=sua_chave_secreta_super_segura
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Inicie o backend:
```bash
npm run dev
```
O servidor estará rodando em: `http://localhost:3333`.

---

### 3. Configurar e Executar o Frontend (`fe/`)

Abra um segundo terminal e acesse a pasta `fe/`:
```bash
cd fe
npm install
cp .env.example .env
```

Verifique o arquivo `fe/.env`:
```env
VITE_API_BASE_URL=http://localhost:3333
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O Vite iniciará em `http://localhost:5173`.

---

## 🧪 Executando os Testes Automatizados

O projeto conta com suítes de testes automatizados completas para backend e frontend:

### Testes do Backend (Jest)
```bash
cd be
npm test
```

### Testes do Frontend (Vitest)
```bash
cd fe
npm run test
```

---

## 🐛 Resolução de Problemas Frequentes

### 1. Erro de CORS na comunicação Frontend-Backend
- Verifique se a variável `ALLOWED_ORIGINS` no `.env` do backend inclui a URL do frontend (por exemplo: `http://localhost:5173` ou `http://localhost:3000`).
- Reinicie o backend após qualquer alteração em arquivos `.env`.

### 2. MongoDB não conecta
- Verifique se a porta `27017` está acessível ou se o contêiner do MongoDB está ativo (`docker ps`).
- Ao rodar com Docker Compose, certifique-se de que a string de conexão no `.env` da raiz referencia o serviço `mongodb`:
  `mongodb://root:senha123@mongodb:27017/sinapheatmap?authSource=admin`.

### 3. Falha de dependências do npm
- Se houver conflito de módulos, execute:
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 🤝 Dúvidas ou Suporte

Consulte o [README.MD](README.MD) na raiz do projeto para detalhes sobre arquitetura, deployment em produção com SSL/HTTPS e checklist de segurança.
