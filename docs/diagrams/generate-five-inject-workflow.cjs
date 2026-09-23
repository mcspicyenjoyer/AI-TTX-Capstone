// Documentation only. Generate the editable scene and SVG from the same geometry.
// Run from the repository root: node docs/diagrams/generate-five-inject-workflow.cjs
const fs = require('node:fs');
const path = require('node:path');

const W = 1600;
const H = 2790;
const elements = [];
const palette = {
  ink: '#243b40', muted: '#52696e', line: '#637a80',
  human: '#f4f0e8', ai: '#e4f3ed', app: '#e9f1fc', gap: '#fff4da',
};
const svg = [];
let sequence = 0;
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function base(id, type, x, y, width, height, options = {}) {
  const n = ++sequence;
  const item = {
    id, type, x, y, width, height, angle: 0, strokeColor: palette.line,
    backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1.5,
    strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null,
    roundness: null, seed: 2200 + n, version: 1, versionNonce: 9000 + n,
    isDeleted: false, boundElements: [], updated: 1790035200000, link: null,
    locked: false, ...options,
  };
  elements.push(item);
  return item;
}

function text(id, x, y, lines, width, size = 21, color = palette.ink, align = 'left') {
  const value = Array.isArray(lines) ? lines.join('\n') : lines;
  const height = value.split('\n').length * size * 1.35;
  base(id, 'text', x, y, width, height, {
    strokeColor: color, strokeWidth: 0, fontSize: size, fontFamily: 2,
    text: value, originalText: value, textAlign: align, verticalAlign: 'top',
    containerId: null, autoResize: false, lineHeight: 1.35,
  });
  const anchor = align === 'center' ? 'middle' : 'start';
  const tx = align === 'center' ? x + width / 2 : x;
  const spans = value.split('\n').map((line, i) =>
    `<tspan x="${tx}" y="${y + size + i * size * 1.35}">${esc(line)}</tspan>`).join('');
  svg.push(`<text data-id="${id}" data-width="${width}" data-x="${x}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${spans}</text>`);
}

function rect(id, x, y, w, h, color, radius = 12) {
  base(id, 'rectangle', x, y, w, h, {
    backgroundColor: color, roundness: { type: 3 },
  });
  svg.push(`<rect data-id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${color}" stroke="${palette.line}" stroke-width="1.5"/>`);
}

function card(id, x, y, w, h, title, lines, tone = 'human', small = false) {
  rect(id, x, y, w, h, palette[tone]);
  text(`${id}-title`, x + 20, y + 13, title, w - 40, small ? 20 : 24);
  text(`${id}-body`, x + 20, y + (small ? 47 : 50), lines, w - 40,
    small ? 18 : 21, palette.muted);
}

function edge(id, points, label, lx = 0, ly = 0, lw = 200) {
  const [x, y] = points[0];
  const relative = points.map(([xx, yy]) => [xx - x, yy - y]);
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  base(id, 'arrow', x, y, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), {
    strokeWidth: 2, points: relative, lastCommittedPoint: null,
    startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: 'arrow',
    elbowed: false,
  });
  svg.push(`<path data-id="${id}" d="${points.map(([xx, yy], i) => `${i ? 'L' : 'M'} ${xx} ${yy}`).join(' ')}" fill="none" stroke="${palette.line}" stroke-width="2" marker-end="url(#arrow)"/>`);
  if (label) text(`${id}-label`, lx, ly, label, lw, 18, palette.muted);
}

text('title', 50, 30, 'AI-assisted TTX / Exercise flow', 1480, 38);
text('subtitle', 50, 86, 'ENISA-adapted planning direction | 22 September 2026 | Synthetic prototype', 1480, 21, palette.muted);
for (const [i, [tone, label]] of Object.entries([
  ['human', 'Human review / decision'], ['ai', 'AI-assisted proposal'],
  ['app', 'Application control'], ['gap', 'Gap / coached retry'],
])) {
  const x = 50 + Number(i) * 370;
  rect(`legend-${tone}`, x, 132, 24, 24, palette[tone], 4);
  text(`legend-${tone}-label`, x + 36, 129, label, 315, 18);
}

card('purpose', 430, 190, 600, 100, '1. Set exercise intention',
  ['Purpose, one track, audience and initial scope']);
card('context', 430, 336, 600, 116, '2. Provide organisation context',
  ['Documents, guided setup or a reviewed profile', 'No document upload is universally required']);
card('profile', 430, 498, 600, 116, '3. Build and review the profile',
  ['Source-linked AI proposals and targeted questions', 'Facts, assumptions, conflicts and unknowns'], 'ai');
card('plan', 430, 660, 600, 140, '4. Review plan and context readiness',
  ['Confirm profile and exercise plan separately', 'Refine objectives, scope, roles and evaluation', 'Apply reviewed checks; record human decisions'], 'app');
card('intake-gap', 1100, 650, 400, 166, 'If essential context is missing',
  ['Provide evidence or revise scope', 'Review explicit exercise assumptions', 'Or save and stop pending information', 'No endless prompting or automatic pass'], 'gap', true);
card('package', 430, 860, 600, 116, '5. AI drafts the five-inject package',
  ['One coherent scenario with objective coverage', 'Reviewed criteria, evidence and role references'], 'ai');
card('package-review', 430, 1022, 600, 100, '6. Review and freeze the package',
  ['Check consistency, criteria and acceptable alternatives']);
card('briefing', 430, 1172, 600, 112, '7. Brief participants; check run readiness',
  ['Confirm roles, context, ground rules and access', 'Use the reviewed package and participant mapping'], 'app');
card('release', 430, 1334, 600, 100, '8. Facilitator approves and releases',
  ['Exact inject and recipients; server rechecks run state']);
card('answer', 430, 1484, 600, 100, '9. Assigned user or team responds',
  ['Agreed decisions, rationale and supporting evidence']);
card('assessment', 430, 1634, 600, 136, '10. Assess the recorded answer',
  ['AI proposes findings against reviewed criteria', 'Application validates; human resolves uncertainty', 'Provider failure leaves assessment pending'], 'app');
card('coach', 50, 1634, 310, 148, 'First answer insufficient',
  ['Give targeted feedback once', 'Submit second / final answer', 'Return to assessment'], 'gap', true);
card('unresolved', 1100, 1780, 400, 130, 'Second answer insufficient',
  ['Record an unresolved finding', 'No third answer and no forced pass'], 'gap', true);
card('outcome', 430, 1880, 600, 108, '11. Record this inject\'s final outcome',
  ['First-attempt success, coached success or unresolved', 'Retain answers, feedback and assessment evidence'], 'app');

base('complete', 'diamond', 570, 2040, 320, 116, { backgroundColor: palette.app });
svg.push(`<polygon data-id="complete" points="730,2040 890,2098 730,2156 570,2098" fill="${palette.app}" stroke="${palette.line}" stroke-width="1.5"/>`);
text('complete-text', 630, 2070, ['All five final', 'outcomes recorded?'], 200, 20, palette.ink, 'center');

card('debrief', 430, 2220, 600, 98, '12. Debrief with participants and facilitator',
  ['Record observations, context and exercise limitations']);
card('aar', 430, 2364, 600, 110, '13. AI drafts; human reviews the AAR',
  ['Cite exercise and debrief evidence', 'Separate first-attempt, coached and unresolved results'], 'ai');
card('actions', 430, 2520, 600, 112, '14. Assign and follow up improvements',
  ['Action owner, due date and status', 'Verify closure; use findings to inform future exercises']);

card('pending', 1100, 190, 400, 180, 'READINESS DETAILS PENDING',
  ['This diagram fixes the workflow structure.', 'Exact criteria, questions, stopping rules', 'and thresholds await the user\'s draft.', 'No readiness engine is implemented.'], 'gap', true);
card('source-note', 50, 336, 310, 195, 'RELEVANT INPUTS',
  ['Network context; IRP / playbooks', 'Asset inventory; BCP / DRP', 'Attributed guided answers', 'Not supplied / unknown / absent', 'remain different meanings.'], 'human', true);
card('shared-note', 50, 660, 310, 166, 'SHARED PROFILE',
  ['Services, assets, dependencies', 'Ownership and business impact', 'Reviewer confirms criticality.', 'Separate exercise assumptions.'], 'human', true);
card('role-note', 50, 1022, 310, 172, 'ROLES AND EVALUATION',
  ['Bind roles to users / teams.', 'RACI does not grant app access.', 'Review criteria and alternatives', 'before play.'], 'human', true);
card('scope-note', 1100, 1022, 400, 176, 'BOUNDED FIRST DRAFT',
  ['Five prepared injects in one track.', 'Technical and operational are both TTXs.', 'Two answers maximum per inject.', 'Adaptive coaching; no scenario branching.'], 'human', true);
card('assessment-note', 1100, 1484, 400, 132, 'UNCLEAR OR FAILED ASSESSMENT',
  ['Hold for review or manual evaluation.', 'No automatic fail or extra attempt.', 'AI never authorises release.'], 'human', true);
card('evidence-note', 50, 2220, 310, 190, 'EVIDENCE LIMITS',
  ['Earlier hints may help later on.', 'A first attempt is not proof of', 'wholly unaided readiness.', 'Discussed actions do not prove', 'executed recovery.'], 'human', true);
card('aar-note', 1100, 2364, 400, 180, 'IMPROVEMENT RECORD',
  ['Separate participant, plan/capability', 'and exercise-design findings.', 'Recommendations are not completed fixes.', 'Share only the reviewed audience view.'], 'human', true);

// Main sequence. Deliberate gaps keep branch labels separate from card text.
for (const [from, to, yy1, yy2] of [
  ['purpose', 'context', 290, 336], ['context', 'profile', 452, 498],
  ['profile', 'plan', 614, 660], ['package', 'package-review', 976, 1022],
  ['package-review', 'briefing', 1122, 1172], ['briefing', 'release', 1284, 1334],
  ['release', 'answer', 1434, 1484], ['answer', 'assessment', 1584, 1634],
  ['outcome', 'complete', 1988, 2040], ['debrief', 'aar', 2318, 2364],
  ['aar', 'actions', 2474, 2520],
]) edge(`${from}-to-${to}`, [[730, yy1 + 3], [730, yy2 - 5]]);
edge('ready-to-draft', [[730, 803], [730, 855]], 'Ready for these objectives', 752, 811, 285);
edge('context-gap', [[1034, 732], [1095, 732]], 'Gaps', 1040, 700, 58);
edge('revisit-context', [[1300, 647], [1300, 556], [1035, 556]], 'When inputs change', 1112, 528, 220);
edge('first-gap', [[425, 1702], [365, 1702]]);
edge('retry', [[205, 1629], [205, 1534], [425, 1534]], 'One coached retry', 220, 1506, 200);
edge('second-gap', [[1034, 1730], [1065, 1730], [1065, 1845], [1095, 1845]]);
edge('sufficient', [[730, 1774], [730, 1875]], 'Criteria met', 752, 1808, 200);
edge('gap-recorded', [[1300, 1914], [1300, 1934], [1035, 1934]]);
edge('next-inject', [[895, 2098], [1540, 2098], [1540, 1384], [1035, 1384]],
  'NO: next prepared inject', 1075, 2068, 330);
edge('all-outcomes', [[730, 2160], [730, 2215]], 'YES', 752, 2170, 100);

text('footer', 50, 2688, [
  'Application-owned records preserve revisions, approvals, releases, responses, feedback and human decisions.',
  'Planning diagram, not implemented navigation. Detailed RACI, grading rubric and AAR template remain pending.',
  'Adapted from ENISA (2026), sections 1-6. Scope and implementation boundaries: docs/PROJECT.md and docs/architecture.md.',
], 1500, 19, palette.muted);

const description = 'Purpose and track precede documents or guided setup. Reviewed source-linked context and a separate exercise plan feed objective-dependent readiness. Unresolved intake gaps require revision or stopping. A reviewed five-inject package and participant briefing precede facilitator-controlled releases. Each inject permits an initial answer and one coached retry, then a sufficient or unresolved outcome. All five outcomes lead to debrief, a human-reviewed AI draft AAR, and owned improvement actions. Readiness specification remains pending.';
const scene = { type: 'excalidraw', version: 2, source: 'AI-TTX-Capstone/local-workflow-generator',
  elements, appState: { viewBackgroundColor: '#ffffff', gridSize: null,
    exportBackground: true, exportWithDarkMode: false }, files: {} };
const output = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="flow-title flow-desc"><title id="flow-title">AI-assisted TTX: ENISA-adapted five-inject exercise flow</title><desc id="flow-desc">${esc(description)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M2 1 L8 5 L2 9" fill="none" stroke="${palette.line}" stroke-width="1.5"/></marker></defs><rect width="${W}" height="${H}" fill="white"/><g font-family="Arial, Helvetica, sans-serif">${svg.join('\n')}</g></svg>\n`;
fs.writeFileSync(path.join(__dirname, 'ttx-five-inject-workflow.excalidraw'), JSON.stringify(scene, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'ttx-five-inject-workflow.svg'), output);
console.log(`Generated workflow SVG and ${elements.length} editable elements.`);
