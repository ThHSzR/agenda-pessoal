const express        = require('express');
const session        = require('express-session');
const bcrypt         = require('bcryptjs');
const path           = require('path');
const { getDb }      = require('./server/database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

app.use(session({
  secret: 'agenda-secreta-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

function auth(req, res, next) {
  if (req.session?.logado) return next();
  res.status(401).json({ erro: 'Não autenticado' });
}

// ─── AUTH ────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n;
  if (total === 0) {
    db.prepare('INSERT INTO usuarios (usuario, senha) VALUES (?,?)')
      .run('admin', bcrypt.hashSync('admin123', 10));
  }
  const user = db.prepare('SELECT * FROM usuarios WHERE usuario=?').get(usuario);
  if (!user || !bcrypt.compareSync(senha, user.senha))
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  req.session.logado  = true;
  req.session.usuario = user.usuario;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (req.session?.logado) return res.json({ usuario: req.session.usuario });
  res.status(401).json({ erro: 'Não autenticado' });
});

// ─── CLIENTES ────────────────────────────────────────────────
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
    'alergia_medicamento','alergia_qual',
    'tratamento_dermato','tratamento_dermato_qual','usa_acidos',
    'cirurgia','cirurgia_qual',
    'anticoncepcional','anticoncepcional_qual',
    'historico_oncologico','oncologico_qual',
    'acompanhamento_medico','acompanhamento_qual',
    'epilepsia','alteracao_hormonal','hormonal_qual','hirsutismo',
    'gestante','herpes','lactante',
    'cor_olhos','cor_cabelos','cor_pelos',
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

// ─── PROCEDIMENTOS ───────────────────────────────────────────
app.get('/api/procedimentos', auth, (req, res) => {
  const sql = req.query.todos === '1'
    ? 'SELECT * FROM procedimentos ORDER BY nome'
    : 'SELECT * FROM procedimentos WHERE ativo=1 ORDER BY nome';
  res.json(getDb().prepare(sql).all());
});

app.post('/api/procedimentos', auth, (req, res) => {
  const db = getDb(), d = req.body;
  if (d.id) {
    db.prepare(`UPDATE procedimentos SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=?,is_laser=?,tem_variantes=? WHERE id=?`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo??1, d.is_laser??0, d.tem_variantes??0, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare(`INSERT INTO procedimentos (nome,descricao,duracao_min,valor,is_laser,tem_variantes) VALUES (?,?,?,?,?,?)`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.is_laser??0, d.tem_variantes??0);
    res.json({ id: r.lastInsertRowid });
  }
});

app.delete('/api/procedimentos/:id', auth, (req, res) => {
  getDb().prepare('UPDATE procedimentos SET ativo=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── VARIANTES ───────────────────────────────────────────────
app.get('/api/variantes/:procId', auth, (req, res) => {
  res.json(getDb().prepare(
    'SELECT * FROM procedimento_variantes WHERE procedimento_id=? ORDER BY nome'
  ).all(req.params.procId));
});

app.post('/api/variantes', auth, (req, res) => {
  const db = getDb(), d = req.body;
  if (d.id) {
    db.prepare(`UPDATE procedimento_variantes SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=? WHERE id=?`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo??1, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare(`INSERT INTO procedimento_variantes (procedimento_id,nome,descricao,duracao_min,valor) VALUES (?,?,?,?,?)`)
      .run(d.procedimento_id, d.nome, d.descricao, d.duracao_min, d.valor);
    res.json({ id: r.lastInsertRowid });
  }
});

app.delete('/api/variantes/:id', auth, (req, res) => {
  getDb().prepare('DELETE FROM procedimento_variantes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ─── AGENDAMENTOS ────────────────────────────────────────────
app.get('/api/agendamentos', auth, (req, res) => {
  const { data, data_inicio, data_fim } = req.query;
  let sql = `
    SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone,
           p.nome as procedimento_nome, p.duracao_min,
           v.nome as variante_nome, v.duracao_min as variante_duracao
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
  `;
  const params = [];
  if (data_inicio && data_fim) { sql += ' WHERE a.data_hora BETWEEN ? AND ?'; params.push(data_inicio, data_fim); }
  else if (data)               { sql += ' WHERE date(a.data_hora) = ?';       params.push(data); }
  sql += ' ORDER BY a.data_hora';
  res.json(getDb().prepare(sql).all(...params));
});

app.get('/api/agendamentos/:id', auth, (req, res) => {
  const row = getDb().prepare(`
    SELECT a.*, c.nome as cliente_nome, p.nome as procedimento_nome,
           p.duracao_min, p.tem_variantes,
           v.nome as variante_nome, v.duracao_min as variante_duracao
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
    WHERE a.id = ?
  `).get(req.params.id);
  row ? res.json(row) : res.status(404).json({ erro: 'Não encontrado' });
});

app.post('/api/agendamentos', auth, (req, res) => {
  const db = getDb(), d = req.body;
  if (d.id) {
    db.prepare(`UPDATE agendamentos SET cliente_id=?,procedimento_id=?,variante_id=?,data_hora=?,status=?,valor_cobrado=?,observacoes=? WHERE id=?`)
      .run(d.cliente_id, d.procedimento_id, d.variante_id||null, d.data_hora, d.status, d.valor_cobrado, d.observacoes, d.id);
    res.json({ id: d.id });
  } else {
    const r = db.prepare(`INSERT INTO agendamentos (cliente_id,procedimento_id,variante_id,data_hora,status,valor_cobrado,observacoes) VALUES (?,?,?,?,?,?,?)`)
      .run(d.cliente_id, d.procedimento_id, d.variante_id||null, d.data_hora, d.status||'agendado', d.valor_cobrado, d.observacoes);
    res.json({ id: r.lastInsertRowid });
  }
});

app.delete('/api/agendamentos/:id', auth, (req, res) => {
  getDb().prepare('DELETE FROM agendamentos WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/agendamentos/:id/status', auth, (req, res) => {
  getDb().prepare('UPDATE agendamentos SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

// ─── FINANCEIRO ──────────────────────────────────────────────
app.get('/api/financeiro/resumo', auth, (req, res) => {
  const { inicio, fim } = req.query;
  res.json(getDb().prepare(`
    SELECT COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status='concluido' THEN valor_cobrado ELSE 0 END) as recebido,
      SUM(CASE WHEN status='agendado'  THEN valor_cobrado ELSE 0 END) as a_receber,
      SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END) as cancelados
    FROM agendamentos WHERE date(data_hora) BETWEEN ? AND ?
  `).get(inicio, fim));
});

app.get('/api/financeiro/detalhado', auth, (req, res) => {
  const { inicio, fim } = req.query;
  res.json(getDb().prepare(`
    SELECT a.data_hora, a.status, a.valor_cobrado,
           c.nome as cliente_nome, p.nome as procedimento_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    WHERE date(a.data_hora) BETWEEN ? AND ?
    ORDER BY a.data_hora
  `).all(inicio, fim));
});

// ─── INTERESSES ──────────────────────────────────────────────
app.get('/api/cliente-proc/:clienteId', auth, (req, res) => {
  res.json(getDb().prepare(
    'SELECT procedimento_id FROM cliente_procedimentos_interesse WHERE cliente_id=?'
  ).all(req.params.clienteId).map(r => r.procedimento_id));
});

app.post('/api/cliente-proc', auth, (req, res) => {
  const db = getDb(), { clienteId, procedimentoIds } = req.body;
  db.prepare('DELETE FROM cliente_procedimentos_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT INTO cliente_procedimentos_interesse (cliente_id, procedimento_id) VALUES (?,?)');
  (procedimentoIds||[]).forEach(pid => ins.run(clienteId, pid));
  res.json({ ok: true });
});

app.get('/api/cliente-variantes/:clienteId', auth, (req, res) => {
  res.json(getDb().prepare(
    'SELECT variante_id FROM cliente_variantes_interesse WHERE cliente_id=?'
  ).all(req.params.clienteId).map(r => r.variante_id));
});

app.post('/api/cliente-variantes', auth, (req, res) => {
  const db = getDb(), { clienteId, varianteIds } = req.body;
  db.prepare('DELETE FROM cliente_variantes_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)');
  (varianteIds||[]).forEach(vid => ins.run(clienteId, vid));
  res.json({ ok: true });
});

// ─── SPA FALLBACK ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Agenda rodando em http://localhost:${PORT}`);
  console.log(`   Login padrão: admin / admin123`);
});