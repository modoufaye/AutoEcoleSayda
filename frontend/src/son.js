/* Petit carillon « nouveau message », joué sans fichier son (Web Audio).
   Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur : le contexte audio
   est créé (ou réveillé) au premier toucher, clic ou touche du clavier sur la page. */
let contexte = null

function preparer() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    if (!contexte) contexte = new Ctx()
    if (contexte.state === 'suspended') contexte.resume().catch(() => {})
  } catch { /* son indisponible : rien à faire */ }
}
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, preparer, { passive: true })

/* Deux notes douces (mi puis la, aigu) d'environ une demi-seconde. */
export function sonNouveauMessage() {
  preparer()
  if (!contexte || contexte.state !== 'running') return
  const t0 = contexte.currentTime
  ;[[659.25, 0], [880, 0.16]].forEach(([freq, decalage]) => {
    const osc = contexte.createOscillator(), vol = contexte.createGain()
    osc.type = 'sine'; osc.frequency.value = freq
    vol.gain.setValueAtTime(0.0001, t0 + decalage)
    vol.gain.exponentialRampToValueAtTime(0.25, t0 + decalage + 0.02)
    vol.gain.exponentialRampToValueAtTime(0.0001, t0 + decalage + 0.45)
    osc.connect(vol).connect(contexte.destination)
    osc.start(t0 + decalage); osc.stop(t0 + decalage + 0.5)
  })
}
