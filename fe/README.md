## Sinapheatmap Web

O **SinapHeatmap WEB** é a interface de usuário para visualização de mapas de calor baseados em dados de rastreamento ocular (**eyetracking**).

---

## Rodando com Docker (recomendado)

> Use o `docker-compose.yml` na **raiz do projeto** (`sinapheatmap/`). O frontend é buildado e servido automaticamente junto com o backend.

```bash
# Na raiz do projeto:
docker-compose up --build
```

Acesse em: **http://localhost:3000**

---

## Rodando localmente (sem Docker)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` **nesta pasta** (`fe/`) com:

```env
# URL da API do backend (onde o servidor Node.js está rodando)
VITE_API_BASE_URL=http://localhost:3333
```

### 3. Iniciar em modo desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (porta padrão do Vite).

> O backend precisa estar rodando em `http://localhost:3333`. Ver `be/README.MD` para instruções.

---

## Scripts disponíveis

| Script            | O que faz                                              |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Inicia servidor de desenvolvimento Vite com hot-reload |
| `npm run build`   | Gera build de produção em `dist/`                      |
| `npm run preview` | Pré-visualiza o build de produção localmente           |
| `npm run lint`    | Verifica erros de lint no código                       |
| `npm run test`    | Executa a suíte de testes (Jest)                       |

---

## Variáveis de Ambiente

| Variável            | Obrigatória | Descrição                                            |
| ------------------- | ----------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL` | **Sim**     | URL base da API backend que o **navegador** vai usar |

> ⚠️ Variáveis do Vite/React precisam do prefixo `VITE_` para serem acessíveis no código do browser.

---

## Nota sobre bibliotecas de heatmap

O projeto usa **dois pacotes de heatmap** intencionalmente:

- `heatmap.js` — biblioteca original
- `@mars3d/heatmap.js` — fork que corrige um bug no qual alguns navegadores proibem a edição direta do objeto `ImageData` (`Uncaught TypeError: Cannot assign to read only property 'data'`)

O fork `@mars3d/heatmap.js` está sendo usado ativamente. Quando a biblioteca original corrigir o bug, o fork será removido.
