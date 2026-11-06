import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Clock,
  FileText,
  FileWarning,
  Globe,
  Inbox,
  Mail,
  MessageSquare,
  Newspaper,
  Phone,
  RefreshCw,
  SquareTerminal,
  Ticket,
  TriangleAlert,
  Voicemail,
} from 'lucide-react';
import type { Actor } from '../contracts/profile.js';
import type { DeliveredImage } from '../contracts/artefact-images.js';
import type { ExerciseWorkspaceModel } from './use-exercise-workspace.js';
import { useOutcomes, type OutcomeModel } from './use-outcomes.js';
import {
  date,
  exerciseText,
  optionLabel,
  parseExerciseText,
  type ExerciseBlock,
  type StoryLabel,
} from './exercise-format.js';
import { ImageThumbnail } from './artefact-images.js';
import { ResponseForm } from './response-form.js';
import { SavedResponse } from './outcome-workspace.js';

type InboxItem = ExerciseWorkspaceModel['inbox'][number];
type Fact = Extract<ExerciseBlock, { kind: 'fact' }>;
type Message = Extract<ExerciseBlock, { kind: 'message' }>;
type Entry = { id: string; number: number; title: string; item: InboxItem | null };

const storyIcons: Record<StoryLabel, typeof Mail> = {
  Email: Mail,
  'Chat message': MessageSquare,
  'Phone call': Phone,
  Voicemail: Voicemail,
  'Helpdesk ticket': Ticket,
  'Ransom note': FileWarning,
  'Leak-site post': Globe,
  'News item': Newspaper,
  'PowerShell transcript': SquareTerminal,
};

function FactList({ title, facts }: { title?: string; facts: Fact[] }) {
  return (
    <section className="fact-section" aria-label={title ?? 'Profile facts'}>
      {title && <h4>{title}</h4>}
      <ul className="fact-list">
        {facts.map((fact, index) => (
          <li key={index}>
            <span className={`fact-tag status-${fact.status}`}>{optionLabel(fact.status)}</span>
            <div>
              {fact.subject && (
                <p className="fact-subject">
                  <strong>{fact.subject}</strong>
                  {fact.field !== 'description' && (
                    <span className="fact-field">{fact.field.replaceAll('-', ' ')}</span>
                  )}
                </p>
              )}
              <p className="preserve-lines">{fact.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StoryMessage({ message, image }: { message: Message; image?: DeliveredImage }) {
  const Icon = storyIcons[message.label];
  const kind = message.label.toLowerCase().replaceAll(' ', '-');
  return (
    <section
      className={`story-message ${kind}${image ? ' has-image' : ''}`}
      aria-label={`${message.label} from ${message.sender}`}
    >
      <div className="story-text">
        <p className="story-meta">
          <Icon size={16} />
          <span className="story-kind">{message.label}</span>
          <span>{message.sender}</span>
        </p>
        <h4>{message.headline}</h4>
        <p className="story-body">{message.body}</p>
      </div>
      {image && <ImageThumbnail image={image} />}
    </section>
  );
}

// Renders parsed blocks in order; consecutive profile lines share one tagged list.
function Blocks({
  blocks,
  images = [],
  factTitle,
}: {
  blocks: ExerciseBlock[];
  images?: DeliveredImage[];
  factTitle?: string;
}) {
  const used = new Set<string>();
  const out: ReactNode[] = [];
  let facts: Fact[] = [];
  const flushFacts = (key: number) => {
    if (facts.length) out.push(<FactList key={`facts-${key}`} title={factTitle} facts={facts} />);
    facts = [];
  };
  blocks.forEach((block, index) => {
    if (block.kind === 'fact') {
      facts.push(block);
      return;
    }
    flushFacts(index);
    if (block.kind === 'text') {
      out.push(
        <p key={index} className="exercise-text preserve-lines">
          {block.text}
        </p>,
      );
    } else if (block.kind === 'message') {
      // Images are delivered with their story message's headline as the title.
      const image = images.find((item) => item.title === block.headline && !used.has(item.id));
      if (image) used.add(image.id);
      out.push(<StoryMessage key={index} message={block} image={image} />);
    } else {
      const discussion = block.title === 'Discussion';
      out.push(
        <section
          key={index}
          className={discussion ? 'discussion' : 'background-list'}
          aria-label={discussion ? 'Discussion questions' : block.title}
        >
          <h4>{discussion ? 'Discuss' : block.title}</h4>
          <ul>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        </section>,
      );
    }
  });
  flushFacts(blocks.length);
  const unmatched = images.filter((image) => !used.has(image.id));
  return (
    <>
      {unmatched.map((image) => (
        <ImageThumbnail key={image.id} image={image} />
      ))}
      {out}
    </>
  );
}

function BriefingPanel({
  briefing,
}: {
  briefing: NonNullable<ExerciseWorkspaceModel['briefing']>;
}) {
  const common = parseExerciseText(exerciseText(briefing.common)).blocks;
  const role = parseExerciseText(exerciseText(briefing.role.briefing)).blocks;
  const references = briefing.references.flatMap(
    (reference) => parseExerciseText(exerciseText(reference)).blocks,
  );
  return (
    <div className="briefing-view">
      <h2>Starting arrangements</h2>
      <section className="briefing-card" aria-label="Situation">
        <h3>Situation</h3>
        <Blocks blocks={common} />
      </section>
      <section className="briefing-card" aria-label="Your role">
        <h3>Your role: {briefing.role.name}</h3>
        <Blocks blocks={role} />
      </section>
      {references.length > 0 && (
        <section className="briefing-card" aria-label="References">
          <h3>References</h3>
          <Blocks blocks={references} />
        </section>
      )}
    </div>
  );
}

function TeamResponsePanel({
  model,
  releaseId,
  blocked,
}: {
  model: OutcomeModel;
  releaseId: string;
  blocked: boolean;
}) {
  const { view, error, pending, busy, saved, submit } = model;
  const position = view?.positions.find((item) => item.releaseId === releaseId);
  const disabled = blocked || busy || !!pending || !!error;
  return (
    <aside className="team-response" aria-label="Team response">
      <div className="section-heading">
        <h3>Team response</h3>
        {position && (
          <span className={`badge ${position.closed ? 'confirmed' : 'pending'}`}>
            {position.closed ? 'Closed' : 'Open'}
          </span>
        )}
      </div>
      {!view ? (
        <p className="muted">{error ? 'Responses are unavailable.' : 'Loading responses...'}</p>
      ) : !position ? (
        <p className="muted">No response record for this inject.</p>
      ) : (
        <>
          {position.response ? (
            <SavedResponse response={position.response} />
          ) : (
            <p className="muted">No team response recorded.</p>
          )}
          {!position.closed && view.run.state !== 'completed' && (
            <ResponseForm
              key={`${releaseId}/${saved}`}
              position={position}
              run={view.run}
              disabled={disabled}
              submit={submit}
            />
          )}
        </>
      )}
    </aside>
  );
}

function InjectPanel({
  entry,
  outcomes,
  blocked,
}: {
  entry: Entry;
  outcomes?: OutcomeModel;
  blocked: boolean;
}) {
  const parsed = entry.item ? parseExerciseText(exerciseText(entry.item.body)) : null;
  return (
    <div className={`inject-view${outcomes ? ' with-response' : ''}`}>
      <article className="inbox-item" aria-labelledby={`inject-title-${entry.id}`}>
        <header className="inject-head">
          <p className="inject-number">Inject {entry.number}</p>
          <h3 id={`inject-title-${entry.id}`}>{entry.title}</h3>
          <p className="inject-meta">
            {parsed?.elapsedMinutes != null && (
              <span className="story-clock">
                <Clock size={14} />+{parsed.elapsedMinutes} min
              </span>
            )}
            {entry.item && (
              <time dateTime={entry.item.releasedAt}>Released {date(entry.item.releasedAt)}</time>
            )}
          </p>
        </header>
        {parsed ? (
          <Blocks blocks={parsed.blocks} images={entry.item!.images} factTitle="What you know" />
        ) : (
          <p className="muted">No message was released to your role for this inject.</p>
        )}
      </article>
      {outcomes && <TeamResponsePanel model={outcomes} releaseId={entry.id} blocked={blocked} />}
    </div>
  );
}

function entriesFor(inbox: InboxItem[], positions?: { releaseId: string; position: number }[]) {
  const sorted = [...inbox].sort(
    (a, b) => a.releasedAt.localeCompare(b.releasedAt) || a.id.localeCompare(b.id),
  );
  const entries: Entry[] = sorted.map((item, index) => ({
    id: item.id,
    number: positions?.find((position) => position.releaseId === item.id)?.position ?? index + 1,
    title: item.title,
    item,
  }));
  for (const position of positions ?? [])
    if (!entries.some((entry) => entry.id === position.releaseId))
      entries.push({
        id: position.releaseId,
        number: position.position,
        title: `Inject ${position.position}`,
        item: null,
      });
  return entries.sort((a, b) => a.number - b.number);
}

// One released inject per tab, with the team's response beside it, so reading and answering
// happen on one screen. Inactive panels stay mounted (hidden) so unsaved drafts survive tab
// changes. A newly released inject opens only when the player was on the latest one and is
// not typing; otherwise its tab is marked New.
export function ParticipantExercise({
  vm,
  outcomes,
  blocked = false,
}: {
  vm: ExerciseWorkspaceModel;
  outcomes?: OutcomeModel;
  blocked?: boolean;
}) {
  // A foreground reload clears the briefing briefly; keep the last view mounted meanwhile so
  // response drafts survive, as they did when responses sat outside the reloading section.
  const cache = useRef({ briefing: vm.briefing, inbox: vm.inbox });
  if (vm.briefing) cache.current = { briefing: vm.briefing, inbox: vm.inbox };
  const { briefing, inbox } = vm.loading ? cache.current : vm;
  const positions = outcomes?.view?.positions;
  const entries = useMemo(() => entriesFor(inbox, positions), [inbox, positions]);
  const newest = entries.at(-1)?.id ?? null;
  const [tab, setTab] = useState<string>(newest ?? 'briefing');
  const [seen, setSeen] = useState(() => new Set(entries.map((entry) => entry.id)));
  const latest = useRef(newest);
  const choose = (id: string) => {
    setTab(id);
    setSeen((current) => (current.has(id) ? current : new Set(current).add(id)));
  };
  useEffect(() => {
    if (newest === latest.current) return;
    // The view mounts before the first read finishes; what that read returns is not "new".
    if (latest.current === null)
      setSeen((current) => new Set([...current, ...entries.map((entry) => entry.id)]));
    const following = tab === 'briefing' || tab === latest.current;
    const typing = document.activeElement instanceof HTMLTextAreaElement;
    latest.current = newest;
    if (newest && following && !typing) choose(newest);
  }, [newest, tab]);
  if (!briefing) return null;
  const active = tab === 'briefing' || entries.some((entry) => entry.id === tab) ? tab : 'briefing';
  const ids = ['briefing', ...entries.map((entry) => entry.id)];
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = ids[(ids.indexOf(active) + step + ids.length) % ids.length]!;
    choose(next);
    document.getElementById(`participant-tab-${next}`)?.focus();
  };
  const clock = entries.at(-1)?.item
    ? parseExerciseText(exerciseText(entries.at(-1)!.item!.body)).elapsedMinutes
    : null;
  return (
    <div className="participant-run">
      <div className="participant-summary">
        <div>
          <p className="summary-role">{briefing.role.name}</p>
          <p className="muted">
            {inbox.length
              ? `${inbox.length} ${inbox.length === 1 ? 'inject' : 'injects'} released to you`
              : 'Waiting for an inject released to you'}
            {clock !== null && ` · story time +${clock} min`}
          </p>
        </div>
        <span className={`badge ${briefing.state === 'active' ? 'confirmed' : 'pending'}`}>
          {optionLabel(briefing.state)}
        </span>
        {outcomes && (
          <button
            className="icon-button"
            title="Refresh outcomes"
            aria-label="Refresh outcomes"
            disabled={outcomes.busy || !!outcomes.pending}
            onClick={() => void outcomes.reload()}
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>
      {!['ready', 'not-required'].includes(briefing.step0Status) && (
        <p className="run-notice">
          <strong>Step 0:</strong> {optionLabel(briefing.step0Status)}
        </p>
      )}
      {outcomes?.error && (
        <p className="error" role="alert">
          <TriangleAlert size={18} />
          {outcomes.error}
        </p>
      )}
      {outcomes?.pending && !outcomes.busy && (
        <button className="secondary" onClick={() => void outcomes.perform(outcomes.pending!)}>
          <RefreshCw size={16} />
          Retry outcome request
        </button>
      )}
      {outcomes?.view?.run.state === 'paused' && (
        <p className="run-notice" role="status">
          Paused. Submissions, review and closure are frozen; local drafts are retained.
        </p>
      )}
      <div
        className="workspace-tabs inject-tabs"
        role="tablist"
        aria-label="Exercise inbox"
        onKeyDown={keys}
      >
        <button
          id="participant-tab-briefing"
          role="tab"
          aria-selected={active === 'briefing'}
          aria-controls="participant-panel-briefing"
          tabIndex={active === 'briefing' ? 0 : -1}
          onClick={() => choose('briefing')}
        >
          <FileText size={17} />
          Briefing
        </button>
        {entries.map((entry) => {
          const unseen = !seen.has(entry.id) && active !== entry.id;
          return (
            <button
              key={entry.id}
              id={`participant-tab-${entry.id}`}
              role="tab"
              aria-label={`Inject ${entry.number}: ${entry.title}${unseen ? ', new' : ''}`}
              aria-selected={active === entry.id}
              aria-controls={`participant-panel-${entry.id}`}
              tabIndex={active === entry.id ? 0 : -1}
              title={entry.title}
              onClick={() => choose(entry.id)}
            >
              <span className="tab-number">{entry.number}</span>
              <span className="tab-title">{entry.title}</span>
              {unseen && <span className="tab-new">New</span>}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id="participant-panel-briefing"
        aria-labelledby="participant-tab-briefing"
        hidden={active !== 'briefing'}
      >
        <BriefingPanel briefing={briefing} />
      </div>
      <section className="participant-inbox" aria-label="Released inbox">
        {/* Team response slots stay reachable even when nothing was delivered to this player. */}
        {inbox.length === 0 && (
          <div className="empty-inline">
            <Inbox size={26} />
            <p>No injects released to you.</p>
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            role="tabpanel"
            id={`participant-panel-${entry.id}`}
            aria-labelledby={`participant-tab-${entry.id}`}
            hidden={active !== entry.id}
          >
            <InjectPanel entry={entry} outcomes={outcomes} blocked={blocked} />
          </div>
        ))}
      </section>
    </div>
  );
}

// Technical runs pair each inject with the team's response for that inject.
export function ParticipantTechnicalExercise({
  vm,
  actor,
  selected,
  blocked,
  onChanged,
  onSessionExpired,
}: {
  vm: ExerciseWorkspaceModel;
  actor: Actor;
  selected: string;
  blocked: boolean;
  onChanged: () => void;
  onSessionExpired: () => void;
}) {
  const [track, runId] = selected.split('/');
  const outcomes = useOutcomes(
    actor,
    `/api/tracks/${track}/runs/${runId}`,
    onChanged,
    onSessionExpired,
  );
  return <ParticipantExercise vm={vm} outcomes={outcomes} blocked={blocked} />;
}
