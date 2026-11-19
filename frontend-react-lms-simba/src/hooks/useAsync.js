import { useCallback, useEffect, useState } from 'react'

export function useAsync(fn) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const run = useCallback((silent) => {
    setState((s) => ({ ...s, loading: !silent, error: null }))
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }))
  }, [fn])
  useEffect(() => {
    run(false)
  }, [run])
  const reload = useCallback(() => run(true), [run])
  return { ...state, reload }
}
