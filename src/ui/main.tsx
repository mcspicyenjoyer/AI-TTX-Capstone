import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity as ActivityIcon,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Fingerprint,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  ActivitySchema,
  ConfirmationSchema,
  MeSchema,
  ProfileListSchema,
  ProfileViewSchema,
  type Activity,
  type Actor,
  type ProfileView,
} from '../contracts/profile.js';
import { ApiError, request, signOut } from './api.js';
import './style.css';

type Status = ProfileView['profile']['statements'][number]['status'];
const statusLabels: Record<Status, string> = {
  fact: 'Sourced fact',
  assumption: 'Assumption',
  unknown: 'Unknown',
  conflict: 'Conflict',
};
const statusIcons = {
  fact: CheckCircle2,
  assumption: CircleHelp,
  unknown: CircleHelp,
  conflict: TriangleAlert,
};
const date = (value: string) =>
  new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The operation could not be completed.';

function App() {
  const [actor, setActor] = useState<Actor | null>(null);
  const [view, setView] = useState<ProfileView | null>(null);
  const [activity, setActivity] = useState<Activity>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'profile' | 'activity'>('profile');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);

  async function loadProfile(currentActor: Actor) {
    setView(null);
    setActivity([]);
    setAcknowledged(false);
    setExpanded(new Set());
    if (currentActor.role !== 'facilitator') return;
    const profiles = await request(ProfileListSchema, '/api/profiles');
    const selected = profiles[0];
    if (!selected) return;
    const [snapshot, events] = await Promise.all([
      request(
        ProfileViewSchema,
        `/api/profiles/${selected.profileId}/revisions/${selected.revisionId}`,
      ),
      request(ActivitySchema, `/api/profiles/${selected.profileId}/activity`),
    ]);
    setView(snapshot);
    setActivity(events);
  }

  async function restoreSession() {
    setLoading(true);
    setError('');
    try {
      const session = await request(MeSchema, '/api/me');
      setActor(session.actor);
      await loadProfile(session.actor);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setActor(null);
        setView(null);
      } else setError(message(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void restoreSession();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const session = await request(MeSchema, '/api/session', {
        username: String(form.get('username')).trim(),
        accessCode: String(form.get('accessCode')),
      });
      setActor(session.actor);
      await loadProfile(session.actor);
    } catch (error) {
      setError(message(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    if (!view || !acknowledged) return;
    setSaving(true);
    setError('');
    try {
      const confirmation = await request(ConfirmationSchema, '/api/profile-confirmations', {
        profileId: view.profile.profileId,
        revisionId: view.profile.revisionId,
        contentHash: view.contentHash,
        acknowledgeUncertainties: true,
      });
      setView({ ...view, confirmation });
      setActivity(
        await request(ActivitySchema, `/api/profiles/${view.profile.profileId}/activity`),
      );
    } catch (error) {
      setError(message(error));
      if (error instanceof ApiError && error.status === 401) {
        setActor(null);
        setView(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setSaving(true);
    setError('');
    try {
      await signOut();
      setActor(null);
      setView(null);
      setActivity([]);
      setTab('profile');
    } catch (error) {
      setError(message(error));
    } finally {
      setSaving(false);
    }
  }

  const profile = view?.profile;
  const counts = Object.fromEntries(
    Object.keys(statusLabels).map((key) => [
      key,
      profile?.statements.filter((statement) => statement.status === key).length ?? 0,
    ]),
  );
  const filtered =
    profile?.statements.filter(
      (statement) =>
        (status === 'all' || statement.status === status) &&
        (category === 'all' || statement.category === category) &&
        (source === 'all' || statement.evidence.some((item) => item.sourceId === source)) &&
        `${statement.label} ${statement.value ?? ''} ${statement.explanation}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) ?? [];

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <Network size={23} strokeWidth={1.7} />
          <span>TTX Platform</span>
          <span className="environment">Local demo</span>
        </div>
        {actor && (
          <div className="account">
            <span>{actor.displayName}</span>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void logout()}
              disabled={saving}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </header>
      {loading ? (
        <main className="loading-state" aria-live="polite">
          <LoaderCircle className="spinner" size={26} />
          <p>Loading workspace...</p>
        </main>
      ) : !actor ? (
        <main className="login-layout">
          <form className="login-form" onSubmit={(event) => void login(event)}>
            <div className="login-mark">
              <LockKeyhole size={28} />
            </div>
            <p className="eyebrow">EXERCISE WORKSPACE</p>
            <h1>Workspace sign-in</h1>
            <p className="muted">Synthetic organisation / Local access</p>
            {error && (
              <div className="error" role="alert">
                <TriangleAlert size={18} />
                <span>{error}</span>
              </div>
            )}
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              maxLength={80}
              autoFocus
            />
            <label htmlFor="accessCode">Access code</label>
            <input
              id="accessCode"
              name="accessCode"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
            />
            <button className="primary login-submit" disabled={saving}>
              {saving ? <LoaderCircle className="spinner" size={18} /> : <ArrowRight size={18} />}
              Sign in
            </button>
          </form>
        </main>
      ) : (
        <div className="workspace">
          <nav className="sidebar" aria-label="Workspace">
            <p className="nav-heading">PREPARATION</p>
            {actor.role === 'facilitator' ? (
              <>
                <button
                  className={tab === 'profile' ? 'nav-item selected' : 'nav-item'}
                  onClick={() => setTab('profile')}
                >
                  <FileText size={18} />
                  Organisation profile
                </button>
                <button
                  className={tab === 'activity' ? 'nav-item selected' : 'nav-item'}
                  onClick={() => setTab('activity')}
                >
                  <ActivityIcon size={18} />
                  Activity
                </button>
              </>
            ) : (
              <div className="nav-item selected">
                <LockKeyhole size={18} />
                Participant workspace
              </div>
            )}
            <div className="sidebar-bottom">
              <span className="status-dot" />
              AI disabled<span>Synthetic data only</span>
            </div>
          </nav>
          <main className="main-content">
            {error && (
              <div className="error" role="alert">
                <TriangleAlert size={18} />
                <span>{error}</span>
                <button
                  className="icon-button"
                  title="Reload workspace"
                  aria-label="Reload workspace"
                  onClick={() => void restoreSession()}
                >
                  <RefreshCw size={17} />
                </button>
              </div>
            )}
            {actor.role === 'participant' ? (
              <section className="empty-state">
                <LockKeyhole size={32} />
                <h1>Participant workspace</h1>
                <p>No exercise content is available.</p>
                <span className="muted">Organisation review is restricted to the facilitator.</span>
              </section>
            ) : !view || !profile ? (
              <section className="empty-state">
                <FileText size={32} />
                <h1>No organisation profile</h1>
                <button className="secondary" onClick={() => void restoreSession()}>
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </section>
            ) : (
              <>
                <div className="breadcrumb">
                  Preparation
                  <ChevronRight size={14} />
                  {tab === 'profile' ? 'Organisation profile' : 'Activity'}
                </div>
                <div className="page-heading">
                  <div>
                    <div className="title-line">
                      <h1>{profile.organisationName}</h1>
                      <span className="badge synthetic">Synthetic</span>
                    </div>
                    <p className="muted">
                      Revision {profile.revisionNumber}
                      <span className="separator">/</span>Track: Technical
                      <span className="separator">/</span>
                      {date(profile.createdAt)}
                    </p>
                  </div>
                  <span className={`badge ${view.confirmation ? 'confirmed' : 'pending'}`}>
                    {view.confirmation ? <CheckCircle2 size={15} /> : <CircleHelp size={15} />}
                    {view.confirmation ? 'Confirmed' : 'Awaiting review'}
                  </span>
                </div>
                <div className="page-tabs" role="tablist" aria-label="Profile views">
                  <button
                    role="tab"
                    aria-selected={tab === 'profile'}
                    className={tab === 'profile' ? 'active' : ''}
                    onClick={() => setTab('profile')}
                  >
                    Profile
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'activity'}
                    className={tab === 'activity' ? 'active' : ''}
                    onClick={() => setTab('activity')}
                  >
                    Activity<span className="tab-count">{activity.length}</span>
                  </button>
                </div>
                {tab === 'activity' ? (
                  <section className="activity-section">
                    <h2>Profile activity</h2>
                    {activity.length === 0 ? (
                      <div className="empty-inline">
                        <ActivityIcon size={24} />
                        <p>No confirmations recorded.</p>
                      </div>
                    ) : (
                      <ol className="activity-list">
                        {activity.map((event) => (
                          <li key={event.sequence}>
                            <CheckCircle2 size={20} />
                            <div>
                              <strong>Revision confirmed</strong>
                              <p>
                                {event.actorName} confirmed {event.revisionId}.
                              </p>
                              <time dateTime={event.occurredAt}>{date(event.occurredAt)}</time>
                            </div>
                            <span className="sequence">#{event.sequence}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                ) : (
                  <div className="review-layout">
                    <section className="profile-section" aria-label="Profile evidence">
                      <div className="evidence-summary">
                        {(Object.keys(statusLabels) as Status[]).map((key) => {
                          const Icon = statusIcons[key];
                          return (
                            <button
                              key={key}
                              aria-pressed={status === key}
                              className={`summary-item ${key} ${status === key ? 'is-filtered' : ''}`}
                              onClick={() => setStatus(status === key ? 'all' : key)}
                            >
                              <span>
                                <Icon size={16} />
                                {statusLabels[key]}
                              </span>
                              <strong>{counts[key]}</strong>
                            </button>
                          );
                        })}
                      </div>
                      <div className="section-heading">
                        <h2>Organisation context</h2>
                        <span className="muted">
                          {filtered.length} of {profile.statements.length} entries
                        </span>
                      </div>
                      <div className="filters">
                        <div className="search-input">
                          <Search size={17} />
                          <input
                            aria-label="Search profile"
                            placeholder="Search profile"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                          />
                          {search && (
                            <button
                              className="icon-button"
                              title="Clear search"
                              aria-label="Clear search"
                              onClick={() => setSearch('')}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                        <label className="category-select">
                          <ListFilter size={17} />
                          <select
                            aria-label="Filter category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                          >
                            <option value="all">All categories</option>
                            <option value="organisation">Organisation</option>
                            <option value="network">Network</option>
                            <option value="responsibilities">Responsibilities</option>
                            <option value="continuity">Continuity</option>
                          </select>
                        </label>
                      </div>
                      {(status !== 'all' || source !== 'all') && (
                        <div className="filter-state">
                          <span>
                            {status === 'all' ? 'All statuses' : statusLabels[status as Status]}
                            {source !== 'all'
                              ? ` / ${profile.sources.find((item) => item.id === source)?.title}`
                              : ''}
                          </span>
                          <button
                            className="text-button"
                            onClick={() => {
                              setStatus('all');
                              setSource('all');
                            }}
                          >
                            <X size={14} />
                            Clear filters
                          </button>
                        </div>
                      )}
                      <div className="entry-table">
                        <div className="entry-header">
                          <span>Profile entry</span>
                          <span>Recorded value</span>
                          <span>Evidence status</span>
                          <span />
                        </div>
                        {filtered.length === 0 ? (
                          <div className="empty-inline">
                            <Search size={23} />
                            <p>No entries match these filters.</p>
                            <button
                              className="text-button"
                              onClick={() => {
                                setSearch('');
                                setStatus('all');
                                setCategory('all');
                                setSource('all');
                              }}
                            >
                              Reset filters
                            </button>
                          </div>
                        ) : (
                          filtered.map((statement) => {
                            const open = expanded.has(statement.id);
                            const Icon = statusIcons[statement.status];
                            return (
                              <article className="entry" key={statement.id}>
                                <button
                                  className="entry-row"
                                  aria-expanded={open}
                                  aria-controls={`evidence-${statement.id}`}
                                  onClick={() =>
                                    setExpanded((previous) => {
                                      const next = new Set(previous);
                                      if (open) next.delete(statement.id);
                                      else next.add(statement.id);
                                      return next;
                                    })
                                  }
                                >
                                  <span className="entry-label">
                                    <strong>{statement.label}</strong>
                                    <span className="category-name">{statement.category}</span>
                                  </span>
                                  <span className={statement.value === null ? 'no-value' : ''}>
                                    {statement.value ??
                                      (statement.status === 'conflict'
                                        ? 'Conflicting source values'
                                        : 'Not supplied')}
                                  </span>
                                  <span className={`evidence-status ${statement.status}`}>
                                    <Icon size={15} />
                                    {statusLabels[statement.status]}
                                  </span>
                                  <ChevronDown
                                    className={open ? 'chevron open' : 'chevron'}
                                    size={17}
                                  />
                                </button>
                                {open && (
                                  <div className="entry-evidence" id={`evidence-${statement.id}`}>
                                    <p>{statement.explanation}</p>
                                    {statement.evidence.map((item, index) => (
                                      <div className="source-excerpt" key={index}>
                                        <div>
                                          <FileText size={15} />
                                          <strong>
                                            {
                                              profile.sources.find(
                                                (source) => source.id === item.sourceId,
                                              )?.title
                                            }
                                          </strong>
                                          <span>{item.locator}</span>
                                        </div>
                                        <blockquote>{item.excerpt}</blockquote>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </article>
                            );
                          })
                        )}
                      </div>
                    </section>
                    <aside className="review-sidebar" aria-label="Revision review">
                      <section className="confirmation-section">
                        <div className="section-heading">
                          <h2>Revision review</h2>
                          <ShieldCheck size={20} />
                        </div>
                        <dl className="revision-details">
                          <div>
                            <dt>Revision</dt>
                            <dd>{profile.revisionId}</dd>
                          </div>
                          <div>
                            <dt>Data classification</dt>
                            <dd>Synthetic</dd>
                          </div>
                          <div>
                            <dt>Open uncertainties</dt>
                            <dd>
                              {(counts.assumption ?? 0) +
                                (counts.unknown ?? 0) +
                                (counts.conflict ?? 0)}
                            </dd>
                          </div>
                        </dl>
                        {view.confirmation ? (
                          <div className="confirmation-receipt" role="status">
                            <CheckCircle2 size={24} />
                            <strong>Revision confirmed</strong>
                            <span>{view.confirmation.confirmedBy.displayName}</span>
                            <time dateTime={view.confirmation.confirmedAt}>
                              {date(view.confirmation.confirmedAt)}
                            </time>
                          </div>
                        ) : (
                          <>
                            <label className="acknowledgement">
                              <input
                                type="checkbox"
                                checked={acknowledged}
                                onChange={(event) => setAcknowledged(event.target.checked)}
                                disabled={saving}
                              />
                              <span>
                                I have reviewed this revision, including its assumptions, unknowns
                                and conflicts.
                              </span>
                            </label>
                            <button
                              className="primary confirm-button"
                              disabled={!acknowledged || saving}
                              onClick={() => void confirm()}
                            >
                              {saving ? (
                                <LoaderCircle className="spinner" size={17} />
                              ) : (
                                <Check size={17} />
                              )}
                              {saving ? 'Saving...' : 'Confirm revision'}
                            </button>
                          </>
                        )}
                        <div className="revision-hash">
                          <Fingerprint size={15} />
                          <span title={view.contentHash}>{view.contentHash.slice(0, 16)}</span>
                        </div>
                      </section>
                      <section className="sources-section">
                        <h2>
                          Source register <span className="muted">{profile.sources.length}</span>
                        </h2>
                        <ul>
                          {profile.sources.map((item) => (
                            <li key={item.id}>
                              <button
                                aria-pressed={source === item.id}
                                onClick={() => setSource(source === item.id ? 'all' : item.id)}
                              >
                                <FileText size={18} />
                                <span>
                                  {item.title}
                                  <small>Version {item.version} / Synthetic</small>
                                </span>
                                <ChevronRight size={15} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </aside>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
