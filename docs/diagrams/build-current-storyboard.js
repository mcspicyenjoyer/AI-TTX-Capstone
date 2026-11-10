// Run through Figma's use_figma API in the existing storyboard file, not Node.js.
// A fresh page preserves the September concepts. Stop rather than overwrite on retry.
const pageName = '10 November 2026 - Implemented workflow';
if (figma.root.children.some((page) => page.name === pageName)) {
  throw new Error('Current storyboard already exists; inspect it before retrying.');
}
const created = [];
const mutated = [];
const keep = (node) => {
  created.push(node.id);
  return node;
};
const palette = {
  ink: '#202b2d',
  muted: '#526862',
  green: '#256b50',
  pale: '#e2f0e8',
  background: '#f5f7f7',
  line: '#d8e0de',
  white: '#ffffff',
  amber: '#7a5a1c',
  amberBg: '#fbf4e2',
  blue: '#2c5480',
  blueBg: '#e3ecf6',
};
const paint = (hex) => ({
  type: 'SOLID',
  color: {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  },
});
for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
  await figma.loadFontAsync({ family: 'Inter', style });
}
const oldPage = await figma.getNodeByIdAsync('0:1');
if (!oldPage || oldPage.type !== 'PAGE') throw new Error('Historical page is missing.');
oldPage.name = 'Archive - September 2026 concepts';
mutated.push(oldPage.id);
const page = keep(figma.createPage());
page.name = pageName;
await figma.setCurrentPageAsync(page);

function stack(parent, name, width, gap = 12, background, direction = 'VERTICAL') {
  const node = keep(figma.createAutoLayout(direction));
  node.name = name;
  node.resize(width, 1);
  node.primaryAxisSizingMode = direction === 'VERTICAL' ? 'AUTO' : 'FIXED';
  node.counterAxisSizingMode = direction === 'VERTICAL' ? 'FIXED' : 'AUTO';
  node.itemSpacing = gap;
  node.fills = background ? [paint(background)] : [];
  node.clipsContent = false;
  parent.appendChild(node);
  return node;
}
function text(parent, value, size = 16, style = 'Regular', color = palette.ink, width) {
  const node = keep(figma.createText());
  node.name = value.split('\n')[0].slice(0, 70);
  node.fontName = { family: 'Inter', style };
  node.fontSize = size;
  node.lineHeight = { unit: 'PERCENT', value: 140 };
  node.letterSpacing = { unit: 'PIXELS', value: 0 };
  node.fills = [paint(color)];
  node.characters = value;
  node.resize(width ?? parent.width - parent.paddingLeft - parent.paddingRight, 1);
  parent.appendChild(node);
  node.textAutoResize = 'HEIGHT';
  return node;
}
function pad(node, amount) {
  node.paddingTop = amount;
  node.paddingRight = amount;
  node.paddingBottom = amount;
  node.paddingLeft = amount;
}
function band(parent, value, tone = 'green') {
  const bg = tone === 'amber' ? palette.amberBg : tone === 'blue' ? palette.blueBg : palette.pale;
  const fg = tone === 'amber' ? palette.amber : tone === 'blue' ? palette.blue : palette.green;
  const node = stack(parent, value, parent.width - parent.paddingLeft - parent.paddingRight, 0, bg);
  pad(node, 12);
  text(node, value, 15, 'Medium', fg);
  return node;
}
function field(parent, label, value, lines = 1) {
  const width = parent.width - parent.paddingLeft - parent.paddingRight;
  const group = stack(parent, label, width, 5);
  text(group, label, 13, 'Semi Bold');
  const input = stack(group, label + ' value', width, 0, palette.white);
  input.strokes = [paint(palette.line)];
  input.strokeWeight = 1;
  input.cornerRadius = 4;
  pad(input, 10);
  text(input, value || ' ', 15, 'Regular');
  if (lines > 1) {
    input.resize(width, Math.max(input.height, lines * 22 + 20));
    input.primaryAxisSizingMode = 'FIXED';
  }
  return group;
}
function actions(parent, labels, primary = 0) {
  const width = parent.width - parent.paddingLeft - parent.paddingRight;
  const row = stack(parent, 'Actions', width, 10, undefined, 'HORIZONTAL');
  for (const [index, label] of labels.entries()) {
    const button = stack(
      row,
      label,
      Math.min(width, Math.max(130, label.length * 8 + 28)),
      0,
      index === primary ? palette.green : palette.white,
    );
    pad(button, 10);
    button.cornerRadius = 4;
    if (index !== primary) button.strokes = [paint(palette.line)];
    text(button, label, 14, 'Semi Bold', index === primary ? palette.white : palette.ink);
  }
  return row;
}
function tabs(parent, labels, selected) {
  const width = parent.width - parent.paddingLeft - parent.paddingRight;
  const row = stack(parent, 'Tabs', width, 8, undefined, 'HORIZONTAL');
  const each = (width - (labels.length - 1) * 8) / labels.length;
  for (const label of labels) {
    const tab = stack(row, label, each, 0, label === selected ? palette.pale : undefined);
    pad(tab, 8);
    text(
      tab,
      label,
      14,
      label === selected ? 'Semi Bold' : 'Regular',
      label === selected ? palette.green : palette.muted,
    );
  }
}
function entry(parent, title, detail, status) {
  const width = parent.width - parent.paddingLeft - parent.paddingRight;
  const row = stack(parent, title, width, 5);
  row.paddingTop = 10;
  row.paddingBottom = 10;
  text(row, title, 16, 'Semi Bold');
  if (detail) text(row, detail, 14, 'Regular', palette.muted);
  if (status) text(row, status, 13, 'Medium', palette.green);
}
const root = stack(page, 'TTX Platform - current nine-screen storyboard', 3344, 28, '#edf2f1');
root.x = 80;
root.y = 80;
pad(root, 64);
root.placeholder = true;
text(root, 'TTX Platform / Implemented workflow', 44, 'Bold');
text(
  root,
  '10 November 2026  |  Technical exercise workstream  |  Five-position prototype',
  22,
  'Medium',
  palette.green,
);
text(
  root,
  'Simplified editable UI states, not screenshots or live results. Illustrative synthetic content. Separate facilitator and participant sign-ins are assumed. Read left to right within each row.',
  18,
  'Regular',
  palette.muted,
);
text(root, 'PREPARE: 01-04     RUN: 05-07     REVIEW: 08-09', 17, 'Semi Bold');
const screens = [];
let row;
function screen(number, title, nav, heading, subtitle, note, participant = false) {
  if ((number - 1) % 3 === 0)
    row = stack(root, 'Storyboard row ' + Math.ceil(number / 3), 3216, 48, undefined, 'HORIZONTAL');
  const panel = stack(row, number + ' / ' + title, 1040, 12);
  text(panel, String(number).padStart(2, '0') + ' / ' + title, 23, 'Semi Bold');
  const shell = stack(panel, 'Editable screen - ' + title, 1040, 0, palette.white);
  shell.strokes = [paint(palette.line)];
  shell.strokeWeight = 1;
  const header = stack(shell, 'Application header', 1040, 8, palette.white, 'HORIZONTAL');
  pad(header, 18);
  text(header, 'TTX Platform', 20, 'Semi Bold', palette.ink, 704);
  text(header, participant ? 'Internal IT' : 'Facilitator', 15, 'Medium', palette.muted, 250);
  const body = stack(shell, 'Workspace', 1040, 0, palette.background, 'HORIZONTAL');
  if (!participant) {
    const sidebar = stack(body, 'Navigation', 180, 16, '#eef3f2');
    pad(sidebar, 16);
    text(sidebar, 'PREPARATION', 11, 'Semi Bold', palette.muted);
    for (const name of [
      'Source intake',
      'Organisation profile',
      'Activity',
      'Package generation',
      'Exercises',
    ]) {
      const item = stack(sidebar, name, 148, 0, name === nav ? palette.pale : undefined);
      pad(item, 8);
      text(
        item,
        name,
        14,
        name === nav ? 'Semi Bold' : 'Regular',
        name === nav ? palette.green : palette.muted,
      );
    }
    sidebar.resize(180, 740);
    sidebar.primaryAxisSizingMode = 'FIXED';
  }
  const main = stack(body, 'Content', participant ? 1040 : 860, 14);
  pad(main, 24);
  text(main, heading, 27, 'Semi Bold');
  text(main, subtitle, 14, 'Regular', palette.muted);
  screens.push({
    number,
    title,
    panelId: panel.id,
    screenId: shell.id,
    contentId: main.id,
    shell,
    main,
  });
  text(panel, note, 16, 'Regular', palette.muted);
  return main;
}

let main = screen(
  1,
  'Import organisation sources',
  'Source intake',
  'Source intake',
  'Teralqen Engineering / Preparation draft',
  'Native import or optional AI extraction. Source quotations, versions and uncertainty remain reviewable.',
);
tabs(main, ['Sources (4)', 'Entities', 'Claims', 'Review'], 'Sources (4)');
tabs(main, ['Document', 'Guided evidence'], 'Document');
field(main, 'Source title', 'Business continuity plan');
const inputs = stack(main, 'Source metadata', 812, 16, undefined, 'HORIZONTAL');
field(stack(inputs, 'Version', 240, 8), 'Version', 'draft-1');
field(stack(inputs, 'Document type', 556, 8), 'Document type', 'BCP');
field(main, 'Source file', 'business-continuity-plan.md');
text(main, "[x] This source meets the prototype's data requirements.", 14);
actions(main, ['Import source', 'Extract candidates']);
entry(main, 'network-diagram.drawio.svg', 'Document type: Network diagram / Version draft-1');
entry(main, 'business-continuity-plan.md', 'Document type: BCP / Version draft-1');

main = screen(
  2,
  'Reconcile and confirm',
  'Source intake',
  'Teralqen Engineering',
  'Preparation draft / Human review',
  'Knowledge status and review decision are separate. In Review, resolve pending decisions and select Confirm profile snapshot. This creates an immutable profile, not a capability certification.',
);
tabs(main, ['Sources', 'Entities', 'Claims', 'Review'], 'Claims');
field(main, 'Knowledge status', 'Proposal');
field(main, 'Value', '4');
field(main, 'Decision', 'Accepted');
band(main, 'Source evidence: proposed minimum-service recovery target.', 'blue');
entry(main, 'Conflicts and unknowns retained', 'A target is not a measured recovery result.');
field(
  main,
  'Review rationale',
  'Reviewed source meaning and retained the feasibility uncertainty.',
);
text(main, '[x] I reviewed the source evidence, proposals, assumptions and remaining gaps.', 14);
actions(main, ['Save review']);

main = screen(
  3,
  'Bind the confirmed profile',
  'Package generation',
  'Package generation',
  'Five positions / Three player roles',
  'Operator handoff: package-target.json binds the confirmed ID, revision and hash. The profile page is not an automatic generation selector.',
);
tabs(main, ['Profile', 'Scenario', 'Pathway', 'Preparation', 'Injects'], 'Profile');
text(main, 'Confirmed profile binding', 20, 'Semi Bold');
entry(main, 'Teralqen Engineering', 'Immutable profile revision / SHA-256 checked at generation');
entry(
  main,
  'Threat library applicability',
  'Suspected ransomware: shared files unavailable',
  'Applicable',
);
entry(
  main,
  'Engineering service -> File server',
  'Entry-point hypotheses and recovery gaps remain explicit.',
);
band(main, 'AI output remains a proposal. Facilitator review is required.', 'amber');
actions(main, ['Generate draft']);
field(main, 'Package draft', 'Reviewed synthetic preparation example');

main = screen(
  4,
  'Review and freeze the package',
  'Package generation',
  'Package generation',
  'Facilitator review / Five injects accepted',
  'Save preparation before final acceptance. Optional images need review and explicit attachment. Freeze creates a new unplayed run.',
);
tabs(main, ['Profile', 'Scenario', 'Pathway', 'Preparation', 'Injects'], 'Injects');
tabs(main, ['1 / Files', '2 / Scope', '3 / Service', '4 / Recovery', '5 / Restore'], '1 / Files');
text(main, 'Shared engineering files unavailable', 20, 'Semi Bold');
field(main, 'Elapsed minutes', '0');
field(main, 'Decision point', 'Containment authority');
text(main, 'Saved role-specific messages', 17, 'Semi Bold');
tabs(main, ['Business leadership', 'Engineering', 'Internal IT'], 'Internal IT');
band(
  main,
  'Helpdesk ticket from Project team: Working files unavailable\nThe shared working files cannot be opened.',
  'blue',
);
text(main, 'Expected actions / Evaluation criteria / Facilitator notes', 16, 'Semi Bold');
actions(main, ['Save edit', 'Accept inject', 'Reject inject'], 1);
entry(main, 'Package approval', '5/5 accepted; objective coverage resolved');
actions(main, ['Approve and freeze package']);

main = screen(
  5,
  'Prepare and start the run',
  'Exercises',
  'Facilitator workspace',
  'Technical exercise / Draft run',
  'Step 0 Ready precedes start. After start: Approve inject, then Release to inbox. Pausing freezes new writes; resume needs current context.',
);
tabs(main, ['Run', 'Record report'], 'Run');
text(main, 'Team contact-route check', 20, 'Semi Bold');
band(main, 'Ready / Recorded team answers and facilitator rationale');
entry(main, 'First contact', 'Team names the incident coordination route.');
entry(
  main,
  'Contact details and fallback',
  'Team explains where to find the route and when to escalate.',
);
text(main, 'Prepared briefing', 20, 'Semi Bold');
text(main, 'Common context, selected references and role-specific knowledge.', 16);
text(main, '[x] Briefing and permitted actions acknowledged.', 15);
actions(main, ['Confirm briefing and start']);

main = screen(
  6,
  'Read and respond by inject',
  'Exercises',
  'Participant workspace',
  'Internal IT / Active / Inject 1 released',
  'Only assigned releases appear. One agreed team response per position, with revisions. Tabs and refreshes retain local drafts; page reload is not durable storage.',
  true,
);
tabs(main, ['Briefing', '1 / Files'], '1 / Files');
const columns = stack(main, 'Inject beside team response', 992, 24, undefined, 'HORIZONTAL');
const reading = stack(columns, 'Released inject', 584, 14, palette.white);
pad(reading, 18);
text(reading, 'Shared engineering files unavailable', 22, 'Semi Bold');
text(reading, '+0 min / Released to Internal IT', 14, 'Medium', palette.green);
text(
  reading,
  'Helpdesk ticket from Project team: Working files unavailable\nThe shared working files cannot be opened.\n\nDiscussion:\nWhat evidence and authority do you need before disruptive action?',
  17,
);
entry(reading, 'Attached image', 'Optional reviewed evidence image');
actions(reading, ['Enlarge image', 'Download'], -1);
const response = stack(columns, 'Team response', 384, 14, palette.white);
pad(response, 18);
text(response, 'Team response', 20, 'Semi Bold');
field(response, 'Agreed actions', 'Preserve evidence and confirm the authorised scope.', 2);
field(response, 'Team rationale', 'Avoid unsupported disruption or recovery claims.', 2);
field(response, 'Information requests', 'What is known about the affected service?', 2);
actions(response, ['Submit team response']);

main = screen(
  7,
  'Review the response and close',
  'Exercises',
  'Facilitator workspace',
  'Run / Position 1 / Team response revision 1',
  'Interpretation, disposition and closure are separate. Repeat the release/response/review/closure loop through five positions, then Complete run.',
);
text(main, 'Response interpretation', 20, 'Semi Bold');
actions(main, ['Interpret response']);
entry(main, 'Containment authority', 'Present / supported by an exact team-response quotation');
entry(main, 'Recovery evidence', 'Missing / not mentioned; no executed failure is inferred');
field(main, 'Review rationale', 'Checked the assessment and its exact quoted evidence.');
actions(main, ['Accept interpretation', 'Edit assessment'], 0);
text(main, 'Facilitator review', 20, 'Semi Bold');
field(main, 'Disposition', 'Reviewed');
actions(main, ['Record disposition', 'Close position']);

main = screen(
  8,
  'Debrief and capture the record',
  'Exercises',
  'Facilitator workspace',
  'Completed run / Record report',
  'Record debrief feedback first, then capture. New entries affect only later snapshots. Immutable records remain cited and facilitator-only.',
);
actions(main, ['Capture record snapshot']);
field(main, 'Snapshot', 'Completed five-position example / immutable hash');
tabs(main, ['Debrief', 'Records', 'After-action review'], 'Records');
tabs(main, ['By objective', 'Timeline'], 'By objective');
text(main, 'Containment authority', 20, 'Semi Bold');
entry(main, '> Release', 'Shared engineering files unavailable / [release ab12]');
entry(main, '> Team response', 'Agreed actions and rationale / [response cd34]');
entry(main, '> Facilitator disposition', 'Reviewed / [disposition ef56]');
actions(main, ['Expand all', 'Collapse all'], -1);
text(
  main,
  'Open a record for its full fields, Identifiers and exact citations.',
  14,
  'Regular',
  palette.muted,
);

main = screen(
  9,
  'Review the after-action report',
  'Exercises',
  'After-action review',
  'Selected immutable snapshot / Unreviewed draft',
  'AI or manual draft, then accept/edit/reject with rationale. Findings cite saved records; proposed actions are not completed actions.',
);
actions(main, ['Draft AAR', 'New manual AAR']);
text(main, 'Objective review', 20, 'Semi Bold');
entry(main, 'Strengths', 'Authority checks were included in the agreed response. [response cd34]');
entry(
  main,
  'Areas for improvement',
  'The response did not identify the required recovery evidence. [response cd34]',
);
text(main, 'Proposed improvement actions', 20, 'Semi Bold');
entry(
  main,
  'Clarify the recovery-evidence checklist',
  'Owner: Unassigned / Due: Not assigned / Status: Proposed',
);
field(main, 'Review rationale', 'Check attribution, quoted evidence and the proposed follow-up.');
actions(main, ['Accept AAR', 'Edit draft', 'Reject AAR']);

for (const item of screens) {
  const body = item.main.parent;
  const desired = Math.max(740, item.main.height);
  body.resize(1040, desired);
  body.counterAxisSizingMode = 'FIXED';
}
const footer = stack(root, 'Delivery boundaries', 3216, 10, palette.white);
pad(footer, 24);
text(footer, 'Implemented scope and remaining work', 23, 'Semi Bold');
text(
  footer,
  'Implemented: synthetic source intake and confirmation; controlled five-position generation; reviewed role delivery; responses, interpretation, debrief, snapshots and AAR.',
  18,
);
text(
  footer,
  'Still outstanding: approved response-dependent branching and recommendations, generated ten-position workflow, independent human evaluation and final Form B acceptance.',
  18,
  'Medium',
  palette.amber,
);
text(
  footer,
  'Separate operational ownership: development skeleton only. No mixed-track run. No coaching retry, real incident execution, deployment or measured workload-saving claim.',
  17,
  'Regular',
  palette.muted,
);
text(
  footer,
  'Operator profile binding and local worker management remain required. Assistant-led rehearsal is not independent human evaluation or evidence of actual recovery.',
  17,
  'Regular',
  palette.muted,
);
root.placeholder = false;
return {
  createdNodeIds: created,
  mutatedNodeIds: mutated,
  pageId: page.id,
  rootId: root.id,
  screens: screens.map(({ number, title, panelId, screenId, contentId }) => ({
    number,
    title,
    panelId,
    screenId,
    contentId,
  })),
  textCount: root.findAllWithCriteria({ types: ['TEXT'] }).length,
  frameCount: root.findAllWithCriteria({ types: ['FRAME'] }).length,
  size: { width: root.width, height: root.height },
};
