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
