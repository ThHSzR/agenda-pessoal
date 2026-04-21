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
      cliente_id INTEGER NOT NULL,
      procedimento_id INTEGER,
      variante_id INTEGER,
      data_hora TEXT NOT NULL,
      status TEXT DEFAULT 'agendado',
      valor_cobrado REAL,
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id),
      FOREIGN KEY (variante_id)     REFERENCES procedimento_variantes(id)
    );
    CREATE TABLE IF NOT EXISTS agendamento_procedimentos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      agendamento_id  INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      variante_id     INTEGER,
      valor           REAL DEFAULT 0,
      duracao_min     INTEGER DEFAULT 0,
      FOREIGN KEY (agendamento_id)  REFERENCES agendamentos(id) ON DELETE CASCADE,
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
    CREATE TABLE IF NOT EXISTS promocoes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT NOT NULL,
      tipo_desconto   TEXT NOT NULL DEFAULT 'percentual',
      valor_desconto  REAL NOT NULL DEFAULT 0,
      modo_itens      TEXT NOT NULL DEFAULT 'lista_fechada',
      quantidade_min  INTEGER,
      ativa           INTEGER NOT NULL DEFAULT 1,
      data_inicio     TEXT,
      data_fim        TEXT,
      dias_semana     TEXT DEFAULT '[]',
      limite_usos     INTEGER,
      usos            INTEGER NOT NULL DEFAULT 0,
      criado_em       TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS promocao_regras (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      promocao_id     INTEGER NOT NULL,
      tipo_regra      TEXT NOT NULL,
      procedimento_id INTEGER,
      variante_id     INTEGER,
      quantidade      INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (promocao_id)     REFERENCES promocoes(id) ON DELETE CASCADE,
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id),
      FOREIGN KEY (variante_id)     REFERENCES procedimento_variantes(id)
    );
    CREATE TABLE IF NOT EXISTS promocao_usos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      promocao_id       INTEGER NOT NULL,
      agendamento_id    INTEGER NOT NULL,
      desconto_aplicado REAL NOT NULL DEFAULT 0,
      criado_em         TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (promocao_id)    REFERENCES promocoes(id) ON DELETE CASCADE,
      FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
    );
  `);

  // ── migrações usuarios ──────────────────────────────────────────
  const colsUser = db.prepare('PRAGMA table_info(usuarios)').all().map(c => c.name);
  if (!colsUser.includes('is_admin'))
    db.exec('ALTER TABLE usuarios ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
  if (!colsUser.includes('criado_em'))
    db.exec('ALTER TABLE usuarios ADD COLUMN criado_em TEXT DEFAULT NULL');
  if (!colsUser.includes('cargo'))
    db.exec("ALTER TABLE usuarios ADD COLUMN cargo TEXT DEFAULT 'operador'");

  const totalAdmins = db.prepare('SELECT COUNT(*) as n FROM usuarios WHERE is_admin=1').get().n;
  if (totalAdmins === 0) {
    const primeiro = db.prepare('SELECT id FROM usuarios ORDER BY id LIMIT 1').get();
    if (primeiro)
      db.prepare('UPDATE usuarios SET is_admin=1, cargo=? WHERE id=?').run('admin', primeiro.id);
  }
  db.prepare("UPDATE usuarios SET cargo='admin' WHERE is_admin=1 AND (cargo IS NULL OR cargo='operador')").run();

  // ── migrações clientes ──────────────────────────────────────────
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

  // ── migrações procedimentos ───────────────────────────────────────
  const colsProc = db.prepare('PRAGMA table_info(procedimentos)').all().map(c => c.name);
  [['is_laser','INTEGER DEFAULT 0'], ['tem_variantes','INTEGER DEFAULT 0']]
    .forEach(([col, tipo]) => {
      if (!colsProc.includes(col)) db.exec(`ALTER TABLE procedimentos ADD COLUMN ${col} ${tipo}`);
    });

  // ── migrações agendamentos ───────────────────────────────────────
  const colsAgend = db.prepare('PRAGMA table_info(agendamentos)').all().map(c => c.name);
  if (!colsAgend.includes('variante_id'))
    db.exec('ALTER TABLE agendamentos ADD COLUMN variante_id INTEGER');

  // ── migra dados legados para agendamento_procedimentos ───────────────
  const legados = db.prepare(`
    SELECT a.id, a.procedimento_id, a.variante_id, a.valor_cobrado,
           COALESCE(v.duracao_min, p.duracao_min, 0) as duracao_min
    FROM agendamentos a
    JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
    WHERE a.procedimento_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM agendamento_procedimentos ap
        WHERE ap.agendamento_id = a.id
      )
  `).all();

  // ── migração promocao_usos (bancos antigos sem a tabela) ─────────
  try {
    db.prepare('SELECT 1 FROM promocao_usos LIMIT 1').get();
  } catch (_) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS promocao_usos (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        promocao_id       INTEGER NOT NULL,
        agendamento_id    INTEGER NOT NULL,
        desconto_aplicado REAL NOT NULL DEFAULT 0,
        criado_em         TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (promocao_id)    REFERENCES promocoes(id) ON DELETE CASCADE,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela promocao_usos criada via migration.');
  }

  if (legados.length > 0) {
    const ins = db.prepare(`
      INSERT INTO agendamento_procedimentos (agendamento_id, procedimento_id, variante_id, valor, duracao_min)
      VALUES (?, ?, ?, ?, ?)
    `);
    const migrar = db.transaction(() => {
      legados.forEach(row => {
        ins.run(row.id, row.procedimento_id, row.variante_id || null,
                row.valor_cobrado || 0, row.duracao_min || 0);
      });
    });
    migrar();
    console.log(`✅ Migrados ${legados.length} agendamento(s) legado(s) para agendamento_procedimentos.`);
  }
}

module.exports = { getDb };