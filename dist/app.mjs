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

const times = n => `${n} ${n === 1 ? 'time' : 'times'}`;
const moreTimes = n => `${n} more ${n === 1 ? 'time' : 'times'}`;

function heelInstructions(c) {
  if (state.heel === 'flk') {
    const H = c.heelStitches;
    const t = c.flkTwinsPerSide;
    const m = c.flkCenter;
    const cuffNote = state.direction === 'cuff'
      ? `<p class="heel-count"><strong>Before you start:</strong> about <strong>${lengthText(2.54)}</strong> before the heel, switch the heel half of the sock to plain stockinette; keep working the instep in pattern. The pattern calls this the dotted line on the cardboard foot.</p>`
      : '';
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Fish Lips Kiss heel</h3></div></div>
      <p>Work flat on <strong>${H} heel stitches</strong>, with ${H} instep stitches resting. Begin at the first heel stitch with the knit side facing. The stitch count never changes. Whenever you meet a twin stitch (TS) again, work its two loops together as one stitch.</p>
      ${cuffNote}
      <div class="heel-split">1 edge · <strong>${t} twin stitches</strong> · <strong>${m} centre stitches</strong> · <strong>${t} twin stitches</strong> · 1 edge</div>
      <div class="heel-phase"><h4>1 / Build the first half</h4><ol>
        <li><strong>Row 1 (RS):</strong> Knit to 2 stitches from the end (K${H - 2}), TSK in the next stitch, turn. The last stitch stays unworked.</li>
        <li><strong>Row 2 (WS):</strong> Purl to 2 stitches from the end (P${H - 4}), TSP in the next stitch, turn.</li>
        <li><strong>Row 3 (RS):</strong> Knit to 1 stitch before the TS (K${H - 5}), TSK in that stitch, turn.</li>
        <li><strong>Row 4 (WS):</strong> Purl to 1 stitch before the TS (P${H - 6}), TSP in that stitch, turn.</li>
        <li><strong>Repeat Rows 3–4 ${moreTimes(t - 2)}</strong> (${t - 1} pairs in all). Each row is 1 stitch shorter than the one before; the last pair is K${m + 1} / P${m}. End after a WS row with ${m} plain centre stitches, ${t} TS on each side and 1 unworked stitch at each end. Turn so the RS faces you.</li>
      </ol></div>
      <div class="heel-phase"><h4>2 / Boomerang</h4><ol>
        <li><strong>Row 1 (RS):</strong> Knit the ${m} centre stitches to the first TS and place a marker. Do not turn. Knit all ${t} TS on this side, each as one stitch. TSK in the last stitch, move the new TS to the left needle, turn.</li>
        <li><strong>Row 2 (WS):</strong> Pull the yarn snug on the corner TS. Purl ${t} to the marker, slip it, purl the ${m} centre stitches and place a second marker. Purl all ${t} TS on this side, each as one stitch. TSP in the last stitch, keep it tight, move it to the left needle, turn.</li>
      </ol></div>
      <div class="heel-phase"><h4>3 / Build the second half</h4><ol>
        <li><strong>Row 1 (RS):</strong> Pull the yarn snug. Knit ${t} to the first marker, slip it, knit the ${m} centre stitches to the second marker. Remove that marker, TSK in the next stitch, turn.</li>
        <li><strong>Row 2 (WS):</strong> Purl ${m} to the marker, remove it, TSP in the next stitch, turn.</li>
        <li><strong>Row 3 (RS):</strong> Knit to the TS and knit it as one stitch (K${m + 1} including the TS), TSK in the next stitch, turn.</li>
        <li><strong>Row 4 (WS):</strong> Purl to the TS and purl it as one stitch (P${m + 2} including the TS), TSP in the next stitch, turn.</li>
        <li><strong>Repeat Rows 3–4 ${moreTimes(t - 2)}</strong> (${t - 1} pairs in all). Each row is 1 stitch longer than the one before; the last pair is K${H - 5} / P${H - 4}. You end after a WS row with a TS in the next-to-last stitch at each edge. Turn: 2 TS sit on the right needle and 2 TS at the far end of the left needle.</li>
      </ol></div>
      <div class="heel-phase"><h4>4 / Finish and rejoin the round</h4><ol>
        <li><strong>Finishing row (RS):</strong> Knit the ${H - 2} heel stitches on the left needle, working the last 2 TS as single stitches.</li>
        <li><strong>Next round:</strong> Pull the yarn snug, work across the ${H} instep stitches, then knit the 2 TS waiting at the start of the heel as single stitches and continue around. You still have <strong>${c.stitches} stitches</strong>.${state.direction === 'toe' ? ` Keep the back of the sock in stockinette for about <strong>${lengthText(2.54)}</strong> above the heel before starting a patterned leg.` : ''}</li>
      </ol></div>
      <details class="twin-guide" open><summary>TSK & TSP quick reference</summary><p><strong>TSK:</strong> Insert the right needle into the right leg of the stitch below the next stitch, lift it onto the left needle beside that stitch and knit it. Put the new loop back on the left needle next to the original stitch, then turn.</p><p><strong>TSP:</strong> Slip the next stitch purlwise to the right needle. With the left needle tip, lift the "collar" (the stitch below, wrapped around its base) onto the right needle beside it and purl it. Slip the new twin stitch back to the left needle purlwise, then turn.</p><p>When you meet a TS later, knit or purl its two loops together as one stitch.</p></details>
      <div class="heel-source">Adapted as a counting reference from Patty-Joy White’s Fish Lips Kiss Heel v2.1, pages 8–16. Use the <a href="https://www.ravelry.com/patterns/library/fish-lips-kiss-heel" target="_blank" rel="noopener">original pattern ↗</a> for photos and technique details.</div>
    </div>`;
  }
  if (state.direction === 'cuff') {
    const H = c.heelStitches;
    const s = c.classicSide;
    const m = c.classicCenter;
    return `<div class="heel-card"><div class="heel-card-top"><span class="heel-icon">↶</span><div><span class="recipe-eyebrow">HEEL REFERENCE</span><h3>Classic flap & gusset</h3></div></div>
      <div class="heel-phase"><h4>1 / Flap</h4><p>Hold ${H} instep stitches. Work <strong>${c.flapRows} rows</strong> flat on the other ${H} heel stitches, starting with a RS row and ending with a WS row. Slip the first stitch of every row. On RS rows, (sl 1, k 1) across for reinforcement if desired. Each flap edge now has ${c.pickup} slipped-stitch loops.</p></div>
      <div class="heel-phase"><h4>2 / Square heel turn</h4><p>Divide the <strong>${H} heel stitches</strong> into <strong>${s} side / ${m} centre / ${s} side</strong>. Each row works across the centre, then decreases the last centre stitch together with the first side stitch beyond it, and turns. The turn leaves a small gap that marks the next decrease.</p><ol>
        <li><strong>Row 1 (RS):</strong> K${s + m - 1}, ssk, turn. ${s - 1} side stitches stay unworked beyond the ssk.</li>
        <li><strong>Row 2 (WS):</strong> Sl 1, P${m - 2}, p2tog, turn. ${s - 1} side stitches stay unworked beyond the p2tog.</li>
        <li><strong>Row 3 (RS):</strong> Sl 1, K${m - 2}, ssk (the stitch before the gap with the stitch after it), turn.</li>
        <li><strong>Row 4 (WS):</strong> Sl 1, P${m - 2}, p2tog (the stitch before the gap with the stitch after it), turn.</li>
        <li><strong>Repeat Rows 3–4 ${moreTimes(s - 2)}</strong> (Rows 5–${c.classicTurnRows}), until no side stitches are left beyond either gap. You end with a WS row.</li>
      </ol><p class="heel-count">Every row after Row 1 is ${m} stitches wide (sl 1 + ${m - 2} + the decrease). The heel loses 1 stitch per row: ${H} → ${H - 2} after Row 2 → <strong>${m} heel stitches</strong> after Row ${c.classicTurnRows}.</p></div>
      <div class="heel-phase"><h4>3 / Pick up & decrease the gusset</h4><ol>
        <li><strong>Setup round:</strong> Knit across the ${m} heel stitches. With the same needle, pick up and knit <strong>${c.pickup} stitches</strong> along the flap edge, one in each slipped-stitch loop. Place a marker, work across the ${H} instep stitches, place a marker. Pick up and knit ${c.pickup} stitches along the other flap edge, then knit ${m / 2} heel stitches. The round now starts at the centre of the sole. You have <strong>${c.classicGussetSetupStitches} stitches</strong>: ${H} instep + ${m + 2 * c.pickup} sole.</li>
        <li><strong>Decrease round:</strong> Knit to 3 stitches before the first marker, k2tog, k1; work across the instep; k1, ssk, knit to the end. 2 stitches decreased.</li>
        <li><strong>Plain round:</strong> Knit around, keeping the instep in pattern.</li>
        <li><strong>Repeat these 2 rounds ${times(c.classicGussetDecreaseRounds)}</strong> in all, until you are back to <strong>${c.stitches} stitches</strong> (${H} instep + ${H} sole).</li>
      </ol><p>If you pick up an extra stitch in each corner to close a gap, work one more decrease round.</p></div>
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
    $('#formula-heel').innerHTML = `${c.heelStitches} = 1 + ${c.flkTwinsPerSide} + <strong>${c.flkCenter}</strong> + ${c.flkTwinsPerSide} + 1<br>Row 1: K${c.heelStitches - 2} (heel sts − 2), TSK · Row 2: P${c.heelStitches - 4} (heel sts − 4), TSP<br>Each half: Rows 1–2, then Rows 3–4 × ${c.flkTwinsPerSide - 1} = ${c.flkTwinsPerSide} TS per side`;
  } else if (state.direction === 'cuff') {
    $('#formula-heel-description').textContent = 'The heel uses half the sock stitches. A square turn divides them into two equal side groups and a centre group. Every turn row decreases one side stitch into the centre, so the centre keeps the same width.';
    $('#formula-heel-equation').innerHTML = 'side = floor(heel sts ÷ 3)<br>centre = heel sts − 2 × side<br>Row 1: K(side + centre − 1), ssk · Row 2: sl 1, P(centre − 2), p2tog<br>turn rows = 2 × side<br>gusset setup = sock sts + centre';
    $('#formula-heel').innerHTML = `${c.heelStitches} = ${c.classicSide} + <strong>${c.classicCenter}</strong> + ${c.classicSide}<br>Row 1: K${c.classicSide + c.classicCenter - 1}, ssk · Row 2: sl 1, P${c.classicCenter - 2}, p2tog · ${c.classicTurnRows} rows → ${c.classicCenter} sts<br>${c.classicGussetSetupStitches} setup sts − (2 × ${c.classicGussetDecreaseRounds} decrease rounds) = ${c.stitches} sts`;
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
