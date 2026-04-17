async function renderFinanceiro() {
  const agora   = new Date();
  const inicioM = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-01`;
  const fimM    = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-31`;

  const resumo   = await window.api.financeiro.resumo({ inicio: inicioM, fim: fimM });
  const detalhes = await window.api.financeiro.detalhado({ inicio: inicioM, fim: fimM });

  const page = document.getElementById('page-financeiro');
  page.innerHTML = `
    <div class="page-header">
      <h1>💰 Financeiro</h1>
      <button class="btn btn-secondary" onclick="imprimirRelatorio()">🖨️ Imprimir Relatório</button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <div class="form-group" style="margin:0">
        <input type="date" id="fin-inicio" value="${inicioM}" />
      </div>
      <span>até</span>
      <div class="form-group" style="margin:0">
        <input type="date" id="fin-fim" value="${fimM}" />
      </div>
      <button class="btn btn-primary btn-sm" onclick="atualizarFinanceiro()">Filtrar</button>
    </div>

    <div class="kpi-grid" id="fin-kpis">
      ${renderKpis(resumo)}
    </div>

    <div class="card">
      <div class="card-header">Detalhamento</div>
      <table>
        <thead>
          <tr><th>Data/Hora</th><th>Cliente</th><th>Procedimento</th><th>Valor</th><th>Status</th></tr>
        </thead>
        <tbody id="fin-tbody">
          ${renderLinhasFinanceiro(detalhes)}
        </tbody>
      </table>
    </div>`;
}

function renderKpis(r) {
  return `
    <div class="kpi-card"><div class="kpi-label">Total Agendamentos</div><div class="kpi-value">${r.total_agendamentos || 0}</div></div>
    <div class="kpi-card"><div class="kpi-label">Recebido</div><div class="kpi-value" style="color:var(--success)">${fmtMoeda(r.recebido)}</div></div>
    <div class="kpi-card"><div class="kpi-label">A Receber</div><div class="kpi-value" style="color:var(--warning)">${fmtMoeda(r.a_receber)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Cancelados</div><div class="kpi-value" style="color:var(--danger)">${r.cancelados || 0}</div></div>`;
}

function renderLinhasFinanceiro(lista) {
  if (!lista.length) return `<tr><td colspan="5"><div class="empty-state"><div class="icon">💰</div><p>Nenhum registro no período.</p></div></td></tr>`;
  return lista.map(a => `
    <tr>
      <td>${fmtDataHora(a.data_hora)}</td>
      <td>${a.cliente_nome}</td>
      <td>${a.procedimento_nome}</td>
      <td>${fmtMoeda(a.valor_cobrado)}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
    </tr>`).join('');
}

async function atualizarFinanceiro() {
  const inicio  = document.getElementById('fin-inicio').value;
  const fim     = document.getElementById('fin-fim').value;
  const resumo  = await window.api.financeiro.resumo({ inicio, fim });
  const detalhes = await window.api.financeiro.detalhado({ inicio, fim });
  document.getElementById('fin-kpis').innerHTML   = renderKpis(resumo);
  document.getElementById('fin-tbody').innerHTML  = renderLinhasFinanceiro(detalhes);
}

async function imprimirRelatorio() {
  const inicio   = document.getElementById('fin-inicio').value;
  const fim      = document.getElementById('fin-fim').value;
  const resumo   = await window.api.financeiro.resumo({ inicio, fim });
  const detalhes = await window.api.financeiro.detalhado({ inicio, fim });

  const html = `
    <html><head><meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
      h1 { color: #c2186e; margin-bottom: 4px; }
      .periodo { color: #888; font-size: 13px; margin-bottom: 24px; }
      .kpis { display: flex; gap: 24px; margin-bottom: 24px; }
      .kpi { border: 1px solid #eee; border-radius: 8px; padding: 12px 20px; }
      .kpi-label { font-size: 11px; text-transform: uppercase; color: #999; }
      .kpi-value { font-size: 22px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #fce4f3; padding: 8px; text-align: left; font-size: 12px; }
      td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
    </style></head><body>
    <h1>🌸 Relatório Financeiro</h1>
    <div class="periodo">Período: ${fmtData(inicio)} a ${fmtData(fim)}</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">Agendamentos</div><div class="kpi-value">${resumo.total_agendamentos || 0}</div></div>
      <div class="kpi"><div class="kpi-label">Recebido</div><div class="kpi-value" style="color:green">${fmtMoeda(resumo.recebido)}</div></div>
      <div class="kpi"><div class="kpi-label">A Receber</div><div class="kpi-value" style="color:orange">${fmtMoeda(resumo.a_receber)}</div></div>
      <div class="kpi"><div class="kpi-label">Cancelados</div><div class="kpi-value" style="color:red">${resumo.cancelados || 0}</div></div>
    </div>
    <table>
      <thead><tr><th>Data/Hora</th><th>Cliente</th><th>Procedimento</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>${detalhes.map(a => `
        <tr>
          <td>${fmtDataHora(a.data_hora)}</td><td>${a.cliente_nome}</td>
          <td>${a.procedimento_nome}</td><td>${fmtMoeda(a.valor_cobrado)}</td><td>${a.status}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </body></html>`;

  await window.api.relatorio.abrir(html);
}
