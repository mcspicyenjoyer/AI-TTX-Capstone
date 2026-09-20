// Editable, synthetic UI concepts. This script generates design data, not application state.
const fs = require('node:fs');
const path = require('node:path');

const elements = [];
const screens = [];
let sequence = 0;
let group = [];
const C = {
  ink: '#202b2d', muted: '#627371', line: '#d5dfdd', paper: '#ffffff',
  bg: '#f5f7f7', nav: '#edf2f1', green: '#176b58', greenBg: '#e1efe9',
  blue: '#355e84', blueBg: '#e8eff7', amber: '#895a10', amberBg: '#faf0d7',
  red: '#a7413b', redBg: '#faeae7',
};
function base(type, x, y, width, height, options = {}) {
  const n = ++sequence;
  const e = {
    id: `screen-concept-${n}`, type, x, y, width, height, angle: 0,
    strokeColor: C.line, backgroundColor: 'transparent', fillStyle: 'solid',
    strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100,
    groupIds: [...group], frameId: null, roundness: null, seed: 2000 + n,
    version: 1, versionNonce: 5000 + n, isDeleted: false, boundElements: [],
    updated: 1789862400000, link: null, locked: false, ...options,
  };
  elements.push(e);
  return e;
}
function rect(x, y, w, h, fill = C.paper, stroke = C.line) {
  return base('rectangle', x, y, w, h, { backgroundColor: fill, strokeColor: stroke });
}
function text(x, y, value, w, size = 16, color = C.ink) {
  return base('text', x, y, w, value.split('\n').length * size * 1.4, {
    strokeColor: color, strokeWidth: 0, fontSize: size, fontFamily: 2,
    text: value, originalText: value, textAlign: 'left', verticalAlign: 'top',
    containerId: null, autoResize: false, lineHeight: 1.4,
  });
}
function rule(x, y, w) {
  return base('line', x, y, w, 0, { points: [[0, 0], [w, 0]], lastCommittedPoint: null,
    startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: null });
}
function badge(x, y, label, w, tone = 'blue') {
  rect(x, y, w, 28, C[`${tone}Bg`], C[`${tone}Bg`]);
  text(x + 10, y + 5, label, w - 20, 13, C[tone]);
}
function button(x, y, label, w, primary = true, disabled = false) {
  rect(x, y, w, 40, disabled ? C.nav : primary ? C.green : C.paper,
    disabled ? C.line : primary ? C.green : C.line);
  text(x + 14, y + 9, label, w - 28, 15, disabled ? C.muted : primary ? C.paper : C.ink);
}
function field(x, y, label, value, w, h = 42) {
  text(x, y, label, w, 14, C.muted);
  rect(x, y + 25, w, h);
  text(x + 12, y + 36, value, w - 24, 15);
}
function check(x, y, value, w) {
  rect(x, y + 2, 16, 16);
  text(x + 27, y, value, w - 27, 14, C.muted);
}
function row(x, y, title, value, status, tone = 'green') {
  text(x, y + 12, title, 245, 15);
  text(x + 250, y + 12, value, 300, 14, C.muted);
  badge(x + 580, y + 9, status, 146, tone);
  rule(x, y + 57, 752);
}
function note(x, y, value, w, tone = 'blue') {
  rect(x, y, w, 68, C[`${tone}Bg`], C[`${tone}Bg`]);
  text(x + 16, y + 13, value, w - 32, 14, C[tone]);
}
function screen(index, title, capability, caption, active, role = 'Facilitator') {
  const x = 56 + ((index - 1) % 3) * 1156;
  const y = 238 + Math.floor((index - 1) / 3) * 920;
  group = [`screen-${index}`];
  text(x, y - 45, `${String(index).padStart(2, '0')} / ${title}`, 740, 22);
  badge(x + 770, y - 42, capability, 270, capability === 'Existing capability' ? 'green' : 'blue');
  rect(x, y, 1040, 780);
  rect(x, y, 1040, 56, C.paper);
  text(x + 24, y + 15, 'TTX Platform', 240, 20);
  text(x + 740, y + 19, `${role}  /  Synthetic`, 275, 14, C.muted);
  if (active) {
    rect(x, y + 56, 188, 724, C.nav, C.nav);
    text(x + 20, y + 82, 'EXERCISE WORKSPACE', 168, 11, C.muted);
    ['Organisation', 'Profile review', 'Exercise setup', 'Package review', 'Run control', 'After-action review']
      .forEach((label, i) => {
        const yy = y + 116 + i * 48;
        if (label === active) rect(x + 10, yy - 5, 168, 38, C.greenBg, C.greenBg);
        text(x + 20, yy + 4, label, 158, 14, label === active ? C.green : C.muted);
      });
    text(x + 20, y + 712, 'Example SME 01\nSynthetic context', 160, 12, C.muted);
  }
  text(x, y + 798, caption, 1040, 14, C.muted);
  const bounds = { index, title, capability, group: group[0], x, y, width: 1040, height: 780 };
  screens.push(bounds);
  return { x: x + (active ? 220 : 32), y: y + 86, sx: x, sy: y, w: active ? 788 : 976 };
}
function heading(s, title, subtitle) {
  text(s.x, s.y, title, s.w, 26);
  text(s.x, s.y + 42, subtitle, s.w, 14, C.muted);
  rule(s.x, s.y + 77, s.w - 32);
}

text(56, 30, 'TTX Platform / Screen Storyboard', 2800, 36);
text(56, 91, 'Design concepts, not a working exercise. All organisation context is synthetic.', 3000, 18, C.muted);
text(56, 124, 'Preparation: 01 > 02 > 03 > 04 > 05  |  Facilitator: 06  |  Participant: 07 > 08  |  Review: 09', 3350, 17);
text(56, 159, 'Technical: your frontend + backend. Operational: other worker. One platform; separate tracks, no mixed run.', 3350, 16, C.muted);

let s = screen(1, 'Workspace sign-in', 'Existing capability',
  'Current: server-validated facilitator and participant sign-in. Layout here is a simplified concept, not a screenshot.', null, 'Local access');
text(s.sx + 345, s.sy + 188, 'Workspace sign-in', 380, 28);
text(s.sx + 345, s.sy + 235, 'Synthetic organisation / Local access', 370, 15, C.muted);
field(s.sx + 345, s.sy + 290, 'Username', 'facilitator', 350);
field(s.sx + 345, s.sy + 380, 'Access code', 'Enter access code', 350);
button(s.sx + 345, s.sy + 488, 'Sign in', 350);
text(s.sx + 345, s.sy + 559, 'AI disabled in the current local build', 380, 14, C.muted);

s = screen(2, 'Organisation intake', 'Planned',
  'Proposed intake. Synthetic-only network/BCP/DRP inputs and SOC/MSSP context precede profile drafting.', 'Organisation');
heading(s, 'Organisation context', 'Example SME 01  /  Preparation  /  Draft');
field(s.x, s.y + 102, 'Organisation', 'Example SME 01', 355);
field(s.x + 389, s.y + 102, 'Business activity', 'Engineering services', 365);
text(s.x, s.y + 200, 'Source documents', 750, 18);
[['Network context', 'Not attached'], ['Business continuity plan', 'Not attached'], ['Disaster recovery plan', 'Not attached']]
  .forEach(([a, b], i) => {
    const y = s.y + 235 + i * 54;
    text(s.x, y + 10, a, 310, 15);
    text(s.x + 320, y + 10, b, 220, 14, C.muted);
    button(s.x + 592, y, 'Choose file', 162, false);
    rule(s.x, y + 47, 754);
  });
field(s.x, s.y + 415, 'SOC operating model', 'MSSP monitoring + internal IT response', 754);
check(s.x, s.y + 508, 'All organisation and exercise data is synthetic.', 754);
button(s.x + 534, s.y + 580, 'Prepare profile draft', 220);

s = screen(3, 'Profile review', 'Existing capability',
  'Current: evidence review and exact-revision confirmation. AI extraction, intake and profile editing are still planned.', 'Profile review');
heading(s, 'Example SME 01', 'Revision 1  /  Track: Technical  /  Awaiting review');
[['4', 'Sourced facts', 'green'], ['1', 'Assumption', 'amber'], ['2', 'Unknowns', 'blue'], ['1', 'Conflict', 'red']]
  .forEach(([n, title, tone], i) => {
    const x = s.x + i * 194;
    text(x, s.y + 99, n, 150, 28, C[tone]);
    text(x, s.y + 139, title, 180, 14, C.muted);
  });
row(s.x, s.y + 185, 'Business activity', 'Engineering services', 'Sourced fact');
row(s.x, s.y + 243, 'Backup isolation', 'Separate backup access', 'Assumption', 'amber');
row(s.x, s.y + 301, 'Containment authority', 'Not supplied', 'Unknown', 'blue');
row(s.x, s.y + 359, 'Recovery target', 'Conflicting source values', 'Conflict', 'red');
note(s.x, s.y + 439, 'Source evidence / File service recovery target\nBCP: four hours. DRP: eight hours. No value selected automatically.', 754, 'amber');
check(s.x, s.y + 534, 'I reviewed this revision and its open uncertainties.', 754);
button(s.x + 550, s.y + 590, 'Confirm revision', 204, true, true);

s = screen(4, 'Exercise setup', 'Planned',
  'Track selection is a concept, not implemented support. Operational content remains the other worker\'s scope.', 'Exercise setup');
heading(s, 'Exercise setup', 'One track per run  /  Five prepared injects');
text(s.x, s.y + 105, 'Exercise track', 754, 16);
rect(s.x, s.y + 140, 754, 49);
rect(s.x, s.y + 140, 377, 49, C.greenBg, C.greenBg);
text(s.x + 22, s.y + 154, '(o) Technical', 325, 16, C.green);
text(s.x + 404, s.y + 154, '( ) Operational', 320, 16);
field(s.x, s.y + 221, 'SOC / MSSP model', 'Confirmed profile reference', 360);
field(s.x + 392, s.y + 221, 'Responding users / teams', 'Not yet mapped', 362);
text(s.x, s.y + 326, 'Reference readiness', 754, 18);
row(s.x, s.y + 369, 'RACI task mapping', 'Awaiting supplied mapping', 'Pending', 'amber');
row(s.x, s.y + 427, 'Assessment rubric', 'Awaiting reviewed thresholds', 'Pending', 'amber');
row(s.x, s.y + 485, 'AAR template', 'Awaiting detailed template', 'Pending', 'amber');
button(s.x + 504, s.y + 598, 'Prepare five-inject draft', 250, true, true);

s = screen(5, 'Package review', 'Planned',
  'Five layout slots only, not generated injects. Required content references must be supplied and reviewed first.', 'Package review');
heading(s, 'Review exercise package', 'Track: Technical  /  Five slots  /  Not ready for approval');
text(s.x, s.y + 100, 'INJECT', 90, 12, C.muted);
text(s.x + 108, s.y + 100, 'CONTENT', 350, 12, C.muted);
text(s.x + 480, s.y + 100, 'RECIPIENTS / RACI', 270, 12, C.muted);
for (let i = 0; i < 5; i++) {
  const y = s.y + 142 + i * 74;
  text(s.x, y, `0${i + 1}`, 80, 20);
  text(s.x + 108, y, 'Draft content pending', 345, 16);
  text(s.x + 108, y + 26, 'Revision not yet prepared', 345, 13, C.muted);
  text(s.x + 480, y + 10, 'Unassigned', 230, 14, C.muted);
  rule(s.x, y + 61, 754);
}
note(s.x, s.y + 524, 'Generation blocked\nRACI, rubric and AAR template are not ready.', 754, 'amber');
button(s.x, s.y + 619, 'Return to setup', 184, false);
button(s.x + 548, s.y + 619, 'Approve package', 206, true, true);

s = screen(6, 'Facilitator control', 'Planned state example',
  'Illustrative paused run after recovery. Content and recipients remain bound to an exact revision; AI cannot release.', 'Run control');
heading(s, 'Exercise control', 'Track: Technical  /  Run paused  /  Explicit resume required');
badge(s.x, s.y + 104, 'Paused', 110, 'amber');
text(s.x + 143, s.y + 108, '1 of 5 outcomes recorded', 390, 16);
button(s.x + 586, s.y + 98, 'Resume run', 168);
text(s.x, s.y + 179, 'Prepared injects', 230, 18);
text(s.x + 274, s.y + 179, 'Selected release', 480, 18);
['01  Outcome recorded', '02  Held for release', '03  Not released', '04  Not released', '05  Not released']
  .forEach((label, i) => {
    if (i === 1) rect(s.x, s.y + 223 + i * 53, 240, 42, C.greenBg, C.greenBg);
    text(s.x + 10, s.y + 232 + i * 53, label, 220, 14, i === 1 ? C.green : C.muted);
  });
field(s.x + 274, s.y + 223, 'Content revision', 'Approved revision reference', 480);
field(s.x + 274, s.y + 311, 'Recipients', 'Reviewed recipient set', 480);
note(s.x + 274, s.y + 414, 'Release unavailable while paused.\nRevalidate approval and run state after resume.', 480, 'amber');
button(s.x + 514, s.y + 514, 'Release selected inject', 240, true, true);
rule(s.x, s.y + 588, 754);
text(s.x, s.y + 610, 'Activity / Recovery recorded; awaiting facilitator resume', 754, 15, C.muted);

s = screen(7, 'Participant response', 'Planned',
  'Participant projection: released content only. No future injects, facilitator notes, hidden rubric or other teams\' data.', null, 'Participant');
heading(s, 'Current inject', 'Track: Technical  /  Assigned team  /  Attempt 1 of 2');
badge(s.x, s.y + 104, 'Released content only', 195, 'green');
text(s.x, s.y + 165, 'Inject title', 620, 22);
rect(s.x, s.y + 209, 976, 115, C.bg, C.bg);
text(s.x + 20, s.y + 230, 'Approved participant-visible scenario information', 900, 18);
text(s.x + 20, s.y + 269, 'Content will come from the reviewed exercise package.', 900, 15, C.muted);
field(s.x, s.y + 364, 'Agreed team response', 'Record your decisions, rationale and relevant evidence...', 976, 150);
text(s.x, s.y + 562, 'Submission is attributed to the authorised responding team.', 730, 14, C.muted);
button(s.x + 752, s.y + 610, 'Submit first answer', 224);

s = screen(8, 'Coached retry', 'Planned state example',
  'One retry only. An insufficient second answer becomes an unresolved finding; it never opens a third submission.', null, 'Participant');
heading(s, 'Review feedback and retry', 'Current inject  /  Attempt 1 assessed  /  One answer remaining');
badge(s.x, s.y + 101, 'More detail needed', 184, 'amber');
text(s.x, s.y + 158, 'Feedback', 950, 21);
rect(s.x, s.y + 203, 976, 130, C.amberBg, C.amberBg);
text(s.x + 20, s.y + 222, 'Criterion-linked guidance appears here after assessment.', 915, 17, C.amber);
text(s.x + 20, s.y + 261, 'The submitted answer and reviewed rubric provide the evidence.\nNo criteria or scoring thresholds have been invented for this concept.', 915, 15, C.amber);
field(s.x, s.y + 376, 'Final answer / Attempt 2 of 2', 'Revise the agreed response...', 976, 138);
text(s.x, s.y + 562, 'Initial answer and guidance remain in the activity record.', 730, 14, C.muted);
button(s.x + 768, s.y + 610, 'Submit final answer', 208);

s = screen(9, 'After-action review', 'Planned',
  'Report layout proposal only. The supplied AAR template controls the final sections; findings must cite saved evidence.', 'After-action review');
heading(s, 'After-action review', 'Draft report  /  Human review required  /  Synthetic exercise');
[['Unaided', 'Not assessed'], ['Coached', 'Not assessed'], ['Unresolved', 'Not assessed']]
  .forEach(([a, b], i) => {
    text(s.x + i * 256, s.y + 104, a, 230, 17);
    text(s.x + i * 256, s.y + 140, b, 230, 14, C.muted);
  });
rule(s.x, s.y + 183, 754);
text(s.x, s.y + 211, 'Strengths, gaps and improvement actions', 754, 21);
text(s.x, s.y + 255, 'No findings have been generated.', 754, 16, C.muted);
field(s.x, s.y + 316, 'Selected finding', 'Awaiting evidence-backed assessment', 754);
field(s.x, s.y + 411, 'Evidence references', 'Inject / answer / attempt / rubric revision', 754);
note(s.x, s.y + 513, 'Template pending\nCompletion may include unresolved gaps; it is not a pass score.', 754, 'amber');
button(s.x + 494, s.y + 614, 'Share reviewed report', 260, true, true);

group = [];
const scene = {
  type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements,
  appState: { viewBackgroundColor: '#f1f4f4', gridSize: null, exportBackground: true }, files: {},
};
fs.writeFileSync(path.join(__dirname, 'ttx-screen-concepts.excalidraw'), JSON.stringify(scene, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'ttx-screen-concepts-index.json'), JSON.stringify({ screens }, null, 2) + '\n');
console.log(`Generated ${screens.length} screens and ${elements.length} editable elements.`);
