const paginas = {
  calendario:   renderCalendario,
  agendamentos: renderAgendamentos,
  clientes:     renderClientes,
  procedimentos: renderProcedimentos,
  financeiro:   renderFinanceiro,
  promocoes:    renderPromocoes,
  usuarios:     renderUsuarios,
};

let paginaAtual = 'calendario';

function navegar(pagina) {
  const pageEl = document.getElementById(`page-${pagina}`);
  const navEl  = document.querySelector(`[data-page="${pagina}"]`);
  if (!pageEl || !navEl) return;

  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

  pageEl.classList.remove('hidden');
  navEl.classList.add('active');

  paginaAtual = pagina;
  paginas[pagina]();
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

  // Esconde aba Procedimentos e Financeiro para operadores
  if (!is_admin && cargo !== 'gerente') {
    const linkProc = document.querySelector('[data-page="procedimentos"]');
    if (linkProc) linkProc.style.display = 'none';
    const linkFin = document.querySelector('[data-page="financeiro"]');
    if (linkFin) linkFin.style.display = 'none';
  }

  // Esconde aba Promoções para operadores (só admin e gerente veem)
  if (!is_admin && cargo !== 'gerente') {
    const linkPromo = document.querySelector('[data-page="promocoes"]');
    if (linkPromo) linkPromo.style.display = 'none';
  }

  const nav = document.querySelector('#sidebar nav');
  if (nav) {
    const sep = document.createElement('hr');
    sep.style = 'border:none;border-top:1px solid #ddd;margin:8px 0';
    nav.appendChild(sep);

    // Botão Usuários — só para admin
    if (is_admin) {
      if (!document.getElementById('page-usuarios')) {
        document.getElementById('page-promocoes').insertAdjacentHTML('afterend',
          '<div id="page-usuarios" class="page hidden"></div>'
        );
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
    btnLogout.style = 'color:#dc2626;cursor:pointer';
    btnLogout.innerHTML = '<span class="icon">🚪</span> Sair';
    btnLogout.addEventListener('click', async () => {
      await window.api.auth.logout();
      location.href = '/login.html';
    });
    nav.appendChild(btnLogout);
  }

  // Inicia no calendário para todos os cargos
  navegar('calendario');
})();