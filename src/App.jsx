import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import MainLayout from './layouts/MainLayout'
import PublicLayout from './layouts/PublicLayout'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import PastQuestions from './pages/PastQuestions'
import Forum from './pages/Forum'
import CBT from './pages/CBT'
import TechCommunity from './pages/TechCommunity'
import SocialFeed from './pages/SocialFeed'
import NewsFeed from './pages/NewsFeed'
import FinalYearSpotlight from './pages/FinalYearSpotlight'
import PressRelease from './pages/PressRelease'
import Research from './pages/Research'
import Events from './pages/Events'
import Alumni from './pages/Alumni'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/AdminDashboard'
import About from './pages/About'
import NewsArticle from './pages/NewsArticle'
import StaffPanel from './pages/StaffPanel'
import Assignments from './pages/Assignments'
import Explore from './pages/Explore'
import Settings from './pages/Settings'
import Filters from './pages/Filters'

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
      </Route>

      {/* Protected app pages */}
      <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="resources" element={<Resources />} />
        <Route path="past-questions" element={<PastQuestions />} />
        <Route path="forum" element={<Forum />} />
        <Route path="cbt" element={<CBT />} />
        <Route path="tech" element={<TechCommunity />} />
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
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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