const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function getDb() {
  if (!db) {
    // importa app aqui dentro, só quando getDb() for chamado
    const { app } = require('electron');
    const dbPath = path.join(app.getPath('userData'), 'clinica.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome              TEXT NOT NULL,
      data_nascimento   TEXT,
      cpf               TEXT,
      email             TEXT,
      telefone          TEXT,
      celular           TEXT,
      endereco          TEXT,
      cidade            TEXT,
      uf                TEXT,
      areas_tratar      TEXT,
      metodo_dep_cera   INTEGER DEFAULT 0,
      metodo_dep_lamina INTEGER DEFAULT 0,
      metodo_dep_laser  INTEGER DEFAULT 0,
      prob_encravamento INTEGER DEFAULT 0,
      prob_manchas      INTEGER DEFAULT 0,
      prob_outros       TEXT,
      medicamento_uso        INTEGER DEFAULT 0,
      medicamento_qual       TEXT,
      roacutan               INTEGER DEFAULT 0,
      tto_vitiligo           INTEGER DEFAULT 0,
      alergia_medicamento    INTEGER DEFAULT 0,
      alergia_qual           TEXT,
      tratamento_dermato     INTEGER DEFAULT 0,
      tratamento_dermato_qual TEXT,
      usa_acidos             INTEGER DEFAULT 0,
      cirurgia               INTEGER DEFAULT 0,
      cirurgia_qual          TEXT,
      anticoncepcional       INTEGER DEFAULT 0,
      anticoncepcional_qual  TEXT,
      historico_oncologico   INTEGER DEFAULT 0,
      oncologico_qual        TEXT,
      acompanhamento_medico  INTEGER DEFAULT 0,
      acompanhamento_qual    TEXT,
      epilepsia              INTEGER DEFAULT 0,
      alteracao_hormonal     INTEGER DEFAULT 0,
      hormonal_qual          TEXT,
      hirsutismo             INTEGER DEFAULT 0,
      gestante               INTEGER DEFAULT 0,
      herpes                 INTEGER DEFAULT 0,
      lactante               INTEGER DEFAULT 0,
      cor_olhos     TEXT,
      cor_cabelos   TEXT,
      cor_pelos     TEXT,
      tomou_sol     INTEGER DEFAULT 0,
      sol_quando    TEXT,
      fitzpatrick   INTEGER DEFAULT 0,
      termo_assinado INTEGER DEFAULT 0,
      observacoes    TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS procedimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      duracao_min INTEGER DEFAULT 60,
      valor REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      data_hora TEXT NOT NULL,
      status TEXT DEFAULT 'agendado',
      valor_cobrado REAL,
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
    );

    
  `);

  // ─── LASER REGIÕES ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS laser_regioes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    duracao_min INTEGER DEFAULT 30,
    valor REAL DEFAULT 0,
    ativo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cliente_laser_regioes (
    cliente_id INTEGER NOT NULL,
    regiao_id INTEGER NOT NULL,
    PRIMARY KEY (cliente_id, regiao_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (regiao_id) REFERENCES laser_regioes(id)
  );

  CREATE TABLE IF NOT EXISTS cliente_procedimentos_interesse (
    cliente_id INTEGER NOT NULL,
    procedimento_id INTEGER NOT NULL,
    PRIMARY KEY (cliente_id, procedimento_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
  );
`);

// Seed regiões laser (só insere se tabela estiver vazia)
const totalRegioes = db.prepare('SELECT COUNT(*) as n FROM laser_regioes').get().n;
if (totalRegioes === 0) {
  const insertRegiao = db.prepare('INSERT INTO laser_regioes (nome, duracao_min, valor) VALUES (?, ?, ?)');
  [
    ['Buço',                   20,  80],
    ['Axila',                  20,  90],
    ['Virilha Simples',        30, 120],
    ['Virilha Completa',       40, 160],
    ['Meia Perna',             40, 150],
    ['Perna Inteira',          60, 220],
    ['Braço Completo',         50, 180],
    ['Antebraço',              30, 120],
    ['Abdômen',                30, 130],
    ['Lombar',                 25, 110],
    ['Busto',                  25, 110],
    ['Rosto Completo',         30, 140],
    ['Costas Completa',        60, 250],
    ['Glúteos',                30, 130],
    ['Corpo Inteiro',         180, 900],
  ].forEach(([nome, dur, val]) => insertRegiao.run(nome, dur, val));
}

// Migração: adiciona flag laser no procedimentos
const colsProc = db.prepare("PRAGMA table_info(procedimentos)").all().map(c => c.name);
if (!colsProc.includes('is_laser')) {
  db.exec('ALTER TABLE procedimentos ADD COLUMN is_laser INTEGER DEFAULT 0');
}

  // Migração segura: adiciona colunas novas sem apagar dados
  const cols = db.prepare("PRAGMA table_info(clientes)").all().map(c => c.name);
  const novos = [
    ['celular','TEXT'], ['endereco','TEXT'], ['cidade','TEXT'], ['uf','TEXT'],
    ['areas_tratar','TEXT'],
    ['metodo_dep_cera','INTEGER DEFAULT 0'], ['metodo_dep_lamina','INTEGER DEFAULT 0'], ['metodo_dep_laser','INTEGER DEFAULT 0'],
    ['prob_encravamento','INTEGER DEFAULT 0'], ['prob_manchas','INTEGER DEFAULT 0'], ['prob_outros','TEXT'],
    ['medicamento_uso','INTEGER DEFAULT 0'], ['medicamento_qual','TEXT'],
    ['roacutan','INTEGER DEFAULT 0'], ['tto_vitiligo','INTEGER DEFAULT 0'],
    ['alergia_medicamento','INTEGER DEFAULT 0'], ['alergia_qual','TEXT'],
    ['tratamento_dermato','INTEGER DEFAULT 0'], ['tratamento_dermato_qual','TEXT'], ['usa_acidos','INTEGER DEFAULT 0'],
    ['cirurgia','INTEGER DEFAULT 0'], ['cirurgia_qual','TEXT'],
    ['anticoncepcional','INTEGER DEFAULT 0'], ['anticoncepcional_qual','TEXT'],
    ['historico_oncologico','INTEGER DEFAULT 0'], ['oncologico_qual','TEXT'],
    ['acompanhamento_medico','INTEGER DEFAULT 0'], ['acompanhamento_qual','TEXT'],
    ['epilepsia','INTEGER DEFAULT 0'],
    ['alteracao_hormonal','INTEGER DEFAULT 0'], ['hormonal_qual','TEXT'], ['hirsutismo','INTEGER DEFAULT 0'],
    ['gestante','INTEGER DEFAULT 0'], ['herpes','INTEGER DEFAULT 0'], ['lactante','INTEGER DEFAULT 0'],
    ['cor_olhos','TEXT'], ['cor_cabelos','TEXT'], ['cor_pelos','TEXT'],
    ['tomou_sol','INTEGER DEFAULT 0'], ['sol_quando','TEXT'],
    ['fitzpatrick','INTEGER DEFAULT 0'],
    ['termo_assinado','INTEGER DEFAULT 0'],
  ];
  novos.forEach(([col, tipo]) => {
    if (!cols.includes(col)) db.exec(`ALTER TABLE clientes ADD COLUMN ${col} ${tipo}`);
  });
}

module.exports = { getDb };