const TARGET_CENTS = 20000;
const OPENING_STORAGE_KEY = 'caixa-facil-counts-v1';
const CLOSING_STORAGE_KEY = 'caixa-facil-closing-v1';
const HISTORY_STORAGE_KEY = 'caixa-facil-history-v1';
const ACTIVE_VIEW_KEY = 'caixa-facil-active-view-v1';
const THEME_STORAGE_KEY = 'caixa-facil-theme-v1';

const denominations = {
  bills: [20000, 10000, 5000, 2000, 1000, 500, 200],
  coins: [100, 50, 25, 10, 5],
};

function createCountState() {
  return {
    bills: Object.fromEntries(denominations.bills.map((value) => [value, 0])),
    coins: Object.fromEntries(denominations.coins.map((value) => [value, 0])),
  };
}

const openingState = createCountState();
const closingState = createCountState();
let pdvCents = 0;
let closingHistory = [];
let installPromptEvent = null;

const els = {
  modeButtons: document.querySelectorAll('.mode-button'),
  themeButton: document.querySelector('#theme-button'),
  openingView: document.querySelector('#opening-view'),
  closingView: document.querySelector('#closing-view'),
  topbarContext: document.querySelector('#topbar-context'),
  billsList: document.querySelector('#bills-list'),
  coinsList: document.querySelector('#coins-list'),
  billsTotal: document.querySelector('#bills-total'),
  coinsTotal: document.querySelector('#coins-total'),
  grandTotal: document.querySelector('#grand-total'),
  progressLabel: document.querySelector('#progress-label'),
  progressBar: document.querySelector('#progress-bar'),
  statusBox: document.querySelector('#status-box'),
  statusIcon: document.querySelector('#status-icon'),
  statusKicker: document.querySelector('#status-kicker'),
  statusTitle: document.querySelector('#status-title'),
  statusDetail: document.querySelector('#status-detail'),
  differenceLabel: document.querySelector('#difference-label'),
  differenceValue: document.querySelector('#difference-value'),
  savedLabel: document.querySelector('#saved-label'),
  clearButton: document.querySelector('#clear-button'),
  closingBillsList: document.querySelector('#closing-bills-list'),
  closingCoinsList: document.querySelector('#closing-coins-list'),
  closingBillsTotal: document.querySelector('#closing-bills-total'),
  closingCoinsTotal: document.querySelector('#closing-coins-total'),
  closingTotal: document.querySelector('#closing-total'),
  closingSavedLabel: document.querySelector('#closing-saved-label'),
  pdvInput: document.querySelector('#pdv-input'),
  closingStatusBox: document.querySelector('#closing-status-box'),
  closingStatusIcon: document.querySelector('#closing-status-icon'),
  closingStatusKicker: document.querySelector('#closing-status-kicker'),
  closingStatusTitle: document.querySelector('#closing-status-title'),
  closingStatusDetail: document.querySelector('#closing-status-detail'),
  closingDifferenceLabel: document.querySelector('#closing-difference-label'),
  closingDifferenceValue: document.querySelector('#closing-difference-value'),
  reservePanel: document.querySelector('#reserve-panel'),
  reserveState: document.querySelector('#reserve-state'),
  reserveAdvice: document.querySelector('#reserve-advice'),
  reserveList: document.querySelector('#reserve-list'),
  withdrawalValue: document.querySelector('#withdrawal-value'),
  clearClosingButton: document.querySelector('#clear-closing-button'),
  installButton: document.querySelector('#install-button'),
  recordClosingButton: document.querySelector('#record-closing-button'),
  copySummaryButton: document.querySelector('#copy-summary-button'),
  actionFeedback: document.querySelector('#action-feedback'),
  historyList: document.querySelector('#history-list'),
  historyEmpty: document.querySelector('#history-empty'),
  clearHistoryButton: document.querySelector('#clear-history-button'),
};

function formatBRL(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatInputMoney(cents) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

function denominationLabel(cents) {
  return formatBRL(cents);
}

function readCount(state, type, value) {
  const count = Number(state[type][value]);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function safeCount(rawValue) {
  const onlyDigits = String(rawValue ?? '').replace(/[^0-9]/g, '').slice(0, 5);
  if (!onlyDigits) return 0;
  return Math.min(Number(onlyDigits), 99999);
}

function parseMoneyCents(rawValue) {
  const raw = String(rawValue ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!raw || raw === '-' || raw === ',' || raw === '.') return 0;

  let normalized = raw.replace(/-/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    const dotParts = normalized.split('.');
    if (!(dotParts.length === 2 && dotParts[1].length <= 2)) normalized = normalized.replace(/\./g, '');
  }

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.min(Math.round(amount * 100), 999999999);
}

function buildMoneyRow({ type, value, state, prefix, onChange }) {
  const row = document.createElement('div');
  row.className = 'money-row';
  row.dataset.type = type;
  row.dataset.value = String(value);
  row.dataset.prefix = prefix;
  const label = type === 'bills' ? 'nota' : 'moeda';
  const inputId = `${prefix}-${type}-${value}`;
  const labelText = denominationLabel(value);
  row.innerHTML = `
    <div class="denomination">
      <strong>${labelText}</strong>
      <span>${label}</span>
    </div>
    <div class="quantity-control" aria-label="Quantidade de ${labelText}">
      <button class="step-button minus" type="button" aria-label="Diminuir quantidade de ${labelText}">−</button>
      <input class="quantity-input" id="${inputId}" inputmode="numeric" pattern="[0-9]*" type="text" value="0" aria-label="Quantidade de ${labelText}" autocomplete="off" />
      <button class="step-button plus" type="button" aria-label="Aumentar quantidade de ${labelText}">+</button>
    </div>
    <span class="subtotal" aria-label="Subtotal">R$ 0,00</span>
  `;

  const input = row.querySelector('.quantity-input');
  const minus = row.querySelector('.minus');
  const plus = row.querySelector('.plus');

  input.addEventListener('input', () => {
    const count = safeCount(input.value);
    input.value = String(count);
    state[type][value] = count;
    onChange();
  });
  input.addEventListener('blur', () => {
    input.value = String(readCount(state, type, value));
  });
  minus.addEventListener('click', () => changeCount({ type, value, state, delta: -1, input, onChange }));
  plus.addEventListener('click', () => changeCount({ type, value, state, delta: 1, input, onChange }));
  return row;
}

function renderMoneyRows({ listElement, type, values, state, prefix, onChange }) {
  listElement.replaceChildren(...values.map((value) => buildMoneyRow({ type, value, state, prefix, onChange })));
  syncRows(prefix, state);
}

function syncRows(prefix, state) {
  document.querySelectorAll(`.money-row[data-prefix="${prefix}"]`).forEach((row) => {
    const type = row.dataset.type;
    const value = Number(row.dataset.value);
    row.querySelector('.quantity-input').value = String(readCount(state, type, value));
  });
}

function changeCount({ type, value, state, delta, input, onChange }) {
  const next = Math.max(0, Math.min(99999, readCount(state, type, value) + delta));
  state[type][value] = next;
  input.value = String(next);
  onChange();
  input.focus();
}

function sumType(state, type) {
  return denominations[type].reduce((total, value) => total + (readCount(state, type, value) * value), 0);
}

function totalState(state) {
  return sumType(state, 'bills') + sumType(state, 'coins');
}

function updateSubtotals(prefix, state) {
  document.querySelectorAll(`.money-row[data-prefix="${prefix}"]`).forEach((row) => {
    const type = row.dataset.type;
    const value = Number(row.dataset.value);
    row.querySelector('.subtotal').textContent = formatBRL(readCount(state, type, value) * value);
  });
}

function updateOpeningCalculations() {
  const billsTotal = sumType(openingState, 'bills');
  const coinsTotal = sumType(openingState, 'coins');
  const total = billsTotal + coinsTotal;
  const difference = total - TARGET_CENTS;
  const progress = Math.min(100, Math.max(0, (total / TARGET_CENTS) * 100));

  els.billsTotal.textContent = formatBRL(billsTotal);
  els.coinsTotal.textContent = formatBRL(coinsTotal);
  els.grandTotal.textContent = formatBRL(total);
  els.progressLabel.textContent = `${Math.round(progress)}%`;
  els.progressBar.style.width = `${progress}%`;
  updateSubtotals('opening', openingState);

  els.statusBox.classList.remove('below', 'exact', 'above');
  if (difference < 0) {
    els.statusBox.classList.add('below');
    els.statusIcon.textContent = '!';
    els.statusKicker.textContent = 'Abaixo da meta';
    els.statusTitle.textContent = 'Ainda não pode operar';
    els.statusDetail.textContent = `Faltam ${formatBRL(Math.abs(difference))} para chegar ao fundo inicial.`;
    els.differenceLabel.textContent = 'Falta para a meta';
    els.differenceValue.textContent = formatBRL(Math.abs(difference));
  } else if (difference === 0) {
    els.statusBox.classList.add('exact');
    els.statusIcon.textContent = '✓';
    els.statusKicker.textContent = 'Meta atingida';
    els.statusTitle.textContent = 'Pode operar';
    els.statusDetail.textContent = 'O fundo inicial está certinho em R$ 200,00.';
    els.differenceLabel.textContent = 'Diferença da meta';
    els.differenceValue.textContent = 'R$ 0,00';
  } else {
    els.statusBox.classList.add('above');
    els.statusIcon.textContent = '↑';
    els.statusKicker.textContent = 'Acima da meta';
    els.statusTitle.textContent = 'Pode operar';
    els.statusDetail.textContent = `Tem ${formatBRL(difference)} a mais que o fundo inicial.`;
    els.differenceLabel.textContent = 'Sobra da meta';
    els.differenceValue.textContent = formatBRL(difference);
  }
}

function updateClosingCalculations() {
  const billsTotal = sumType(closingState, 'bills');
  const coinsTotal = sumType(closingState, 'coins');
  const total = billsTotal + coinsTotal;
  const difference = total - pdvCents;

  els.closingBillsTotal.textContent = formatBRL(billsTotal);
  els.closingCoinsTotal.textContent = formatBRL(coinsTotal);
  els.closingTotal.textContent = formatBRL(total);
  updateSubtotals('closing', closingState);

  els.closingStatusBox.classList.remove('neutral', 'below', 'exact', 'above');
  if (pdvCents === 0) {
    els.closingStatusBox.classList.add('neutral');
    els.closingStatusIcon.textContent = '?';
    els.closingStatusKicker.textContent = 'Informe o PDV';
    els.closingStatusTitle.textContent = 'Digite o valor do PDV';
    els.closingStatusDetail.textContent = 'Assim você compara o dinheiro contado com o sistema.';
    els.closingDifferenceLabel.textContent = 'Diferença do PDV';
    els.closingDifferenceValue.textContent = '—';
  } else if (difference < 0) {
    els.closingStatusBox.classList.add('below');
    els.closingStatusIcon.textContent = '!';
    els.closingStatusKicker.textContent = 'Falta no caixa';
    els.closingStatusTitle.textContent = 'Não bateu com o PDV';
    els.closingStatusDetail.textContent = `Faltam ${formatBRL(Math.abs(difference))} em relação ao valor do sistema.`;
    els.closingDifferenceLabel.textContent = 'Falta para o PDV';
    els.closingDifferenceValue.textContent = formatBRL(Math.abs(difference));
  } else if (difference === 0) {
    els.closingStatusBox.classList.add('exact');
    els.closingStatusIcon.textContent = '✓';
    els.closingStatusKicker.textContent = 'Conferência exata';
    els.closingStatusTitle.textContent = 'Bateu com o PDV';
    els.closingStatusDetail.textContent = 'O dinheiro contado está igual ao valor do sistema.';
    els.closingDifferenceLabel.textContent = 'Diferença do PDV';
    els.closingDifferenceValue.textContent = 'R$ 0,00';
  } else {
    els.closingStatusBox.classList.add('above');
    els.closingStatusIcon.textContent = '↑';
    els.closingStatusKicker.textContent = 'Sobra no caixa';
    els.closingStatusTitle.textContent = 'Não bateu com o PDV';
    els.closingStatusDetail.textContent = `Sobram ${formatBRL(difference)} em relação ao valor do sistema.`;
    els.closingDifferenceLabel.textContent = 'Sobra do PDV';
    els.closingDifferenceValue.textContent = formatBRL(difference);
  }

  updateReserveSuggestion(total);
}

function gcd(a, b) {
  let first = Math.abs(a);
  let second = Math.abs(b);
  while (second) [first, second] = [second, first % second];
  return first;
}

function findReserveCombination(state) {
  const options = [
    ...denominations.bills.map((value) => ({ type: 'bills', value })),
    ...denominations.coins.map((value) => ({ type: 'coins', value })),
  ];
  const maxAvailable = options.map(({ type, value }) => Math.min(readCount(state, type, value), Math.floor(TARGET_CENTS / value)));
  const suffixMax = Array(options.length + 1).fill(0);
  const suffixGcd = Array(options.length + 1).fill(0);

  for (let index = options.length - 1; index >= 0; index -= 1) {
    suffixMax[index] = suffixMax[index + 1] + (maxAvailable[index] * options[index].value);
    suffixGcd[index] = gcd(options[index].value, suffixGcd[index + 1]);
  }

  let best = null;
  const used = Array(options.length).fill(0);

  function search(index, remaining, pieces) {
    if (remaining === 0) {
      // Os valores estão em ordem do maior para o menor. Como percorremos
      // cada quantidade começando em zero, a primeira solução encontrada é a
      // que usa o mínimo possível de notas altas e deixa mais troco miúdo.
      best = { pieces, counts: [...used] };
      return true;
    }
    if (index >= options.length || remaining < 0 || remaining > suffixMax[index]) return false;
    if (suffixGcd[index] === 0 || remaining % suffixGcd[index] !== 0) return false;

    const { value } = options[index];
    const maxTake = Math.min(maxAvailable[index], Math.floor(remaining / value));
    for (let take = 0; take <= maxTake; take += 1) {
      used[index] = take;
      if (search(index + 1, remaining - (take * value), pieces + take)) return true;
    }
    used[index] = 0;
    return false;
  }

  search(0, TARGET_CENTS, 0);
  if (!best) return null;
  return options
    .map((option, index) => ({ ...option, count: best.counts[index] }))
    .filter((option) => option.count > 0);
}

function updateReserveSuggestion(total) {
  els.reservePanel.classList.remove('not-ready', 'ready', 'unavailable');
  els.reserveList.replaceChildren();
  els.withdrawalValue.textContent = total >= TARGET_CENTS ? formatBRL(total - TARGET_CENTS) : 'R$ 0,00';

  if (total < TARGET_CENTS) {
    els.reservePanel.classList.add('not-ready');
    els.reserveState.textContent = 'Aguardando contagem';
    els.reserveAdvice.textContent = `Faltam ${formatBRL(TARGET_CENTS - total)} no caixa para conseguir deixar o fundo de amanhã.`;
    return;
  }

  const combination = findReserveCombination(closingState);
  if (!combination) {
    els.reservePanel.classList.add('unavailable');
    els.reserveState.textContent = 'Troque alguma peça';
    els.reserveAdvice.textContent = 'O total já passa de R$ 200,00, mas essas unidades não formam R$ 200,00 exatos. Troque uma nota por moedas ou outra cédula.';
    return;
  }

  els.reservePanel.classList.add('ready');
  els.reserveState.textContent = 'Combinação encontrada';
  els.reserveAdvice.textContent = 'A sugestão leva as notas altas e deixa primeiro as notas e moedas menores para facilitar o troco amanhã.';
  combination.forEach(({ count, value }) => {
    const chip = document.createElement('span');
    chip.className = 'reserve-chip';
    chip.innerHTML = `<strong>${count}×</strong> ${formatBRL(value)}`;
    els.reserveList.append(chip);
  });
}

function saveOpeningState() {
  try {
    localStorage.setItem(OPENING_STORAGE_KEY, JSON.stringify(openingState));
    const now = new Date();
    els.savedLabel.textContent = `Salvo às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    els.savedLabel.textContent = 'Salvo neste aparelho';
  }
}

function saveClosingState() {
  try {
    localStorage.setItem(CLOSING_STORAGE_KEY, JSON.stringify({ counts: closingState, pdvCents }));
    const now = new Date();
    els.closingSavedLabel.textContent = `Salvo às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    els.closingSavedLabel.textContent = 'Salvo neste aparelho';
  }
}

function showActionFeedback(message, tone = 'success') {
  els.actionFeedback.textContent = message;
  els.actionFeedback.className = `action-feedback ${tone}`;
  window.clearTimeout(showActionFeedback.timer);
  showActionFeedback.timer = window.setTimeout(() => {
    els.actionFeedback.textContent = '';
    els.actionFeedback.className = 'action-feedback';
  }, 4200);
}

function formatHistoryDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Data desconhecida';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHistoryTime(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function historyResult(record) {
  if (record.difference === 0) return { label: 'Bateu com o PDV', className: 'history-exact', detail: 'Conferência exata' };
  if (record.difference < 0) return { label: `Faltou ${formatBRL(Math.abs(record.difference))}`, className: 'history-below', detail: 'Falta no caixa' };
  return { label: `Sobrou ${formatBRL(record.difference)}`, className: 'history-above', detail: 'Sobra no caixa' };
}

function renderHistory() {
  els.historyList.replaceChildren();
  els.historyEmpty.hidden = closingHistory.length > 0;
  els.clearHistoryButton.disabled = closingHistory.length === 0;

  closingHistory.forEach((record) => {
    const result = historyResult(record);
    const item = document.createElement('article');
    item.className = 'history-item';

    const date = document.createElement('div');
    date.className = 'history-date';
    date.innerHTML = `<strong>${formatHistoryDate(record.createdAt)}</strong><span>${formatHistoryTime(record.createdAt)}</span>`;

    const values = document.createElement('div');
    values.className = 'history-values';
    values.innerHTML = `<span>Contado <strong>${formatBRL(record.totalCents)}</strong></span><span>PDV <strong>${formatBRL(record.pdvCents)}</strong></span>`;

    const status = document.createElement('div');
    status.className = `history-status ${result.className}`;
    status.innerHTML = `<small>${result.detail}</small><strong>${result.label}</strong>`;

    const reserve = document.createElement('p');
    reserve.className = 'history-reserve';
    const reserveText = record.reserve?.length
      ? record.reserve.map(({ count, value }) => `${count}× ${formatBRL(value)}`).join(' + ')
      : 'Sem combinação exata para o fundo';
    reserve.textContent = `Fundo de amanhã: ${reserveText}`;

    item.append(date, values, status, reserve);
    els.historyList.append(item);
  });
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(closingHistory));
  } catch {
    showActionFeedback('Não foi possível salvar o histórico neste aparelho.', 'warning');
  }
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    closingHistory = saved.filter((record) => (
      record && typeof record.createdAt === 'string'
      && Number.isSafeInteger(record.totalCents) && record.totalCents >= 0
      && Number.isSafeInteger(record.pdvCents) && record.pdvCents >= 0
      && Number.isSafeInteger(record.difference)
    )).slice(0, 60);
  } catch {
    closingHistory = [];
  }
  renderHistory();
}

function recordClosing() {
  const total = totalState(closingState);
  if (total === 0 || pdvCents === 0) {
    showActionFeedback('Conte o caixa e informe o PDV antes de registrar.', 'warning');
    return;
  }

  const reserve = findReserveCombination(closingState) || [];
  closingHistory = [{
    id: Date.now(),
    createdAt: new Date().toISOString(),
    totalCents: total,
    pdvCents,
    difference: total - pdvCents,
    reserve: reserve.map(({ count, value }) => ({ count, value })),
  }, ...closingHistory].slice(0, 60);
  saveHistory();
  renderHistory();
  showActionFeedback('Fechamento registrado no histórico deste aparelho.');
}

function clearHistory() {
  if (!closingHistory.length) return;
  if (!window.confirm('Quer mesmo apagar os últimos fechamentos salvos neste aparelho?')) return;
  closingHistory = [];
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  renderHistory();
  showActionFeedback('Histórico apagado.');
}

function buildClosingSummary() {
  const total = totalState(closingState);
  const difference = total - pdvCents;
  const reserve = findReserveCombination(closingState) || [];
  const reserveText = reserve.length
    ? reserve.map(({ count, value }) => `${count}x ${formatBRL(value)}`).join(' + ')
    : 'não encontrada';
  const result = difference === 0
    ? 'Bateu com o PDV'
    : difference < 0 ? `Faltou ${formatBRL(Math.abs(difference))}` : `Sobrou ${formatBRL(difference)}`;
  return [
    'Caixa Fácil — resumo do fechamento',
    `Dinheiro contado: ${formatBRL(total)}`,
    `Valor do PDV: ${formatBRL(pdvCents)}`,
    `Resultado: ${result}`,
    `Fundo de amanhã: ${reserveText}`,
    `Para retirada/conferência: ${formatBRL(Math.max(0, total - TARGET_CENTS))}`,
  ].join('\n');
}

async function copyClosingSummary() {
  const summary = buildClosingSummary();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
    } else {
      const helper = document.createElement('textarea');
      helper.value = summary;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.append(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    showActionFeedback('Resumo copiado. Você já pode enviar para alguém.');
  } catch {
    showActionFeedback('Não consegui copiar. Selecione o resumo manualmente.', 'warning');
  }
}

function loadOpeningState() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPENING_STORAGE_KEY) || 'null');
    if (!saved) return;
    for (const type of ['bills', 'coins']) {
      for (const value of denominations[type]) {
        if (saved[type] && Object.prototype.hasOwnProperty.call(saved[type], value)) openingState[type][value] = safeCount(saved[type][value]);
      }
    }
    els.savedLabel.textContent = 'Última contagem restaurada';
  } catch {
    els.savedLabel.textContent = 'Pronto para contar';
  }
}

function loadClosingState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLOSING_STORAGE_KEY) || 'null');
    if (!saved) return;
    const savedCounts = saved.counts || saved;
    for (const type of ['bills', 'coins']) {
      for (const value of denominations[type]) {
        if (savedCounts[type] && Object.prototype.hasOwnProperty.call(savedCounts[type], value)) closingState[type][value] = safeCount(savedCounts[type][value]);
      }
    }
    if (Number.isSafeInteger(saved.pdvCents) && saved.pdvCents >= 0) pdvCents = saved.pdvCents;
    els.closingSavedLabel.textContent = 'Último fechamento restaurado';
  } catch {
    els.closingSavedLabel.textContent = 'Pronto para contar';
  }
}

function clearOpeningCount() {
  if (!window.confirm('Quer mesmo limpar toda a contagem de abertura e começar de novo?')) return;
  for (const type of ['bills', 'coins']) for (const value of denominations[type]) openingState[type][value] = 0;
  localStorage.removeItem(OPENING_STORAGE_KEY);
  syncRows('opening', openingState);
  els.savedLabel.textContent = 'Contagem limpa';
  updateOpeningCalculations();
}

function clearClosingCount() {
  if (!window.confirm('Quer mesmo limpar todo o fechamento, incluindo o valor do PDV?')) return;
  for (const type of ['bills', 'coins']) for (const value of denominations[type]) closingState[type][value] = 0;
  pdvCents = 0;
  localStorage.removeItem(CLOSING_STORAGE_KEY);
  els.pdvInput.value = '0,00';
  syncRows('closing', closingState);
  els.closingSavedLabel.textContent = 'Fechamento limpo';
  updateClosingCalculations();
}

function switchView(viewName) {
  const titles = { opening: 'Conferência de abertura', closing: 'Conferência de fechamento', extras: 'Ferramentas em desenvolvimento' };
  if (!titles[viewName]) viewName = 'opening';
  document.querySelectorAll('.view-panel').forEach((panel) => {
    const on = panel.id === `${viewName}-view`;
    panel.hidden = !on;
    panel.classList.toggle('active', on);
  });
  els.topbarContext.textContent = titles[viewName];
  els.modeButtons.forEach((button) => {
    const selected = button.dataset.view === viewName;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  localStorage.setItem(ACTIVE_VIEW_KEY, viewName);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateThemeButton(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  els.themeButton.setAttribute('aria-pressed', String(dark));
  els.themeButton.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  els.themeButton.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
  els.themeButton.querySelector('.theme-label').textContent = dark ? 'Claro' : 'Escuro';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#14211f' : '#0f766e';
}

function toggleTheme() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  updateThemeButton(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    showActionFeedback('Não foi possível salvar a preferência de tema neste aparelho.', 'warning');
  }
}

async function installApp() {
  if (!installPromptEvent) {
    showActionFeedback('No celular, abra o menu do navegador e escolha “Adicionar à tela inicial”.', 'info');
    return;
  }
  installPromptEvent.prompt();
  const choice = await installPromptEvent.userChoice;
  if (choice.outcome === 'accepted') showActionFeedback('Caixa Fácil instalado na tela inicial.');
  installPromptEvent = null;
  els.installButton.hidden = true;
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPromptEvent = event;
  els.installButton.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  els.installButton.hidden = true;
  showActionFeedback('Caixa Fácil instalado na tela inicial.');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // O app continua funcionando normalmente mesmo sem o cache offline.
    });
  });
}

els.modeButtons.forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelector('.footer-extras').addEventListener('click', () => switchView('extras'));
document.querySelector('#extras-back-button').addEventListener('click', () => switchView('opening'));
document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  switchView('opening');
});
els.themeButton.addEventListener('click', toggleTheme);
els.clearButton.addEventListener('click', clearOpeningCount);
els.clearClosingButton.addEventListener('click', clearClosingCount);
els.installButton.addEventListener('click', installApp);
els.recordClosingButton.addEventListener('click', recordClosing);
els.copySummaryButton.addEventListener('click', copyClosingSummary);
els.clearHistoryButton.addEventListener('click', clearHistory);
els.pdvInput.addEventListener('input', () => {
  pdvCents = parseMoneyCents(els.pdvInput.value);
  saveClosingState();
  updateClosingCalculations();
});
els.pdvInput.addEventListener('blur', () => {
  els.pdvInput.value = formatInputMoney(pdvCents);
});

loadOpeningState();
loadClosingState();
loadHistory();
renderMoneyRows({ listElement: els.billsList, type: 'bills', values: denominations.bills, state: openingState, prefix: 'opening', onChange: () => { saveOpeningState(); updateOpeningCalculations(); } });
renderMoneyRows({ listElement: els.coinsList, type: 'coins', values: denominations.coins, state: openingState, prefix: 'opening', onChange: () => { saveOpeningState(); updateOpeningCalculations(); } });
renderMoneyRows({ listElement: els.closingBillsList, type: 'bills', values: denominations.bills, state: closingState, prefix: 'closing', onChange: () => { saveClosingState(); updateClosingCalculations(); } });
renderMoneyRows({ listElement: els.closingCoinsList, type: 'coins', values: denominations.coins, state: closingState, prefix: 'closing', onChange: () => { saveClosingState(); updateClosingCalculations(); } });
els.pdvInput.value = formatInputMoney(pdvCents);
updateOpeningCalculations();
updateClosingCalculations();
updateThemeButton(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
const savedView = localStorage.getItem(ACTIVE_VIEW_KEY);
if (savedView && savedView !== 'opening') switchView(savedView);
