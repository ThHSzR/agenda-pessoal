async function renderAgendamentos() {
  const lista = await window.api.agendamentos.listar({});
  const page  = document.getElementById('page-agendamentos');

  page.innerHTML = `
    <div class="page-header">
      <h1>📋 Agendamentos</h1>
      <button class="btn btn-primary" onclick="abrirNovoAgendamento()">+ Novo Agendamento</button>
    </div>
    <div class="search-bar" style="align-items:center">
      <button class="btn btn-secondary btn-sm" onclick="agendHoje()">Hoje</button>
      <input type="date" id="filtro-data" value="${hoje()}" onchange="filtrarAgendPorData()"/>
      <button class="btn btn-secondary btn-sm" onclick="limparFiltroAgend()">Todos</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr><th>Data/Hora</th><th>Cliente</th><th>Procedimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody id="tbody-agend">
          ${renderLinhasAgend(lista)}
        </tbody>
      </table>
    </div>`;
}

function calcularStatus(a) {
  if (a.status === 'concluido' || a.status === 'cancelado') return a.status;
  const agora  = new Date();
  const dataAg = new Date(a.data_hora.replace(' ', 'T'));
  if (dataAg < agora) return 'atrasado';
  return a.status;
}

const STATUS_CONFIG = {
  agendado:  { label: 'Agendado',  emoji: '🕐' },
  atrasado:  { label: 'Atrasado',  emoji: '⚠️' },
  concluido: { label: 'Concluído', emoji: '✅' },
  cancelado: { label: 'Cancelado', emoji: '❌' },
};

function renderLinhasAgend(lista) {
  if (lista.length === 0)
    return `<tr><td colspan="6"><div class="empty-state"><div class="icon">📋</div><p>Nenhum agendamento encontrado.</p></div></td></tr>`;
  return lista.map(a => {
    const statusReal = calcularStatus(a);
    const cfg = STATUS_CONFIG[statusReal];
    const nomeProcedimento = a.variante_nome
      ? `${a.procedimento_nome} — ${a.variante_nome}`
      : a.procedimento_nome;
    const opcoesHtml = Object.entries(STATUS_CONFIG).map(([val, c]) => `
      <div class="status-dropdown-item" onclick="alterarStatusAgend(${a.id},'${val}');fecharTodosDropdowns()">
        <span class="status-dot dot-${val}"></span> ${c.emoji} ${c.label}
      </div>`).join('');
    return `
    <tr>
      <td>${fmtDataHora(a.data_hora)}</td>
      <td><strong>${a.cliente_nome}</strong></td>
      <td>${nomeProcedimento}</td>
      <td>${fmtMoeda(a.valor_cobrado)}</td>
      <td>
        <div class="status-wrapper">
          <div class="status-pill status-pill-${statusReal}" onclick="toggleStatusDropdown(this)">
            ${cfg.emoji} ${cfg.label}
          </div>
          <div class="status-dropdown">${opcoesHtml}</div>
        </div>
      </td>
      <td>
        <button class="btn btn-info btn-sm" onclick="editarAgendamento(${a.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="excluirAgend(${a.id})">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function toggleStatusDropdown(pill) {
  fecharTodosDropdowns();
  const dropdown = pill.nextElementSibling;
  const rect = pill.getBoundingClientRect();
  dropdown.style.top  = (rect.bottom + 4) + 'px';
  dropdown.style.left = rect.left + 'px';
  dropdown.classList.add('open');
  setTimeout(() => document.addEventListener('click', fecharTodosDropdowns, { once: true }), 10);
}

function fecharTodosDropdowns() {
  document.querySelectorAll('.status-dropdown.open').forEach(d => d.classList.remove('open'));
}

async function alterarStatusAgend(id, status) {
  await window.api.agendamentos.status({ id, status });
  toast(`Status atualizado para "${status}".`, 'success');
  const filtroData = document.getElementById('filtro-data')?.value;
  if (filtroData) {
    filtrarAgendPorData();
  } else {
    const lista = await window.api.agendamentos.listar({});
    document.getElementById('tbody-agend').innerHTML = renderLinhasAgend(lista);
  }
}

async function filtrarAgendPorData() {
  const data = document.getElementById('filtro-data').value;
  const lista = await window.api.agendamentos.listar({ data });
  document.getElementById('tbody-agend').innerHTML = renderLinhasAgend(lista);
}

async function limparFiltroAgend() {
  document.getElementById('filtro-data').value = '';
  const lista = await window.api.agendamentos.listar({});
  document.getElementById('tbody-agend').innerHTML = renderLinhasAgend(lista);
}

// ── modal agendamento ─────────────────────────────────────────
async function _carregarVariantesAgend(procId, varianteSelecionada) {
  const wrap = document.getElementById('agend-variante-wrap');
  const sel  = document.getElementById('agend-variante');
  if (!procId) { wrap.classList.add('hidden'); return; }

  const procs = await window.api.procedimentos.todos();
  const proc  = procs.find(p => p.id === parseInt(procId));
  if (!proc?.tem_variantes) { wrap.classList.add('hidden'); return; }

  const variantes = await window.api.variantes.listar(procId);
  if (variantes.length === 0) { wrap.classList.add('hidden'); return; }

  sel.innerHTML = variantes.map(v =>
    `<option value="${v.id}" data-valor="${v.valor}" data-duracao="${v.duracao_min}"
      ${v.id === varianteSelecionada ? 'selected' : ''}>
      ${v.nome} — ${v.duracao_min}min · ${fmtMoeda(v.valor)}
    </option>`
  ).join('');
  wrap.classList.remove('hidden');
  _preencherValorVariante();
}

function _preencherValorVariante() {
  const wrap = document.getElementById('agend-variante-wrap');
  if (!wrap.classList.contains('hidden')) {
    const sel = document.getElementById('agend-variante');
    const opt = sel.options[sel.selectedIndex];
    if (opt && !document.getElementById('agend-id').value) {
      document.getElementById('agend-valor').value = opt.dataset.valor || '';
    }
  }
}

function preencherValor() {
  const wrap = document.getElementById('agend-variante-wrap');
  if (!wrap?.classList.contains('hidden')) return; // valor vem da variante
  const sel = document.getElementById('agend-procedimento');
  const opt = sel.options[sel.selectedIndex];
  if (opt && !document.getElementById('agend-id').value)
    document.getElementById('agend-valor').value = opt.dataset.valor || '';
}

async function abrirNovoAgendamento(dataHoraPre) {
  const clientes = await window.api.clientes.listar();
  const procs    = await window.api.procedimentos.listar();

  if (clientes.length === 0) { toast('Cadastre um cliente primeiro.', 'error'); return; }
  if (procs.length === 0)    { toast('Cadastre um procedimento primeiro.', 'error'); return; }

  document.getElementById('modal-agend-title').textContent = 'Novo Agendamento';
  document.getElementById('agend-id').value        = '';
  document.getElementById('agend-status').value    = 'agendado';
  document.getElementById('agend-obs').value       = '';
  document.getElementById('agend-valor').value     = '';
  document.getElementById('agend-data-hora').value = dataHoraPre || '';

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('agend-procedimento').innerHTML =
    procs.map(p => `<option value="${p.id}" data-valor="${p.valor}" data-tem-variantes="${p.tem_variantes}">${p.nome}</option>`).join('');

  const primeiroProcId = procs[0]?.id;
  await _carregarVariantesAgend(primeiroProcId, null);
  if (document.getElementById('agend-variante-wrap').classList.contains('hidden'))
    preencherValor();

  abrirModal('modal-agendamento');
}

async function editarAgendamento(id) {
  const a = await window.api.agendamentos.buscar(id);
  if (!a) return;

  const clientes = await window.api.clientes.listar();
  const procs    = await window.api.procedimentos.listar();

  document.getElementById('modal-agend-title').textContent = 'Editar Agendamento';
  document.getElementById('agend-id').value = a.id;

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}" ${c.id===a.cliente_id?'selected':''}>${c.nome}</option>`).join('');
  document.getElementById('agend-procedimento').innerHTML =
    procs.map(p => `<option value="${p.id}" data-valor="${p.valor}" data-tem-variantes="${p.tem_variantes}" ${p.id===a.procedimento_id?'selected':''}>${p.nome}</option>`).join('');

  document.getElementById('agend-data-hora').value = toInputDatetime(a.data_hora);
  document.getElementById('agend-valor').value     = a.valor_cobrado || '';
  document.getElementById('agend-status').value    = a.status;
  document.getElementById('agend-obs').value       = a.observacoes || '';

  await _carregarVariantesAgend(a.procedimento_id, a.variante_id);
  abrirModal('modal-agendamento');
}

async function salvarAgendamento() {
  const clienteId = document.getElementById('agend-cliente').value;
  const procId    = document.getElementById('agend-procedimento').value;
  const dataHora  = document.getElementById('agend-data-hora').value;
  if (!clienteId || !procId || !dataHora) { toast('Preencha os campos obrigatórios.', 'error'); return; }

  const wrapVar   = document.getElementById('agend-variante-wrap');
  const varianteId = !wrapVar.classList.contains('hidden')
    ? parseInt(document.getElementById('agend-variante').value) || null
    : null;

  await window.api.agendamentos.salvar({
    id:              document.getElementById('agend-id').value || null,
    cliente_id:      parseInt(clienteId),
    procedimento_id: parseInt(procId),
    variante_id:     varianteId,
    data_hora:       toDbDatetime(dataHora),
    status:          document.getElementById('agend-status').value,
    valor_cobrado:   parseFloat(document.getElementById('agend-valor').value) || 0,
    observacoes:     document.getElementById('agend-obs').value,
  });

  fecharModal('modal-agendamento');
  toast('Agendamento salvo!', 'success');
  const paginaAtiva = document.querySelector('.page:not(.hidden)');
  if (paginaAtiva?.id === 'page-agendamentos') renderAgendamentos();
  if (paginaAtiva?.id === 'page-calendario')   renderCalendario();
}

async function excluirAgend(id) {
  if (!confirm('Excluir este agendamento?')) return;
  await window.api.agendamentos.excluir(id);
  toast('Agendamento excluído.', 'info');
  renderAgendamentos();
}

function agendHoje() {
  document.getElementById('filtro-data').value = hoje();
  filtrarAgendPorData();
}