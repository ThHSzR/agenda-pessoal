const Database = require('better-sqlite3');
const path     = require('path');

let db;

function getDb() {
  if (!db) {
    db = new Database(path.join(__dirname, '..', 'clinica.db'));
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario   TEXT NOT NULL UNIQUE,
      senha     TEXT NOT NULL,
      is_admin  INTEGER NOT NULL DEFAULT 0,
      cargo     TEXT DEFAULT 'operador',
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL, data_nascimento TEXT, cpf TEXT, email TEXT,
      telefone TEXT, celular TEXT, endereco TEXT, cidade TEXT, uf TEXT,
      areas_tratar TEXT,
      metodo_dep_cera INTEGER DEFAULT 0, metodo_dep_lamina INTEGER DEFAULT 0,
      metodo_dep_laser INTEGER DEFAULT 0, prob_encravamento INTEGER DEFAULT 0,
      prob_manchas INTEGER DEFAULT 0, prob_outros TEXT,
      medicamento_uso INTEGER DEFAULT 0, medicamento_qual TEXT,
      roacutan INTEGER DEFAULT 0, tto_vitiligo INTEGER DEFAULT 0,
      alergia_medicamento INTEGER DEFAULT 0, alergia_qual TEXT,
      tratamento_dermato INTEGER DEFAULT 0, tratamento_dermato_qual TEXT,
      usa_acidos INTEGER DEFAULT 0, cirurgia INTEGER DEFAULT 0, cirurgia_qual TEXT,
      anticoncepcional INTEGER DEFAULT 0, anticoncepcional_qual TEXT,
      historico_oncologico INTEGER DEFAULT 0, oncologico_qual TEXT,
      acompanhamento_medico INTEGER DEFAULT 0, acompanhamento_qual TEXT,
      epilepsia INTEGER DEFAULT 0, alteracao_hormonal INTEGER DEFAULT 0,
      hormonal_qual TEXT, hirsutismo INTEGER DEFAULT 0,
      gestante INTEGER DEFAULT 0, herpes INTEGER DEFAULT 0, lactante INTEGER DEFAULT 0,
      cor_olhos TEXT, cor_cabelos TEXT, cor_pelos TEXT,
      tomou_sol INTEGER DEFAULT 0, sol_quando TEXT,
      fitzpatrick INTEGER DEFAULT 0, termo_assinado INTEGER DEFAULT 0,
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS procedimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL, descricao TEXT,
      duracao_min INTEGER DEFAULT 60, valor REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1, is_laser INTEGER DEFAULT 0,
      tem_variantes INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS procedimento_variantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      procedimento_id INTEGER NOT NULL, nome TEXT NOT NULL,
      descricao TEXT, duracao_min INTEGER DEFAULT 30,
      valor REAL DEFAULT 0, ativo INTEGER DEFAULT 1,
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL, procedimento_id INTEGER NOT NULL,
      variante_id INTEGER, data_hora TEXT NOT NULL,
      status TEXT DEFAULT 'agendado', valor_cobrado REAL, observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id),
      FOREIGN KEY (variante_id)     REFERENCES procedimento_variantes(id)
    );
    CREATE TABLE IF NOT EXISTS cliente_variantes_interesse (
      cliente_id INTEGER NOT NULL, variante_id INTEGER NOT NULL,
      PRIMARY KEY (cliente_id, variante_id),
      FOREIGN KEY (cliente_id)  REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (variante_id) REFERENCES procedimento_variantes(id)
    );
    CREATE TABLE IF NOT EXISTS cliente_procedimentos_interesse (
      cliente_id INTEGER NOT NULL, procedimento_id INTEGER NOT NULL,
      PRIMARY KEY (cliente_id, procedimento_id),
      FOREIGN KEY (cliente_id)      REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
    );
  `);

  // ── migrações usuarios ────────────────────────────────────
  const colsUser = db.prepare('PRAGMA table_info(usuarios)').all().map(c => c.name);
  if (!colsUser.includes('is_admin'))
    db.exec('ALTER TABLE usuarios ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
  if (!colsUser.includes('criado_em'))
    db.exec('ALTER TABLE usuarios ADD COLUMN criado_em TEXT DEFAULT NULL');
  if (!colsUser.includes('cargo'))
    db.exec("ALTER TABLE usuarios ADD COLUMN cargo TEXT DEFAULT 'operador'");

  // garante sempre ao menos 1 admin
  const totalAdmins = db.prepare('SELECT COUNT(*) as n FROM usuarios WHERE is_admin=1').get().n;
  if (totalAdmins === 0) {
    const primeiro = db.prepare('SELECT id FROM usuarios ORDER BY id LIMIT 1').get();
    if (primeiro)
      db.prepare('UPDATE usuarios SET is_admin=1, cargo=? WHERE id=?').run('admin', primeiro.id);
  }
  // sincroniza cargo dos admins existentes que ainda estão como 'operador'
  db.prepare("UPDATE usuarios SET cargo='admin' WHERE is_admin=1 AND (cargo IS NULL OR cargo='operador')").run();

  // ── migrações clientes ────────────────────────────────────
  const colsCli = db.prepare('PRAGMA table_info(clientes)').all().map(c => c.name);
  [
    ['celular','TEXT'], ['endereco','TEXT'], ['cidade','TEXT'], ['uf','TEXT'],
    ['areas_tratar','TEXT'], ['metodo_dep_cera','INTEGER DEFAULT 0'],
    ['metodo_dep_lamina','INTEGER DEFAULT 0'], ['metodo_dep_laser','INTEGER DEFAULT 0'],
    ['prob_encravamento','INTEGER DEFAULT 0'], ['prob_manchas','INTEGER DEFAULT 0'],
    ['prob_outros','TEXT'], ['medicamento_uso','INTEGER DEFAULT 0'],
    ['medicamento_qual','TEXT'], ['roacutan','INTEGER DEFAULT 0'],
    ['tto_vitiligo','INTEGER DEFAULT 0'], ['alergia_medicamento','INTEGER DEFAULT 0'],
    ['alergia_qual','TEXT'], ['tratamento_dermato','INTEGER DEFAULT 0'],
    ['tratamento_dermato_qual','TEXT'], ['usa_acidos','INTEGER DEFAULT 0'],
    ['cirurgia','INTEGER DEFAULT 0'], ['cirurgia_qual','TEXT'],
    ['anticoncepcional','INTEGER DEFAULT 0'], ['anticoncepcional_qual','TEXT'],
    ['historico_oncologico','INTEGER DEFAULT 0'], ['oncologico_qual','TEXT'],
    ['acompanhamento_medico','INTEGER DEFAULT 0'], ['acompanhamento_qual','TEXT'],
    ['epilepsia','INTEGER DEFAULT 0'], ['alteracao_hormonal','INTEGER DEFAULT 0'],
    ['hormonal_qual','TEXT'], ['hirsutismo','INTEGER DEFAULT 0'],
    ['gestante','INTEGER DEFAULT 0'], ['herpes','INTEGER DEFAULT 0'],
    ['lactante','INTEGER DEFAULT 0'], ['cor_olhos','TEXT'], ['cor_cabelos','TEXT'],
    ['cor_pelos','TEXT'], ['tomou_sol','INTEGER DEFAULT 0'], ['sol_quando','TEXT'],
    ['fitzpatrick','INTEGER DEFAULT 0'], ['termo_assinado','INTEGER DEFAULT 0'],
    ['observacoes','TEXT'],
  ].forEach(([col, tipo]) => {
    if (!colsCli.includes(col))
      db.exec(`ALTER TABLE clientes ADD COLUMN ${col} ${tipo}`);
  });

  // ── migrações procedimentos ───────────────────────────────
  const colsProc = db.prepare('PRAGMA table_info(procedimentos)').all().map(c => c.name);
  [['is_laser','INTEGER DEFAULT 0'], ['tem_variantes','INTEGER DEFAULT 0']]
    .forEach(([col, tipo]) => {
      if (!colsProc.includes(col)) db.exec(`ALTER TABLE procedimentos ADD COLUMN ${col} ${tipo}`);
    });

  // ── migrações agendamentos ────────────────────────────────
  const colsAgend = db.prepare('PRAGMA table_info(agendamentos)').all().map(c => c.name);
  if (!colsAgend.includes('variante_id'))
    db.exec('ALTER TABLE agendamentos ADD COLUMN variante_id INTEGER');
}

module.exports = { getDb };