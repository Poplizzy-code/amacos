const fs = require('fs');
const path = 'src/Pages/SocialFeed.jsx';
let text = fs.readFileSync(path, 'utf8');
text = text.replace(
  `import { useState, useEffect, useRef } from 'react'\nimport { useNavigate } from 'react-router-dom'\nimport axios from 'axios'\n`,
  `import { useState, useEffect, useRef } from 'react'\nimport axios from 'axios'\nimport FilterStudio from '../components/FilterStudio'\n`
);
text = text.replace(
  `  const [cameraOpen, setCameraOpen] = useState(false)\n  const [dmOpen, setDmOpen] = useState(false)\n  const [commentPost, setCommentPost] = useState(null)\n\n`,
  `  const [cameraOpen, setCameraOpen] = useState(false)\n  const [filtersOpen, setFiltersOpen] = useState(false)\n  const [dmOpen, setDmOpen] = useState(false)\n  const [commentPost, setCommentPost] = useState(null)\n\n`
);
text = text.replace(
  `function CameraModal({ open, onClose, user, onPost }) {`,
  `function CameraModal({ open, onClose, user, onPost, onOpenFilters }) {`
);
text = text.replace(
  `        <button onClick={() => { stopCam(); resetAll(); onClose(); navigate('/app/filters') }}\n          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-[11px] font-bold">\n          Filters\n        </button>\n`,
  `        <button onClick={() => { stopCam(); resetAll(); onClose(); onOpenFilters() }}\n          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-[11px] font-bold">\n          Filters\n        </button>\n`
);
fs.writeFileSync(path, text, 'utf8');
console.log('patched imports and camera modal button');
