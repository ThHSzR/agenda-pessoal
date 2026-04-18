async function renderAgendamentos() {
  const lista = await window.api.agendamentos.listar({});
  const page = document.getElementById('page-agendamentos');

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
  const agora = new Date();
  const dataAg = new Date(a.data_hora.replace(' ', 'T'));
  if (dataAg < agora) return 'atrasado';
  return a.status;
}

const STATUS_CONFIG = {
  agendado: { label: 'Agendado', emoji: '🕐' },
  atrasado: { label: 'Atrasado', emoji: '⚠️' },
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
  <button class="btn btn-whatsapp btn-sm"
    onclick="abrirWhatsApp('${a.cliente_telefone}', '${a.data_hora}')"
    title="Confirmar via WhatsApp">💬</button>
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
  dropdown.style.top = (rect.bottom + 4) + 'px';
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
  const sel = document.getElementById('agend-variante');
  if (!procId) { wrap.classList.add('hidden'); return; }

  const procs = await window.api.procedimentos.todos();
  const proc = procs.find(p => p.id === parseInt(procId));
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

// ── estado interno dos procs do modal ────────────────────────
let _agendProcsModal = []; // [{procId, varianteId, valor, duracao, nomeProc, nomeVar}]
let _agendClienteTelefone = null;
let _agendDataHora = null;

function _isGerente() {
  const s = window._session;
  return s && (s.is_admin || s.cargo === 'gerente');
}

// Recalcula totais e preenche o campo valor (se operador, readonly)
function _agendRecalcular() {
  let totalValor = 0, totalDur = 0;
  _agendProcsModal.forEach(p => {
    totalValor += parseFloat(p.valor) || 0;
    totalDur   += parseInt(p.duracao) || 0;
  });
  document.getElementById('agend-total-valor').textContent   = fmtMoeda(totalValor);
  document.getElementById('agend-total-duracao').textContent = totalDur + ' min';

  const campoValor = document.getElementById('agend-valor');
  if (!_isGerente()) {
    campoValor.value    = totalValor.toFixed(2);
    campoValor.readOnly = true;
    campoValor.style.background = 'var(--color-surface-offset)';
    campoValor.style.cursor     = 'not-allowed';
    document.getElementById('agend-valor-label').textContent = 'Valor cobrado (R$) 🔒';
  } else {
    campoValor.readOnly = false;
    campoValor.style.background = '';
    campoValor.style.cursor     = '';
    document.getElementById('agend-valor-label').textContent = 'Valor cobrado (R$) ✏️';
    // Só preenche automático se campo estiver vazio
    if (!campoValor.value) campoValor.value = totalValor.toFixed(2);
  }
}

async function _agendAdicionarProc(procIdSel = null, varianteIdSel = null) {
  const procs = await window.api.procedimentos.listar();
  const idx   = _agendProcsModal.length;

  const linha = document.createElement('div');
  linha.id    = `agend-proc-linha-${idx}`;
  linha.style = 'display:flex;gap:8px;align-items:center;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:8px';

  linha.innerHTML = `
    <select id="agend-proc-sel-${idx}" style="flex:2"
      onchange="_agendOnProcChange(${idx})">
      ${procs.map(p => `<option value="${p.id}" data-valor="${p.valor}" data-duracao="${p.duracao_min}" data-tem-variantes="${p.tem_variantes}"
        ${p.id === procIdSel ? 'selected' : ''}>${p.nome}</option>`).join('')}
    </select>
    <select id="agend-var-sel-${idx}" style="flex:2;display:none"
      onchange="_agendOnVarChange(${idx})"></select>
    <span id="agend-proc-info-${idx}" style="flex:1;font-size:var(--text-sm);color:var(--color-text-muted)"></span>
    <button class="btn btn-danger btn-sm" onclick="_agendRemoverProc(${idx})">✕</button>
  `;

  document.getElementById('agend-procs-lista').appendChild(linha);
  _agendProcsModal.push({ procId: null, varianteId: null, valor: 0, duracao: 0 });

  await _agendOnProcChange(idx, varianteIdSel);
}

async function _agendOnProcChange(idx, varianteIdSel = null) {
  const sel  = document.getElementById(`agend-proc-sel-${idx}`);
  const opt  = sel.options[sel.selectedIndex];
  const procId     = parseInt(sel.value);
  const temVar     = opt.dataset.temVariantes === '1';
  const varSel     = document.getElementById(`agend-var-sel-${idx}`);

  if (temVar) {
    const vars = await window.api.variantes.listar(procId);
    varSel.innerHTML = vars.map(v =>
      `<option value="${v.id}" data-valor="${v.valor}" data-duracao="${v.duracao_min}"
        ${v.id === varianteIdSel ? 'selected' : ''}>${v.nome} — ${fmtMoeda(v.valor)}</option>`
    ).join('');
    varSel.style.display = '';
    _agendOnVarChange(idx);
  } else {
    varSel.style.display = 'none';
    varSel.innerHTML     = '';
    const valor   = parseFloat(opt.dataset.valor)   || 0;
    const duracao = parseInt(opt.dataset.duracao)    || 0;
    _agendProcsModal[idx] = { procId, varianteId: null, valor, duracao };
    document.getElementById(`agend-proc-info-${idx}`).textContent =
      `${duracao}min · ${fmtMoeda(valor)}`;
    _agendRecalcular();
  }
}

function _agendOnVarChange(idx) {
  const varSel = document.getElementById(`agend-var-sel-${idx}`);
  const procSel = document.getElementById(`agend-proc-sel-${idx}`);
  const vOpt   = varSel.options[varSel.selectedIndex];
  const procId    = parseInt(procSel.value);
  const varianteId = parseInt(varSel.value);
  const valor   = parseFloat(vOpt?.dataset.valor)   || 0;
  const duracao = parseInt(vOpt?.dataset.duracao)    || 0;
  _agendProcsModal[idx] = { procId, varianteId, valor, duracao };
  document.getElementById(`agend-proc-info-${idx}`).textContent =
    `${duracao}min · ${fmtMoeda(valor)}`;
  _agendRecalcular();
}

function _agendRemoverProc(idx) {
  const linha = document.getElementById(`agend-proc-linha-${idx}`);
  if (linha) linha.remove();
  _agendProcsModal[idx] = null;
  _agendRecalcular();
}

function _agendWhatsApp() {
  abrirWhatsApp(_agendClienteTelefone, _agendDataHora);
}

async function abrirNovoAgendamento(dataHoraPre) {
  const clientes = await window.api.clientes.listar();
  if (clientes.length === 0) { toast('Cadastre um cliente primeiro.', 'error'); return; }

  document.getElementById('modal-agend-title').textContent = 'Novo Agendamento';
  document.getElementById('agend-id').value        = '';
  document.getElementById('agend-status').value    = 'agendado';
  document.getElementById('agend-obs').value       = '';
  document.getElementById('agend-valor').value     = '';
  document.getElementById('agend-data-hora').value = dataHoraPre || '';
  document.getElementById('agend-procs-lista').innerHTML = '';
  document.getElementById('agend-whatsapp-btn').style.display = 'none';

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}" data-tel="${c.telefone || ''}">${c.nome}</option>`).join('');

  _agendProcsModal = [];
  _agendClienteTelefone = null;
  _agendDataHora = null;

  await _agendAdicionarProc();
  _agendRecalcular();
  abrirModal('modal-agendamento');
}

async function editarAgendamento(id) {
  const a = await window.api.agendamentos.buscar(id);
  if (!a) return;

  const clientes = await window.api.clientes.listar();

  document.getElementById('modal-agend-title').textContent = 'Editar Agendamento';
  document.getElementById('agend-id').value        = a.id;
  document.getElementById('agend-data-hora').value = toInputDatetime(a.data_hora);
  document.getElementById('agend-status').value    = a.status;
  document.getElementById('agend-obs').value       = a.observacoes || '';
  document.getElementById('agend-valor').value     = a.valor_cobrado || '';
  document.getElementById('agend-procs-lista').innerHTML = '';

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}" data-tel="${c.telefone || ''}"
      ${c.id === a.cliente_id ? 'selected' : ''}>${c.nome}</option>`).join('');

  // Botão WhatsApp no modal de edição
  _agendClienteTelefone = a.cliente_telefone;
  _agendDataHora        = a.data_hora;
  const btnWa = document.getElementById('agend-whatsapp-btn');
  btnWa.style.display = _agendClienteTelefone ? '' : 'none';

  _agendProcsModal = [];
  await _agendAdicionarProc(a.procedimento_id, a.variante_id);
  _agendRecalcular();
  abrirModal('modal-agendamento');
}

async function salvarAgendamento() {
  const clienteId = document.getElementById('agend-cliente').value;
  const dataHora  = document.getElementById('agend-data-hora').value;
  if (!clienteId || !dataHora) { toast('Preencha os campos obrigatórios.', 'error'); return; }

  const procsValidos = _agendProcsModal.filter(Boolean);
  if (procsValidos.length === 0) { toast('Adicione ao menos um procedimento.', 'error'); return; }

  // Usa o primeiro procedimento/variante como principal (compatível com DB atual)
  const primeiro = procsValidos[0];

  await window.api.agendamentos.salvar({
    id:             document.getElementById('agend-id').value || null,
    cliente_id:     parseInt(clienteId),
    procedimento_id: primeiro.procId,
    variante_id:    primeiro.varianteId || null,
    data_hora:      toDbDatetime(dataHora),
    status:         document.getElementById('agend-status').value,
    valor_cobrado:  parseFloat(document.getElementById('agend-valor').value) || 0,
    observacoes:    document.getElementById('agend-obs').value,
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