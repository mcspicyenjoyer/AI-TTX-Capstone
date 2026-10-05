import { Inbox } from 'lucide-react';
import type { ExerciseWorkspaceModel } from './use-exercise-workspace.js';
import { date } from './exercise-format.js';

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
            {briefing.state}
          </span>
        </div>
        {!['ready', 'not-required'].includes(briefing.step0Status) && (
          <p className="run-notice">Step 0: {briefing.step0Status.replaceAll('-', ' ')}</p>
        )}
        <p>{briefing.common}</p>
        <h3>{briefing.role.name}</h3>
        <p>{briefing.role.briefing}</p>
        <ul className="run-references">
          {briefing.references.map((reference) => (
            <li key={reference}>{reference}</li>
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
              <p className="inject-body">{item.body}</p>
            </article>
          ))
        )}
      </section>
    </>
  );
}
