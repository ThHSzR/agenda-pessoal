const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const { getDb } = require('./database');

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
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => { createWindow(); scheduleNotifications(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── CLIENTES ───────────────────────────────────────────────
ipcMain.handle('clientes:listar', () => {
  return getDb().prepare('SELECT * FROM clientes ORDER BY nome').all();
});

ipcMain.handle('clientes:buscar', (_, id) => {
  return getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(id);
});

ipcMain.handle('clientes:salvar', (_, d) => {
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
  } else {
    const cols = fields.join(',');
    const phs  = fields.map(() => '?').join(',');
    db.prepare(`INSERT INTO clientes (${cols}) VALUES (${phs})`).run(...vals);
  }
});

ipcMain.handle('clientes:excluir', (_, id) => {
  getDb().prepare('DELETE FROM clientes WHERE id = ?').run(id);
});

// ─── PROCEDIMENTOS ──────────────────────────────────────────
ipcMain.handle('procedimentos:listar', () => {
  return getDb().prepare('SELECT * FROM procedimentos WHERE ativo=1 ORDER BY nome').all();
});

ipcMain.handle('procedimentos:todos', () => {
  return getDb().prepare('SELECT * FROM procedimentos ORDER BY nome').all();
});

ipcMain.handle('procedimentos:salvar', (_, dados) => {
  const db = getDb();
  if (dados.id) {
    db.prepare(`UPDATE procedimentos SET nome=?,descricao=?,duracao_min=?,valor=?,ativo=? WHERE id=?`)
      .run(dados.nome, dados.descricao, dados.duracao_min, dados.valor, dados.ativo ?? 1, dados.id);
    return dados.id;
  } else {
    const r = db.prepare(`INSERT INTO procedimentos (nome,descricao,duracao_min,valor) VALUES (?,?,?,?)`)
      .run(dados.nome, dados.descricao, dados.duracao_min, dados.valor);
    return r.lastInsertRowid;
  }
});

ipcMain.handle('procedimentos:excluir', (_, id) => {
  getDb().prepare('UPDATE procedimentos SET ativo=0 WHERE id=?').run(id);
});

// ─── AGENDAMENTOS ────────────────────────────────────────────
ipcMain.handle('agendamentos:listar', (_, filtro) => {
  let sql = `
    SELECT a.*, c.nome as cliente_nome, c.telefone as cliente_telefone,
           p.nome as procedimento_nome, p.duracao_min
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
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
    SELECT a.*, c.nome as cliente_nome, p.nome as procedimento_nome, p.duracao_min
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    WHERE a.id = ?
  `).get(id);
});

ipcMain.handle('agendamentos:salvar', (_, dados) => {
  const db = getDb();
  if (dados.id) {
    db.prepare(`UPDATE agendamentos SET cliente_id=?,procedimento_id=?,data_hora=?,status=?,valor_cobrado=?,observacoes=? WHERE id=?`)
      .run(dados.cliente_id, dados.procedimento_id, dados.data_hora, dados.status, dados.valor_cobrado, dados.observacoes, dados.id);
    return dados.id;
  } else {
    const r = db.prepare(`INSERT INTO agendamentos (cliente_id,procedimento_id,data_hora,status,valor_cobrado,observacoes) VALUES (?,?,?,?,?,?)`)
      .run(dados.cliente_id, dados.procedimento_id, dados.data_hora, dados.status || 'agendado', dados.valor_cobrado, dados.observacoes);
    return r.lastInsertRowid;
  }
});

ipcMain.handle('agendamentos:excluir', (_, id) => {
  getDb().prepare('DELETE FROM agendamentos WHERE id=?').run(id);
});

ipcMain.handle('agendamentos:status', (_, { id, status }) => {
  getDb().prepare('UPDATE agendamentos SET status=? WHERE id=?').run(status, id);
});

// ─── FINANCEIRO ──────────────────────────────────────────────
ipcMain.handle('financeiro:resumo', (_, { inicio, fim }) => {
  return getDb().prepare(`
    SELECT
      COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status='concluido' THEN valor_cobrado ELSE 0 END) as recebido,
      SUM(CASE WHEN status='agendado'  THEN valor_cobrado ELSE 0 END) as a_receber,
      SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END) as cancelados
    FROM agendamentos
    WHERE date(data_hora) BETWEEN ? AND ?
  `).get(inicio, fim);
});

ipcMain.handle('financeiro:detalhado', (_, { inicio, fim }) => {
  return getDb().prepare(`
    SELECT a.data_hora, a.status, a.valor_cobrado,
           c.nome as cliente_nome, p.nome as procedimento_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    JOIN procedimentos p ON p.id = a.procedimento_id
    WHERE date(a.data_hora) BETWEEN ? AND ?
    ORDER BY a.data_hora
  `).all(inicio, fim);
});

// ─── NOTIFICAÇÕES ────────────────────────────────────────────
function scheduleNotifications() {
  setInterval(() => {
    const agora = new Date();
    const em30 = new Date(agora.getTime() + 30 * 60000);
    const janela_inicio = em30.toISOString().slice(0, 16).replace('T', ' ');
    const em31 = new Date(agora.getTime() + 31 * 60000);
    const janela_fim = em31.toISOString().slice(0, 16).replace('T', ' ');
    try {
      const proximos = getDb().prepare(`
        SELECT a.data_hora, c.nome as cliente_nome, p.nome as procedimento_nome
        FROM agendamentos a
        JOIN clientes c ON c.id = a.cliente_id
        JOIN procedimentos p ON p.id = a.procedimento_id
        WHERE a.data_hora BETWEEN ? AND ? AND a.status = 'agendado'
      `).all(janela_inicio, janela_fim);
      proximos.forEach(ag => {
        new Notification({
          title: '⏰ Agendamento em 30 minutos',
          body: `${ag.cliente_nome} — ${ag.procedimento_nome}`
        }).show();
      });
    } catch (e) {}
  }, 60000);
}

// ─── IMPRESSÃO / RELATÓRIO ───────────────────────────────────
ipcMain.handle('relatorio:abrir', (_, html) => {
  const win = new BrowserWindow({ width: 800, height: 600, show: false });
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  win.once('ready-to-show', () => {
    win.show();
    win.webContents.print({ silent: false, printBackground: true });
  });
});