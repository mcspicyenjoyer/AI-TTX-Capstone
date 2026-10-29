import type { FamilyAssessment, PathwayClaim, ThreatPathway } from '../contracts/threat.js';

function ClaimLines({ claims }: { claims: PathwayClaim[] }) {
  if (!claims.length) return <p className="muted">None recorded in the confirmed profile.</p>;
  return (
    <ul className="pathway-claims">
      {claims.map((claim) => (
        <li key={claim.claimId}>
          <span className={claim.status === 'fact' ? 'badge' : 'badge pending'}>
            {claim.status.toUpperCase()}
          </span>{' '}
          {claim.text} <code>{claim.claimId}</code>
        </li>
      ))}
    </ul>
  );
}

// Applicability of a library family to the pinned confirmed profile, shown before generation.
export function FamilyAssessmentView({ family }: { family: FamilyAssessment }) {
  const eligible = family.targets.filter((target) => target.supplierIds.length >= 2);
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
          Eligible pathways: {eligible.map((target) => target.name).join('; ')}
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
export function ThreatPathwayView({ pathway }: { pathway: ThreatPathway }) {
  return (
    <section className="run-section threat-pathway" aria-label="Threat pathway">
      <h2>Threat pathway</h2>
      <p className="muted">
        {pathway.title} / {pathway.libraryVersion} / Facilitator only
      </p>
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
      <h3>Target system: {pathway.target.name}</h3>
      <ClaimLines claims={pathway.target.claims} />
      <h3>Dependent services</h3>
      {pathway.services.map((service) => (
        <details key={service.entityId} open={service.selected}>
          <summary>
            {service.name}
            {service.selected && ' (scenario service)'}
          </summary>
          <ClaimLines claims={service.claims} />
        </details>
      ))}
      <h3>Recovery evidence</h3>
      <ClaimLines claims={pathway.recovery} />
      <h3>Authority</h3>
      <ClaimLines claims={pathway.authority} />
      <h3>Facilitator-played suppliers</h3>
      {pathway.suppliers.map((supplier) => (
        <details key={supplier.entityId}>
          <summary>{supplier.name}</summary>
          <ClaimLines claims={supplier.claims} />
        </details>
      ))}
      <h3>Gaps on the pathway</h3>
      <p className="muted">
        These claims are not confirmed facts. They keep their recorded state; players discuss them
        rather than the package resolving them.
      </p>
      <ClaimLines claims={pathway.gaps} />
    </section>
  );
}
