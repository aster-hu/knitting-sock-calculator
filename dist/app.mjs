import { PRESETS, DEFAULTS, calculate, cmToIn, inToCm } from './calculator.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const lengthFields = ['circumference', 'length', 'cuffHeight', 'legHeight', 'heelAllowance'];
const gaugeFields = ['stitchGauge', 'rowGauge'];
const formFields = [...lengthFields, ...gaugeFields];
const gaugeFactor = 10.16 / 10; // 4 in / 10 cm

let state = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem('sock-atlas-settings'));
  if (saved && typeof saved === 'object') state = { ...DEFAULTS, ...saved };
} catch { /* Private browsing or old saved data: use defaults. */ }

const decimal = (value, digits = 1) => Number(value.toFixed(digits)).toString();
const lengthText = cm => `${decimal(state.unit === 'in' ? cmToIn(cm) : cm)} ${state.unit}`;
const numberText = n => Number.isFinite(n) ? n.toLocaleString() : '—';
const fieldDisplay = (key, value) => {
  if (lengthFields.includes(key)) return decimal(state.unit === 'in' ? cmToIn(value) : value);
  if (gaugeFields.includes(key)) return decimal(state.unit === 'in' ? value * gaugeFactor : value);
  return value;
};

function syncInputs() {
  for (const key of formFields) $(`#${key}`).value = fieldDisplay(key, state[key]);
  $('#heel').value = state.heel;
  $('#ease').value = state.ease;
  $('#ease-output').textContent = `${state.ease}%`;
  $$('.unit').forEach(node => {
    if (node.textContent === 'cm' || node.textContent === 'in') node.textContent = state.unit;
  });
  $$('.gauge-basis').forEach(node => node.textContent = state.unit === 'in' ? '4 in' : '10 cm');
  $$('[data-preset]').forEach(button => {
    const size = PRESETS[button.dataset.preset];
    button.querySelector('small').textContent = `${decimal(state.unit === 'in' ? cmToIn(size.circumference) : size.circumference)} × ${decimal(state.unit === 'in' ? cmToIn(size.length) : size.length)}`;
  });
  $('#preset-note').textContent = `Preset figures are circumference × length, in ${state.unit === 'in' ? 'inches' : 'centimetres'}.`;
  $$('[data-direction]').forEach(button => {
    const active = button.dataset.direction === state.direction;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-preset]').forEach(button => {
    const active = button.dataset.preset === state.preset;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-unit]').forEach(button => {
    const active = button.dataset.unit === state.unit;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#heel-allowance-field').hidden = !(state.heel === 'flk' && state.direction === 'toe');
}

function item(index, eyebrow, heading, detail, accent = '') {
  return `<div class="recipe-step"><span class="recipe-index">${String(index).padStart(2, '0')}</span><div><span class="recipe-eyebrow">${eyebrow}</span><h3>${heading}</h3><p>${detail}</p></div>${accent ? `<span class="recipe-accent">${accent}</span>` : ''}</div>`;
}

function heelInstructions(c) {
  if (state.heel === 'flk') {
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Fish Lips Kiss heel</h3></div></div><p>Work the designer’s short-row heel on <strong>${c.heelStitches} heel stitches</strong>; hold the other ${c.heelStitches} for the instep. Complete the first half, transition, and second half as written in the pattern, then resume working all <strong>${c.stitches}</strong> stitches in the round.</p><a href="https://www.ravelry.com/patterns/library/fish-lips-kiss-heel" target="_blank" rel="noopener">Open the original heel pattern ↗</a><small>The exact twin-stitch method and foot template are in the designer’s pattern.</small></div>`;
  }
  if (state.direction === 'cuff') {
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Classic flap & gusset</h3></div></div><ol><li><strong>Flap:</strong> Hold ${c.heelStitches} instep stitches. On the other ${c.heelStitches}, work ${c.flapRows} rows flat, slipping the first stitch of each row. Reinforce RS rows with sl 1, k 1 if desired.</li><li><strong>Turn:</strong> Divide heel stitches into thirds as evenly as possible. Work a short-row turn across the centre third, decreasing across the gap at each edge until the side stitches are consumed.</li><li><strong>Pick up:</strong> Pick up about ${c.pickup} slipped-edge stitches on each flap side, plus a corner stitch if needed. Keep the ${c.heelStitches} instep stitches unchanged.</li><li><strong>Gusset:</strong> On alternate rounds, decrease one stitch on each side of the sole until ${c.stitches} stitches remain in total.</li></ol></div>`;
  }
  return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Toe-up flap & gusset</h3></div></div><ol><li><strong>Gusset:</strong> Increase one stitch at each edge of the ${c.heelStitches}-stitch sole every other round, ${c.toeUpGussetPerSide} times; you have ${c.gussetStitches} stitches total.</li><li><strong>Turn:</strong> Work a short-row heel turn across the centre of the sole, narrowing to roughly its middle third. Keep the ${c.heelStitches} instep stitches resting.</li><li><strong>Flap:</strong> Work back and forth up the heel. At the end of each row, decrease one flap stitch together with one gusset stitch, until the added ${c.toeUpGussetPerSide} stitches on each side are gone.</li><li><strong>Resume:</strong> Return to the round with ${c.stitches} stitches and continue the leg.</li></ol></div>`;
}

function recipe(c) {
  const rib = `ribbing for about ${lengthText(state.cuffHeight)} (${c.cuffRounds} rounds).`;
  const leg = `Continue the leg for ${lengthText(state.legHeight)} after the cuff (about ${c.legRounds} rounds).`;
  const toeDown = `Knit until the foot measures about <strong>${lengthText(c.toeStart)}</strong> from the back of the heel. Decrease 4 stitches every other round to ${c.toeMid} stitches, then every round to ${c.toeStitches}. Graft ${c.toeStitches / 2} + ${c.toeStitches / 2} stitches.`;
  const toeUp = `Use a two-sided cast-on for <strong>${c.toeStitches} stitches total</strong> (${c.toeStitches / 2} per side). Increase 4 stitches every round to ${c.toeMid}, then every other round to ${c.stitches}. Approximate toe length: ${lengthText(c.toeLength)}.`;
  let steps;
  if (state.direction === 'cuff') {
    steps = [
      item(1, 'BEGIN', `Cast on ${c.stitches} stitches`, `Join in the round without twisting. Work ${rib}`, `${c.stitches} STS`),
      item(2, 'LEG', 'Work to heel', leg),
      item(3, 'HEEL', state.heel === 'flk' ? 'Work short-row heel' : 'Work flap, turn & gusset', `Use the ${c.heelStitches} heel stitches. See the heel reference below.`),
      item(4, 'FOOT & TOE', 'Shape the finish', toeDown, `≈ ${lengthText(c.toeLength)} TOE`),
    ];
  } else {
    const heelPoint = state.heel === 'flk' ? c.shortRowStart : c.gussetStart;
    const heelName = state.heel === 'flk' ? 'heel' : 'gusset';
    steps = [
      item(1, 'BEGIN', `Cast on ${c.toeStitches} stitches`, toeUp, `${c.toeStitches} → ${c.stitches}`),
      item(2, 'FOOT', `Work to ${heelName} start`, `Measure from the toe. Begin at about <strong>${lengthText(heelPoint)}</strong> of foot length. Try on and adjust the heel placement as needed.`),
      item(3, 'HEEL', state.heel === 'flap' ? 'Shape gusset, turn & flap' : 'Work short-row heel', `Use the ${c.heelStitches} sole stitches. See the heel reference below.`),
      item(4, 'LEG & CUFF', 'Finish the leg', `${leg} Then work ${rib} Bind off loosely or use a stretchy bind-off.`),
    ];
  }
  return `<div class="recipe-title"><span>THE ROUTE</span><span>${state.direction === 'cuff' ? 'CUFF → TOE' : 'TOE → CUFF'}</span></div>${steps.join('')}${heelInstructions(c)}`;
}

function formulaContent(c) {
  const unit = state.unit;
  const multiplier = unit === 'in' ? state.stitchGauge * 2.54 / 10 : state.stitchGauge / 10;
  const circumference = unit === 'in' ? decimal(cmToIn(state.circumference), 2) : decimal(state.circumference);
  $('#formula-stitches-equation').textContent = `stitches = round₄(circumference × (1 − ease) × sts / ${unit})`;
  $('#formula-toe-equation').textContent = `toe length ≈ total toe rounds ÷ rounds per ${unit}`;
  $('#formula-landmark-equation').textContent = `gusset length ≈ (increases / side × 2) ÷ rounds per ${unit}`;
  $('#formula-stitches').innerHTML = `${circumference} ${unit} × ${decimal(1 - state.ease / 100, 2)} × ${decimal(multiplier, 2)} sts/${unit} = ${decimal(c.rawStitches, 1)} → <strong>${c.stitches} sts</strong>`;
  $('#formula-heel').innerHTML = `${c.stitches} ÷ 2 = <strong>${c.heelStitches} heel sts</strong><br>${c.flapRows} rows ÷ 2 = <strong>${c.pickup} pickups / side</strong>`;
  $('#formula-toe').innerHTML = `${c.toeStitches} → ${c.toeMid} → ${c.stitches} sts · ${c.toeRounds} total rounds ≈ <strong>${lengthText(c.toeLength)}</strong>`;
  $('#formula-landmark').innerHTML = `${c.toeUpGussetPerSide} increases / side × 2 = ${c.gussetRounds} rounds ≈ <strong>${lengthText(c.gussetLength)}</strong><br>Toe-up flap starts ≈ ${lengthText(c.gussetStart)} from toe`;
}

function render() {
  const c = calculate(state);
  $('#validation').hidden = Boolean(c);
  $('#results').classList.toggle('invalid', !c);
  if (!c) return;
  $('#main-stat-label').textContent = state.direction === 'cuff' ? 'CAST ON' : 'FOOT STITCHES';
  $('#main-stat-number').textContent = numberText(c.stitches);
  $('#heel-stat').textContent = numberText(c.heelStitches);
  $('#circ-stat').textContent = lengthText(c.actualCircumference);
  $('#result-title').textContent = `${state.direction === 'cuff' ? 'Cuff-down' : 'Toe-up'} · ${state.heel === 'flap' ? 'flap & gusset' : 'Fish Lips Kiss'}`;
  $('#plan-intro-text').innerHTML = `At ${state.ease}% negative ease, the sock tube finishes at about <strong>${lengthText(c.actualCircumference)}</strong> around. It is sized for a <strong>${lengthText(state.circumference)}</strong> foot.`;
  $('#recipe').innerHTML = recipe(c);
  formulaContent(c);
  try { localStorage.setItem('sock-atlas-settings', JSON.stringify(state)); } catch { /* Settings remain available this visit. */ }
}

for (const key of formFields) {
  $(`#${key}`).addEventListener('input', event => {
    const displayed = Number(event.target.value);
    state[key] = event.target.value === '' ? NaN : lengthFields.includes(key)
      ? (state.unit === 'in' ? inToCm(displayed) : displayed)
      : (state.unit === 'in' ? displayed / gaugeFactor : displayed);
    if (key === 'circumference' || key === 'length') {
      state.preset = 'custom';
      $$('[data-preset]').forEach(button => { button.classList.remove('active'); button.setAttribute('aria-pressed', 'false'); });
    }
    render();
  });
}
$('#ease').addEventListener('input', event => { state.ease = Number(event.target.value); $('#ease-output').textContent = `${state.ease}%`; render(); });
$('#heel').addEventListener('change', event => { state.heel = event.target.value; syncInputs(); render(); });
$$('[data-preset]').forEach(button => button.addEventListener('click', () => {
  const preset = button.dataset.preset;
  state = { ...state, ...PRESETS[preset], preset };
  syncInputs(); render();
}));
$$('[data-direction]').forEach(button => button.addEventListener('click', () => { state.direction = button.dataset.direction; syncInputs(); render(); }));
$$('[data-unit]').forEach(button => button.addEventListener('click', () => { state.unit = button.dataset.unit; syncInputs(); render(); }));
$('#copy-plan').addEventListener('click', async () => {
  const c = calculate(state);
  if (!c) return;
  const text = [
    `Sock Atlas — ${state.direction === 'cuff' ? 'cuff-down' : 'toe-up'}, ${state.heel === 'flap' ? 'classic flap & gusset' : 'Fish Lips Kiss heel'}`,
    `Foot: ${lengthText(state.circumference)} around × ${lengthText(state.length)} long; ${state.ease}% ease`,
    `Gauge: ${decimal(state.stitchGauge)} sts, ${decimal(state.rowGauge)} rounds / 10 cm`,
    `Sock: ${c.stitches} sts; heel: ${c.heelStitches} sts; toe: ${c.toeStitches} sts; toe length ≈ ${lengthText(c.toeLength)}`,
    state.direction === 'cuff' ? `Foot to toe start: ${lengthText(c.toeStart)} from back heel` : `Foot to ${state.heel === 'flap' ? 'gusset' : 'heel'} start: ${lengthText(state.heel === 'flap' ? c.gussetStart : c.shortRowStart)} from toe`,
    ...$$('.recipe-step').map(step => step.innerText.replace(/\s+/g, ' ').trim()),
    ...$$('.heel-card li').map(li => li.innerText.replace(/\s+/g, ' ').trim()),
    ...(state.heel === 'flk' ? ['Fish Lips Kiss method: https://www.ravelry.com/patterns/library/fish-lips-kiss-heel'] : []),
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    $('#copy-plan').textContent = 'Copied!';
    window.setTimeout(() => { $('#copy-plan').textContent = 'Copy plan'; }, 1800);
  } catch { $('#copy-plan').textContent = 'Copy failed'; }
});
$('#print-plan').addEventListener('click', () => window.print());

const navObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    $$('[data-nav]').forEach(link => link.classList.toggle('current', link.dataset.nav === entry.target.id));
  }
}, { rootMargin: '-25% 0px -60% 0px' });
navObserver.observe($('#calculator'));
navObserver.observe($('#formulas'));

syncInputs();
render();
