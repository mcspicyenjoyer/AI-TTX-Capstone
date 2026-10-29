import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type GuardState = 'dirty' | 'pending' | null;
export type GuardRegistry = {
  report: (key: string, state: GuardState) => void;
  // False while a request is unresolved, or when the user keeps their unsaved input.
  canLeave: () => boolean;
  clear: () => void;
};
const GuardContext = createContext<GuardRegistry | null>(null);

// One registry for the signed-in view. It asks before tab changes, exercise switches, sign-out
// and page unload while any form holds unsaved input. Drafts stay page-local by design.
export function useGuardRegistry(onBlocked: (message: string) => void): GuardRegistry {
  const states = useRef(new Map<string, GuardState>());
  const [active, setActive] = useState(false);
  const report = useCallback((key: string, state: GuardState) => {
    if (state) states.current.set(key, state);
    else states.current.delete(key);
    setActive(states.current.size > 0);
  }, []);
  const clear = useCallback(() => {
    states.current.clear();
    setActive(false);
  }, []);
  const canLeave = useCallback(() => {
    const values = [...states.current.values()];
    if (values.includes('pending')) {
      onBlocked('Resolve the pending request before leaving this view.');
      return false;
    }
    return !values.length || window.confirm('Discard unsaved changes in this view?');
  }, [onBlocked]);
  useEffect(() => {
    if (!active) return;
    const before = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [active]);
  return useMemo(() => ({ report, canLeave, clear }), [report, canLeave, clear]);
}

export function GuardProvider({
  registry,
  children,
}: {
  registry: GuardRegistry;
  children: ReactNode;
}) {
  const parent = useContext(GuardContext);
  // Local replacement checks see only this editor; page navigation still sees every form.
  const report = useCallback(
    (key: string, state: GuardState) => {
      registry.report(key, state);
      parent?.report(key, state);
    },
    [registry, parent],
  );
  const value = useMemo(() => ({ ...registry, report }), [registry, report]);
  return <GuardContext.Provider value={value}>{children}</GuardContext.Provider>;
}

// A form reports unsaved input or an unresolved request; unmounting withdraws the report.
export function useUnsavedGuard(dirty: boolean, pending = false): void {
  const registry = useContext(GuardContext);
  const key = useId();
  useLayoutEffect(() => {
    registry?.report(key, pending ? 'pending' : dirty ? 'dirty' : null);
  }, [registry, key, dirty, pending]);
  useLayoutEffect(() => () => registry?.report(key, null), [registry, key]);
}

// For in-view switches, such as changing exercise, that would discard a form's input.
export function useCanLeave(): () => boolean {
  const registry = useContext(GuardContext);
  return useCallback(() => registry?.canLeave() ?? true, [registry]);
}
