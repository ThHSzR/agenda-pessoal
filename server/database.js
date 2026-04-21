const Database = require('better-sqlite3');
const path     = require('path');

let db;

function getDb() {
  if (!db) {
    db = new Database(path.join(__dirname, '..', 'clinica.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

/* ══════════════════════════════════════════════════════════════
   SCHEMA PRINCIPAL — tabelas criadas se não existirem
   ══════════════════════════════════════════════════════════════ */
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

    CREATE TABLE IF NOT EXISTS bloqueios_horario (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo     TEXT NOT NULL DEFAULT 'Bloqueado',
      data_hora_inicio TEXT NOT NULL,
      data_hora_fim    TEXT NOT NULL,
      motivo     TEXT,
      recorrente INTEGER DEFAULT 0,
      criado_em  TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS log_atividades (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      acao       TEXT NOT NULL,
      entidade   TEXT,
      entidade_id INTEGER,
      detalhes   TEXT,
      criado_em  TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  /* ══════════════════════════════════════════════════════════════
     MIGRAÇÕES — adicionam colunas/tabelas faltantes em bancos antigos
     ══════════════════════════════════════════════════════════════ */

  // ── Helpers ──────────────────────────────────────────────────
  function tableColumns(table) {
    return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  }
  function addColIfMissing(table, col, tipo) {
    if (!tableColumns(table).includes(col))
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${tipo}`);
  }

  // ── usuarios ────────────────────────────────────────────────
  addColIfMissing('usuarios', 'is_admin',  'INTEGER NOT NULL DEFAULT 0');
  addColIfMissing('usuarios', 'criado_em', 'TEXT DEFAULT NULL');
  addColIfMissing('usuarios', 'cargo',     "TEXT DEFAULT 'operador'");

  const totalAdmins = db.prepare('SELECT COUNT(*) as n FROM usuarios WHERE is_admin=1').get().n;
  if (totalAdmins === 0) {
    const primeiro = db.prepare('SELECT id FROM usuarios ORDER BY id LIMIT 1').get();
    if (primeiro)
      db.prepare('UPDATE usuarios SET is_admin=1, cargo=? WHERE id=?').run('admin', primeiro.id);
  }
  db.prepare("UPDATE usuarios SET cargo='admin' WHERE is_admin=1 AND (cargo IS NULL OR cargo='operador')").run();

  // ── clientes ────────────────────────────────────────────────
  const clienteCols = [
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
  ];
  clienteCols.forEach(([col, tipo]) => addColIfMissing('clientes', col, tipo));

  // ── procedimentos ──────────────────────────────────────────
  addColIfMissing('procedimentos', 'is_laser',      'INTEGER DEFAULT 0');
  addColIfMissing('procedimentos', 'tem_variantes', 'INTEGER DEFAULT 0');

  // ── agendamentos ───────────────────────────────────────────
  addColIfMissing('agendamentos', 'variante_id', 'INTEGER');

  // Migração ROBUSTA: tornar procedimento_id nullable em bancos antigos
  // SQLite não suporta ALTER COLUMN — recriamos a tabela com mapeamento explícito
  const procIdCol = db.prepare('PRAGMA table_info(agendamentos)').all()
    .find(c => c.name === 'procedimento_id');
  if (procIdCol && procIdCol.notnull === 1) {
    console.log('⚙️ Migrando tabela agendamentos: tornando procedimento_id nullable...');
    try {
      // Desabilitar foreign keys durante a migration (SQLite exige isso para ALTER TABLE)
      db.pragma('foreign_keys = OFF');

      // Pega as colunas reais da tabela antiga
      const oldCols = tableColumns('agendamentos');
      // Colunas do schema novo
      const newCols = ['id','cliente_id','procedimento_id','variante_id','data_hora',
                       'status','valor_cobrado','observacoes','criado_em'];
      // Interseção: colunas que existem em ambos
      const commonCols = newCols.filter(c => oldCols.includes(c));
      const colList = commonCols.join(', ');

      db.exec(`
        CREATE TABLE agendamentos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cliente_id INTEGER NOT NULL,
          procedimento_id INTEGER,
          variante_id INTEGER,
          data_hora TEXT NOT NULL,
          status TEXT DEFAULT 'agendado',
          valor_cobrado REAL,
          observacoes TEXT,
          criado_em TEXT DEFAULT (datetime('now','localtime'))
        );
        INSERT INTO agendamentos_new (${colList}) SELECT ${colList} FROM agendamentos;
        DROP TABLE agendamentos;
        ALTER TABLE agendamentos_new RENAME TO agendamentos;
      `);
      console.log('✅ Tabela agendamentos migrada com sucesso.');

      // Reabilitar foreign keys
      db.pragma('foreign_keys = ON');
    } catch (e) {
      console.error('⚠️ Erro na migração de agendamentos:', e.message);
      // Limpa tabela temporária se ficou pendurada
      try { db.exec('DROP TABLE IF EXISTS agendamentos_new'); } catch (_) {}
      // Reabilitar foreign keys mesmo em caso de erro
      db.pragma('foreign_keys = ON');
    }
  }

  // ── backfill legados para agendamento_procedimentos ─────────
  try {
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
  } catch (e) {
    console.warn('⚠️ Backfill legados:', e.message);
  }

  // ── promocao_usos (bancos antigos sem a tabela) ─────────────
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

  // ── bloqueios_horario (bancos antigos sem a tabela) ─────────
  try {
    db.prepare('SELECT 1 FROM bloqueios_horario LIMIT 1').get();
  } catch (_) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bloqueios_horario (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo     TEXT NOT NULL DEFAULT 'Bloqueado',
        data_hora_inicio TEXT NOT NULL,
        data_hora_fim    TEXT NOT NULL,
        motivo     TEXT,
        recorrente INTEGER DEFAULT 0,
        criado_em  TEXT DEFAULT (datetime('now','localtime'))
      )
    `);
    console.log('✅ Tabela bloqueios_horario criada via migration.');
  }

  // ── log_atividades (bancos antigos sem a tabela) ────────────
  try {
    db.prepare('SELECT 1 FROM log_atividades LIMIT 1').get();
  } catch (_) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS log_atividades (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        acao       TEXT NOT NULL,
        entidade   TEXT,
        entidade_id INTEGER,
        detalhes   TEXT,
        criado_em  TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('✅ Tabela log_atividades criada via migration.');
  }
}

module.exports = { getDb };
