import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage from './Pages/LoginPage'
import RegisterPage from './Pages/RegisterPage'
import VerifyEmailPage from './Pages/VerifyEmailPage'
import LandingPage from './Pages/LandingPage'
import MainLayout from './Layouts/MainLayout'
import PublicLayout from './Layouts/PublicLayout'
import Dashboard from './Pages/Dashboard'
import Resources from './Pages/Resources'
import PastQuestions from './Pages/PastQuestions'
import Forum from './Pages/Forum'
import CBT from './Pages/CBT'
import TechCommunity from './Pages/TechCommunity'
import SocialFeed from './Pages/SocialFeed'
import NewsFeed from './Pages/NewsFeed'
import FinalYearSpotlight from './Pages/FinalYearSpotlight'
import PressRelease from './Pages/PressRelease'
import Research from './Pages/Research'
import Events from './Pages/Events'
import Alumni from './Pages/Alumni'
import Messages from './Pages/Messages'
import Notifications from './Pages/Notifications'
import AdminDashboard from './Pages/AdminDashboard'
import About from './Pages/About'
import NewsArticle from './Pages/NewsArticle'
import StaffPanel from './Pages/StaffPanel'
import Assignments from './Pages/Assignments'
import Explore from './Pages/Explore'
import AppExplore from './Pages/AppExplore'
import Settings from './Pages/Settings'
import Filters from './Pages/Filters'
import Groups from './Pages/Groups'
import StudentPanel from './Pages/StudentPanel'
import LetsTalk from './Pages/LetsTalk'
import MediaHub from './Pages/MediaHub'
import MediaChannel from './Pages/MediaChannel'
import MediaContentPage from './Pages/MediaContentPage'
import MediaCreate from './Pages/MediaCreate'
import MediaEditorQueue from './Pages/MediaEditorQueue'
import Elections from './Pages/Elections'
import ElectionDetail from './Pages/ElectionDetail'
import Communities from './Pages/Communities'
import CommunityDetail from './Pages/CommunityDetail'
import Wallet from './Pages/Wallet'

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#1a3c5e] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#1a3c5e] font-medium text-sm">Loading AMACOS...</p>
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />
  if (!user.isStaffAdmin) return <Navigate to="/app/dashboard" />
  return children
}

const StudentAdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />
  if (!user.isStudentAdmin) return <Navigate to="/app/dashboard" />
  return children
}

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />
  if (user.accountType !== 'staff') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-[#1a3c5e] mb-2">Staff Only</h2>
        <p className="text-gray-500 max-w-sm">
          The Staff Portal is restricted to lecturers and administrators.
          Your student account does not have access to this area.
        </p>
      </div>
    )
  }
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/app/dashboard" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/app/dashboard" />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Public pages with navbar — no login needed */}
      <Route element={<PublicLayout />}>
        <Route path="/explore" element={<Explore />} />
        <Route path="/news" element={<NewsFeed />} />
        <Route path="/news/:id" element={<NewsArticle />} />
        <Route path="/events" element={<Events />} />
        <Route path="/spotlight" element={<FinalYearSpotlight />} />
        <Route path="/social" element={<SocialFeed />} />
        <Route path="/press" element={<PressRelease />} />
        <Route path="/about" element={<About />} />
        <Route path="/media" element={<MediaHub />} />
        <Route path="/media/channel/:slug" element={<MediaChannel />} />
        <Route path="/media/content/:id" element={<MediaContentPage />} />
      </Route>

      {/* Protected app pages */}
      <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="resources" element={<Resources />} />
        <Route path="past-questions" element={<PastQuestions />} />
        <Route path="lets-talk" element={<LetsTalk />} />
        <Route path="forum" element={<Navigate to="/app/lets-talk" replace />} />
        <Route path="messages" element={<Navigate to="/app/lets-talk?tab=messages" replace />} />
        <Route path="groups" element={<Navigate to="/app/lets-talk?tab=groups" replace />} />
        <Route path="cbt" element={<CBT />} />
        <Route path="tech" element={<TechCommunity />} />
        <Route path="explore" element={<AppExplore />} />
        <Route path="feed" element={<SocialFeed />} />
        <Route path="news" element={<NewsFeed />} />
        <Route path="news/:id" element={<NewsArticle />} />
        <Route path="spotlight" element={<FinalYearSpotlight />} />
        <Route path="press" element={<PressRelease />} />
        <Route path="research" element={<Research />} />
        <Route path="events" element={<Events />} />
        <Route path="alumni" element={<Alumni />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="staff-panel" element={<StaffRoute><StaffPanel /></StaffRoute>} />
        <Route path="settings" element={<Settings />} />
        <Route path="filters" element={<Filters />} />
        <Route path="groups" element={<Groups />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="student-panel" element={<StudentAdminRoute><StudentPanel /></StudentAdminRoute>} />
        <Route path="media" element={<MediaHub isApp />} />
        <Route path="media/channel/:slug" element={<MediaChannel isApp />} />
        <Route path="media/content/:id" element={<MediaContentPage isApp />} />
        <Route path="media/create" element={<MediaCreate isApp />} />
        <Route path="media/queue" element={<MediaEditorQueue isApp />} />
        <Route path="elections" element={<Elections />} />
        <Route path="elections/:id" element={<ElectionDetail />} />
        <Route path="communities" element={<Communities />} />
        <Route path="communities/:id" element={<CommunityDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }
        }} />
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  )
}