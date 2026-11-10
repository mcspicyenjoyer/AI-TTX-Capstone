import { useState, type ReactNode } from 'react';
import {
  Clock,
  FileWarning,
  Globe,
  Mail,
  MessageSquare,
  Newspaper,
  Phone,
  SquareTerminal,
  Ticket,
  Voicemail,
} from 'lucide-react';
import type { DeliveredImage } from '../contracts/artefact-images.js';
import {
  exerciseText,
  optionLabel,
  parseExerciseText,
  type ExerciseBlock,
  type StoryLabel,
} from './exercise-format.js';
import { ImageThumbnail } from './artefact-images.js';

type Fact = Extract<ExerciseBlock, { kind: 'fact' }>;
type Message = Extract<ExerciseBlock, { kind: 'message' }>;

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
export function Blocks({
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

// Facilitator preview of what each role receives: the participant's own rendering, one role
// at a time (ADR-045). Display only; the stored role bodies are unchanged.
export function RoleMessages({
  roles,
  bodies,
}: {
  roles: { id: string; name: string }[];
  bodies: { roleId: string; body: string }[];
}) {
  const [roleId, setRoleId] = useState(bodies[0]?.roleId ?? '');
  const selected = bodies.find((item) => item.roleId === roleId) ?? bodies[0];
  if (!selected) return null;
  const parsed = parseExerciseText(exerciseText(selected.body));
  const name = (id: string) => roles.find((role) => role.id === id)?.name ?? id;
  return (
    <div className="role-messages">
      <div className="role-switch" role="tablist" aria-label="Role message">
        {bodies.map((item) => (
          <button
            key={item.roleId}
            role="tab"
            aria-selected={item.roleId === selected.roleId}
            onClick={() => setRoleId(item.roleId)}
          >
            {name(item.roleId)}
          </button>
        ))}
      </div>
      <div className="role-message" role="tabpanel" aria-label={name(selected.roleId) + ' message'}>
        {parsed.elapsedMinutes != null && (
          <p className="inject-meta">
            <span className="story-clock">
              <Clock size={14} />+{parsed.elapsedMinutes} min
            </span>
          </p>
        )}
        <Blocks blocks={parsed.blocks} factTitle="What this role knows" />
      </div>
    </div>
  );
}
