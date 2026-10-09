import { PRESETS, DEFAULTS, calculate, cmToIn, inToCm } from './calculator.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const lengthFields = ['circumference', 'length', 'cuffHeight', 'legHeight', 'heelAllowance'];
const gaugeFields = ['stitchGauge', 'rowGauge'];
const formFields = [...lengthFields, ...gaugeFields];
const gaugeFactor = 10.16 / 10; // 4 in / 10 cm

let state = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem('sock-calculator-settings'));
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

function item(index, eyebrow, heading, detail, accent = '', extra = '') {
  return `<div class="recipe-step"><span class="recipe-index">${String(index).padStart(2, '0')}</span><div><span class="recipe-eyebrow">${eyebrow}</span><h3>${heading}</h3><p>${detail}</p>${extra}</div>${accent ? `<span class="recipe-accent">${accent}</span>` : ''}</div>`;
}

function heelInstructions(c) {
  if (state.heel === 'flk') {
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Fish Lips Kiss heel</h3></div></div>
      <p>Work flat on <strong>${c.heelStitches} heel stitches</strong>, with ${c.heelStitches} instep stitches resting. Start with the knit side facing. A twin stitch (TS) is worked as one stitch whenever you meet it again.</p>
      <div class="heel-split">1 edge · <strong>${c.flkTwinsPerSide} twin stitches</strong> · <strong>${c.flkCenter} centre stitches</strong> · <strong>${c.flkTwinsPerSide} twin stitches</strong> · 1 edge</div>
      <div class="heel-phase"><h4>1 / Shorten the rows</h4><ol>
        <li><strong>RS:</strong> K${c.heelStitches - 2}, make a TSK in the next stitch, leave the final edge stitch unworked; turn.</li>
        <li><strong>WS:</strong> P${c.heelStitches - 4}, make a TSP in the next stitch, leave the final edge stitch unworked; turn.</li>
        <li><strong>RS:</strong> Knit to one stitch before the nearest TS, make a TSK there; turn. <strong>WS:</strong> Purl to one before the nearest TS, make a TSP there; turn. Work this RS/WS pair <strong>${c.flkTwinsPerSide - 1} times</strong> in all. End after a WS row with ${c.flkCenter} plain centre stitches and ${c.flkTwinsPerSide} TS on each side.</li>
      </ol></div>
      <div class="heel-phase"><h4>2 / Boomerang across both sides</h4><ol>
        <li><strong>RS:</strong> Knit to the first TS; place a marker. Continue across all ${c.flkTwinsPerSide} TS on that side, knitting each pair together as one. Make a TSK in the last, previously untouched edge stitch; move that new TS back to the left needle and turn.</li>
        <li><strong>WS:</strong> Keep the corner snug. Purl back to the marker, slip it, purl across the ${c.flkCenter} centre stitches, then place a second marker before the first TS. Purl all ${c.flkTwinsPerSide} TS on this side as single stitches. Make a TSP in the final untouched edge stitch, move the new TS back to the left needle and turn.</li>
      </ol></div>
      <div class="heel-phase"><h4>3 / Lengthen the rows</h4><ol>
        <li><strong>RS:</strong> Knit to the first marker and across the centre to the second marker. Remove that marker, TSK in the next stitch; turn. <strong>WS:</strong> Purl to the remaining marker, remove it, TSP in the next stitch; turn.</li>
        <li><strong>RS:</strong> Knit to the TS, knit its two loops together, TSK in the next stitch; turn. <strong>WS:</strong> Purl to the TS, purl its two loops together, TSP in the next stitch; turn. Repeat this pair <strong>${c.flkTwinsPerSide - 1} times</strong>, ending after WS; the next-to-last stitch at each edge is now a TS.</li>
      </ol></div>
      <div class="heel-phase"><h4>4 / Rejoin the round</h4><p>Knit across the heel, working each remaining TS as one stitch. Work the instep, then resolve the final TS at the other heel edge on the next round. You still have <strong>${c.stitches} stitches</strong> in total.${state.direction === 'toe' ? ` Keep the back of the heel in stockinette for about <strong>${lengthText(2.54)}</strong> above the turn before starting a patterned leg.` : ''}</p></div>
      <details class="twin-guide" open><summary>TSK & TSP quick reference</summary><p><strong>TSK:</strong> Lift the right leg of the stitch below the next stitch onto the left needle. Knit that lifted loop, place its new loop back beside the original stitch, then turn.</p><p><strong>TSP:</strong> Slip the next stitch purlwise to the right needle. Lift the collar of the stitch below onto the right needle beside it. Purl the lifted collar, move the new loop back to the left needle purlwise beside the original stitch, then turn.</p><p>When resolving a TS, knit or purl its two loops together as one stitch.</p></details>
      <div class="heel-source">Adapted as a counting reference from Patty-Joy White’s Fish Lips Kiss Heel v2.1, pages 9–16. Use the <a href="https://www.ravelry.com/patterns/library/fish-lips-kiss-heel" target="_blank" rel="noopener">original pattern ↗</a> for photos and technique details.</div>
    </div>`;
  }
  if (state.direction === 'cuff') {
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Classic flap & gusset</h3></div></div>
      <div class="heel-phase"><h4>1 / Flap</h4><p>Hold ${c.heelStitches} instep stitches. Work ${c.flapRows} rows flat on the other ${c.heelStitches}, slipping the first stitch of each row. On RS rows, sl 1, k 1 across for reinforcement if desired.</p></div>
      <div class="heel-phase"><h4>2 / Square heel turn</h4><p>Divide the <strong>${c.heelStitches} heel stitches</strong> into <strong>${c.classicSide} side / ${c.classicCenter} centre / ${c.classicSide} side</strong>. Do not slip the first stitch during this turn.</p><ol>
        <li><strong>Row 1 (RS):</strong> K${c.classicSide + c.classicCenter}, turn; ${c.classicSide} side stitches remain unworked.</li>
        <li><strong>Row 2 (WS):</strong> P${c.classicCenter}, turn.</li>
        <li><strong>Rows 3–${c.classicTurnRows}:</strong> Repeat this pair <strong>${c.classicSide} times</strong>: RS K${c.classicCenter - 1}, ssk across the gap, turn. WS P${c.classicCenter - 1}, p2tog across the gap, turn. Each decrease joins the last centre stitch to the next side stitch.</li>
      </ol><p class="heel-count">Turn complete: <strong>${c.classicCenter} heel stitches</strong> remain.</p></div>
      <div class="heel-phase"><h4>3 / Pick up & decrease</h4><p>Pick up <strong>${c.pickup} stitches on each flap edge</strong> and work across the ${c.heelStitches} resting instep stitches. You have <strong>${c.classicGussetSetupStitches} stitches</strong> before any optional corner pickups. On alternate rounds, decrease one stitch at each side of the sole <strong>${c.classicGussetDecreaseRounds} times</strong> to return to ${c.stitches} stitches. If you picked up extra corner stitches, decrease those too.</p></div>
    </div>`;
  }
  return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Toe-up flap & gusset</h3></div></div>
    <div class="heel-phase"><h4>1 / Gusset</h4><p>Increase one stitch at each edge of the ${c.heelStitches}-stitch sole on alternate rounds, <strong>${c.toeUpGussetPerSide} times</strong>. You now have <strong>${c.gussetStitches} stitches</strong>: ${c.heelStitches} instep, ${c.toeUpGussetPerSide} side-gusset, ${c.heelStitches} central sole, ${c.toeUpGussetPerSide} side-gusset.</p></div>
    <div class="heel-phase"><h4>2 / Turn the central sole</h4><p>Keep the instep and gusset stitches resting. Begin at the first of the <strong>${c.heelStitches} central sole stitches</strong>, RS facing. Use wrap-and-turn (w&amp;t); a wrapped stitch still counts as one stitch.</p><ol>
      <li><strong>Row 1 (RS):</strong> K${c.heelStitches - 1}, w&amp;t the last central stitch.</li>
      <li><strong>Row 2 (WS):</strong> P${c.heelStitches - 2}, w&amp;t the last central stitch at the other edge.</li>
      <li><strong>Rows 3–${c.classicSide * 2}:</strong> On RS and WS, work to one stitch before the nearest wrapped stitch, w&amp;t that stitch. Repeat this pair <strong>${c.classicSide - 1} times</strong>. You now have ${c.classicSide} wrapped stitches on each side and <strong>${c.classicCenter} unwrapped centre stitches</strong>.</li>
      <li><strong>Work back out:</strong> On each RS, knit across the centre and the next wrapped stitch, knitting its wrap with it, then turn. On each WS, purl back and resolve the next wrap, then turn. Repeat <strong>${c.classicSide} RS/WS pairs</strong> to restore all ${c.heelStitches} sole stitches.</li>
    </ol></div>
    <div class="heel-phase"><h4>3 / Work the flap upward</h4><p>Each row consumes one side-gusset stitch while keeping ${c.heelStitches} active heel stitches:</p><ol><li><strong>RS:</strong> Sl 1, K${c.heelStitches - 2}, ssk the last heel stitch with the next gusset stitch; turn.</li><li><strong>WS:</strong> Sl 1, P${c.heelStitches - 2}, p2tog the last heel stitch with the next gusset stitch; turn.</li></ol><p>Repeat these two rows <strong>${c.toeUpGussetPerSide} times</strong>. All gusset stitches are used; return to the round with <strong>${c.stitches} stitches</strong> and continue the leg.</p></div>
  </div>`;
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
      item(3, 'HEEL', state.heel === 'flk' ? 'Work short-row heel' : 'Work flap, turn & gusset', `Work on the ${c.heelStitches} heel stitches.`, '', heelInstructions(c)),
      item(4, 'FOOT & TOE', 'Shape the finish', toeDown, `≈ ${lengthText(c.toeLength)} TOE`),
    ];
  } else {
    const heelPoint = state.heel === 'flk' ? c.shortRowStart : c.gussetStart;
    const heelName = state.heel === 'flk' ? 'heel' : 'gusset';
    steps = [
      item(1, 'BEGIN', `Cast on ${c.toeStitches} stitches`, toeUp, `${c.toeStitches} → ${c.stitches}`),
      item(2, 'FOOT', `Work to ${heelName} start`, `Measure from the toe. Begin at about <strong>${lengthText(heelPoint)}</strong> of foot length. Try on and adjust the heel placement as needed.`),
      item(3, 'HEEL', state.heel === 'flap' ? 'Shape gusset, turn & flap' : 'Work short-row heel', `Work on the ${c.heelStitches} sole stitches.`, '', heelInstructions(c)),
      item(4, 'LEG & CUFF', 'Finish the leg', `${leg} Then work ${rib} Bind off loosely or use a stretchy bind-off.`),
    ];
  }
  return `<div class="recipe-title"><span>THE ROUTE</span><span>${state.direction === 'cuff' ? 'CUFF → TOE' : 'TOE → CUFF'}</span></div>${steps.join('')}`;
}

function formulaContent(c) {
  const unit = state.unit;
  const multiplier = unit === 'in' ? state.stitchGauge * 2.54 / 10 : state.stitchGauge / 10;
  const circumference = unit === 'in' ? decimal(cmToIn(state.circumference), 2) : decimal(state.circumference);
  $('#formula-stitches-equation').textContent = `stitches = round₄(circumference × (1 − ease) × sts / ${unit})`;
  $('#formula-toe-equation').textContent = `toe length ≈ total toe rounds ÷ rounds per ${unit}`;
  $('#formula-landmark-equation').textContent = `gusset length ≈ (increases / side × 2) ÷ rounds per ${unit}`;
  $('#formula-stitches').innerHTML = `${circumference} ${unit} × ${decimal(1 - state.ease / 100, 2)} × ${decimal(multiplier, 2)} sts/${unit} = ${decimal(c.rawStitches, 1)} → <strong>${c.stitches} sts</strong>`;
  if (state.heel === 'flk') {
    $('#formula-heel-description').textContent = 'The heel uses half the sock stitches. Leave one stitch at each edge; divide the rest into two twin-stitch wedges and a plain centre.';
    $('#formula-heel-equation').innerHTML = 'heel sts = total ÷ 2<br>twins / side ≈ round((heel sts − 2) ÷ 3)<br>centre = heel sts − 2 − 2 × twins / side';
    $('#formula-heel').innerHTML = `${c.heelStitches} = 1 + ${c.flkTwinsPerSide} + <strong>${c.flkCenter}</strong> + ${c.flkTwinsPerSide} + 1<br>First and second wedges each use ${c.flkTwinsPerSide - 1} additional RS/WS pairs.`;
  } else if (state.direction === 'cuff') {
    $('#formula-heel-description').textContent = 'The heel uses half the sock stitches. A square turn divides them into two equal side groups and a centre group; each turn-row pair consumes one stitch from each side.';
    $('#formula-heel-equation').innerHTML = 'side = floor(heel sts ÷ 3)<br>centre = heel sts − 2 × side<br>gusset setup = sock sts + centre';
    $('#formula-heel').innerHTML = `${c.heelStitches} = ${c.classicSide} + <strong>${c.classicCenter}</strong> + ${c.classicSide}<br>${c.classicGussetSetupStitches} setup sts − (2 × ${c.classicGussetDecreaseRounds} decrease rounds) = ${c.stitches} sts`;
  } else {
    $('#formula-heel-description').textContent = 'The toe-up gusset increases on both sole edges. Its added stitches are consumed while working the heel flap upward.';
    $('#formula-heel-equation').innerHTML = 'heel sts = total ÷ 2<br>gusset increases / side ≈ round(⅜ × heel sts)<br>turn centre = heel sts − 2 × floor(heel sts ÷ 3)';
    $('#formula-heel').innerHTML = `${c.heelStitches} heel sts; ${c.toeUpGussetPerSide} increases / side<br>${c.stitches} + 2 × ${c.toeUpGussetPerSide} = <strong>${c.gussetStitches} setup sts</strong><br>Turn: ${c.classicSide} wraps / side + ${c.classicCenter} centre sts`;
  }
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
  try { localStorage.setItem('sock-calculator-settings', JSON.stringify(state)); } catch { /* Settings remain available this visit. */ }
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
    `Sock Calculator — ${state.direction === 'cuff' ? 'cuff-down' : 'toe-up'}, ${state.heel === 'flap' ? 'classic flap & gusset' : 'Fish Lips Kiss heel'}`,
    `Foot: ${lengthText(state.circumference)} around × ${lengthText(state.length)} long; ${state.ease}% ease`,
    `Gauge: ${decimal(state.stitchGauge)} sts, ${decimal(state.rowGauge)} rounds / 10 cm`,
    `Sock: ${c.stitches} sts; heel: ${c.heelStitches} sts; toe: ${c.toeStitches} sts; toe length ≈ ${lengthText(c.toeLength)}`,
    state.direction === 'cuff' ? `Foot to toe start: ${lengthText(c.toeStart)} from back heel` : `Foot to ${state.heel === 'flap' ? 'gusset' : 'heel'} start: ${lengthText(state.heel === 'flap' ? c.gussetStart : c.shortRowStart)} from toe`,
    ...$$('.recipe-step').map(step => step.innerText.replace(/\s+/g, ' ').trim()),
    $('.heel-card').innerText.replace(/\s+/g, ' ').trim(),
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
