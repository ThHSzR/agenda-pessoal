# 🌸 Clínica Estética — Sistema de Agendamento

Sistema desktop para gerenciamento de clínica de estética. Funciona offline, sem internet, sem Docker.

## Requisitos para desenvolvimento

- [Node.js 18+](https://nodejs.org/)
- Windows 10

## Como rodar em desenvolvimento

```bash
npm install
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
