import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

export default function SignInPrompt({ feature = 'this feature' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-[#1a3c5e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Lock size={28} className="text-[#1a3c5e]" />
      </div>
      <h2 className="text-lg font-display font-bold text-[#1a3c5e] mb-2">
        Sign in to access {feature}
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Create a free account or sign in to unlock full access to AMACOS.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/register"
          className="bg-[#1a3c5e] hover:bg-[#15324f] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">
          Create Account
        </Link>
        <Link to="/login"
          className="border border-[#1a3c5e] text-[#1a3c5e] hover:bg-[#1a3c5e]/5 px-6 py-2.5 rounded-xl text-sm font-medium transition">
          Sign In
        </Link>
      </div>
    </div>
  )
}