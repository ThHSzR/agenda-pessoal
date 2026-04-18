async function renderUsuarios() {
  const lista = await window.api.usuarios.listar();
  const page  = document.getElementById('page-usuarios');
  if (!page) return;

  page.innerHTML = `
    <div class="page-header">
      <h1>⚙️ Usuários</h1>
      <button class="btn btn-primary" onclick="abrirNovoUsuario()">+ Novo Usuário</button>
    </div>
    <div class="card">
      <table>
        <thead>
          <tr><th>Usuário</th><th>Admin</th><th>Criado em</th><th>Ações</th></tr>
        </thead>
        <tbody>
          ${lista.map(u => `
            <tr>
              <td><strong>${u.usuario}</strong></td>
              <td>${u.is_admin ? '✅ Sim' : 'Não'}</td>
              <td>${u.criado_em || '-'}</td>
              <td>
                <button class="btn btn-info btn-sm" onclick="abrirTrocarSenha(${u.id}, '${u.usuario}')">🔑 Senha</button>
                <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${u.id}, '${u.usuario}')">🗑️</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal novo usuário -->
    <div id="modal-usuario" class="modal-overlay hidden">
      <div class="modal">
        <div class="modal-header">
          <h2>Novo Usuário</h2>
          <button class="modal-close" onclick="fecharModal('modal-usuario')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Usuário *</label>
            <input type="text" id="nou-usuario" autocomplete="off"/>
          </div>
          <div class="form-group">
            <label>Senha * (mín. 6 caracteres)</label>
            <input type="password" id="nou-senha" autocomplete="new-password"/>
          </div>
          <div class="form-group">
            <label>Confirmar Senha *</label>
            <input type="password" id="nou-senha2" autocomplete="new-password"/>
          </div>
          <div class="check-group" style="margin-top:12px">
            <label>
              <input type="checkbox" id="nou-admin"/> É administrador
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="fecharModal('modal-usuario')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarUsuario()">💾 Salvar</button>
        </div>
      </div>
    </div>

    <!-- Modal trocar senha -->
    <div id="modal-senha" class="modal-overlay hidden">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-senha-title">Trocar Senha</h2>
          <button class="modal-close" onclick="fecharModal('modal-senha')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="troca-id"/>
          <div class="form-group">
            <label>Nova Senha * (mín. 6 caracteres)</label>
            <input type="password" id="troca-senha" autocomplete="new-password"/>
          </div>
          <div class="form-group">
            <label>Confirmar Nova Senha *</label>
            <input type="password" id="troca-senha2" autocomplete="new-password"/>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="fecharModal('modal-senha')">Cancelar</button>
          <button class="btn btn-primary" onclick="confirmarTrocarSenha()">💾 Salvar</button>
        </div>
      </div>
    </div>
  `;
}

function abrirNovoUsuario() {
  document.getElementById('nou-usuario').value = '';
  document.getElementById('nou-senha').value   = '';
  document.getElementById('nou-senha2').value  = '';
  document.getElementById('nou-admin').checked = false;
  abrirModal('modal-usuario');
}

async function salvarUsuario() {
  const usuario  = document.getElementById('nou-usuario').value.trim();
  const senha    = document.getElementById('nou-senha').value;
  const senha2   = document.getElementById('nou-senha2').value;
  const is_admin = document.getElementById('nou-admin').checked;

  if (!usuario) { toast('Informe o usuário', 'error'); return; }
  if (senha.length < 6) { toast('Senha mínima: 6 caracteres', 'error'); return; }
  if (senha !== senha2) { toast('As senhas não conferem', 'error'); return; }

  const res = await window.api.usuarios.criar({ usuario, senha, is_admin });
  if (res?.erro) { toast(res.erro, 'error'); return; }

  fecharModal('modal-usuario');
  toast('Usuário criado!', 'success');
  renderUsuarios();
}

function abrirTrocarSenha(id, nome) {
  document.getElementById('troca-id').value    = id;
  document.getElementById('troca-senha').value  = '';
  document.getElementById('troca-senha2').value = '';
  document.getElementById('modal-senha-title').textContent = `Trocar senha — ${nome}`;
  abrirModal('modal-senha');
}

async function confirmarTrocarSenha() {
  const id     = document.getElementById('troca-id').value;
  const senha  = document.getElementById('troca-senha').value;
  const senha2 = document.getElementById('troca-senha2').value;

  if (senha.length < 6) { toast('Senha mínima: 6 caracteres', 'error'); return; }
  if (senha !== senha2)  { toast('As senhas não conferem', 'error'); return; }

  const res = await window.api.usuarios.trocarSenha(id, senha);
  if (res?.erro) { toast(res.erro, 'error'); return; }

  fecharModal('modal-senha');
  toast('Senha alterada!', 'success');
}

async function excluirUsuario(id, nome) {
  if (!confirm(`Excluir o usuário "${nome}"?`)) return;
  const res = await window.api.usuarios.excluir(id);
  if (res?.erro) { toast(res.erro, 'error'); return; }
  toast('Usuário removido', 'success');
  renderUsuarios();
}