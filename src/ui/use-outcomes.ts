import { useEffect, useRef, useState } from 'react';
import type { TSchema } from '@sinclair/typebox';
import type { Actor } from '../contracts/profile.js';
import {
  OutcomeReviewSchema,
  TeamOutcomesSchema,
  type OutcomeReview,
  type TeamOutcomes,
} from '../contracts/outcomes.js';
import { ApiError, request } from './api.js';

type Pending = { schema: TSchema; action: string; body: Record<string, unknown> };
export function useOutcomes(
  actor: Actor,
  root: string,
  onChanged: () => void,
  onSessionExpired: () => void,
) {
  const [view, setView] = useState<OutcomeReview | TeamOutcomes | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [saved, setSaved] = useState(0);
  const generation = useRef(0);
  const alive = useRef(true);
  const polling = useRef(false);
  const refresh = useRef<() => void>(() => {});
  async function reload() {
    const current = ++generation.current;
    polling.current = true;
    try {
      const value =
        actor.role === 'facilitator'
          ? await request(OutcomeReviewSchema, `${root}/outcomes`)
          : await request(TeamOutcomesSchema, `${root}/team-responses`);
      if (current !== generation.current) return;
      setView(value);
      setError('');
    } catch (error) {
      if (current !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) setView(null);
      setError(error instanceof Error ? error.message : 'Could not read the exercise outcomes.');
    } finally {
      polling.current = false;
    }
  }
  async function perform(command: Pending) {
    const current = ++generation.current;
    setBusy(true);
    setPending(command);
    setError('');
    try {
      await request(command.schema, `${root}/${command.action}`, command.body);
      if (current !== generation.current) return;
      setPending(null);
      setSaved((value) => value + 1);
      setView(null);
      await reload();
      if (alive.current) onChanged();
    } catch (error) {
      if (current !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setError(
        error instanceof Error
          ? error.message
          : 'The request outcome is unconfirmed. Retry the original request.',
      );
      if (error instanceof ApiError && error.status < 500) {
        setPending(null);
        if ([403, 404].includes(error.status)) setView(null);
      }
    } finally {
      setBusy(false);
    }
  }
  function submit(schema: TSchema, action: string, body: Record<string, unknown>) {
    if (!view || busy || pending) return;
    void perform({ schema, action, body: { ...body, idempotencyKey: crypto.randomUUID() } });
  }
  refresh.current = () => {
    if (!busy && !pending && !polling.current && !document.hidden) void reload();
  };
  useEffect(() => {
    alive.current = true;
    void reload();
    const timer = window.setInterval(() => refresh.current(), 5000);
    const focus = () => refresh.current();
    window.addEventListener('focus', focus);
    return () => {
      alive.current = false;
      generation.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, []);
  return { view, error, busy, pending, saved, reload, perform, submit };
}
export type OutcomeModel = ReturnType<typeof useOutcomes>;
