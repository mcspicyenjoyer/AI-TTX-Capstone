import type { FamilyAssessment, PathwayClaim, ThreatPathway } from '../contracts/threat.js';
import { optionLabel } from './exercise-format.js';

function ClaimLines({ claims }: { claims: PathwayClaim[] }) {
  if (!claims.length) return <p className="muted">None recorded in the confirmed profile.</p>;
  return (
    <ul className="pathway-claims">
      {claims.map((claim) => (
        <li key={claim.claimId}>
          <span className={claim.status === 'fact' ? 'badge' : 'badge pending'}>
            {optionLabel(claim.status)}
          </span>{' '}
          {claim.text} <code>{claim.claimId}</code>
        </li>
      ))}
    </ul>
  );
}

// Applicability of a library family to the pinned confirmed profile, shown before generation.
export function FamilyAssessmentView({ family }: { family: FamilyAssessment }) {
  return (
    <div className="threat-family" aria-label="Threat library family">
      <p>
        <strong>{family.title}</strong>{' '}
        <span className={family.applicable ? 'badge' : 'badge pending'}>
          {family.applicable ? 'Applicable' : 'Not applicable'}
        </span>{' '}
        <span className="muted">{family.libraryVersion}</span>
      </p>
      <p>{family.summary}</p>
      {family.applicable ? (
        <p className="muted">
          Eligible pathways: {family.targets.map((target) => target.name).join('; ')}
        </p>
      ) : (
        <ul>
          {family.unmet.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <details>
        <summary>Library rules and references</summary>
        <ul>
          {family.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <ul>
          {family.references.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

// Facilitator-only map of the plan's pathway; hypotheses are never shown to players.
// The route and its open gaps are on screen; the supporting claims open on request, so a gap
// is not listed twice (ADR-045). All claims and their IDs remain on the page.
export function ThreatPathwayView({ pathway }: { pathway: ThreatPathway }) {
  const scenarioServices = pathway.services.filter((service) => service.selected);
  const count = (claims: PathwayClaim[]) =>
    `${claims.length} ${claims.length === 1 ? 'claim' : 'claims'}`;
  return (
    <section className="run-section threat-pathway" aria-label="Threat pathway">
      <h2>Threat pathway</h2>
      <p className="muted">
        {pathway.title} / {pathway.libraryVersion} / Facilitator only
      </p>
      <ol className="pathway-route" aria-label="Pathway route">
        <li>
          <span>Entry</span>
          {pathway.entryHypotheses.length
            ? `${pathway.entryHypotheses.length} ${pathway.entryHypotheses.length === 1 ? 'hypothesis' : 'hypotheses'}`
            : 'No access link recorded'}
        </li>
        <li>
          <span>Target</span>
          {pathway.target.name}
        </li>
        <li>
          <span>Service</span>
          {scenarioServices.map((service) => service.name).join('; ') || 'None selected'}
        </li>
        <li>
          <span>Open gaps</span>
          {pathway.gaps.length}
        </li>
      </ol>
      <h3>Entry point</h3>
      <p>{pathway.entryStatement}</p>
      {pathway.entryHypotheses.length ? (
        pathway.entryHypotheses.map((node) => (
          <details key={node.entityId}>
            <summary>
              {node.name} <span className="badge pending">Hypothesis</span>
            </summary>
            <ClaimLines claims={node.claims} />
          </details>
        ))
      ) : (
        <p className="muted">No confirmed access link to the target is recorded.</p>
      )}
      <h3>Gaps on the pathway</h3>
      <p className="muted">
        These claims are not confirmed facts. They keep their recorded state; participants discuss
        them rather than the package resolving them.
      </p>
      <ClaimLines claims={pathway.gaps} />
      <h3>Supporting claims</h3>
      <details>
        <summary>
          Target system: {pathway.target.name}{' '}
          <span className="muted">{count(pathway.target.claims)}</span>
        </summary>
        <ClaimLines claims={pathway.target.claims} />
      </details>
      {pathway.services.map((service) => (
        <details key={service.entityId}>
          <summary>
            Dependent service: {service.name}
            {service.selected && ' (scenario service)'}{' '}
            <span className="muted">{count(service.claims)}</span>
          </summary>
          <ClaimLines claims={service.claims} />
        </details>
      ))}
      <details>
        <summary>
          Recovery evidence <span className="muted">{count(pathway.recovery)}</span>
        </summary>
        <ClaimLines claims={pathway.recovery} />
      </details>
      <details>
        <summary>
          Authority <span className="muted">{count(pathway.authority)}</span>
        </summary>
        <ClaimLines claims={pathway.authority} />
      </details>
      {pathway.suppliers.map((supplier) => (
        <details key={supplier.entityId}>
          <summary>
            Facilitator-played supplier: {supplier.name}{' '}
            <span className="muted">{count(supplier.claims)}</span>
          </summary>
          <ClaimLines claims={supplier.claims} />
        </details>
      ))}
    </section>
  );
}
