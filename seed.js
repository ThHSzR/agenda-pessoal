const bcrypt    = require('bcryptjs');
const { getDb } = require('./server/database');

const db = getDb();
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const bool  = ()  => Math.random() > 0.5 ? 1 : 0;
const num   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function dataAleatoria(diasAtras = 180, diasFrente = 60) {
  const ms  = Date.now();
  const min = ms - diasAtras * 86400000;
  const max = ms + diasFrente * 86400000;
  const d   = new Date(min + Math.random() * (max - min));
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function nascimento() {
  const ano = num(1970, 2003);
  const mes = String(num(1, 12)).padStart(2, '0');
  const dia = String(num(1, 28)).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function cpf() {
  return Array.from({length: 3}, () => String(num(100,999))).join('.') + '-' + String(num(10,99));
}

function tel() {
  return `(${num(11,99)}) 9${num(1000,9999)}-${num(1000,9999)}`;
}

// ─────────────────────────────────────────────
// DADOS FICTÍCIOS
// ─────────────────────────────────────────────
const NOMES = [
  'Ana Paula Ferreira','Beatriz Souza Lima','Camila Rodrigues','Daniela Costa',
  'Eduarda Martins','Fernanda Oliveira','Gabriela Santos','Helena Almeida',
  'Isabela Carvalho','Juliana Pereira','Karla Nascimento','Larissa Mendes',
  'Mariana Silva','Natalia Rocha','Olivia Campos','Patricia Gomes',
  'Rafaela Torres','Sabrina Lopes','Tatiane Ribeiro','Vanessa Moreira',
  'Amanda Freitas','Bianca Nunes','Carolina Pinto','Débora Cavalcante',
  'Elaine Cardoso','Flávia Correia','Giovana Dias','Heloísa Barros',
  'Iris Monteiro','Jessica Cunha',
];

const CIDADES = [
  ['Goiânia','GO'],['São Paulo','SP'],['Rio de Janeiro','RJ'],
  ['Belo Horizonte','MG'],['Brasília','DF'],['Salvador','BA'],
  ['Anápolis','GO'],['Aparecida de Goiânia','GO'],['Curitiba','PR'],
  ['Fortaleza','CE'],
];

const ENDERECOS = [
  'Rua das Flores, 123','Av. Brasil, 456','Rua XV de Novembro, 789',
  'Alameda Santos, 321','Rua Goiás, 654','Av. Paulista, 1000',
  'Rua das Acácias, 22','Travessa do Sol, 88','Rua Minas Gerais, 10',
  'Av. Anhanguera, 500',
];

const COR_OLHOS   = ['castanhos','verdes','azuis','pretos','avelã'];
const COR_CABELOS = ['pretos','castanhos','loiros','ruivos','grisalhos','tingidos'];
const COR_PELOS   = ['finos e claros','grossos e escuros','médios e castanhos','finos e escuros'];

// ─────────────────────────────────────────────
// 1. USUÁRIOS
// ─────────────────────────────────────────────
console.log('→ Inserindo usuários...');

const usuariosExtra = [
  { usuario: 'gerente1',  senha: 'gerente123', is_admin: 0, cargo: 'gerente'  },
  { usuario: 'operador1', senha: 'oper123',    is_admin: 0, cargo: 'operador' },
  { usuario: 'operador2', senha: 'oper456',    is_admin: 0, cargo: 'operador' },
];

const insUsuario = db.prepare(
  'INSERT OR IGNORE INTO usuarios (usuario, senha, is_admin, cargo) VALUES (?,?,?,?)'
);
for (const u of usuariosExtra) {
  insUsuario.run(u.usuario, bcrypt.hashSync(u.senha, 10), u.is_admin, u.cargo);
}

// ─────────────────────────────────────────────
// 2. PROCEDIMENTOS + VARIANTES
// ─────────────────────────────────────────────
console.log('→ Inserindo procedimentos...');

const procedimentos = [
  {
    nome: 'Limpeza de Pele', descricao: 'Limpeza profunda com extração de comedões.',
    duracao_min: 60, valor: 120.00, is_laser: 0, tem_variantes: 0,
  },
  {
    nome: 'Design de Sobrancelha', descricao: 'Modelagem com linha e pinça.',
    duracao_min: 30, valor: 45.00, is_laser: 0, tem_variantes: 0,
  },
  {
    nome: 'Depilação a Laser', descricao: 'Laser de diodo para remoção de pelos.',
    duracao_min: 45, valor: 0, is_laser: 1, tem_variantes: 1,
    variantes: [
      { nome: 'Buço',             descricao: 'Região acima dos lábios', duracao_min: 15, valor: 80.00  },
      { nome: 'Axilas',           descricao: 'Região das axilas',       duracao_min: 20, valor: 120.00 },
      { nome: 'Pernas completas', descricao: 'Toda a perna',            duracao_min: 60, valor: 350.00 },
      { nome: 'Virilha',          descricao: 'Região inguinal',         duracao_min: 30, valor: 180.00 },
      { nome: 'Costas',           descricao: 'Região dorsal completa',  duracao_min: 45, valor: 280.00 },
    ],
  },
  {
    nome: 'Hidratação Facial', descricao: 'Máscara hidratante com vitamina C.',
    duracao_min: 45, valor: 90.00, is_laser: 0, tem_variantes: 0,
  },
  {
    nome: 'Peeling Químico', descricao: 'Renovação celular com ácidos.',
    duracao_min: 50, valor: 0, is_laser: 0, tem_variantes: 1,
    variantes: [
      { nome: 'Peeling Superficial', descricao: 'Ácido glicólico 30%',   duracao_min: 30, valor: 150.00 },
      { nome: 'Peeling Médio',       descricao: 'Ácido tricloroacético',  duracao_min: 50, valor: 250.00 },
    ],
  },
  {
    nome: 'Massagem Relaxante', descricao: 'Massagem corporal 60 minutos.',
    duracao_min: 60, valor: 110.00, is_laser: 0, tem_variantes: 0,
  },
  {
    nome: 'Micropigmentação', descricao: 'Pigmentação semipermanente.',
    duracao_min: 120, valor: 0, is_laser: 0, tem_variantes: 1,
    variantes: [
      { nome: 'Sobrancelha', descricao: 'Técnica fio a fio',    duracao_min: 120, valor: 400.00 },
      { nome: 'Lábios',      descricao: 'Contorno e preench.',  duracao_min: 90,  valor: 350.00 },
    ],
  },
];

const insProc = db.prepare(
  'INSERT OR IGNORE INTO procedimentos (nome,descricao,duracao_min,valor,is_laser,tem_variantes) VALUES (?,?,?,?,?,?)'
);
const insVar = db.prepare(
  'INSERT INTO procedimento_variantes (procedimento_id,nome,descricao,duracao_min,valor) VALUES (?,?,?,?,?)'
);

const procIds = {};
for (const p of procedimentos) {
  const existe = db.prepare('SELECT id FROM procedimentos WHERE nome=?').get(p.nome);
  if (existe) { procIds[p.nome] = existe.id; continue; }

  const r = insProc.run(p.nome, p.descricao, p.duracao_min, p.valor, p.is_laser, p.tem_variantes);
  procIds[p.nome] = r.lastInsertRowid;
  if (p.variantes) {
    for (const v of p.variantes) {
      insVar.run(r.lastInsertRowid, v.nome, v.descricao, v.duracao_min, v.valor);
    }
  }
}

const todasVariantes = db.prepare('SELECT id, procedimento_id FROM procedimento_variantes').all();

// ─────────────────────────────────────────────
// 3. CLIENTES
// ─────────────────────────────────────────────
console.log('→ Inserindo clientes...');

const insCliente = db.prepare(`
  INSERT OR IGNORE INTO clientes
  (nome,data_nascimento,cpf,email,telefone,celular,endereco,cidade,uf,
   cor_olhos,cor_cabelos,cor_pelos,fitzpatrick,
   medicamento_uso,alergia_medicamento,alergia_qual,
   anticoncepcional,anticoncepcional_qual,
   tomou_sol,sol_quando,observacoes)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

for (const nome of NOMES) {
  const [cidade, uf] = pick(CIDADES);
  const usaMed  = bool();
  const temAler = bool();
  const usaAnti = bool();
  insCliente.run(
    nome, nascimento(), cpf(),
    nome.split(' ')[0].toLowerCase() + '@email.com',
    tel(), tel(),
    pick(ENDERECOS), cidade, uf,
    pick(COR_OLHOS), pick(COR_CABELOS), pick(COR_PELOS),
    num(1, 6),
    usaMed, temAler,
    temAler ? pick(['Dipirona','Penicilina','Anti-inflamatório']) : null,
    usaAnti, usaAnti ? pick(['Anticoncepcional oral','DIU','Implante']) : null,
    bool(), bool() ? 'Há 2 semanas' : null,
    pick([null, 'Pele sensível', 'Faz uso de ácidos em casa', 'Retornou após gravidez'])
  );
}

const todosClientes = db.prepare('SELECT id FROM clientes').all().map(c => c.id);

// ─────────────────────────────────────────────
// 4. INTERESSES (cliente ↔ procedimento)
// ─────────────────────────────────────────────
console.log('→ Inserindo interesses...');

const insCliProc = db.prepare(
  'INSERT OR IGNORE INTO cliente_procedimentos_interesse (cliente_id, procedimento_id) VALUES (?,?)'
);
const insCliVar = db.prepare(
  'INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)'
);

const todosProcIds = Object.values(procIds);
for (const cid of todosClientes) {
  const qtd = num(1, 3);
  const selecionados = [...todosProcIds].sort(() => Math.random() - 0.5).slice(0, qtd);
  for (const pid of selecionados) {
    insCliProc.run(cid, pid);
    const vars = todasVariantes.filter(v => v.procedimento_id === pid);
    if (vars.length > 0) insCliVar.run(cid, pick(vars).id);
  }
}

// ─────────────────────────────────────────────
// 5. AGENDAMENTOS
// ─────────────────────────────────────────────
console.log('→ Inserindo agendamentos...');

const STATUS   = ['agendado','agendado','agendado','concluido','concluido','cancelado'];
const insAgend = db.prepare(`
  INSERT INTO agendamentos
  (cliente_id, procedimento_id, variante_id, data_hora, status, valor_cobrado, observacoes)
  VALUES (?,?,?,?,?,?,?)
`);

for (let i = 0; i < 60; i++) {
  const cid  = pick(todosClientes);
  const proc = pick(procedimentos);
  const pid  = procIds[proc.nome];
  if (!pid) continue;

  let vid   = null;
  let valor = proc.valor;

  if (proc.tem_variantes) {
    const vars = todasVariantes.filter(v => v.procedimento_id === pid);
    if (vars.length > 0) {
      const v    = pick(vars);
      vid        = v.id;
      const vRow = db.prepare('SELECT valor FROM procedimento_variantes WHERE id=?').get(v.id);
      valor      = vRow?.valor ?? 0;
    }
  }

  insAgend.run(
    cid, pid, vid,
    dataAleatoria(180, 60),
    pick(STATUS),
    valor > 0 ? valor : num(80, 400),
    pick([null, null, null, 'Cliente indicada por amiga', 'Retorno', 'Pacote 5 sessões'])
  );
}

console.log('');
console.log('✅ Seed concluído!');
console.log('   Usuários: gerente1 / gerente123 | operador1 / oper123 | operador2 / oper456');
console.log(`   Clientes: ${NOMES.length}`);
console.log(`   Procedimentos: ${procedimentos.length}`);
console.log('   Agendamentos: 60');