const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function getDb() {
  if (!db) {
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