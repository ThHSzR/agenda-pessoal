// ── TOAST ──────────────────────────────────────────────────
function toast(msg, tipo = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── MODAL ──────────────────────────────────────────────────
function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

// Fecha modal clicando fora
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ── FORMATAÇÃO ─────────────────────────────────────────────
function fmtData(iso) {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00');
  return d.toLocaleDateString('pt-BR');
}

function fmtDataHora(iso) {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtMoeda(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

function fmtHora(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── DATE HELPERS ───────────────────────────────────────────
function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDatetime(iso) {
  if (!iso) return '';
  return iso.replace(' ', 'T').slice(0, 16);
}

function toDbDatetime(inputVal) {
  return inputVal.replace('T', ' ') + ':00';
}
