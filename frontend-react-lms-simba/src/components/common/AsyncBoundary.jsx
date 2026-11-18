import LoadingState from './LoadingState'
import ErrorState from './ErrorState'

// Pembungkus status useAsync: loading → spinner, error → pesan + coba lagi, selesai → render children(data).
export default function AsyncBoundary({ state, children }) {
  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />
  return children(state.data)
}
