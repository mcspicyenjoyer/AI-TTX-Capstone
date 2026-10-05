import { useEffect, useRef, useState } from 'react';
import type { TSchema } from '@sinclair/typebox';
import type { Actor } from '../contracts/profile.js';
import {
  RunListSchema,
  ReviewSchema,
  BriefingViewSchema,
  InboxSchema,
  RunActivitySchema,
  type BriefingView,
  type Inbox as InboxItems,
  type Review,
  type RunActivity,
  type RunList,
} from '../contracts/exercise.js';
import { ApiError, request } from './api.js';

type Pending = { schema: TSchema; path: string; body: Record<string, unknown> };
const emptyStep0 = {
  firstContact: '',
  contactRoute: '',
  fallback: '',
  rationale: '',
  decision: 'clarification-required',
};
const step0Binding = (review: Review) =>
  `${review.run.track}/${review.run.id}/${review.packageHash}/${review.assignmentHash}`;

export function useExerciseWorkspace(actor: Actor, onSessionExpired: () => void) {
  const [runs, setRuns] = useState<RunList>([]);
  const [selected, setSelected] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [briefing, setBriefing] = useState<BriefingView | null>(null);
  const [inbox, setInbox] = useState<InboxItems>([]);
  const [events, setEvents] = useState<RunActivity>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [refreshError, setRefreshError] = useState('');
  const [step0, setStep0] = useState(emptyStep0);
  const [step0OutcomeUnknown, setStep0OutcomeUnknown] = useState(false);
  const [draftContext, setDraftContext] = useState<'current' | 'stale' | 'review' | 'confirmed'>(
    'current',
  );
  const [respondents, setRespondents] = useState<string[]>([]);
  const generation = useRef(0);
  const binding = useRef('');
  const polling = useRef(false);
  const editing = useRef(false);
  const draftBinding = useRef('');
  const draftRevision = useRef<number | null>(null);
  const refresh = useRef<() => void>(() => {});

  async function reload(choice = selected, background = false, keepDraft = false) {
    const current = ++generation.current;
    if (background) polling.current = true;
    else {
      setLoading(true);
      setError('');
      setRefreshError('');
      if (!keepDraft) setReview(null);
      setBriefing(null);
      setInbox([]);
      setEvents([]);
      setAcknowledged(false);
    }
    try {
      const lists = await Promise.all(
        ['technical', 'operational'].map((track) =>
          request(RunListSchema, `/api/tracks/${track}/runs`),
        ),
      );
      const all = lists.flat();
      if (current !== generation.current || (background && editing.current)) return;
      setRuns(all);
      const matchingRun = all.find((item) => `${item.track}/${item.id}` === choice);
      if (keepDraft && !matchingRun) {
        setReview(null);
        throw new Error(
          'This exercise is no longer assigned. Review any earlier request outcome after access returns.',
        );
      }
      const run = matchingRun ?? all[0];
      const next = run ? `${run.track}/${run.id}` : '';
      setSelected(next);
      if (!run) {
        setReview(null);
        setBriefing(null);
        setInbox([]);
        setEvents([]);
        return;
      }
      const root = `/api/tracks/${run.track}/runs/${run.id}`;
      if (actor.role === 'facilitator') {
        const [detail, activity] = await Promise.all([
          request(ReviewSchema, `${root}/review`),
          request(RunActivitySchema, `${root}/activity`),
        ]);
        if (current !== generation.current || (background && editing.current)) return;
        setReview(detail);
        setEvents(activity);
        if (keepDraft) setDraftContext('review');
        const inject = detail.package.injects.find((item) => item.id === detail.nextInject?.id);
        const nextBinding = `${run.id}/${detail.packageHash}/${detail.assignmentHash}/${inject?.id ?? ''}`;
        if (!background || binding.current !== nextBinding) {
          setAcknowledged(false);
          binding.current = nextBinding;
          if (!keepDraft)
            setRespondents(
              detail.members
                .filter(
                  (member) =>
                    member.kind === 'participant' &&
                    member.roleId &&
                    detail.package.roles.some((role) => role.id === member.roleId),
                )
                .map((member) => member.actorId),
            );
          setRecipients(
            detail.approval?.recipientIds ??
              detail.members
                .filter(
                  (member) =>
                    member.kind === 'participant' &&
                    member.roleId &&
                    inject?.recipientRoleIds.includes(member.roleId),
                )
                .map((member) => member.actorId),
          );
        }
      } else {
        const [context, items] = await Promise.all([
          request(BriefingViewSchema, `${root}/briefing`),
          request(InboxSchema, `${root}/inbox`),
        ]);
        if (current !== generation.current) return;
        setBriefing(context);
        setInbox(items);
      }
      setRefreshError('');
    } catch (error) {
      if (current === generation.current) {
        if (error instanceof ApiError && error.status === 401) {
          generation.current++;
          onSessionExpired();
        } else {
          if (error instanceof ApiError && [403, 404].includes(error.status)) {
            setReview(null);
            setBriefing(null);
            setInbox([]);
            setEvents([]);
          }
          (background ? setRefreshError : setError)(
            error instanceof Error ? error.message : 'The exercise could not be loaded.',
          );
        }
      }
    } finally {
      if (background) polling.current = false;
      else if (current === generation.current) setLoading(false);
    }
  }

  refresh.current = () => {
    if (!busy && !loading && !pending && !polling.current && !editing.current && !document.hidden)
      void reload(selected, true);
  };

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => refresh.current(), 5000);
    const visible = () => refresh.current();
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      generation.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  async function perform(command: Pending) {
    const current = ++generation.current;
    setBusy(true);
    setError('');
    try {
      await request(command.schema, command.path, command.body);
      if (current !== generation.current) return;
      setPending(null);
      if (command.path.endsWith('/step0')) {
        clearStep0();
      }
      await reload(selected, false, editing.current);
    } catch (error) {
      if (current !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setError(error instanceof Error ? error.message : 'The result could not be confirmed.');
      if (error instanceof ApiError && error.status < 500) setPending(null);
      else if (command.path.endsWith('/step0')) setStep0OutcomeUnknown(true);
      if (error instanceof ApiError && [403, 404].includes(error.status)) {
        generation.current++;
        setReview(null);
        setBriefing(null);
        setInbox([]);
        setEvents([]);
      }
      if (error instanceof ApiError && error.status === 409 && editing.current)
        setDraftContext('stale');
    } finally {
      setBusy(false);
    }
  }

  function submit(schema: TSchema, action: string, body: Record<string, unknown> = {}) {
    if (!review || busy || pending) return;
    if (editing.current && !['step0', 'pause'].includes(action)) return;
    if (action === 'step0' && !canRecordStep0) return;
    const command = {
      schema,
      path: `/api/tracks/${review.run.track}/runs/${review.run.id}/${action}`,
      body: {
        ...body,
        expectedRunRevision: review.run.revision,
        idempotencyKey: crypto.randomUUID(),
      },
    };
    setPending(command);
    void perform(command);
  }

  const disabled = busy || loading || !!pending;
  const inject = review?.package.injects.find((item) => item.id === review.nextInject?.id);
  const approvalMatches =
    !!review?.approval &&
    [...recipients].sort().join(',') === [...review.approval.recipientIds].sort().join(',');
  const isSkeleton = review?.package.kind === 'development-skeleton';
  const draftMatches =
    !editing.current || (!!review && draftBinding.current === step0Binding(review));
  const canRecordStep0 =
    !!review &&
    ['draft', 'paused'].includes(review.run.state) &&
    draftMatches &&
    !step0OutcomeUnknown &&
    ['current', 'confirmed'].includes(draftContext);

  function clearStep0() {
    editing.current = false;
    draftBinding.current = '';
    draftRevision.current = null;
    setStep0(emptyStep0);
    setStep0OutcomeUnknown(false);
    setDraftContext('current');
  }

  function beginStep0Edit() {
    if (!editing.current && review) {
      draftBinding.current = step0Binding(review);
      draftRevision.current = review.run.revision;
    }
    editing.current = true;
  }

  function editStep0(field: keyof typeof step0, value: string) {
    beginStep0Edit();
    setStep0((previous) => ({ ...previous, [field]: value }));
  }

  return {
    actor,
    runs,
    selected,
    review,
    briefing,
    inbox,
    events,
    loading,
    busy,
    error,
    acknowledged,
    recipients,
    pending,
    refreshError,
    step0,
    step0OutcomeUnknown,
    draftContext,
    respondents,
    editing,
    draftRevision,
    disabled,
    inject,
    approvalMatches,
    isSkeleton,
    draftMatches,
    canRecordStep0,
    reload,
    perform,
    submit,
    clearStep0,
    beginStep0Edit,
    editStep0,
    setDraftContext,
    setRespondents,
    setAcknowledged,
    setRecipients,
  };
}
export type ExerciseWorkspaceModel = ReturnType<typeof useExerciseWorkspace>;
