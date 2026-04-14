import { useEffect } from 'react';

type RefreshFn = () => void | Promise<void>;

export function useApiMutationRefresh(refresh: RefreshFn, debounceMs = 250) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refresh();
      }, debounceMs);
    };

    window.addEventListener('api:mutation-success', handler as EventListener);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('api:mutation-success', handler as EventListener);
    };
  }, [refresh, debounceMs]);
}

