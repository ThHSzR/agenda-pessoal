const paginas = {
  dashboard:     renderDashboard,
  calendario:    renderCalendario,
  agendamentos:  renderAgendamentos,
  clientes:      renderClientes,
  procedimentos: renderProcedimentos,
  financeiro:    renderFinanceiro,
  promocoes:     renderPromocoes,
  bloqueios:     renderBloqueios,
  relatorios:    renderRelatorios,
  usuarios:      renderUsuarios,
  logs:          renderLogs,
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

// Helper: cria um link de navegação na sidebar
function _criarNavLink(nav, pagina, icone, label, opts = {}) {
  // Cria a page div se não existir
  if (!document.getElementById(`page-${pagina}`)) {
    const main = document.getElementById('content');
    const div = document.createElement('div');
    div.id = `page-${pagina}`;
    div.className = 'page hidden';
    main.appendChild(div);
  }

  const a = document.createElement('a');
  a.className = 'nav-link';
  a.dataset.page = pagina;
  if (opts.style) a.style = opts.style;
  a.innerHTML = `<span class="icon">${icone}</span> ${label}`;
  a.addEventListener('click', () => navegar(pagina));
  nav.appendChild(a);
  return a;
}

// Verificação de sessão + montagem dinâmica da sidebar
(async () => {
  const res = await fetch('/api/me', { credentials: 'same-origin' });
  if (!res.ok) { window.location.href = '/login.html'; return; }

  const { usuario, is_admin, cargo } = await res.json();
  window._session = { usuario, is_admin, cargo };

  const isOperador = !is_admin && cargo !== 'gerente';
  const isGerente  = is_admin || cargo === 'gerente';

  // Esconde abas restritas para operadores
  if (isOperador) {
    ['dashboard', 'procedimentos', 'financeiro', 'promocoes'].forEach(p => {
      const link = document.querySelector(`[data-page="${p}"]`);
      if (link) link.style.display = 'none';
    });
  }

  const nav = document.querySelector('#sidebar nav');
  if (nav) {
    // Separador antes das abas extras
    const sep = document.createElement('hr');
    sep.style = 'border:none;border-top:1px solid rgba(255,255,255,0.15);margin:12px 0';
    nav.appendChild(sep);

    // Bloqueios de horário — gerentes e admin
    if (isGerente) {
      _criarNavLink(nav, 'bloqueios', '🚫', 'Bloqueios');
    }

    // Relatórios — gerentes e admin
    if (isGerente) {
      _criarNavLink(nav, 'relatorios', '📈', 'Relatórios');
    }

    // Usuários — só admin
    if (is_admin) {
      _criarNavLink(nav, 'usuarios', '⚙️', 'Usuários');
    }

    // Log de atividades — só admin
    if (is_admin) {
      _criarNavLink(nav, 'logs', '📝', 'Logs');
    }

    // Separador antes do logout
    const sep2 = document.createElement('hr');
    sep2.style = 'border:none;border-top:1px solid rgba(255,255,255,0.15);margin:12px 0';
    nav.appendChild(sep2);

    // Info do usuário logado
    const userInfo = document.createElement('div');
    userInfo.style = 'padding:8px 16px;font-size:11px;color:rgba(255,255,255,0.6)';
    userInfo.innerHTML = `👤 ${usuario} <span style="opacity:0.5">(${cargo || 'admin'})</span>`;
    nav.appendChild(userInfo);

    // Botão Sair
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

  // Operadores vão direto para o calendário; demais cargos para o dashboard
  navegar(isOperador ? 'calendario' : 'dashboard');
})();
