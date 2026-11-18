import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../contexts/AuthContext'
import { teacherHomeService } from '../../services'
import WelcomeBanner from './dashboard/WelcomeBanner'
import StatCards from './dashboard/StatCards'
import ActiveSession from './dashboard/ActiveSession'
import TodayAgenda from './dashboard/TodayAgenda'
import HomeroomPanel from './dashboard/HomeroomPanel'
import RecentSubmissions from './dashboard/RecentSubmissions'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(teacherHomeService.get)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  return (
    <div className="space-y-6">
      <WelcomeBanner name={user.name} home={data} />
      <StatCards home={data} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2"><ActiveSession session={data.session} /><TodayAgenda agenda={data.agenda} /></div>
        <div className="space-y-6"><HomeroomPanel homeroom={data.homeroom} /><RecentSubmissions items={data.recent} /></div>
      </div>
    </div>
  )
}
