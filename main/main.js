const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const { getDb } = require('./database');

app.commandLine.appendSwitch('lang', 'pt-BR');

try { require('electron-reloader')(module, { watchRenderer: true }); } catch (_) {}

// ── LOG ──────────────────────────────────────────────────────
function log(nivel, canal, msg, extra) {
  const ts = new Date().toLocaleTimeString('pt-BR');
  const linha = `[${ts}] [${nivel}] [${canal}] ${msg}`;
  if (extra !== undefined) {
    if (nivel === 'ERROR') console.error(linha, extra);
    else                   console.log(linha, extra);
  } else {
    if (nivel === 'ERROR') console.error(linha);
    else                   console.log(linha);
  }
}

function ipc(canal, fn) {
  ipcMain.handle(canal, async (event, ...args) => {
    log('INFO', canal, '→ chamado', args[0] ?? '');
    try {
      const result = await fn(event, ...args);
      log('OK  ', canal, '← ok');
      return result;
    } catch (err) {
      log('ERROR', canal, '✖ erro:', err.message);
      throw err;
    }
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1024, minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Clínica Estética',
    show: false
  });
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  mainWindow.once('ready-to-show', () => {
    log('INFO', 'app', 'Janela pronta');
    mainWindow.show();
  });
}

app.whenReady().then(() => { createWindow(); scheduleNotifications(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── CLIENTES ───────────────────────────────────────────────
ipc('clientes:listar', () =>
  getDb().prepare('SELECT * FROM clientes ORDER BY nome').all());

ipc('clientes:buscar', (_, id) =>
  getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(id));

ipc('clientes:salvar', (_, d) => {
  const db = getDb();
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
    'tomou_sol','sol_quando','fitzpatrick',
    'termo_assinado','observacoes'
  ];
  const vals = fields.map(f => d[f] !== undefined ? d[f] : null);
  if (d.id) {
    const sets = fields.map(f => `${f}=?`).join(',');
    db.prepare(`UPDATE clientes SET ${sets} WHERE id=?`).run(...vals, d.id);
    log('INFO', 'clientes:salvar', `UPDATE id=${d.id} nome="${d.nome}"`);
  } else {
    const cols = fields.join(',');
    const phs  = fields.map(() => '?').join(',');
    const r = db.prepare(`INSERT INTO clientes (${cols}) VALUES (${phs})`).run(...vals);
    log('INFO', 'clientes:salvar', `INSERT novo id=${r.lastInsertRowid} nome="${d.nome}"`);
  }
});

ipc('clientes:excluir', (_, id) => {
  getDb().prepare('DELETE FROM clientes WHERE id = ?').run(id);
  log('INFO', 'clientes:excluir', `id=${id}`);
});

// ─── PROCEDIMENTOS ──────────────────────────────────────────
ipc('procedimentos:listar', () =>
  getDb().prepare('SELECT * FROM procedimentos WHERE ativo=1 ORDER BY nome').all());

ipc('procedimentos:todos', () =>
  getDb().prepare('SELECT * FROM procedimentos ORDER BY nome').all());

ipc('procedimentos:salvar', (_, d) => {
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

ipc('procedimentos:excluir', (_, id) =>
  getDb().prepare('UPDATE procedimentos SET ativo=0 WHERE id=?').run(id));

// ─── VARIANTES ───────────────────────────────────────────────
ipc('variantes:listar', (_, procedimentoId) =>
  getDb().prepare('SELECT * FROM procedimento_variantes WHERE procedimento_id=? ORDER BY nome').all(procedimentoId));

ipc('variantes:salvar', (_, d) => {
  const db = getDb();
  if (d.id) {
    db.prepare(`UPDATE procedimento_variantes SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=? WHERE id=?`)
      .run(d.nome, d.descricao, d.duracao_min, d.valor, d.ativo ?? 1, d.id);
  } else {
    db.prepare(`INSERT INTO procedimento_variantes (procedimento_id,nome,descricao,duracao_min,valor) VALUES (?,?,?,?,?)`)
      .run(d.procedimento_id, d.nome, d.descricao, d.duracao_min, d.valor);
  }
});

ipc('variantes:excluir', (_, id) =>
  getDb().prepare('DELETE FROM procedimento_variantes WHERE id=?').run(id));

// ─── AGENDAMENTOS ────────────────────────────────────────────
ipc('agendamentos:listar', (_, filtro) => {
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

ipc('agendamentos:buscar', (_, id) =>
  getDb().prepare(`
    SELECT a.*, c.nome as cliente_nome, p.nome as procedimento_nome,
           p.duracao_min, p.tem_variantes,
           v.nome as variante_nome, v.duracao_min as variante_duracao
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = a.variante_id
    WHERE a.id = ?
  `).get(id));

ipc('agendamentos:salvar', (_, d) => {
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

ipc('agendamentos:excluir', (_, id) =>
  getDb().prepare('DELETE FROM agendamentos WHERE id=?').run(id));

ipc('agendamentos:status', (_, { id, status }) =>
  getDb().prepare('UPDATE agendamentos SET status=? WHERE id=?').run(status, id));

// ─── FINANCEIRO ──────────────────────────────────────────────
ipc('financeiro:resumo', (_, { inicio, fim }) =>
  getDb().prepare(`
    SELECT
      COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status='concluido' THEN valor_cobrado ELSE 0 END) as recebido,
      SUM(CASE WHEN status='agendado'  THEN valor_cobrado ELSE 0 END) as a_receber,
      SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END) as cancelados
    FROM agendamentos WHERE date(data_hora) BETWEEN ? AND ?
  `).get(inicio, fim));

ipc('financeiro:detalhado', (_, { inicio, fim }) =>
  getDb().prepare(`
    SELECT a.data_hora, a.status, a.valor_cobrado,
           c.nome as cliente_nome, p.nome as procedimento_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    WHERE date(a.data_hora) BETWEEN ? AND ?
    ORDER BY a.data_hora
  `).all(inicio, fim));

// ─── INTERESSE VARIANTES ─────────────────────────────────────
ipc('cliente:getVariantesInteresse', (_, clienteId) =>
  getDb().prepare('SELECT variante_id FROM cliente_variantes_interesse WHERE cliente_id=?')
    .all(clienteId).map(r => r.variante_id));

ipc('cliente:salvarVariantesInteresse', (_, { clienteId, varianteIds }) => {
  const db = getDb();
  db.prepare('DELETE FROM cliente_variantes_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT OR IGNORE INTO cliente_variantes_interesse (cliente_id, variante_id) VALUES (?,?)');
  varianteIds.forEach(vid => ins.run(clienteId, vid));
});

// ─── PROCEDIMENTOS INTERESSE ─────────────────────────────────
ipc('cliente:getProcInteresse', (_, clienteId) =>
  getDb().prepare('SELECT procedimento_id FROM cliente_procedimentos_interesse WHERE cliente_id=?')
    .all(clienteId).map(r => r.procedimento_id));

ipc('cliente:salvarProcInteresse', (_, { clienteId, procedimentoIds }) => {
  const db = getDb();
  db.prepare('DELETE FROM cliente_procedimentos_interesse WHERE cliente_id=?').run(clienteId);
  const ins = db.prepare('INSERT INTO cliente_procedimentos_interesse (cliente_id, procedimento_id) VALUES (?,?)');
  procedimentoIds.forEach(pid => ins.run(clienteId, pid));
});

// ─── NOTIFICAÇÕES ────────────────────────────────────────────
function scheduleNotifications() {
  log('INFO', 'notif', 'Scheduler iniciado (intervalo 60s)');
  setInterval(() => {
    const agora = new Date();
    const em30  = new Date(agora.getTime() + 30 * 60000);
    const em31  = new Date(agora.getTime() + 31 * 60000);
    const inicio = em30.toISOString().slice(0, 16).replace('T', ' ');
    const fim    = em31.toISOString().slice(0, 16).replace('T', ' ');
    try {
      const proximos = getDb().prepare(`
        SELECT a.data_hora, c.nome as cliente_nome, p.nome as procedimento_nome
        FROM agendamentos a
        JOIN clientes c ON c.id = a.cliente_id
        JOIN procedimentos p ON p.id = a.procedimento_id
        WHERE a.data_hora BETWEEN ? AND ? AND a.status = 'agendado'
      `).all(inicio, fim);
      if (proximos.length) log('INFO', 'notif', `${proximos.length} notificação(ões) disparadas`);
      proximos.forEach(ag => {
        new Notification({
          title: '⏰ Agendamento em 30 minutos',
          body: `${ag.cliente_nome} — ${ag.procedimento_nome}`
        }).show();
      });
    } catch (e) {
      log('ERROR', 'notif', 'Erro no scheduler:', e.message);
    }
  }, 60000);
}

// ─── IMPRESSÃO ───────────────────────────────────────────────
ipc('relatorio:abrir', (_, html) => {
  const win = new BrowserWindow({ width: 800, height: 600, show: false });
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  win.once('ready-to-show', () => { win.show(); win.webContents.print({ silent: false, printBackground: true }); });
});