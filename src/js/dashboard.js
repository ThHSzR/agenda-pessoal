async function renderDashboard() {
  const page = document.getElementById('page-dashboard');
  if (!page) return;

  page.innerHTML = `
    <div class="page-header">
      <h1>📊 Dashboard</h1>
    </div>
    <div id="dash-kpis" class="kpi-grid">
      <div class="kpi-card" style="text-align:center">
        <div class="kpi-label">Carregando...</div>
        <div class="kpi-value">⏳</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px">
      <div class="card">
        <div class="card-header">📅 Agendamentos de Hoje</div>
        <div class="card-body" id="dash-agend-hoje" style="max-height:320px;overflow-y:auto">
          <div class="empty-state"><div class="icon">⏳</div><p>Carregando...</p></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">🏷️ Promoções Ativas</div>
        <div class="card-body" id="dash-promos" style="max-height:320px;overflow-y:auto">
          <div class="empty-state"><div class="icon">⏳</div><p>Carregando...</p></div>
        </div>
      </div>
    </div>
  `;

  try {
    const stats = await window.api.dashboard.stats();

    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card" style="text-align:center;border-top:3px solid var(--info)">
        <div class="kpi-label">📅 Agendamentos Hoje</div>
        <div class="kpi-value" style="color:var(--info)">${stats.agendamentos_hoje}</div>
      </div>
      <div class="kpi-card" style="text-align:center;border-top:3px solid var(--rosa-botao)">
        <div class="kpi-label">👤 Total Clientes</div>
        <div class="kpi-value" style="color:var(--rosa-botao)">${stats.total_clientes}</div>
      </div>
      <div class="kpi-card" style="text-align:center;border-top:3px solid var(--success)">
        <div class="kpi-label">💰 Recebido (Mês)</div>
        <div class="kpi-value" style="color:var(--success)">${fmtMoeda(stats.recebido_mes)}</div>
      </div>
      <div class="kpi-card" style="text-align:center;border-top:3px solid var(--warning)">
        <div class="kpi-label">🏷️ Promoções Ativas</div>
        <div class="kpi-value" style="color:var(--warning)">${stats.promos_ativas}</div>
      </div>
    `;

    // Agendamentos de hoje
    const hojeStr = hoje();
    const agendHoje = await window.api.agendamentos.listar({ data: hojeStr });
    const divAgend = document.getElementById('dash-agend-hoje');
    if (agendHoje.length === 0) {
      divAgend.innerHTML = '<div class="empty-state"><div class="icon">📅</div><p>Nenhum agendamento hoje.</p></div>';
    } else {
      divAgend.innerHTML = agendHoje.map(ag => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <strong style="font-size:13px">${ag.cliente_nome}</strong>
            <div style="font-size:11px;color:var(--text-muted)">${ag.procedimento_nome || '—'}</div>
          </div>
          <div style="text-align:right">
            <span style="font-size:12px;font-weight:600">${fmtHora(ag.data_hora)}</span>
            <div><span class="badge badge-${ag.status}" style="font-size:10px">${ag.status}</span></div>
          </div>
        </div>
      `).join('');
    }

    // Promoções ativas (se gerente)
    const divPromos = document.getElementById('dash-promos');
    try {
      const promos = await window.api.promocoes.listar();
      const ativas = promos.filter(p => p.ativa);
      if (ativas.length === 0) {
        divPromos.innerHTML = '<div class="empty-state"><div class="icon">🏷️</div><p>Nenhuma promoção ativa.</p></div>';
      } else {
        divPromos.innerHTML = ativas.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <div>
              <strong style="font-size:13px">${p.nome}</strong>
              <div style="font-size:11px;color:var(--text-muted)">${_fmtTipoDesconto(p.tipo_desconto, p.valor_desconto)}</div>
            </div>
            <div style="text-align:right;font-size:11px;color:var(--text-muted)">
              ${p.regras?.length || 0} regra(s)
            </div>
          </div>
        `).join('');
      }
    } catch (_) {
      divPromos.innerHTML = '<div class="empty-state"><div class="icon">🔒</div><p>Acesso restrito a gerentes.</p></div>';
    }
  } catch (e) {
    console.error('Erro ao carregar dashboard:', e);
  }
}

function fmtHora(dataHora) {
  if (!dataHora) return '—';
  const d = new Date(String(dataHora).replace(' ', 'T'));
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
