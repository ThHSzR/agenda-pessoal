async function renderAgendamentos() {
  const lista = await window.api.agendamentos.listar({});
  const page  = document.getElementById('page-agendamentos');

  page.innerHTML = `
    <div class="page-header">
      <h1>📋 Agendamentos</h1>
      <button class="btn btn-primary" onclick="abrirNovoAgendamento()">+ Novo Agendamento</button>
    </div>
    <div class="search-bar" style="align-items:center">
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

function renderLinhasAgend(lista) {
  if (lista.length === 0) return `<tr><td colspan="6"><div class="empty-state"><div class="icon">📋</div><p>Nenhum agendamento encontrado.</p></div></td></tr>`;
  return lista.map(a => `
    <tr>
      <td>${fmtDataHora(a.data_hora)}</td>
      <td><strong>${a.cliente_nome}</strong></td>
      <td>${a.procedimento_nome}</td>
      <td>${fmtMoeda(a.valor_cobrado)}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
      <td>
        <button class="btn btn-info btn-sm" onclick="editarAgendamento(${a.id})">✏️</button>
        ${a.status === 'agendado' ? `<button class="btn btn-success btn-sm" onclick="concluirAgend(${a.id})">✔ Concluir</button>` : ''}
        ${a.status === 'agendado' ? `<button class="btn btn-warning btn-sm" onclick="cancelarAgend(${a.id})">✕ Cancelar</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="excluirAgend(${a.id})">🗑️</button>
      </td>
    </tr>`).join('');
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

async function abrirNovoAgendamento(dataHoraPre) {
  const clientes      = await window.api.clientes.listar();
  const procedimentos = await window.api.procedimentos.listar();

  if (clientes.length === 0) { toast('Cadastre um cliente primeiro.', 'error'); return; }
  if (procedimentos.length === 0) { toast('Cadastre um procedimento primeiro.', 'error'); return; }

  document.getElementById('modal-agend-title').textContent = 'Novo Agendamento';
  document.getElementById('agend-id').value     = '';
  document.getElementById('agend-status').value = 'agendado';
  document.getElementById('agend-obs').value    = '';
  document.getElementById('agend-valor').value  = '';
  document.getElementById('agend-data-hora').value = dataHoraPre || '';

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('agend-procedimento').innerHTML =
    procedimentos.map(p => `<option value="${p.id}" data-valor="${p.valor}">${p.nome} (${p.duracao_min}min)</option>`).join('');

  preencherValor();
  abrirModal('modal-agendamento');
}

async function editarAgendamento(id) {
  const a = await window.api.agendamentos.buscar(id);
  if (!a) return;

  const clientes      = await window.api.clientes.listar();
  const procedimentos = await window.api.procedimentos.listar();

  document.getElementById('modal-agend-title').textContent = 'Editar Agendamento';
  document.getElementById('agend-id').value = a.id;

  document.getElementById('agend-cliente').innerHTML =
    clientes.map(c => `<option value="${c.id}" ${c.id===a.cliente_id?'selected':''}>${c.nome}</option>`).join('');
  document.getElementById('agend-procedimento').innerHTML =
    procedimentos.map(p => `<option value="${p.id}" data-valor="${p.valor}" ${p.id===a.procedimento_id?'selected':''}>${p.nome} (${p.duracao_min}min)</option>`).join('');

  document.getElementById('agend-data-hora').value = toInputDatetime(a.data_hora);
  document.getElementById('agend-valor').value     = a.valor_cobrado || '';
  document.getElementById('agend-status').value    = a.status;
  document.getElementById('agend-obs').value       = a.observacoes || '';

  abrirModal('modal-agendamento');
}

function preencherValor() {
  const sel   = document.getElementById('agend-procedimento');
  const opt   = sel.options[sel.selectedIndex];
  const valor = opt ? opt.dataset.valor : '';
  if (!document.getElementById('agend-id').value) {
    document.getElementById('agend-valor').value = valor || '';
  }
}

async function salvarAgendamento() {
  const clienteId  = document.getElementById('agend-cliente').value;
  const procId     = document.getElementById('agend-procedimento').value;
  const dataHora   = document.getElementById('agend-data-hora').value;

  if (!clienteId || !procId || !dataHora) { toast('Preencha os campos obrigatórios.', 'error'); return; }

  await window.api.agendamentos.salvar({
    id:              document.getElementById('agend-id').value || null,
    cliente_id:      parseInt(clienteId),
    procedimento_id: parseInt(procId),
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

async function concluirAgend(id) {
  await window.api.agendamentos.status({ id, status: 'concluido' });
  toast('Agendamento concluído!', 'success');
  renderAgendamentos();
}

async function cancelarAgend(id) {
  if (!confirm('Cancelar este agendamento?')) return;
  await window.api.agendamentos.status({ id, status: 'cancelado' });
  toast('Agendamento cancelado.', 'info');
  renderAgendamentos();
}

async function excluirAgend(id) {
  if (!confirm('Excluir este agendamento?')) return;
  await window.api.agendamentos.excluir(id);
  toast('Agendamento excluído.', 'info');
  renderAgendamentos();
}
