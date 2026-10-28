# 📥 Guia Rápido de Instalação - Ferramentas Necessárias

Este guia mostra como instalar todas as ferramentas necessárias para rodar o SINAPHEATMAP no Windows.

---

## Node.js e npm

O npm (Node Package Manager) é instalado automaticamente junto com o Node.js.

### Instalação:

1. **Acesse**: [https://nodejs.org/](https://nodejs.org/)

2. **Baixe** a versão **LTS (Long Term Support)** - botão verde à esquerda

   - Exemplo: v20.11.0 LTS

3. **Execute** o instalador baixado (`node-vXX.XX.X-x64.msi`)

4. **Durante a instalação**:

   - ✅ Aceite os termos
   - ✅ Mantenha o caminho padrão de instalação
   - ✅ **IMPORTANTE**: Deixe marcada a opção **"Automatically install the necessary tools"**
   - ✅ Clique em "Next" até finalizar

5. **Reinicie** o PowerShell ou Terminal

### Verificação:

Abra o PowerShell e digite:

```powershell
node --version
```

Deve mostrar algo como: `v20.11.0`

```powershell
npm --version
```

Deve mostrar algo como: `10.2.4`

✅ **Se ambos os comandos mostrarem versões, está instalado corretamente!**

---

## MongoDB

Você tem **2 opções**. Escolha UMA delas:

### Opção A: Instalar MongoDB Localmente (Mais complexo)

1. **Acesse**: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

2. **Configure**:

   - Version: Última versão (ex: 7.0.x)
   - Platform: Windows
   - Package: msi

3. **Baixe** e execute o instalador

4. **Durante a instalação**:

   - Setup Type: Complete
   - ✅ Install MongoDB as a Service
   - ✅ Install MongoDB Compass (interface gráfica - recomendado)

5. **Após instalação**, o MongoDB deve iniciar automaticamente como serviço

### Opção B: Usar Docker (Recomendado - Mais fácil)

É mais fácil usar Docker! Veja a próxima seção.

---

## Docker Desktop

Com Docker, você não precisa instalar MongoDB manualmente!

### Instalação:

1. **Acesse**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

2. **Baixe** Docker Desktop para Windows

3. **Execute** o instalador

4. **Durante a instalação**:

   - ✅ Use WSL 2 instead of Hyper-V (recomendado)
   - ✅ Add shortcut to desktop

5. **⚠️ IMPORTANTE**: Após a instalação, **reinicie o computador**

6. **Após reiniciar**, abra o Docker Desktop
   - Ele pode pedir para atualizar o WSL 2 (siga as instruções se aparecer)

### Verificação:

Abra o PowerShell e digite:

```powershell
docker --version
```

Deve mostrar algo como: `Docker version 24.0.7`

```powershell
docker-compose --version
```

Deve mostrar algo como: `Docker Compose version v2.23.0`

✅ **Se ambos os comandos mostrarem versões, está instalado!**

---

## Visual Studio Code (Opcional, mas recomendado)

### Instalação:

1. **Acesse**: [https://code.visualstudio.com/](https://code.visualstudio.com/)

2. **Baixe** a versão para Windows

3. **Execute** o instalador

4. **Durante a instalação**:
   - ✅ Add "Open with Code" action to Windows Explorer context menu
   - ✅ Add to PATH

### Extensões Recomendadas:

Após instalar o VS Code, instale estas extensões:

1. Abra o VS Code
2. Clique no ícone de Extensions (Ctrl+Shift+X)
3. Procure e instale:
   - **ESLint** - Para JavaScript
   - **Prettier** - Formatação de código
   - **Docker** - Se você instalou Docker
   - **MongoDB for VS Code** - Se você instalou MongoDB

---

## 🆘 Problemas Comuns

### "comando não encontrado" após instalar

**Solução**:

1. **Feche** todos os terminais/PowerShell abertos
2. **Abra um novo** PowerShell
3. Tente novamente

Se ainda não funcionar, reinicie o computador.

### Docker não inicia após instalação

**Solução**:

1. Certifique-se de que reiniciou o computador após instalar
2. Verifique se a virtualização está habilitada na BIOS
3. Atualize o WSL 2 se o Docker pedir

### npm muito lento no Windows

**Solução**:
Execute no PowerShell como **Administrador**:

```powershell
npm config set registry https://registry.npmjs.org/
npm cache clean --force
```

---

## 🎯 Próximos Passos

Após instalar tudo, vá para o **SETUP_GUIDE.md** para configurar e rodar o projeto!

---

**Dica**: Se tiver dúvidas durante a instalação, procure no Google por:

- "Como instalar Node.js no Windows"
- "Docker Desktop Windows instalação"
- etc.

Há muitos tutoriais em vídeo no YouTube que podem ajudar!
