import { LoadingState, ErrorState } from '../common/States.jsx'

export default function AsyncBoundary({ state, children }) {
  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error.message} onRetry={state.reload} />
  return children(state.data)
}
