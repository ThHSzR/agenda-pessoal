-- ══════════════════════════════════════════════════════════════
-- RESET COMPLETO (apaga tudo e recria limpo)
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS cliente_procedimentos_interesse;
DROP TABLE IF EXISTS cliente_laser_regioes;
DROP TABLE IF EXISTS agendamentos;
DROP TABLE IF EXISTS laser_regioes;
DROP TABLE IF EXISTS procedimentos;
DROP TABLE IF EXISTS clientes;

-- ══════════════════════════════════════════════════════════════
-- TABELAS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE clientes (
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

CREATE TABLE procedimentos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  duracao_min INTEGER DEFAULT 60,
  valor       REAL DEFAULT 0,
  ativo       INTEGER DEFAULT 1,
  is_laser    INTEGER DEFAULT 0
);

CREATE TABLE agendamentos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id      INTEGER NOT NULL,
  procedimento_id INTEGER NOT NULL,
  data_hora       TEXT NOT NULL,
  status          TEXT DEFAULT 'agendado',
  valor_cobrado   REAL,
  observacoes     TEXT,
  criado_em TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
);

CREATE TABLE laser_regioes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  duracao_min INTEGER DEFAULT 30,
  valor       REAL DEFAULT 0,
  ativo       INTEGER DEFAULT 1
);

CREATE TABLE cliente_laser_regioes (
  cliente_id INTEGER NOT NULL,
  regiao_id  INTEGER NOT NULL,
  PRIMARY KEY (cliente_id, regiao_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (regiao_id)  REFERENCES laser_regioes(id)
);

CREATE TABLE cliente_procedimentos_interesse (
  cliente_id      INTEGER NOT NULL,
  procedimento_id INTEGER NOT NULL,
  PRIMARY KEY (cliente_id, procedimento_id),
  FOREIGN KEY (cliente_id)      REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
);

-- ══════════════════════════════════════════════════════════════
-- SEED: PROCEDIMENTOS
-- ══════════════════════════════════════════════════════════════

-- Único procedimento laser (is_laser=1, sem valor fixo — valor vem da região)
INSERT INTO procedimentos (nome, descricao, duracao_min, valor, is_laser) VALUES
  ('Depilação a Laser', 'Duração e valor variam conforme a região tratada', 30, 0, 1);

-- Demais procedimentos estéticos
INSERT INTO procedimentos (nome, descricao, duracao_min, valor) VALUES
  ('Limpeza de Pele',        'Higienização profunda facial',           60, 120),
  ('Peeling Facial',         'Renovação celular com ácidos',           45, 150),
  ('Drenagem Linfática',     'Massagem de drenagem corporal',          60, 100),
  ('Massagem Relaxante',     'Massagem terapêutica corporal',          60,  90),
  ('Design de Sobrancelhas', 'Modelagem e design de sobrancelhas',     30,  50),
  ('Microagulhamento',       'Estímulo de colágeno com microagulhas',  60, 250),
  ('Manicure e Pedicure',    'Cuidados com as unhas',                  60,  70),
  ('Radiofrequência',        'Tratamento de flacidez',                 45, 180),
  ('Bronzeamento',           'Bronzeamento artificial',                30,  80);

-- ══════════════════════════════════════════════════════════════
-- SEED: REGIÕES LASER
-- ══════════════════════════════════════════════════════════════

INSERT INTO laser_regioes (nome, duracao_min, valor) VALUES
  ('Buço',             20,   80),
  ('Axila',            20,   90),
  ('Virilha Simples',  30,  120),
  ('Virilha Completa', 40,  160),
  ('Meia Perna',       40,  150),
  ('Perna Inteira',    60,  220),
  ('Braço Completo',   50,  180),
  ('Antebraço',        30,  120),
  ('Abdômen',          30,  130),
  ('Lombar',           25,  110),
  ('Busto',            25,  110),
  ('Rosto Completo',   30,  140),
  ('Costas Completa',  60,  250),
  ('Glúteos',          30,  130),
  ('Corpo Inteiro',   180,  900);

-- ══════════════════════════════════════════════════════════════
-- SEED: CLIENTES DE TESTE
-- ══════════════════════════════════════════════════════════════

INSERT INTO clientes (nome, data_nascimento, cpf, celular, email, cidade, uf,
  cor_olhos, cor_cabelos, cor_pelos, fitzpatrick, metodo_dep_laser,
  termo_assinado, criado_em) VALUES
  ('Ana Lima',     '1995-03-12', '111.111.111-11', '(62) 99999-0001', 'ana@email.com',    'Goiânia', 'GO', 'Castanhos',    'Castanho escuro', 'Negros',         3, 1, 1, datetime('now','localtime')),
  ('Bruna Costa',  '1990-07-25', '222.222.222-22', '(62) 99999-0002', 'bruna@email.com',  'Goiânia', 'GO', 'Verdes',       'Loiros',           'Castanhos',      2, 1, 1, datetime('now','localtime')),
  ('Carla Mendes', '1988-11-08', '333.333.333-33', '(62) 99999-0003', 'carla@email.com',  'Goiânia', 'GO', 'Pretos',       'Pretos',           'Negros',         5, 1, 1, datetime('now','localtime')),
  ('Diana Souza',  '2000-01-30', '444.444.444-44', '(62) 99999-0004', 'diana@email.com',  'Goiânia', 'GO', 'Castanhos',    'Castanho claro',   'Castanhos',      3, 0, 1, datetime('now','localtime')),
  ('Elena Rocha',  '1997-06-15', '555.555.555-55', '(62) 99999-0005', 'elena@email.com',  'Goiânia', 'GO', 'Mel',          'Ruivos',           'Ruivos',         2, 1, 1, datetime('now','localtime'));

-- ══════════════════════════════════════════════════════════════
-- SEED: PROCEDIMENTOS DE INTERESSE DOS CLIENTES DE TESTE
-- ══════════════════════════════════════════════════════════════

-- Ana: laser + limpeza de pele
INSERT INTO cliente_procedimentos_interesse VALUES (1, 1), (1, 2);
-- Bruna: laser + massagem
INSERT INTO cliente_procedimentos_interesse VALUES (2, 1), (2, 4);
-- Carla: laser + peeling + radiofrequência
INSERT INTO cliente_procedimentos_interesse VALUES (3, 1), (3, 3), (3, 9);
-- Diana: limpeza + manicure (sem laser)
INSERT INTO cliente_procedimentos_interesse VALUES (4, 2), (4, 8);
-- Elena: laser + design sobrancelhas
INSERT INTO cliente_procedimentos_interesse VALUES (5, 1), (5, 6);

-- ══════════════════════════════════════════════════════════════
-- SEED: REGIÕES LASER DOS CLIENTES DE TESTE
-- ══════════════════════════════════════════════════════════════

-- Ana: axila + virilha simples
INSERT INTO cliente_laser_regioes VALUES (1, 2), (1, 3);
-- Bruna: buço + axila
INSERT INTO cliente_laser_regioes VALUES (2, 1), (2, 2);
-- Carla: perna inteira + virilha completa + glúteos
INSERT INTO cliente_laser_regioes VALUES (3, 6), (3, 4), (3, 14);
-- Elena: buço + rosto completo
INSERT INTO cliente_laser_regioes VALUES (5, 1), (5, 12);