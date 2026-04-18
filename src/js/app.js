// Verificação de sessão + controle de admin
(async () => {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (!res.ok) { window.location.href = '/login.html'; return; }
  const { usuario, is_admin } = await res.json();

  // Mostra nome do usuário logado na sidebar
  const brand = document.querySelector('#sidebar .brand');
  if (brand) {
    const span = document.createElement('div');
    span.style = 'font-size:0.75rem;color:#888;margin-top:4px';
    span.textContent = '👤 ' + usuario;
    brand.appendChild(span);
  }

  // Botão de logout
  const nav = document.querySelector('#sidebar nav');
  if (nav) {
    const sep = document.createElement('hr');
    sep.style = 'border:none;border-top:1px solid #ddd;margin:8px 0';
    nav.appendChild(sep);

    if (is_admin) {
      const btnAdmin = document.createElement('a');
      btnAdmin.className = 'nav-link';
      btnAdmin.dataset.page = 'usuarios';
      btnAdmin.innerHTML = '<span class="icon">⚙️</span> Usuários';
      nav.appendChild(btnAdmin);
    }

    const btnLogout = document.createElement('a');
    btnLogout.className = 'nav-link';
    btnLogout.style = 'color:#dc2626';
    btnLogout.innerHTML = '<span class="icon">🚪</span> Sair';
    btnLogout.onclick = async () => {
      await window.api.auth.logout();
      location.href = '/login.html';
    };
    nav.appendChild(btnLogout);
  }

  // Registra a página de usuários se for admin
  if (is_admin) {
    document.getElementById('page-clientes').insertAdjacentHTML('afterend',
      '<div id="page-usuarios" class="page hidden"></div>'
    );
  }
})();

const paginas = {
  calendario:    renderCalendario,
  agendamentos:  renderAgendamentos,
  clientes:      renderClientes,
  procedimentos: renderProcedimentos,
  financeiro:    renderFinanceiro,
};

let paginaAtual = 'calendario';

function navegar(pagina) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

  document.getElementById(`page-${pagina}`).classList.remove('hidden');
  document.querySelector(`[data-page="${pagina}"]`).classList.add('active');

  paginaAtual = pagina;
  paginas[pagina]();
}

document.querySelectorAll('.nav-link').forEach(a => {
  a.addEventListener('click', () => navegar(a.dataset.page));
});

// Inicializa na página do calendário
navegar('calendario');
