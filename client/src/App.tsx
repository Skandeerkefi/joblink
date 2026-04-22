import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import MyApplications from './pages/candidate/MyApplications'
import MyResumes from './pages/candidate/MyResumes'
import ManualResumeEditor from './pages/candidate/ManualResumeEditor'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import SavedJobs from './pages/candidate/SavedJobs'
import AtsChecker from './pages/candidate/AtsChecker'
import CandidateProfile from './pages/candidate/CandidateProfile'
import RecruiterJobs from './pages/recruiter/RecruiterJobs'
import JobForm from './pages/recruiter/JobForm'
import RecruiterApplications from './pages/recruiter/RecruiterApplications'
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard'
import AdminUsers from './pages/admin/AdminUsers'

function DashboardRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Home />
  if (user.role === 'admin') return <Navigate to="/admin/users" replace />
  if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />
  return <Navigate to="/candidate/dashboard" replace />
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />

            {/* Candidate routes */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute role="candidate">
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/applications"
              element={
                <ProtectedRoute role="candidate">
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/saved-jobs"
              element={
                <ProtectedRoute role="candidate">
                  <SavedJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes"
              element={
                <ProtectedRoute role="candidate">
                  <MyResumes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/ats-checker"
              element={
                <ProtectedRoute role="candidate">
                  <AtsChecker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/profile"
              element={
                <ProtectedRoute role="candidate">
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/new"
              element={
                <ProtectedRoute role="candidate">
                  <ManualResumeEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes/:id/edit"
              element={
                <ProtectedRoute role="candidate">
                  <ManualResumeEditor />
                </ProtectedRoute>
              }
            />

            {/* Recruiter routes */}
            <Route
              path="/recruiter/dashboard"
              element={
                <ProtectedRoute role="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs"
              element={
                <ProtectedRoute role="recruiter">
                  <RecruiterJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/new"
              element={
                <ProtectedRoute role="recruiter">
                  <JobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/jobs/:id/edit"
              element={
                <ProtectedRoute role="recruiter">
                  <JobForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute role="recruiter">
                  <RecruiterApplications />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
