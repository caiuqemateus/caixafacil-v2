(() => {
  const $ = (s) => document.querySelector(s);
  const MOV_KEY = 'caixa-facil-moves-v1';
  const CHANGE = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5];
  let kind = 'sangria';
  let moves = [];

  const feedback = (msg) => {
    const el = $('#x-feedback');
    el.textContent = msg;
    clearTimeout(feedback.t);
    feedback.t = setTimeout(() => { el.textContent = ''; }, 4000);
  };

  // ---- Troco
  function calcChange() {
    const due = parseMoneyCents($('#troco-due').value);
    const paid = parseMoneyCents($('#troco-paid').value);
    const box = $('#troco-result');
    const list = $('#troco-list');
    list.replaceChildren();
    box.className = 'x-result';
    if (!due || !paid) { box.textContent = 'Digite os valores para ver o troco.'; return; }
    if (paid < due) { box.classList.add('bad'); box.textContent = `Faltam ${formatBRL(due - paid)} do cliente.`; return; }
    let rest = paid - due;
    box.classList.add(rest ? 'ok' : 'even');
    box.textContent = rest ? `Troco: ${formatBRL(rest)}` : 'Sem troco. Valor exato.';
    CHANGE.forEach((v) => {
      const n = Math.floor(rest / v);
      if (!n) return;
      rest -= n * v;
      const chip = document.createElement('span');
      chip.className = 'reserve-chip';
      chip.innerHTML = `<strong>${n}×</strong> ${formatBRL(v)}`;
      list.append(chip);
    });
    if (rest) { const r = document.createElement('small'); r.textContent = `Arredonde ${formatBRL(rest)} (sem moeda menor que 5 centavos).`; list.append(r); }
  }

  // ---- Movimentos
  function saveMoves() { try { localStorage.setItem(MOV_KEY, JSON.stringify(moves)); } catch { feedback('Não foi possível salvar.'); } }
  function renderMoves() {
    const out = moves.filter((m) => m.kind === 'sangria').reduce((s, m) => s + m.cents, 0);
    const inn = moves.filter((m) => m.kind === 'suprimento').reduce((s, m) => s + m.cents, 0);
    $('#mov-out').textContent = formatBRL(out);
    $('#mov-in').textContent = formatBRL(inn);
    $('#mov-clear').disabled = !moves.length;
    $('#mov-list').replaceChildren(...moves.map((m) => {
      const item = document.createElement('article');
      item.className = 'history-item x-move';
      const time = new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const label = document.createElement('div');
      label.innerHTML = `<strong>${m.kind === 'sangria' ? '− Sangria' : '+ Suprimento'}</strong><small></small>`;
      label.querySelector('small').textContent = `${time}${m.note ? ' · ' + m.note : ''}`;
      const val = document.createElement('strong');
      val.className = m.kind === 'sangria' ? 'x-neg' : 'x-pos';
      val.textContent = formatBRL(m.cents);
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'x-del'; del.setAttribute('aria-label', 'Remover movimento'); del.textContent = '×';
      del.addEventListener('click', () => { moves = moves.filter((x) => x.id !== m.id); saveMoves(); renderMoves(); });
      item.append(label, val, del);
      return item;
    }));
  }
  function loadMoves() {
    try {
      const saved = JSON.parse(localStorage.getItem(MOV_KEY) || '[]');
      moves = Array.isArray(saved) ? saved.filter((m) => m && Number.isSafeInteger(m.cents) && m.cents > 0 && ['sangria', 'suprimento'].includes(m.kind)) : [];
    } catch { moves = []; }
  }

  // ---- Compartilhar, CSV, backup
  const fmtDate = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function shareLast() {
    const r = closingHistory[0];
    if (!r) { feedback('Registre um fechamento primeiro (aba Fechamento).'); return; }
    const res = r.difference === 0 ? 'Bateu com o PDV' : r.difference < 0 ? `Faltou ${formatBRL(-r.difference)}` : `Sobrou ${formatBRL(r.difference)}`;
    const text = `Caixa Fácil — fechamento de ${fmtDate(r.createdAt)}\nContado: ${formatBRL(r.totalCents)}\nPDV: ${formatBRL(r.pdvCents)}\nResultado: ${res}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); feedback('Resumo copiado.'); }
    } catch { /* cancelado */ }
  }
  function exportCsv() {
    if (!closingHistory.length) { feedback('Não há fechamentos para exportar.'); return; }
    const rows = ['data;contado;pdv;diferenca'].concat(closingHistory.map((r) =>
      [fmtDate(r.createdAt), r.totalCents / 100, r.pdvCents / 100, r.difference / 100].map((v) => String(v).replace('.', ',')).join(';')));
    download('caixa-facil-historico.csv', '\ufeff' + rows.join('\n'), 'text/csv;charset=utf-8');
  }
  function backup() {
    const data = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k.startsWith('caixa-facil-')) data[k] = localStorage.getItem(k);
    }
    download(`caixa-facil-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json');
  }
  function restore(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const keys = Object.keys(data).filter((k) => k.startsWith('caixa-facil-') && typeof data[k] === 'string');
        if (!keys.length) throw new Error();
        if (!confirm('Restaurar o backup vai substituir os dados atuais. Continuar?')) return;
        keys.forEach((k) => localStorage.setItem(k, data[k]));
        location.reload();
      } catch { feedback('Arquivo de backup inválido.'); }
    };
    reader.readAsText(file);
  }

  // ---- Eventos
  ['#troco-due', '#troco-paid'].forEach((s) => $(s).addEventListener('input', calcChange));
  document.querySelectorAll('.x-seg-btn').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    document.querySelectorAll('.x-seg-btn').forEach((x) => x.classList.toggle('active', x === b));
  }));
  $('#mov-add').addEventListener('click', () => {
    const cents = parseMoneyCents($('#mov-value').value);
    if (!cents) { feedback('Informe o valor do movimento.'); return; }
    moves = [{ id: Date.now(), kind, cents, note: $('#mov-note').value.trim(), at: new Date().toISOString() }, ...moves].slice(0, 100);
    $('#mov-value').value = ''; $('#mov-note').value = '';
    saveMoves(); renderMoves();
  });
  $('#mov-clear').addEventListener('click', () => {
    if (!confirm('Zerar todos os movimentos do dia?')) return;
    moves = []; saveMoves(); renderMoves();
  });
  $('#x-share').addEventListener('click', shareLast);
  $('#x-csv').addEventListener('click', exportCsv);
  $('#x-backup').addEventListener('click', backup);
  $('#x-restore').addEventListener('click', () => $('#x-file').click());
  $('#x-file').addEventListener('change', (e) => { if (e.target.files[0]) restore(e.target.files[0]); e.target.value = ''; });

  loadMoves();
  renderMoves();
})();
