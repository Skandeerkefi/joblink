import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: '🔍',
    title: 'Find the right job',
    description: 'Browse hundreds of opportunities filtered by category, location, and skills.',
  },
  {
    icon: '📄',
    title: 'Manage your resumes',
    description: 'Upload multiple resumes and attach the best one to each application.',
  },
  {
    icon: '📊',
    title: 'Track applications',
    description: 'Stay on top of every application — from Applied to Hired in one dashboard.',
  },
  {
    icon: '🚀',
    title: 'Post & manage jobs',
    description: 'Recruiters can post job openings, review candidates, and update statuses instantly.',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-white px-8 py-16 mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
          Your next career move<br className="hidden sm:block" /> starts here
        </h1>
        <p className="text-blue-100 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
          JobLink connects talented candidates with forward-thinking companies. Find jobs or hire talent — all in one place.
        </p>

        {!user ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Get Started Free
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : user.role === 'candidate' ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/jobs"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Browse Jobs
            </Link>
            <Link
              to="/candidate/dashboard"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              My Dashboard
            </Link>
          </div>
        ) : user.role === 'recruiter' ? (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/recruiter/jobs/new"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Post a Job
            </Link>
            <Link
              to="/recruiter/dashboard"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              My Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/admin/users"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow"
            >
              Admin Panel
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA blocks */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-8">
          <h3 className="text-xl font-bold text-blue-900 mb-2">👤 For Candidates</h3>
          <p className="text-blue-700 mb-4 text-sm">
            Create your profile, upload your CV, apply to jobs, and track your applications — all for free.
          </p>
          <Link
            to={user?.role === 'candidate' ? '/candidate/dashboard' : '/register'}
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {user?.role === 'candidate' ? 'Go to Dashboard' : 'Sign up as Candidate'}
          </Link>
        </div>

        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-2">🏢 For Recruiters</h3>
          <p className="text-indigo-700 mb-4 text-sm">
            Post job openings, review candidates' applications, and manage your hiring pipeline with ease.
          </p>
          <Link
            to={user?.role === 'recruiter' ? '/recruiter/dashboard' : '/register'}
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            {user?.role === 'recruiter' ? 'Go to Dashboard' : 'Sign up as Recruiter'}
          </Link>
        </div>
      </section>
    </div>
  )
}
