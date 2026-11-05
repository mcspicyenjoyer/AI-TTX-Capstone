import { Inbox } from 'lucide-react';
import type { ExerciseWorkspaceModel } from './use-exercise-workspace.js';
import { date, exerciseText, optionLabel } from './exercise-format.js';
import { EvidenceImages } from './artefact-images.js';

export function ParticipantExercise({ vm }: { vm: ExerciseWorkspaceModel }) {
  const { briefing: current, inbox } = vm;
  if (!current) return null;
  const briefing = current;
  return (
    <>
      {' '}
      <section className="run-section">
        <div className="section-heading">
          <h2>Starting arrangements</h2>
          <span className={`badge ${briefing.state === 'active' ? 'confirmed' : 'pending'}`}>
            {optionLabel(briefing.state)}
          </span>
        </div>
        {!['ready', 'not-required'].includes(briefing.step0Status) && (
          <p className="run-notice">
            <strong>Step 0:</strong> {optionLabel(briefing.step0Status)}
          </p>
        )}
        <p className="preserve-lines">{exerciseText(briefing.common)}</p>
        <h3>{briefing.role.name}</h3>
        <p className="preserve-lines">{exerciseText(briefing.role.briefing)}</p>
        <ul className="run-references">
          {briefing.references.map((reference) => (
            <li key={reference}>{exerciseText(reference)}</li>
          ))}
        </ul>
      </section>
      <section className="run-section" aria-label="Released inbox">
        <h2>Released inbox</h2>
        {inbox.length === 0 ? (
          <div className="empty-inline">
            <Inbox size={26} />
            <p>No injects released to you.</p>
          </div>
        ) : (
          inbox.map((item) => (
            <article className="inbox-item" key={item.id}>
              <h3>{item.title}</h3>
              <time dateTime={item.releasedAt}>{date(item.releasedAt)}</time>
              <EvidenceImages images={item.images} />
              <p className="inject-body">{exerciseText(item.body)}</p>
            </article>
          ))
        )}
      </section>
    </>
  );
}
