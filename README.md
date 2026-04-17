# 🌸 Clínica Estética — Sistema de Agendamento

Sistema desktop para gerenciamento de clínica de estética. Funciona offline, sem internet, sem Docker.

## Requisitos para desenvolvimento

- [Node.js 18+](https://nodejs.org/)
- Windows 10

## Como rodar em desenvolvimento

```bash
npm install
# 1. Garantir Node v20 (não v24!)
nvm use 20

# 2. Instalar sem baixar o Electron pela rede
cd ~/agenda-pessoal
rm -rf node_modules package-lock.json
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install

# 3. Extrair o zip do Electron manualmente
#    (baixar electron-v28.3.3-linux-x64.zip ~120MB no navegador Windows)
rm -rf node_modules/electron/dist
mkdir -p node_modules/electron/dist
unzip -o ~/.cache/electron/electron-v28.3.3-linux-x64.zip \
  -d node_modules/electron/dist
chmod +x node_modules/electron/dist/electron
printf "electron" > node_modules/electron/path.txt

# 4. Rebuild do better-sqlite3
npx electron-rebuild -f -w better-sqlite3

# 5. Rodar
npm start
```

## Como gerar o instalador .exe

```bash
npm install
npm run build
```

O instalador será gerado em `dist/Clínica Estética Setup x.x.x.exe`.

## Funcionalidades

- 📅 Calendário com visão por mês, semana e dia
- 👤 Cadastro completo de clientes
- 💆 Gerenciamento de procedimentos e valores
- 📋 Agendamentos com status (agendado / concluído / cancelado)
- 💰 Painel financeiro com KPIs e relatório para impressão
- 🔔 Notificações automáticas 30 min antes do agendamento
- 💾 Banco de dados local (SQLite) — dados nunca se perdem

## Onde ficam os dados

Os dados ficam salvos em:
`C:\Users\<usuário>\AppData\Roaming\clinica-estetica\clinica.db`
