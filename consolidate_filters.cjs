const fs = require('fs');
const p = 'src/Pages/SocialFeed.jsx';
let t = fs.readFileSync(p, 'utf8');

// 1. Remove filtersOpen state from main component
t = t.replace(
  '  const [cameraOpen, setCameraOpen] = useState(false)\n  const [filtersOpen, setFiltersOpen] = useState(false)\n  const [dmOpen, setDmOpen] = useState(false)\n',
  '  const [cameraOpen, setCameraOpen] = useState(false)\n  const [dmOpen, setDmOpen] = useState(false)\n'
);

// 2. Add advancedMode state to CameraModal
t = t.replace(
  'function CameraModal({ open, onClose, user, onPost, onOpenFilters }) {\n  const [stage, setStage] = useState(\'camera\')   // \'camera\' | \'preview\'\n  const [mode, setMode] = useState(\'photo\')       // \'photo\' | \'video\'\n',
  'function CameraModal({ open, onClose, user, onPost }) {\n  const [stage, setStage] = useState(\'camera\')   // \'camera\' | \'preview\'\n  const [mode, setMode] = useState(\'photo\')       // \'photo\' | \'video\'\n  const [advancedMode, setAdvancedMode] = useState(false)\n'
);

// 3. Remove the separate advanced filters overlay button from the top bar
t = t.replace(
  '        <button onClick={() => { stopCam(); resetAll(); onClose(); onOpenFilters() }}\n          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-[11px] font-bold">\n          Filters\n        </button>\n',
  '        <button onClick={() => setAdvancedMode(v => !v)}\n          className={`w-10 h-10 flex items-center justify-center rounded-full transition text-[11px] font-bold ${\n            advancedMode ? \'bg-amber-400/70 text-[#1a3c5e]\' : \'bg-white/10 text-white hover:bg-white/20\'\n          }`}\n          title={advancedMode ? \'Standard Effects\' : \'Advanced Filters\'}>\n          <span className="font-black">{advancedMode ? \'✨\' : \'Fx\'}</span>\n        </button>\n'
);

// 4. Replace the effect strip section to conditionally show FilterStudio
const oldEffectStrip = `      {/* ── Effect strip ── */}\n      {!camErr && (\n        <div className="bg-gradient-to-t from-black via-black/95 to-black/80">\n          <EffectStrip active={effect} onChange={setEffect} thumbSrc={thumbSrc} />\n        </div>\n      )}`;

const newEffectStrip = `      {/* ── Effect strip or Advanced Mode ── */}\n      {!camErr && (\n        <div>\n          {advancedMode ? (\n            <div className="bg-gradient-to-t from-black via-black/95 to-black/80 p-4 max-h-64 overflow-y-auto">\n              <h3 className="text-xs font-bold text-white mb-3">Advanced Filters & Effects</h3>\n              <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', marginLeft: '-25px' }}>\n                <FilterStudio />\n              </div>\n            </div>\n          ) : (\n            <div className="bg-gradient-to-t from-black via-black/95 to-black/80">\n              <EffectStrip active={effect} onChange={setEffect} thumbSrc={thumbSrc} />\n            </div>\n          )}\n        </div>\n      )}`;

t = t.replace(oldEffectStrip, newEffectStrip);

// 5. Remove the separate "Fx" FAB button and filtersOpen overlay
const oldFABSection = `      {/* ── FAB ── */}\n      {user && (\n        <button onClick={() => setFiltersOpen(true)}\n          className="fixed bottom-20 right-6 z-30 w-14 h-14 bg-[#f59e0b] hover:bg-[#fbbf24] text-white rounded-full shadow-2xl shadow-[#f59e0b]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"\n          title="Advanced filters">\n          <span className="text-xs font-black">Fx</span>\n        </button>\n      )}\n      {user && (\n        <button onClick={() => setCameraOpen(true)}\n          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#1a3c5e] hover:bg-[#152f4a] text-white rounded-full shadow-2xl shadow-[#1a3c5e]/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"\n          title="Create post">\n          <Plus size={26} strokeWidth={2.5} />\n        </button>\n      )}\n\n      {/* ── Overlays ── */}\n      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} user={user} onPost={handlePost} onOpenFilters={setFiltersOpen} />\n      {filtersOpen && (\n        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">\n          <div className="relative w-full max-w-6xl h-full max-h-[calc(100vh-2rem)] overflow-auto rounded-3xl bg-white shadow-2xl">\n            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">\n              <div>\n                <h2 className="text-lg font-bold text-[#1a3c5e]">Advanced Filters</h2>\n                <p className="text-sm text-gray-500">Use the MediaPipe/TensorFlow filter studio for photo or camera effects.</p>\n              </div>\n              <button onClick={() => setFiltersOpen(false)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-[#1a3c5e] hover:bg-gray-200 transition">\n                Close\n              </button>\n            </div>\n            <div className="p-4">\n              <FilterStudio />\n            </div>\n          </div>\n        </div>\n      )}\n      <CommentsDrawer open={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} currentUser={user} />\n      {user && <DMPanel open={dmOpen} onClose={() => setDmOpen(false)} currentUser={user} />}`;

const newFABSection = `      {/* ── FAB ── */}\n      {user && (\n        <button onClick={() => setCameraOpen(true)}\n          className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#1a3c5e] hover:bg-[#152f4a] text-white rounded-full shadow-2xl shadow-[#1a3c5e]/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"\n          title="Create post">\n          <Plus size={26} strokeWidth={2.5} />\n        </button>\n      )}\n\n      {/* ── Overlays ── */}\n      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} user={user} onPost={handlePost} />\n      <CommentsDrawer open={!!commentPost} onClose={() => setCommentPost(null)} post={commentPost} currentUser={user} />\n      {user && <DMPanel open={dmOpen} onClose={() => setDmOpen(false)} currentUser={user} />}`;

t = t.replace(oldFABSection, newFABSection);

fs.writeFileSync(p, t, 'utf8');
console.log('consolidated filters into camera modal');
