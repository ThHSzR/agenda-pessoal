const express   = require('express');
const session   = require('express-session');
const bcrypt    = require('bcryptjs');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./server/database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SSE Log em tempo real ─────────────────────────────────────
const sseClients = new Set();

function sseLog(nivel, ...args) {
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  const linha = `[${new Date().toLocaleTimeString('pt-BR')}] [${nivel.toUpperCase()}] ${msg}`;
  console.log(linha);
  for (const res of sseClients) {
    try { res.write(`data: ${JSON.stringify({ nivel, msg: linha })}\n\n`); } catch (_) {}
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// Middleware de log de todas as requisições API
app.use('/api', (req, _res, next) => {
  sseLog('info', `→ ${req.method} ${req.path}`, req.method !== 'GET' ? req.body : '');
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-troque-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true, legacyHeaders: false,
});

function auth(req, res, next) {
  if (req.session?.logado) return next();
  res.status(401).json({ erro: 'Não autenticado' });
}
function authAdmin(req, res, next) {
  if (req.session?.logado && req.session?.is_admin) return next();
  res.status(403).json({ erro: 'Acesso negado' });
}
function authGerente(req, res, next) {
  if (req.session?.logado && (req.session?.is_admin || req.session?.cargo === 'gerente')) return next();
  res.status(403).json({ erro: 'Acesso negado' });
}

// ── SSE endpoint ──────────────────────────────────────────────
app.get('/api/logs/stream', authAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ nivel: 'info', msg: '✅ Log conectado.' })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/login', loginLimiter, (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha)
    return res.status(400).json({ erro: 'Preencha usuário e senha' });
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n;
  if (total === 0) {
    db.prepare('INSERT INTO usuarios (usuario, senha, is_admin, cargo) VALUES (?,?,1,?)')
      .run('admin', bcrypt.hashSync('admin123', 12), 'admin');
  }
  const user = db.prepare('SELECT * FROM usuarios WHERE usuario=?').get(usuario);
  if (!user || !bcrypt.compareSync(senha, user.senha))
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ erro: 'Erro interno' });
    req.session.logado   = true;
    req.session.usuario  = user.usuario;
    req.session.is_admin = !!user.is_admin;
    req.session.cargo    = user.cargo || 'operador';
    res.json({ ok: true, is_admin: !!user.is_admin, cargo: req.session.cargo });
  });
});

app.post('/api/logout', auth, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (req.session?.logado)
    return res.json({ usuario: req.session.usuario, is_admin: !!req.session.is_admin, cargo: req.session.cargo || 'operador' });
  res.status(401).json({ erro: 'Não autenticado' });
});

// ── USUÁRIOS ──────────────────────────────────────────────────
app.get('/api/usuarios', authAdmin, (req, res) => {
  res.json(getDb().prepare('SELECT id, usuario, is_admin, cargo FROM usuarios ORDER BY usuario').all());
});
app.post('/api/usuarios', authAdmin, (req, res) => {
  const { usuario, senha, is_admin, cargo } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  if (senha.length < 6)   return res.status(400).json({ erro: 'Senha mínima: 6 caracteres' });
  const db = getDb();
  if (db.prepare('SELECT id FROM usuarios WHERE usuario=?').get(usuario))
    return res.status(409).json({ erro: 'Usuário já existe' });
  const cargoFinal = is_admin ? 'admin' : (cargo === 'gerente' ? 'gerente' : 'operador');
  const r = db.prepare('INSERT INTO usuarios (usuario, senha, is_admin, cargo) VALUES (?,?,?,?)')
    .run(usuario, bcrypt.hashSync(senha, 12), is_admin ? 1 : 0, cargoFinal);
  res.json({ id: r.lastInsertRowid });
});
app.patch('/api/usuarios/:id/senha', authAdmin, (req, res) => {
  const { senha } = req.body;
  if (!senha || senha.length < 6) return res.status(400).json({ erro: 'Senha mínima: 6 caracteres' });
  getDb().prepare('UPDATE usuarios SET senha=? WHERE id=?').run(bcrypt.hashSync(senha, 12), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/usuarios/:id', authAdmin, (req, res) => {
  const db = getDb();
  const alvo = db.prepare('SELECT usuario, is_admin FROM usuarios WHERE id=?').get(req.params.id);
  if (!alvo) return res.status(404).json({ erro: 'Não encontrado' });
  if (alvo.usuario === req.session.usuario)
    return res.status(400).json({ erro: 'Você não pode excluir sua própria conta' });
  if (alvo.is_admin && db.prepare('SELECT COUNT(*) as n FROM usuarios WHERE is_admin=1').get().n <= 1)
    return res.status(400).json({ erro: 'Não é possível remover o único administrador' });
  db.prepare('DELETE FROM usuarios WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── CLIENTES ──────────────────────────────────────────────────
app.get('/api/clientes', auth, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM clientes ORDER BY nome').all());
});
app.get('/api/clientes/:id', auth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM clientes WHERE id=?').get(req.params.id);
  row ? res.json(row) : res.status(404).json({ erro: 'Não encontrado' });
});
app.post('/api/clientes', auth, (req, res) => {
  const db = getDb(), d = req.body;
  const fields = [
    'nome','data_nascimento','cpf','email','telefone','celular','endereco','cidade','uf',
    'areas_tratar','metodo_dep_cera','metodo_dep_lamina','metodo_dep_laser',
    'prob_encravamento','prob_manchas','prob_outros',
    'medicamento_uso','medicamento_qual','roacutan','tto_vitiligo',
    'alergia_medicamento','alergia_qual','tratamento_dermato','tratamento_dermato_qual','usa_acidos',
    'cirurgia','cirurgia_qual','anticoncepcional','anticoncepcional_qual',
    'historico_oncologico','oncologico_qual','acompanhamento_medico','acompanhamento_qual',
    'epilepsia','alteracao_hormonal','hormonal_qual','hirsutismo',
    'gestante','herpes','lactante','cor_olhos','cor_cabelos','cor_pelos',
    'tomou_sol','sol_quando','fitzpatrick','termo_assinado','observacoes'
  ];
  const vals = fields.map(f => d[f] !== undefined ? d[f] : null);
  if (d.id) {
    db.prepare(`UPDATE clientes SET ${fields.map(f=>`${f}=?`).join(',')} WHERE id=?`).run(...vals, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare(`INSERT INTO clientes (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...vals);
    res.json({ id: r.lastInsertRowid });
  }
});
app.delete('/api/clientes/:id', auth, (req, res) => {
  getDb().prepare('DELETE FROM clientes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── PROCEDIMENTOS ─────────────────────────────────────────────
app.get('/api/procedimentos', auth, (req, res) => {
  const sql = req.query.todos === '1'
    ? 'SELECT * FROM procedimentos ORDER BY nome'
    : 'SELECT * FROM procedimentos WHERE ativo=1 ORDER BY nome';
  res.json(getDb().prepare(sql).all());
});
app.post('/api/procedimentos', authGerente, (req, res) => {
  const db = getDb(), d = req.body;
  if (d.id) {
    db.prepare('UPDATE procedimentos SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=?,is_laser=?,tem_variantes=? WHERE id=?')
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo??1, d.is_laser??0, d.tem_variantes??0, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare('INSERT INTO procedimentos (nome,descricao,duracao_min,valor,is_laser,tem_variantes) VALUES (?,?,?,?,?,?)')
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.is_laser??0, d.tem_variantes??0);
    res.json({ id: r.lastInsertRowid });
  }
});
app.delete('/api/procedimentos/:id', authGerente, (req, res) => {
  getDb().prepare('UPDATE procedimentos SET ativo=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── VARIANTES ─────────────────────────────────────────────────
app.get('/api/variantes/:procId', auth, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM procedimento_variantes WHERE procedimento_id=? ORDER BY nome').all(req.params.procId));
});
app.post('/api/variantes', authGerente, (req, res) => {
  const db = getDb(), d = req.body;
  if (d.id) {
    db.prepare('UPDATE procedimento_variantes SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=? WHERE id=?')
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo??1, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare('INSERT INTO procedimento_variantes (procedimento_id,nome,descricao,duracao_min,valor) VALUES (?,?,?,?,?)')
      .run(d.procedimento_id, d.nome, d.descricao, d.duracao_min, d.valor);
    res.json({ id: r.lastInsertRowid });
  }
});
app.delete('/api/variantes/:id', authGerente, (req, res) => {
  getDb().prepare('DELETE FROM procedimento_variantes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── AGENDAMENTOS ──────────────────────────────────────────────
app.get('/api/agendamentos', auth, (req, res) => {
  const { data, data_inicio, data_fim } = req.query;
  let sql = `
    SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone,
           p.nome as procedimento_nome,
           v.nome as variante_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    LEFT JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
  `;
  const params = [];
  if (data_inicio && data_fim) { sql += ' WHERE a.data_hora BETWEEN ? AND ?'; params.push(data_inicio, data_fim); }
  else if (data)               { sql += ' WHERE date(a.data_hora) = ?';       params.push(data); }
  sql += ' ORDER BY a.data_hora';
  res.json(getDb().prepare(sql).all(...params));
});

app.get('/api/agendamentos/:id', auth, (req, res) => {
  const db = getDb();
  const agend = db.prepare(`
    SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!agend) return res.status(404).json({ erro: 'Não encontrado' });
  agend.procs = db.prepare(`
    SELECT ap.*, p.nome as procedimento_nome, p.tem_variantes, p.is_laser,
           v.nome as variante_nome
    FROM agendamento_procedimentos ap
    JOIN procedimentos p ON p.id = ap.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = ap.variante_id
    WHERE ap.agendamento_id = ?
    ORDER BY ap.id
  `).all(req.params.id);
  res.json(agend);
});

app.post('/api/agendamentos', auth, (req, res) => {
  const db = getDb(), d = req.body;
  const procs = Array.isArray(d.procs) && d.procs.length > 0 ? d.procs : [];
  const somaValor   = procs.reduce((s, p) => s + (Number(p.valor)       || 0), 0);

  const isGerente = req.session?.is_admin || req.session?.cargo === 'gerente';
  const valorFinal = (isGerente && d.valor_cobrado != null)
    ? Number(d.valor_cobrado)
    : somaValor;

  let agendId;
  if (d.id) {
    db.prepare(`
      UPDATE agendamentos
      SET cliente_id=?, data_hora=?, status=?, valor_cobrado=?, observacoes=?,
          procedimento_id=NULL, variante_id=NULL
      WHERE id=?
    `).run(d.cliente_id, d.data_hora, d.status, valorFinal, d.observacoes, d.id);
    agendId = d.id;
  } else {
    const r = db.prepare(`
      INSERT INTO agendamentos (cliente_id, data_hora, status, valor_cobrado, observacoes)
      VALUES (?,?,?,?,?)
    `).run(d.cliente_id, d.data_hora, d.status || 'agendado', valorFinal, d.observacoes);
    agendId = r.lastInsertRowid;
  }

  db.prepare('DELETE FROM agendamento_procedimentos WHERE agendamento_id=?').run(agendId);
  db.prepare('DELETE FROM promocao_usos WHERE agendamento_id=?').run(agendId);

  const insAP = db.prepare(`
    INSERT INTO agendamento_procedimentos (agendamento_id, procedimento_id, variante_id, valor, duracao_min)
    VALUES (?,?,?,?,?)
  `);
  const insAll = db.transaction(() => {
    procs.forEach(p => insAP.run(agendId, p.procedimento_id, p.variante_id || null,
                                  Number(p.valor) || 0, Number(p.duracao_min) || 0));
    // Persiste uso de promoção se houver
    if (d.promocao_aplicada?.id) {
      db.prepare('INSERT INTO promocao_usos (promocao_id, agendamento_id, desconto_aplicado) VALUES (?,?,?)')
        .run(d.promocao_aplicada.id, agendId, d.promocao_aplicada.desconto || 0);
    }
  });
  insAll();

  res.json({ id: agendId });
});

app.delete('/api/agendamentos/:id', auth, (req, res) => {
  getDb().prepare('DELETE FROM agendamentos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/agendamentos/:id/status', auth, (req, res) => {
  getDb().prepare('UPDATE agendamentos SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

// ── FINANCEIRO ────────────────────────────────────────────────
app.get('/api/financeiro/resumo', authGerente, (req, res) => {
  const { inicio, fim } = req.query;
  res.json(getDb().prepare(`
    SELECT COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status='concluido' THEN valor_cobrado ELSE 0 END) as recebido,
      SUM(CASE WHEN status='agendado'  THEN valor_cobrado ELSE 0 END) as a_receber,
      SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END) as cancelados
    FROM agendamentos WHERE date(data_hora) BETWEEN ? AND ?
  `).get(inicio, fim));
});

app.get('/api/financeiro/detalhado', authGerente, (req, res) => {
  const { inicio, fim } = req.query;
  res.json(getDb().prepare(`
    SELECT a.data_hora, a.status, a.valor_cobrado,
           c.nome as cliente_nome,
           (
             SELECT GROUP_CONCAT(p2.nome, ', ')
             FROM agendamento_procedimentos ap2
             JOIN procedimentos p2 ON p2.id = ap2.procedimento_id
             WHERE ap2.agendamento_id = a.id
           ) as procedimento_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE date(a.data_hora) BETWEEN ? AND ?
    ORDER BY a.data_hora
  `).all(inicio, fim));
});

// ── INTERESSES ────────────────────────────────────────────────
app.get('/api/cliente-proc/:clienteId', auth, (req, res) => {
  res.json(getDb().prepare('SELECT procedimento_id FROM cliente_procedimentos_interesse WHERE cliente_id=?')
    .all(req.params.clienteId).map(r => r.procedimento_id));
});
app.post('/api/cliente-proc', auth, (req, res) => {
  const db = getDb(), { clienteId, procedimentoIds } = req.body;
  db.prepare('DELETE FROM cliente_procedimentos_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT INTO cliente_procedimentos_interesse (cliente_id, procedimento_id) VALUES (?,?)');
  (procedimentoIds||[]).forEach(pid => ins.run(clienteId, pid));
  res.json({ ok: true });
});
app.get('/api/cliente-variantes/:clienteId', auth, (req, res) => {
  res.json(getDb().prepare('SELECT variante_id FROM cliente_variantes_interesse WHERE cliente_id=?')
    .all(req.params.clienteId).map(r => r.variante_id));
});
app.post('/api/cliente-variantes', auth, (req, res) => {
  const db = getDb(), { clienteId, varianteIds } = req.body;
  db.prepare('DELETE FROM cliente_variantes_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)');
  (varianteIds||[]).forEach(vid => ins.run(clienteId, vid));
  res.json({ ok: true });
});

// ── PROMOÇÕES — helpers de cálculo ──────────────────────────────
function _estaNaVigencia(prom, dataHora) {
  const data = String(dataHora).slice(0, 10);
  if (prom.data_inicio && data < prom.data_inicio) return false;
  if (prom.data_fim    && data > prom.data_fim)    return false;
  if (prom.dias_semana) {
    try {
      const dias = JSON.parse(prom.dias_semana);
      if (Array.isArray(dias) && dias.length > 0) {
        const dow = new Date(String(dataHora).replace(' ', 'T')).getDay();
        if (!dias.includes(dow)) return false;
      }
    } catch (_) {}
  }
  return true;
}

function _subtotalItens(itens) {
  return itens.reduce((s, it) => s + (parseFloat(it.valor) || 0), 0);
}

function _clonarItens(itens) {
  return itens.map((it, idx) => ({ ...it, _idx: idx, _usado: false }));
}

function _matchRegraEmItem(regra, item) {
  if (regra.tipo_regra === 'categoria_laser') return Number(item.is_laser) === 1;
  if (regra.tipo_regra === 'procedimento')    return Number(item.procedimento_id) === Number(regra.procedimento_id);
  if (regra.tipo_regra === 'variante')        return Number(item.variante_id) === Number(regra.variante_id);
  return false;
}

function _consumirListaFechada(regras, pool) {
  const usados = [];
  for (const regra of regras) {
    let faltam = Number(regra.quantidade || 1);
    for (const item of pool) {
      if (item._usado) continue;
      if (_matchRegraEmItem(regra, item)) {
        item._usado = true;
        usados.push(item);
        faltam--;
        if (faltam <= 0) break;
      }
    }
    if (faltam > 0) return null;
  }
  return usados;
}

function _consumirMinimo(regras, quantMin, pool) {
  const elegiveis = pool.filter(it => !it._usado && regras.some(r => _matchRegraEmItem(r, it)));
  if (elegiveis.length < quantMin) return null;
  const usados = elegiveis.slice(0, quantMin);
  usados.forEach(it => { it._usado = true; });
  return usados;
}

function _calcDesconto(tipo, valorDesc, subtotalCasado) {
  const vd  = parseFloat(valorDesc)    || 0;
  const sub = parseFloat(subtotalCasado) || 0;
  if (tipo === 'fixo' || tipo === 'valor_fixo') return Math.max(0, sub - vd);
  if (tipo === 'reais')      return Math.max(0, vd);
  if (tipo === 'percentual') return Math.max(0, sub * vd / 100);
  return 0;
}

function _tentarPromo(db, prom, itens, dataHora) {
  if (!_estaNaVigencia(prom, dataHora)) return null;
  const usos = db.prepare('SELECT COUNT(*) as n FROM promocao_usos WHERE promocao_id=?').get(prom.id).n;
  if (prom.limite_usos != null && usos >= Number(prom.limite_usos)) return null;

  const regras = db.prepare('SELECT * FROM promocao_regras WHERE promocao_id=? ORDER BY id').all(prom.id);
  const pool   = _clonarItens(itens);

  const usados = prom.modo_itens === 'lista_fechada'
    ? _consumirListaFechada(regras, pool)
    : _consumirMinimo(regras, Number(prom.quantidade_min || 1), pool);

  if (!usados || usados.length === 0) return null;

  const subtotalCasado = _subtotalItens(usados);
  const desconto       = _calcDesconto(prom.tipo_desconto, prom.valor_desconto, subtotalCasado);
  const valorAplicado  = Math.max(0, subtotalCasado - desconto);
  return { promocao: prom, usados, subtotal_casado: subtotalCasado, valor_aplicado: valorAplicado, desconto };
}

function _buscarPromoAuto(db, itens, dataHora, ignorarId = null) {
  const proms = db.prepare('SELECT * FROM promocoes WHERE ativa=1 ORDER BY id').all();
  for (const prom of proms) {
    if (ignorarId && Number(prom.id) === Number(ignorarId)) continue;
    const res = _tentarPromo(db, prom, itens, dataHora);
    if (res) return res;
  }
  return null;
}

function _enriquecerItens(db, itensRaw) {
  return itensRaw.map(it => {
    if (it.variante_id) {
      const row = db.prepare(`
        SELECT pv.id as variante_id, pv.valor, pv.duracao_min,
               p.id as procedimento_id, p.nome as procedimento_nome, p.is_laser,
               pv.nome as variante_nome
        FROM procedimento_variantes pv
        JOIN procedimentos p ON p.id = pv.procedimento_id
        WHERE pv.id = ?
      `).get(it.variante_id);
      if (row) return {
        procedimento_id: row.procedimento_id, procedimento_nome: row.procedimento_nome,
        variante_id: row.variante_id, variante_nome: row.variante_nome,
        valor: Number(it.valor ?? row.valor ?? 0),
        duracao_min: Number(it.duracao_min ?? row.duracao_min ?? 0),
        is_laser: Number(row.is_laser || 0),
      };
    }
    const proc = db.prepare('SELECT * FROM procedimentos WHERE id=?').get(it.procedimento_id);
    return {
      procedimento_id: it.procedimento_id,
      procedimento_nome: proc?.nome ?? '',
      variante_id: null, variante_nome: null,
      valor: Number(it.valor ?? proc?.valor ?? 0),
      duracao_min: Number(it.duracao_min ?? proc?.duracao_min ?? 0),
      is_laser: Number(proc?.is_laser || 0),
    };
  });
}

// ── PROMOÇÕES ─────────────────────────────────────────────────
app.get('/api/promocoes', authGerente, (req, res) => {
  try {
    const db = getDb();
    const promos = db.prepare('SELECT * FROM promocoes ORDER BY criado_em DESC').all();
    promos.forEach(p => {
      p.regras = db.prepare('SELECT * FROM promocao_regras WHERE promocao_id=?').all(p.id);
    });
    res.json(promos);
  } catch (e) {
    sseLog('error', 'GET /api/promocoes:', e.message);
    res.status(500).json({ erro: e.message });
  }
});

app.get('/api/promocoes/:id', authGerente, (req, res) => {
  try {
    const db = getDb();
    const promo = db.prepare('SELECT * FROM promocoes WHERE id=?').get(req.params.id);
    if (!promo) return res.status(404).json({ erro: 'Não encontrado' });
    promo.regras = db.prepare('SELECT * FROM promocao_regras WHERE promocao_id=?').all(promo.id);
    res.json(promo);
  } catch (e) {
    sseLog('error', 'GET /api/promocoes/:id:', e.message);
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/promocoes', authGerente, (req, res) => {
  try {
    sseLog('info', 'POST /api/promocoes body:', req.body);
    const db = getDb(), d = req.body;

    if (!d.nome || !d.nome.trim())
      return res.status(400).json({ erro: 'Nome é obrigatório' });

    const campos = ['nome','tipo_desconto','valor_desconto','modo_itens',
                    'quantidade_min','ativa','data_inicio','data_fim',
                    'dias_semana','limite_usos'];

    let promoId;
    if (d.id) {
      db.prepare(`UPDATE promocoes SET ${campos.map(c=>`${c}=?`).join(',')} WHERE id=?`)
        .run(...campos.map(c => d[c] !== undefined ? d[c] : null), d.id);
      promoId = d.id;
      sseLog('info', 'Promoção atualizada id:', promoId);
    } else {
      const r = db.prepare(`INSERT INTO promocoes (${campos.join(',')}) VALUES (${campos.map(()=>'?').join(',')})`)
        .run(...campos.map(c => d[c] !== undefined ? d[c] : null));
      promoId = r.lastInsertRowid;
      sseLog('info', 'Promoção criada id:', promoId);
    }

    // Regras
    db.prepare('DELETE FROM promocao_regras WHERE promocao_id=?').run(promoId);
    const insRegra = db.prepare(
      'INSERT INTO promocao_regras (promocao_id, tipo_regra, procedimento_id, variante_id, quantidade) VALUES (?,?,?,?,?)'
    );
    const regras = Array.isArray(d.regras) ? d.regras : [];
    const insAll = db.transaction(() => {
      regras.forEach(r => {
        // Infere tipo_regra automaticamente se não vier preenchido do frontend
        let tipo = r.tipo_regra;
        if (!tipo) {
          if      (r.variante_id)     tipo = 'variante';
          else if (r.procedimento_id) tipo = 'procedimento';
          else                        tipo = 'categoria_laser';
        }
        insRegra.run(promoId, tipo, r.procedimento_id || null,
                     r.variante_id || null, r.quantidade || 1);
      });
    });
    insAll();

    sseLog('info', `✅ Promoção ${promoId} salva com ${regras.length} regra(s).`);
    res.json({ id: promoId });
  } catch (e) {
    sseLog('error', 'POST /api/promocoes ERRO:', e.message, e.stack);
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/promocoes/calcular', auth, (req, res) => {
  try {
    const db      = getDb();
    const payload = req.body;
    const itens   = _enriquecerItens(db, payload.itens || []);
    const subtotal = _subtotalItens(itens);

    let aplicada = null;

    if (payload.promocao_id) {
      const prom = db.prepare('SELECT * FROM promocoes WHERE id=? AND ativa=1').get(payload.promocao_id);
      if (prom) aplicada = _tentarPromo(db, prom, itens, payload.data_hora);
    } else if (payload.aplicar_automatico !== 0) {
      aplicada = _buscarPromoAuto(db, itens, payload.data_hora);
    }

    const alternativa = aplicada
      ? _buscarPromoAuto(db, itens, payload.data_hora, aplicada.promocao.id)
      : null;

    const total = aplicada ? subtotal - aplicada.desconto : subtotal;

    res.json({
      subtotal,
      total,
      promocao_aplicada: aplicada ? {
        id: aplicada.promocao.id,
        nome: aplicada.promocao.nome,
        tipo_desconto: aplicada.promocao.tipo_desconto,
        valor_desconto: aplicada.promocao.valor_desconto,
        subtotal_casado: aplicada.subtotal_casado,
        valor_aplicado: aplicada.valor_aplicado,
        desconto: aplicada.desconto,
        usados: aplicada.usados,
      } : null,
      aviso_outra_promocao: alternativa
        ? `⚠️ Outra promoção também era aplicável: "${alternativa.promocao.nome}". Apenas uma promoção por agendamento.`
        : null,
    });
  } catch (e) {
    sseLog('error', 'POST /api/promocoes/calcular ERRO:', e.message);
    res.status(500).json({ erro: e.message });
  }
});

app.delete('/api/promocoes/:id', authGerente, (req, res) => {
  try {
    getDb().prepare('DELETE FROM promocoes WHERE id=?').run(req.params.id);
    sseLog('info', 'Promoção excluída id:', req.params.id);
    res.json({ ok: true });
  } catch (e) {
    sseLog('error', 'DELETE /api/promocoes/:id:', e.message);
    res.status(500).json({ erro: e.message });
  }
});

// ── SPA FALLBACK ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Agenda rodando em http://localhost:${PORT}`);
});