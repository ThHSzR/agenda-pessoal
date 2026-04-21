# Agenda Pessoal — Clínica de Estética

Sistema de agendamento e gestão para clínicas de estética e salões de beleza.
Versão web com Node.js + Express + SQLite (better-sqlite3) + JavaScript vanilla.

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs em tempo real: agendamentos do dia, total de clientes, receita do mês, promoções ativas |
| **Calendário** | Visualização mensal, semanal e diária dos agendamentos com cores por status |
| **Agendamentos** | CRUD completo com múltiplos procedimentos/variantes por agendamento, cálculo automático de promoção |
| **Clientes** | Ficha de anamnese completa (dados pessoais, saúde, físico/pele, Fitzpatrick), procedimentos de interesse |
| **Procedimentos** | Cadastro com variantes (ex: áreas do corpo), duração, valor, flag laser |
| **Financeiro** | Resumo e detalhamento por período, KPIs de recebido/a receber/cancelados, exportação CSV |
| **Promoções** | Desconto percentual, em reais ou valor fixo; modo combo fechado ou mínimo; vigência, dias da semana, limite de usos |
| **Usuários** | Gestão de contas com 3 níveis de cargo (operador, gerente, admin), troca de senha e cargo |
| **Backup** | Download do banco SQLite pelo painel de administração |

## Requisitos

- Node.js 18+
- npm ou pnpm

## Instalação

```bash
git clone <repo-url>
cd agenda-pessoal
npm install
```

## Execução

```bash
# Produção
npm start

# Desenvolvimento (com hot-reload via nodemon)
npm run dev
```

O servidor inicia em `http://localhost:3000`.

Na primeira execução, o banco `clinica.db` é criado automaticamente com todas as tabelas e migrações.
O primeiro usuário cadastrado via login será promovido a administrador (usuário padrão: `admin` / senha: `admin123`).

## Estrutura do Projeto

```
agenda-pessoal/
├── server.js              # Servidor Express — todas as rotas da API
├── server/
│   └── database.js        # Inicialização do SQLite, DDL e migrações
├── src/
│   ├── index.html         # SPA principal (modais inline)
│   ├── login.html         # Tela de login
│   ├── css/
│   │   └── style.css      # Estilos globais (variáveis CSS, componentes)
│   └── js/
│       ├── utils.js        # Funções utilitárias (toast, modal, formatação)
│       ├── api.js          # Camada de comunicação com a API (fetch wrapper)
│       ├── app.js          # Roteamento SPA e controle de sessão/sidebar
│       ├── dashboard.js    # Página de Dashboard com KPIs
│       ├── calendario.js   # Calendário (mês/semana/dia)
│       ├── agendamentos.js # CRUD de agendamentos + cálculo de promoção
│       ├── clientes.js     # CRUD de clientes + anamnese
│       ├── procedimentos.js# CRUD de procedimentos e variantes
│       ├── financeiro.js   # Relatórios financeiros + exportação CSV
│       ├── promocoes.js    # CRUD de promoções e regras
│       └── usuarios.js     # Gestão de usuários + backup
├── clinica.db             # Banco SQLite (gerado automaticamente)
└── package.json
```

## Níveis de Acesso

| Cargo | Permissões |
|---|---|
| **Operador** | Agendar, ver calendário, cadastrar clientes |
| **Gerente** | Tudo do operador + procedimentos, promoções, financeiro, editar valores |
| **Admin** | Tudo do gerente + gestão de usuários, backup do banco |

## API Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/login` | — | Autenticação |
| POST | `/api/logout` | auth | Encerrar sessão |
| GET | `/api/me` | — | Dados da sessão atual |
| GET | `/api/dashboard` | auth | KPIs do dashboard |
| GET/POST/DELETE | `/api/clientes` | auth | CRUD de clientes |
| GET | `/api/clientes/:id/historico` | auth | Histórico de agendamentos do cliente |
| GET/POST/DELETE | `/api/procedimentos` | gerente | CRUD de procedimentos |
| GET/POST/DELETE | `/api/variantes/:procId` | gerente | CRUD de variantes |
| GET/POST/DELETE | `/api/agendamentos` | auth | CRUD de agendamentos |
| PATCH | `/api/agendamentos/:id/status` | auth | Alterar status |
| GET | `/api/financeiro/resumo` | gerente | Resumo financeiro por período |
| GET | `/api/financeiro/detalhado` | gerente | Detalhamento financeiro |
| GET/POST/DELETE | `/api/promocoes` | gerente | CRUD de promoções |
| POST | `/api/promocoes/calcular` | auth | Cálculo automático de promoção |
| GET/POST/PATCH/DELETE | `/api/usuarios` | admin | Gestão de usuários |
| GET | `/api/backup` | admin | Download do banco SQLite |

## Tecnologias

- **Backend:** Node.js, Express, express-session, express-rate-limit, bcryptjs, better-sqlite3
- **Frontend:** HTML5, CSS3 (variáveis CSS), JavaScript vanilla (sem frameworks)
- **Banco:** SQLite com WAL mode

## Onde ficam os dados

Os dados ficam salvos no arquivo `clinica.db` na raiz do projeto.

## Licença

Uso privado.
