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
  } else {
    const cols = fields.join(',');
    const phs  = fields.map(() => '?').join(',');
    db.prepare(`INSERT INTO clientes (${cols}) VALUES (${phs})`).run(...vals);
  }
});

ipc('clientes:excluir', (_, id) => {
  getDb().prepare('DELETE FROM clientes WHERE id = ?').run(id);
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
  const db = getDb();
  let sql = `
    SELECT a.*,
           c.nome  AS cliente_nome,
           c.telefone AS cliente_telefone,
           c.celular  AS cliente_celular
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
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

  const agendamentos = db.prepare(sql).all(...params);

  const getProcs = db.prepare(`
    SELECT ap.*, p.nome AS procedimento_nome, p.duracao_min AS proc_duracao,
           v.nome AS variante_nome, v.duracao_min AS variante_duracao
    FROM agendamento_procedimentos ap
    JOIN procedimentos p ON p.id = ap.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = ap.variante_id
    WHERE ap.agendamento_id = ?
    ORDER BY ap.id
  `);

  return agendamentos.map(ag => {
    const procs = getProcs.all(ag.id);
    return {
      ...ag,
      procedimentos: procs,
      procedimento_nome: procs.map(p => p.variante_nome ? `${p.procedimento_nome} (${p.variante_nome})` : p.procedimento_nome).join(', ') || '—',
      variante_nome:     procs[0]?.variante_nome ?? null,
      duracao_min:       procs.reduce((s, p) => s + (p.variante_duracao ?? p.proc_duracao ?? 0), 0)
    };
  });
});

ipc('agendamentos:buscar', (_, id) => {
  const db = getDb();
  const ag = db.prepare(`
    SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.celular AS cliente_celular
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE a.id = ?
  `).get(id);
  if (!ag) return null;

  const procs = db.prepare(`
    SELECT ap.*, p.nome AS procedimento_nome, p.tem_variantes, p.is_laser,
           p.duracao_min AS proc_duracao,
           v.nome AS variante_nome, v.duracao_min AS variante_duracao
    FROM agendamento_procedimentos ap
    JOIN procedimentos p ON p.id = ap.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = ap.variante_id
    WHERE ap.agendamento_id = ?
    ORDER BY ap.id
  `).all(id);

  const usoPromo = db.prepare(`
    SELECT pu.*, pr.nome as promocao_nome
    FROM promocao_usos pu
    JOIN promocoes pr ON pr.id = pu.promocao_id
    WHERE pu.agendamento_id = ?
  `).get(id);

  return {
    ...ag,
    procedimentos: procs,
    procs,
    procedimento_nome: procs.map(p => p.variante_nome ? `${p.procedimento_nome} (${p.variante_nome})` : p.procedimento_nome).join(', ') || '—',
    variante_nome:     procs[0]?.variante_nome ?? null,
    duracao_min:       procs.reduce((s, p) => s + (p.variante_duracao ?? p.proc_duracao ?? 0), 0),
    promocao_uso:      usoPromo || null,
  };
});

ipc('agendamentos:salvar', (_, d) => {
  const db = getDb();

  const salvar = db.transaction(() => {
    const procs = Array.isArray(d.procs) && d.procs.length > 0 ? d.procs : [];

    let agendamentoId;
    if (d.id) {
      db.prepare(`
        UPDATE agendamentos
        SET cliente_id=?, data_hora=?, status=?, valor_cobrado=?, observacoes=?,
            procedimento_id=?, variante_id=?
        WHERE id=?
      `).run(
        d.cliente_id, d.data_hora, d.status, d.valor_cobrado, d.observacoes,
        procs[0]?.procedimento_id ?? null, procs[0]?.variante_id ?? null,
        d.id
      );
      agendamentoId = Number(d.id);
      db.prepare('DELETE FROM agendamento_procedimentos WHERE agendamento_id=?').run(agendamentoId);
      db.prepare('DELETE FROM promocao_usos WHERE agendamento_id=?').run(agendamentoId);
    } else {
      const r = db.prepare(`
        INSERT INTO agendamentos (cliente_id, data_hora, status, valor_cobrado, observacoes, procedimento_id, variante_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        d.cliente_id, d.data_hora, d.status ?? 'agendado', d.valor_cobrado, d.observacoes,
        procs[0]?.procedimento_id ?? null, procs[0]?.variante_id ?? null
      );
      agendamentoId = r.lastInsertRowid;
    }

    const insAP = db.prepare(`
      INSERT INTO agendamento_procedimentos (agendamento_id, procedimento_id, variante_id, valor, duracao_min)
      VALUES (?, ?, ?, ?, ?)
    `);
    const getDur = db.prepare(`
      SELECT COALESCE(v.duracao_min, p.duracao_min, 0) AS dur
      FROM procedimentos p
      LEFT JOIN procedimento_variantes v ON v.id = ?
      WHERE p.id = ?
    `);
    procs.forEach(p => {
      const row = getDur.get(p.variante_id ?? null, p.procedimento_id);
      insAP.run(agendamentoId, p.procedimento_id, p.variante_id ?? null, p.valor ?? 0, p.duracao_min ?? row?.dur ?? 0);
    });

    if (d.promocao_aplicada?.id) {
      db.prepare(`
        INSERT INTO promocao_usos (promocao_id, agendamento_id, desconto_aplicado)
        VALUES (?, ?, ?)
      `).run(d.promocao_aplicada.id, agendamentoId, d.promocao_aplicada.desconto || 0);
    }

    return agendamentoId;
  });

  return salvar();
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

ipc('financeiro:detalhado', (_, { inicio, fim }) => {
  const db = getDb();
  const agendamentos = db.prepare(`
    SELECT a.id, a.data_hora, a.status, a.valor_cobrado, c.nome AS cliente_nome
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE date(a.data_hora) BETWEEN ? AND ?
    ORDER BY a.data_hora
  `).all(inicio, fim);

  const getProcs = db.prepare(`
    SELECT p.nome AS procedimento_nome
    FROM agendamento_procedimentos ap
    JOIN procedimentos p ON p.id = ap.procedimento_id
    WHERE ap.agendamento_id = ?
    ORDER BY ap.id
  `);

  const getPromo = db.prepare(`
    SELECT pu.desconto_aplicado, pr.nome as promocao_nome
    FROM promocao_usos pu
    JOIN promocoes pr ON pr.id = pu.promocao_id
    WHERE pu.agendamento_id = ?
  `);

  return agendamentos.map(ag => ({
    ...ag,
    procedimento_nome: getProcs.all(ag.id).map(p => p.procedimento_nome).join(', ') || '—',
    promocao: getPromo.get(ag.id) || null,
  }));
});

// ─── PROMOÇÕES — helpers ─────────────────────────────────────
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
  if (tipo === 'fixo')        return Math.max(0, vd);
  if (tipo === 'reais')       return Math.max(0, sub - vd);
  if (tipo === 'percentual')  return Math.max(0, sub * (1 - vd / 100));
  return sub;
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
  const valorAplicado  = _calcDesconto(prom.tipo_desconto, prom.valor_desconto, subtotalCasado);
  const desconto       = Math.max(0, subtotalCasado - valorAplicado);
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

// ─── PROMOÇÕES — CRUD ────────────────────────────────────────
ipc('promocoes:listar', () => {
  const db = getDb();
  return db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM promocao_regras WHERE promocao_id=p.id) as total_regras,
      (SELECT COUNT(*) FROM promocao_usos    WHERE promocao_id=p.id) as usos_realizados
    FROM promocoes p
    ORDER BY p.id
  `).all();
});

ipc('promocoes:buscar', (_, id) => {
  const db = getDb();
  const prom = db.prepare('SELECT * FROM promocoes WHERE id=?').get(id);
  if (!prom) return null;
  const regras = db.prepare(`
    SELECT r.*, p.nome as procedimento_nome, v.nome as variante_nome
    FROM promocao_regras r
    LEFT JOIN procedimentos p ON p.id = r.procedimento_id
    LEFT JOIN procedimento_variantes v ON v.id = r.variante_id
    WHERE r.promocao_id=? ORDER BY r.id
  `).all(id);
  return { ...prom, regras };
});

ipc('promocoes:salvar', (_, d) => {
  const db = getDb();
  const tx = db.transaction(() => {
    let pid = d.id ? Number(d.id) : null;
    if (pid) {
      db.prepare(`
        UPDATE promocoes SET nome=?,tipo_desconto=?,valor_desconto=?,modo_itens=?,
          quantidade_min=?,ativa=?,data_inicio=?,data_fim=?,dias_semana=?,limite_usos=?
        WHERE id=?
      `).run(d.nome, d.tipo_desconto, d.valor_desconto, d.modo_itens,
             d.quantidade_min ?? 1, d.ativa ?? 1,
             d.data_inicio || null, d.data_fim || null,
             d.dias_semana || null, d.limite_usos ?? null, pid);
      db.prepare('DELETE FROM promocao_regras WHERE promocao_id=?').run(pid);
    } else {
      const r = db.prepare(`
        INSERT INTO promocoes (nome,tipo_desconto,valor_desconto,modo_itens,
          quantidade_min,ativa,data_inicio,data_fim,dias_semana,limite_usos)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `).run(d.nome, d.tipo_desconto, d.valor_desconto, d.modo_itens,
             d.quantidade_min ?? 1, d.ativa ?? 1,
             d.data_inicio || null, d.data_fim || null,
             d.dias_semana || null, d.limite_usos ?? null);
      pid = r.lastInsertRowid;
    }
    const ins = db.prepare(`
      INSERT INTO promocao_regras (promocao_id,tipo_regra,procedimento_id,variante_id,quantidade)
      VALUES (?,?,?,?,?)
    `);
    (d.regras || []).forEach(r => ins.run(pid, r.tipo_regra, r.procedimento_id || null, r.variante_id || null, r.quantidade ?? 1));
    return pid;
  });
  return tx();
});

ipc('promocoes:excluir', (_, id) => {
  getDb().prepare('DELETE FROM promocoes WHERE id=?').run(id);
  return { ok: true };
});

ipc('promocoes:calcular', (_, payload) => {
  const db    = getDb();
  const itens = _enriquecerItens(db, payload.itens || []);
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

  return {
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
  };
});

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
        SELECT a.data_hora, c.nome AS cliente_nome,
               GROUP_CONCAT(p.nome, ', ') AS procedimento_nome
        FROM agendamentos a
        JOIN clientes c ON c.id = a.cliente_id
        JOIN agendamento_procedimentos ap ON ap.agendamento_id = a.id
        JOIN procedimentos p ON p.id = ap.procedimento_id
        WHERE a.data_hora BETWEEN ? AND ? AND a.status = 'agendado'
        GROUP BY a.id
      `).all(inicio, fim);
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
  win.once('ready-to-show', () => {
    win.show();
    win.webContents.print({ silent: false, printBackground: true });
  });
});