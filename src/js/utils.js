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

function abrirWhatsApp(telefone, dataHoraAgend) {
  if (!telefone) { toast('Cliente sem telefone cadastrado.', 'error'); return; }

  const num = telefone.replace(/\D/g, '');

  // Saudação baseada na hora ATUAL
  const horaAtual = new Date().getHours();
  const saudacao  = horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  // Referência ao dia do agendamento
  let refDia = '';
  if (dataHoraAgend) {
    const agora     = new Date();
    const dAgend    = new Date(dataHoraAgend.replace(' ', 'T'));
    const hojeStr   = agora.toISOString().slice(0, 10);
    const agendStr  = dAgend.toISOString().slice(0, 10);

    const amanhaDate = new Date(agora);
    amanhaDate.setDate(agora.getDate() + 1);
    const amanhaStr = amanhaDate.toISOString().slice(0, 10);

    const diasSemana = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
    const hora       = dAgend.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const diaSemNome = diasSemana[dAgend.getDay()];
    const diaNum     = String(dAgend.getDate()).padStart(2, '0');
    const mesNum     = String(dAgend.getMonth() + 1).padStart(2, '0');

    if (agendStr === hojeStr) {
      refDia = `hoje às ${hora}`;
    } else if (agendStr === amanhaStr) {
      refDia = `amanhã às ${hora}`;
    } else {
      refDia = `${diaSemNome}, dia ${diaNum}/${mesNum}, às ${hora}`;
    }
  }

  const texto = refDia
    ? `${saudacao}! 😊 Passando para confirmar o seu horário ${refDia}. Tudo certo?`
    : `${saudacao}! 😊`;

  window.open(`https://wa.me/55${num}?text=${encodeURIComponent(texto)}`, '_blank');
}