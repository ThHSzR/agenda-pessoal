const paginas = {
  dashboard:     renderDashboard,
  calendario:    renderCalendario,
  agendamentos:  renderAgendamentos,
  clientes:      renderClientes,
  procedimentos: renderProcedimentos,
  financeiro:    renderFinanceiro,
  promocoes:     renderPromocoes,
  usuarios:      renderUsuarios,
};

let paginaAtual = 'dashboard';

function navegar(pagina) {
  const pageEl = document.getElementById(`page-${pagina}`);
  const navEl  = document.querySelector(`[data-page="${pagina}"]`);
  if (!pageEl) return;

  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

  pageEl.classList.remove('hidden');
  if (navEl) navEl.classList.add('active');

  paginaAtual = pagina;
  if (paginas[pagina]) paginas[pagina]();
}

// Registra cliques nos links estáticos do HTML
document.querySelectorAll('.nav-link').forEach(a => {
  a.addEventListener('click', () => navegar(a.dataset.page));
});

// Verificação de sessão + montagem dinâmica da sidebar
(async () => {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (!res.ok) { window.location.href = '/login.html'; return; }

  const { usuario, is_admin, cargo } = await res.json();
  window._session = { usuario, is_admin, cargo };

  // Esconde abas restritas para operadores
  if (!is_admin && cargo !== 'gerente') {
    ['procedimentos', 'financeiro', 'promocoes'].forEach(p => {
      const link = document.querySelector(`[data-page="${p}"]`);
      if (link) link.style.display = 'none';
    });
  }

  const nav = document.querySelector('#sidebar nav');
  if (nav) {
    const sep = document.createElement('hr');
    sep.style = 'border:none;border-top:1px solid rgba(255,255,255,0.2);margin:8px 0';
    nav.appendChild(sep);

    // Botão Usuários — só para admin
    if (is_admin) {
      if (!document.getElementById('page-usuarios')) {
        const main = document.getElementById('content');
        const div = document.createElement('div');
        div.id = 'page-usuarios';
        div.className = 'page hidden';
        main.appendChild(div);
      }
      const btnAdmin = document.createElement('a');
      btnAdmin.className = 'nav-link';
      btnAdmin.dataset.page = 'usuarios';
      btnAdmin.innerHTML = '<span class="icon">⚙️</span> Usuários';
      btnAdmin.addEventListener('click', () => navegar('usuarios'));
      nav.appendChild(btnAdmin);
    }

    // Botão Sair — todos os cargos veem
    const btnLogout = document.createElement('a');
    btnLogout.className = 'nav-link';
    btnLogout.style = 'color:rgba(255,200,200,0.9);cursor:pointer';
    btnLogout.innerHTML = '<span class="icon">🚪</span> Sair';
    btnLogout.addEventListener('click', async () => {
      await window.api.auth.logout();
      location.href = '/login.html';
    });
    nav.appendChild(btnLogout);
  }

  // Inicia no dashboard
  navegar('dashboard');
})();
