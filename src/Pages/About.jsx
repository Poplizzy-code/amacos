export default function About() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">About AMACOS</h1>
        <p className="text-gray-500 text-sm mt-1">Mass Communication Department, Adeleke University</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="w-16 h-16 bg-[#1a3c5e] rounded-2xl flex items-center justify-center mb-6 text-3xl">🎓</div>
        <h2 className="text-xl font-display font-bold text-[#1a3c5e] mb-3">Who We Are</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          The Department of Mass Communication at Adeleke University is committed to producing world-class media practitioners, journalists, broadcasters, and communication experts. AMACOS is our digital hub connecting students, staff and alumni.
        </p>
        <h2 className="text-xl font-display font-bold text-[#1a3c5e] mb-3">Our Mission</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          To provide quality education in mass communication while equipping students with practical skills for the modern media industry.
        </p>
        <h2 className="text-xl font-display font-bold text-[#1a3c5e] mb-3">Contact</h2>
        <p className="text-gray-600 text-sm">📧 masscomm@adelekeuniversity.edu.ng</p>
        <p className="text-gray-600 text-sm">📍 Adeleke University, Ede, Osun State, Nigeria</p>
      </div>
    </div>
  )
}