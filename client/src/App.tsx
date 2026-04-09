import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import MyApplications from './pages/candidate/MyApplications'
import MyResumes from './pages/candidate/MyResumes'
import RecruiterJobs from './pages/recruiter/RecruiterJobs'
import JobForm from './pages/recruiter/JobForm'
import RecruiterApplications from './pages/recruiter/RecruiterApplications'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />

            {/* Candidate routes */}
            <Route
              path="/candidate/applications"
              element={
                <ProtectedRoute role="candidate">
                  <MyApplications />
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

            {/* Recruiter routes */}
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
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
