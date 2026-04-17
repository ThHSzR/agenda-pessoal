async function renderProcedimentos() {
  const lista = await window.api.procedimentos.todos();
  const page  = document.getElementById('page-procedimentos');

  page.innerHTML = `
    <div class="page-header">
      <h1>💆 Procedimentos</h1>
      <button class="btn btn-primary" onclick="abrirNovoProcedimento()">+ Novo Procedimento</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr><th>Nome</th><th>Duração</th><th>Valor Padrão</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          ${lista.length === 0 ? `<tr><td colspan="5"><div class="empty-state"><div class="icon">💆</div><p>Nenhum procedimento cadastrado.</p></div></td></tr>` :
            lista.map(p => `
              <tr>
                <td><strong>${p.nome}</strong>${p.descricao ? `<br><small style="color:var(--text-muted)">${p.descricao}</small>` : ''}</td>
                <td>${p.duracao_min} min</td>
                <td>${fmtMoeda(p.valor)}</td>
                <td><span class="badge ${p.ativo ? 'badge-concluido' : 'badge-cancelado'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                  <button class="btn btn-info btn-sm" onclick="editarProcedimento(${p.id})">✏️ Editar</button>
                  <button class="btn btn-danger btn-sm" onclick="inativarProcedimento(${p.id})">${p.ativo ? '🚫 Inativar' : '✅ Ativar'}</button>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function abrirNovoProcedimento() {
  document.getElementById('modal-proc-title').textContent = 'Novo Procedimento';
  document.getElementById('proc-id').value       = '';
  document.getElementById('proc-nome').value     = '';
  document.getElementById('proc-duracao').value  = '60';
  document.getElementById('proc-valor').value    = '';
  document.getElementById('proc-desc').value     = '';
  abrirModal('modal-procedimento');
}

async function editarProcedimento(id) {
  const lista = await window.api.procedimentos.todos();
  const p = lista.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-proc-title').textContent = 'Editar Procedimento';
  document.getElementById('proc-id').value      = p.id;
  document.getElementById('proc-nome').value    = p.nome;
  document.getElementById('proc-duracao').value = p.duracao_min;
  document.getElementById('proc-valor').value   = p.valor;
  document.getElementById('proc-desc').value    = p.descricao || '';
  abrirModal('modal-procedimento');
}

async function salvarProcedimento() {
  const nome = document.getElementById('proc-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  await window.api.procedimentos.salvar({
    id:          document.getElementById('proc-id').value || null,
    nome,
    duracao_min: parseInt(document.getElementById('proc-duracao').value) || 60,
    valor:       parseFloat(document.getElementById('proc-valor').value) || 0,
    descricao:   document.getElementById('proc-desc').value,
    ativo:       1
  });
  fecharModal('modal-procedimento');
  toast('Procedimento salvo!', 'success');
  renderProcedimentos();
}

async function inativarProcedimento(id) {
  const lista = await window.api.procedimentos.todos();
  const p = lista.find(x => x.id === id);
  if (!p) return;
  await window.api.procedimentos.salvar({ ...p, ativo: p.ativo ? 0 : 1 });
  toast(p.ativo ? 'Procedimento inativado.' : 'Procedimento ativado.', 'info');
  renderProcedimentos();
}
