const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDb() {
  if (!db) {
    const { app } = require('electron');
    const dbPath = path.join(app.getPath('userData'), 'clinica.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {

  // ─── TABELAS ─────────────────────────────────────────────────
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
      medicamento_uso         INTEGER DEFAULT 0,
      medicamento_qual        TEXT,
      roacutan                INTEGER DEFAULT 0,
      tto_vitiligo            INTEGER DEFAULT 0,
      alergia_medicamento     INTEGER DEFAULT 0,
      alergia_qual            TEXT,
      tratamento_dermato      INTEGER DEFAULT 0,
      tratamento_dermato_qual TEXT,
      usa_acidos              INTEGER DEFAULT 0,
      cirurgia                INTEGER DEFAULT 0,
      cirurgia_qual           TEXT,
      anticoncepcional        INTEGER DEFAULT 0,
      anticoncepcional_qual   TEXT,
      historico_oncologico    INTEGER DEFAULT 0,
      oncologico_qual         TEXT,
      acompanhamento_medico   INTEGER DEFAULT 0,
      acompanhamento_qual     TEXT,
      epilepsia               INTEGER DEFAULT 0,
      alteracao_hormonal      INTEGER DEFAULT 0,
      hormonal_qual           TEXT,
      hirsutismo              INTEGER DEFAULT 0,
      gestante                INTEGER DEFAULT 0,
      herpes                  INTEGER DEFAULT 0,
      lactante                INTEGER DEFAULT 0,
      cor_olhos       TEXT,
      cor_cabelos     TEXT,
      cor_pelos       TEXT,
      tomou_sol       INTEGER DEFAULT 0,
      sol_quando      TEXT,
      fitzpatrick     INTEGER DEFAULT 0,
      termo_assinado  INTEGER DEFAULT 0,
      observacoes     TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS procedimentos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT NOT NULL,
      descricao   TEXT,
      duracao_min INTEGER DEFAULT 60,
      valor       REAL DEFAULT 0,
      ativo       INTEGER DEFAULT 1,
      is_laser    INTEGER DEFAULT 0,
      tem_variantes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS procedimento_variantes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      procedimento_id INTEGER NOT NULL,
      nome            TEXT NOT NULL,
      descricao       TEXT,
      duracao_min     INTEGER DEFAULT 30,
      valor           REAL DEFAULT 0,
      ativo           INTEGER DEFAULT 1,
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id      INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      variante_id     INTEGER,
      data_hora       TEXT NOT NULL,
      status          TEXT DEFAULT 'agendado',
      valor_cobrado   REAL,
      observacoes     TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id),
      FOREIGN KEY (variante_id)     REFERENCES procedimento_variantes(id)
    );

    CREATE TABLE IF NOT EXISTS cliente_variantes_interesse (
      cliente_id  INTEGER NOT NULL,
      variante_id INTEGER NOT NULL,
      PRIMARY KEY (cliente_id, variante_id),
      FOREIGN KEY (cliente_id)  REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (variante_id) REFERENCES procedimento_variantes(id)
    );

    CREATE TABLE IF NOT EXISTS cliente_procedimentos_interesse (
      cliente_id      INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      PRIMARY KEY (cliente_id, procedimento_id),
      FOREIGN KEY (cliente_id)      REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
    );
  `);

  // ─── MIGRAÇÕES SEGURAS ───────────────────────────────────────

  // clientes
  const colsCli = db.prepare('PRAGMA table_info(clientes)').all().map(c => c.name);
  [
    ['celular','TEXT'], ['endereco','TEXT'], ['cidade','TEXT'], ['uf','TEXT'],
    ['areas_tratar','TEXT'],
    ['metodo_dep_cera','INTEGER DEFAULT 0'], ['metodo_dep_lamina','INTEGER DEFAULT 0'],
    ['metodo_dep_laser','INTEGER DEFAULT 0'],
    ['prob_encravamento','INTEGER DEFAULT 0'], ['prob_manchas','INTEGER DEFAULT 0'],
    ['prob_outros','TEXT'],
    ['medicamento_uso','INTEGER DEFAULT 0'], ['medicamento_qual','TEXT'],
    ['roacutan','INTEGER DEFAULT 0'], ['tto_vitiligo','INTEGER DEFAULT 0'],
    ['alergia_medicamento','INTEGER DEFAULT 0'], ['alergia_qual','TEXT'],
    ['tratamento_dermato','INTEGER DEFAULT 0'], ['tratamento_dermato_qual','TEXT'],
    ['usa_acidos','INTEGER DEFAULT 0'],
    ['cirurgia','INTEGER DEFAULT 0'], ['cirurgia_qual','TEXT'],
    ['anticoncepcional','INTEGER DEFAULT 0'], ['anticoncepcional_qual','TEXT'],
    ['historico_oncologico','INTEGER DEFAULT 0'], ['oncologico_qual','TEXT'],
    ['acompanhamento_medico','INTEGER DEFAULT 0'], ['acompanhamento_qual','TEXT'],
    ['epilepsia','INTEGER DEFAULT 0'],
    ['alteracao_hormonal','INTEGER DEFAULT 0'], ['hormonal_qual','TEXT'],
    ['hirsutismo','INTEGER DEFAULT 0'],
    ['gestante','INTEGER DEFAULT 0'], ['herpes','INTEGER DEFAULT 0'],
    ['lactante','INTEGER DEFAULT 0'],
    ['cor_olhos','TEXT'], ['cor_cabelos','TEXT'], ['cor_pelos','TEXT'],
    ['tomou_sol','INTEGER DEFAULT 0'], ['sol_quando','TEXT'],
    ['fitzpatrick','INTEGER DEFAULT 0'], ['termo_assinado','INTEGER DEFAULT 0'],
    ['observacoes','TEXT'],
  ].forEach(([col, tipo]) => {
    if (!colsCli.includes(col))
      db.exec(`ALTER TABLE clientes ADD COLUMN ${col} ${tipo}`);
  });

  // procedimentos
  const colsProc = db.prepare('PRAGMA table_info(procedimentos)').all().map(c => c.name);
  [
    ['is_laser','INTEGER DEFAULT 0'],
    ['tem_variantes','INTEGER DEFAULT 0'],
  ].forEach(([col, tipo]) => {
    if (!colsProc.includes(col))
      db.exec(`ALTER TABLE procedimentos ADD COLUMN ${col} ${tipo}`);
  });

  // agendamentos
  const colsAgend = db.prepare('PRAGMA table_info(agendamentos)').all().map(c => c.name);
  if (!colsAgend.includes('variante_id'))
    db.exec('ALTER TABLE agendamentos ADD COLUMN variante_id INTEGER');

  // migração: laser_regioes → procedimento_variantes
  const temTabelaLaser = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='laser_regioes'"
  ).get();
  if (temTabelaLaser) {
    const laserProc = db.prepare("SELECT id FROM procedimentos WHERE is_laser=1 LIMIT 1").get();
    if (laserProc) {
      const jasMigradas = db.prepare(
        'SELECT COUNT(*) as n FROM procedimento_variantes WHERE procedimento_id=?'
      ).get(laserProc.id).n;
      if (jasMigradas === 0) {
        const regioes = db.prepare('SELECT * FROM laser_regioes').all();
        const ins = db.prepare(`
          INSERT INTO procedimento_variantes (procedimento_id, nome, descricao, duracao_min, valor, ativo)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        regioes.forEach(r => ins.run(laserProc.id, r.nome, null, r.duracao_min, r.valor, r.ativo));

        // migra cliente_laser_regioes → cliente_variantes_interesse
        const mapa = {};
        regioes.forEach(r => {
          const v = db.prepare(
            'SELECT id FROM procedimento_variantes WHERE procedimento_id=? AND nome=? LIMIT 1'
          ).get(laserProc.id, r.nome);
          if (v) mapa[r.id] = v.id;
        });
        const clr = db.prepare('SELECT * FROM cliente_laser_regioes').all();
        const insCV = db.prepare(
          'INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)'
        );
        clr.forEach(row => {
          if (mapa[row.regiao_id]) insCV.run(row.cliente_id, mapa[row.regiao_id]);
        });
      }
    }
    // marca laser como tem_variantes=1
    db.prepare('UPDATE procedimentos SET tem_variantes=1 WHERE is_laser=1').run();
  }

  // ─── SEED: procedimentos ─────────────────────────────────────
  const laserExiste = db.prepare('SELECT id FROM procedimentos WHERE is_laser=1 LIMIT 1').get();
  if (!laserExiste) {
    const r = db.prepare(`
      INSERT INTO procedimentos (nome, descricao, duracao_min, valor, is_laser, tem_variantes)
      VALUES ('Depilação a Laser','Duração e valor variam conforme a região tratada', 30, 0, 1, 1)
    `).run();
    // seed das variantes laser
    const ins = db.prepare(`
      INSERT INTO procedimento_variantes (procedimento_id, nome, duracao_min, valor) VALUES (?,?,?,?)
    `);
    [
      ['Buço',             20,   80],
      ['Axila',            20,   90],
      ['Virilha Simples',  30,  120],
      ['Virilha Completa', 40,  160],
      ['Meia Perna',       40,  150],
      ['Perna Inteira',    60,  220],
      ['Braço Completo',   50,  180],
      ['Antebraço',        30,  120],
      ['Abdômen',          30,  130],
      ['Lombar',           25,  110],
      ['Busto',            25,  110],
      ['Rosto Completo',   30,  140],
      ['Costas Completa',  60,  250],
      ['Glúteos',          30,  130],
      ['Corpo Inteiro',   180,  900],
    ].forEach(([n, d, v]) => ins.run(r.lastInsertRowid, n, d, v));
  }

  const totalOutros = db.prepare(
    'SELECT COUNT(*) as n FROM procedimentos WHERE ativo=1 AND is_laser=0'
  ).get().n;
  if (totalOutros === 0) {
    const ins = db.prepare(
      'INSERT INTO procedimentos (nome, descricao, duracao_min, valor) VALUES (?,?,?,?)'
    );
    [
      ['Limpeza de Pele',        'Higienização profunda facial',          60, 120],
      ['Peeling Facial',         'Renovação celular com ácidos',          45, 150],
      ['Drenagem Linfática',     'Massagem de drenagem corporal',         60, 100],
      ['Massagem Relaxante',     'Massagem terapêutica corporal',         60,  90],
      ['Design de Sobrancelhas', 'Modelagem e design de sobrancelhas',    30,  50],
      ['Microagulhamento',       'Estímulo de colágeno com microagulhas', 60, 250],
      ['Manicure e Pedicure',    'Cuidados com as unhas',                 60,  70],
      ['Radiofrequência',        'Tratamento de flacidez',                45, 180],
      ['Bronzeamento',           'Bronzeamento artificial',               30,  80],
    ].forEach(([n, d, dur, v]) => ins.run(n, d, dur, v));
  }
}

module.exports = { getDb };