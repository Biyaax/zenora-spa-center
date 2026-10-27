import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

/** Loads GET `path` (re-runs when path/query change). */
export function useFetch(path, query) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: Boolean(path),
  });

  const key = JSON.stringify(query || {});

  const load = useCallback(async () => {
    if (!path) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await api(path, { query: JSON.parse(key) });
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error: error.message, loading: false });
    }
  }, [path, key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, reload: load };
}
