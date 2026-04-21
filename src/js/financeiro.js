async function renderFinanceiro() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const ultimoDia  = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);

  const page = document.getElementById('page-financeiro');
  page.innerHTML = `
    <div class="page-header">
      <h1>💰 Financeiro</h1>
    </div>
    <div class="search-bar" style="align-items:center;gap:12px;flex-wrap:wrap">
      <label style="font-size:var(--text-sm);color:var(--color-text-muted)">Período:</label>
      <input type="date" id="fin-inicio" value="${primeiroDia}" onchange="atualizarFinanceiro()"/>
      <span style="color:var(--color-text-muted)">até</span>
      <input type="date" id="fin-fim" value="${ultimoDia}" onchange="atualizarFinanceiro()"/>
      <button class="btn btn-secondary btn-sm" onclick="finMesAtual()">Este mês</button>
      <button class="btn btn-secondary btn-sm" onclick="finHoje()">Hoje</button>
    </div>

    <!-- KPIs -->
    <div id="fin-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px"></div>

    <!-- Tabela detalhada -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-size:var(--text-base);font-weight:600">Detalhamento</h3>
        <button class="btn btn-secondary btn-sm" onclick="exportarFinanceiro()">⬇️ Exportar CSV</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Cliente</th>
            <th>Procedimento</th>
            <th>Promoção</th>
            <th>Status</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody id="fin-tbody">
          <tr><td colspan="6"><div class="empty-state"><div class="icon">⏳</div><p>Carregando...</p></div></td></tr>
        </tbody>
      </table>
    </div>
  `;

  await atualizarFinanceiro();
}

async function atualizarFinanceiro() {
  const inicio = document.getElementById('fin-inicio')?.value;
  const fim    = document.getElementById('fin-fim')?.value;
  if (!inicio || !fim) return;

  const [resumo, detalhado] = await Promise.all([
    window.api.financeiro.resumo({ inicio, fim }),
    window.api.financeiro.detalhado({ inicio, fim }),
  ]);

  // ── KPIs ──────────────────────────────────────────────
  const kpisEl = document.getElementById('fin-kpis');
  if (kpisEl) {
    const recebido   = parseFloat(resumo?.recebido  || 0);
    const aReceber   = parseFloat(resumo?.a_receber || 0);
    const totalAg    = parseInt(resumo?.total_agendamentos || 0);
    const cancelados = parseInt(resumo?.cancelados   || 0);

    kpisEl.innerHTML = `
      ${kpiCard('✅ Recebido',       fmtMoeda(recebido),       'var(--color-success)')}
      ${kpiCard('🕐 A Receber',      fmtMoeda(aReceber),       'var(--color-primary)')}
      ${kpiCard('📋 Agendamentos',   totalAg,                  'var(--color-blue)')}
      ${kpiCard('❌ Cancelamentos',  cancelados,               'var(--color-error)')}
    `;
  }

  // ── Tabela ────────────────────────────────────────────
  const tbody = document.getElementById('fin-tbody');
  if (!tbody) return;

  if (!detalhado || detalhado.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="icon">💰</div>
        <p>Nenhum agendamento no período.</p>
      </div>
    </td></tr>`;
    return;
  }

  const STATUS_LABEL = {
    agendado:  '🕐 Agendado',
    concluido: '✅ Concluído',
    cancelado: '❌ Cancelado',
  };

  tbody.innerHTML = detalhado.map(ag => {
    const promoCell = ag.promocao
      ? `<span style="font-size:var(--text-xs);background:var(--color-success-highlight);color:var(--color-success);padding:2px 6px;border-radius:var(--radius-full)">
           🏷️ ${ag.promocao.promocao_nome} (−${fmtMoeda(ag.promocao.desconto_aplicado)})
         </span>`
      : `<span style="color:var(--color-text-faint);font-size:var(--text-xs)">—</span>`;

    return `
    <tr>
      <td>${fmtDataHora(ag.data_hora)}</td>
      <td>${ag.cliente_nome}</td>
      <td>${ag.procedimento_nome || '—'}</td>
      <td>${promoCell}</td>
      <td><span class="status-pill status-pill-${ag.status}" style="font-size:var(--text-xs)">${STATUS_LABEL[ag.status] ?? ag.status}</span></td>
      <td><strong>${fmtMoeda(ag.valor_cobrado)}</strong></td>
    </tr>`;
  }).join('');
}

function kpiCard(titulo, valor, cor) {
  return `
  <div class="card" style="text-align:center;padding:16px 12px;border-top:3px solid ${cor}">
    <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">${titulo}</div>
    <div style="font-size:var(--text-xl);font-weight:700;color:${cor}">${valor}</div>
  </div>`;
}

function finMesAtual() {
  const h = new Date();
  document.getElementById('fin-inicio').value = new Date(h.getFullYear(), h.getMonth(), 1).toISOString().slice(0, 10);
  document.getElementById('fin-fim').value    = new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().slice(0, 10);
  atualizarFinanceiro();
}

function finHoje() {
  const d = hoje();
  document.getElementById('fin-inicio').value = d;
  document.getElementById('fin-fim').value    = d;
  atualizarFinanceiro();
}

async function exportarFinanceiro() {
  const inicio = document.getElementById('fin-inicio')?.value;
  const fim    = document.getElementById('fin-fim')?.value;
  if (!inicio || !fim) return;

  const detalhado = await window.api.financeiro.detalhado({ inicio, fim });
  if (!detalhado || detalhado.length === 0) {
    toast('Nenhum dado para exportar.', 'error');
    return;
  }

  const linhas = [
    ['Data/Hora', 'Cliente', 'Procedimento', 'Promoção', 'Desconto', 'Status', 'Valor'].join(';'),
    ...detalhado.map(ag => [
      ag.data_hora,
      ag.cliente_nome,
      ag.procedimento_nome || '',
      ag.promocao?.promocao_nome || '',
      ag.promocao?.desconto_aplicado ?? '',
      ag.status,
      String(ag.valor_cobrado ?? '').replace('.', ','),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
  ];

  const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `financeiro_${inicio}_${fim}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exportado com sucesso!', 'success');
}