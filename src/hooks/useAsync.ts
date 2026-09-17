import { useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Runs an async task on mount / whenever the dependency list changes and
 * ignores results from superseded runs.
 */
export function useAsync<T>(task: () => Promise<T>, deps: ReadonlyArray<unknown>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined
  });
  const runId = useRef(0);

  useEffect(() => {
    const currentRun = ++runId.current;
    setState({ data: undefined, loading: true, error: undefined });

    task().
    then((data) => {
      if (runId.current === currentRun) setState({ data, loading: false, error: undefined });
    }).
    catch((error: unknown) => {
      if (runId.current === currentRun) {
        setState({
          data: undefined,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}