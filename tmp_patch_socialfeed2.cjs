const fs = require('fs');
const p = 'src/Pages/SocialFeed.jsx';
let t = fs.readFileSync(p, 'utf8');
const oldText = `      {/* ── FAB ── */}
      {user && (
        <button onClick={() => setCameraOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#1a3c5e] hover:bg-[#152f4a] text-white rounded-full shadow-2xl shadow-[#1a3c5e]/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Create post">
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* ── Overlays ── */}
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} user={user} onPost={handlePost} />
      <CommentsDrawer open={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} currentUser={user} />
      {user && <DMPanel open={dmOpen} onClose={() => setDmOpen(false)} currentUser={user} />}
    </div>
  )
}
`;
const newText = `      {/* ── FAB ── */}
      {user && (
        <button onClick={() => setFiltersOpen(true)}
          className="fixed bottom-20 right-6 z-30 w-14 h-14 bg-[#f59e0b] hover:bg-[#fbbf24] text-white rounded-full shadow-2xl shadow-[#f59e0b]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Advanced filters">
          <span className="text-xs font-black">Fx</span>
        </button>
      )}
      {user && (
        <button onClick={() => setCameraOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#1a3c5e] hover:bg-[#152f4a] text-white rounded-full shadow-2xl shadow-[#1a3c5e]/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Create post">
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* ── Overlays ── */}
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} user={user} onPost={handlePost} onOpenFilters={setFiltersOpen} />
      {filtersOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-full max-h-[calc(100vh-2rem)] overflow-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-[#1a3c5e]">Advanced Filters</h2>
                <p className="text-sm text-gray-500">Use the MediaPipe/TensorFlow filter studio for photo or camera effects.</p>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-[#1a3c5e] hover:bg-gray-200 transition">
                Close
              </button>
            </div>
            <div className="p-4">
              <FilterStudio />
            </div>
          </div>
        </div>
      )}
      <CommentsDrawer open={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} currentUser={user} />
      {user && <DMPanel open={dmOpen} onClose={() => setDmOpen(false)} currentUser={user} />}
    </div>
  )
}
`;
if (!t.includes(oldText)) {
  throw new Error('Reference text not found in SocialFeed.jsx');
}
fs.writeFileSync(p, t.replace(oldText, newText), 'utf8');
console.log('wrote advanced filter button and overlay');
