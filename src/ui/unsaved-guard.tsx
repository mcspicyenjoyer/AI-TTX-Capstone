import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
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
  return <GuardContext.Provider value={registry}>{children}</GuardContext.Provider>;
}

// A form reports its unsaved input; unmounting withdraws the report.
export function useUnsavedGuard(dirty: boolean): void {
  const registry = useContext(GuardContext);
  const key = useId();
  useEffect(() => {
    registry?.report(key, dirty ? 'dirty' : null);
  }, [registry, key, dirty]);
  useEffect(() => () => registry?.report(key, null), [registry, key]);
}

// For in-view switches, such as changing exercise, that would discard a form's input.
export function useCanLeave(): () => boolean {
  const registry = useContext(GuardContext);
  return useCallback(() => registry?.canLeave() ?? true, [registry]);
}
