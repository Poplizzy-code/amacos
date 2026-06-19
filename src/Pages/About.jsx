export default function About() {
  return (
    <div className="pt-2">
      <div className="mb-8 px-1">
        <h1 className="text-2xl font-bold text-white">About AMACOS</h1>
        <p className="text-gray-500 text-sm mt-1">Mass Communication Department, Adeleke University</p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#1a3c5e] to-[#2a5a8e] rounded-2xl flex items-center justify-center mb-4 text-2xl">🎓</div>
          <h2 className="text-lg font-bold text-white mb-2">Who We Are</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The Department of Mass Communication at Adeleke University is committed to producing world-class media practitioners, journalists, broadcasters, and communication experts. AMACOS is our digital hub connecting students, staff and alumni.
          </p>
        </div>

        <div className="border-t border-white/5 pt-8">
          <h2 className="text-lg font-bold text-white mb-2">Our Mission</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            To provide quality education in mass communication while equipping students with practical skills for the modern media industry.
          </p>
        </div>

        <div className="border-t border-white/5 pt-8">
          <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
          <p className="text-gray-400 text-sm flex items-center gap-2 mb-2">📧 masscomm@adelekeuniversity.edu.ng</p>
          <p className="text-gray-400 text-sm flex items-center gap-2">📍 Adeleke University, Ede, Osun State, Nigeria</p>
        </div>
      </div>
    </div>
  )
}
