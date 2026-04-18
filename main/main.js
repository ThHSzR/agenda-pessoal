// ─── PROCEDIMENTOS ──────────────────────────────────────────
ipcMain.handle('procedimentos:listar', () => {
  return getDb().prepare('SELECT * FROM procedimentos WHERE ativo=1 ORDER BY nome').all();
});

ipcMain.handle('procedimentos:todos', () => {
  return getDb().prepare('SELECT * FROM procedimentos ORDER BY nome').all();
});

ipcMain.handle('procedimentos:salvar', (_, d) => {
  const db = getDb();
  if (d.id) {
    db.prepare(`UPDATE procedimentos SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=?,is_laser=?,tem_variantes=? WHERE id=?`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo ?? 1, d.is_laser ?? 0, d.tem_variantes ?? 0, d.id);
    return d.id;
  } else {
    const r = db.prepare(`INSERT INTO procedimentos (nome,descricao,duracao_min,valor,is_laser,tem_variantes) VALUES (?,?,?,?,?,?)`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.is_laser ?? 0, d.tem_variantes ?? 0);
    return r.lastInsertRowid;
  }
});

ipcMain.handle('procedimentos:excluir', (_, id) => {
  getDb().prepare('UPDATE procedimentos SET ativo=0 WHERE id=?').run(id);
});

// ─── VARIANTES ───────────────────────────────────────────────
ipcMain.handle('variantes:listar', (_, procedimentoId) => {
  return getDb().prepare(
    'SELECT * FROM procedimento_variantes WHERE procedimento_id=? ORDER BY nome'
  ).all(procedimentoId);
});

ipcMain.handle('variantes:salvar', (_, d) => {
  const db = getDb();
  if (d.id) {
    db.prepare(`UPDATE procedimento_variantes SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=? WHERE id=?`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo ?? 1, d.id);
  } else {
    db.prepare(`INSERT INTO procedimento_variantes (procedimento_id,nome,descricao,duracao_min,valor) VALUES (?,?,?,?,?)`)
      .run(d.procedimento_id, d.nome, d.descricao, d.duracao_min, d.valor);
  }
});

ipcMain.handle('variantes:excluir', (_, id) => {
  getDb().prepare('DELETE FROM procedimento_variantes WHERE id=?').run(id);
});

// ─── AGENDAMENTOS ────────────────────────────────────────────
ipcMain.handle('agendamentos:listar', (_, filtro) => {
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
  if (filtro?.data_inicio && filtro?.data_fim) {
    sql += ' WHERE a.data_hora BETWEEN ? AND ?';
    params.push(filtro.data_inicio, filtro.data_fim);
  } else if (filtro?.data) {
    sql += ' WHERE date(a.data_hora) = ?';
    params.push(filtro.data);
  }
  sql += ' ORDER BY a.data_hora';
  return getDb().prepare(sql).all(...params);
});

ipcMain.handle('agendamentos:buscar', (_, id) => {
  return getDb().prepare(`
    SELECT a.*, c.nome as cliente_nome, p.nome as procedimento_nome,
           p.duracao_min, p.tem_variantes,
           v.nome as variante_nome, v.duracao_min as variante_duracao
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
    WHERE a.id = ?
  `).get(id);
});

ipcMain.handle('agendamentos:salvar', (_, d) => {
  const db = getDb();
  if (d.id) {
    db.prepare(`UPDATE agendamentos SET cliente_id=?,procedimento_id=?,variante_id=?,data_hora=?,status=?,valor_cobrado=?,observacoes=? WHERE id=?`)
      .run(d.cliente_id, d.procedimento_id, d.variante_id || null, d.data_hora, d.status, d.valor_cobrado, d.observacoes, d.id);
    return d.id;
  } else {
    const r = db.prepare(`INSERT INTO agendamentos (cliente_id,procedimento_id,variante_id,data_hora,status,valor_cobrado,observacoes) VALUES (?,?,?,?,?,?,?)`)
      .run(d.cliente_id, d.procedimento_id, d.variante_id || null, d.data_hora, d.status || 'agendado', d.valor_cobrado, d.observacoes);
    return r.lastInsertRowid;
  }
});

// ─── INTERESSE VARIANTES ─────────────────────────────────────
ipcMain.handle('cliente:getVariantesInteresse', (_, clienteId) => {
  return getDb().prepare(
    'SELECT variante_id FROM cliente_variantes_interesse WHERE cliente_id=?'
  ).all(clienteId).map(r => r.variante_id);
});

ipcMain.handle('cliente:salvarVariantesInteresse', (_, { clienteId, varianteIds }) => {
  const db = getDb();
  db.prepare('DELETE FROM cliente_variantes_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)');
  varianteIds.forEach(vid => ins.run(clienteId, vid));
});