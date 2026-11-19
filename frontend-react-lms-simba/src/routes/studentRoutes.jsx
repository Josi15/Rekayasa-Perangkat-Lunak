import StudentDashboard from '../pages/student/StudentDashboard.jsx'
import MyClasses from '../pages/student/MyClasses.jsx'
import ClassDetail from '../pages/student/ClassDetail.jsx'
import MaterialList from '../pages/student/MaterialList.jsx'
import MaterialDetail from '../pages/student/MaterialDetail.jsx'
import Tasks from '../pages/student/Tasks.jsx'
import TaskDetail from '../pages/student/TaskDetail.jsx'
import Grades from '../pages/student/Grades.jsx'
import Schedule from '../pages/student/Schedule.jsx'
import Announcements from '../pages/student/Announcements.jsx'
import AnnouncementDetail from '../pages/student/AnnouncementDetail.jsx'
import Notifications from '../pages/student/Notifications.jsx'
import Profile from '../pages/student/Profile.jsx'
import Attendance from '../pages/student/Attendance.jsx'
import Quiz from '../pages/student/Quiz.jsx'
import QuizRunner from '../pages/student/QuizRunner.jsx'

export const studentRoutes = [
  { index: true, element: <StudentDashboard /> },
  { path: 'classes', element: <MyClasses /> },
  { path: 'classes/:courseId', element: <ClassDetail /> },
  { path: 'materials', element: <MaterialList /> },
  { path: 'materials/:materialId', element: <MaterialDetail /> },
  { path: 'tasks', element: <Tasks /> },
  { path: 'tasks/:taskId', element: <TaskDetail /> },
  { path: 'grades', element: <Grades /> },
  { path: 'schedule', element: <Schedule /> },
  { path: 'announcements', element: <Announcements /> },
  { path: 'announcements/:id', element: <AnnouncementDetail /> },
  { path: 'notifications', element: <Notifications /> },
  { path: 'profile', element: <Profile /> },
  { path: 'attendance', element: <Attendance /> },
  { path: 'quiz', element: <Quiz /> },
  { path: 'quiz/:quizId', element: <QuizRunner /> },
]
