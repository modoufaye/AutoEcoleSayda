import { useEffect, useState } from 'react'
import { toast } from './Toast'

/* Bouton de lecture à voix haute (synthèse du navigateur, voix française si disponible) :
   un clic lance la lecture, un autre la met en pause, un troisième la reprend. Une seule
   lecture à la fois : lancer un autre texte arrête le précédent, et tous les boutons suivent. */

let courant = null   // { texte, etat: 'lecture' | 'pause', u }
const abonnes = new Set()
const annoncer = () => abonnes.forEach(f => f(courant))

function lancer(texte) {
  const s = window.speechSynthesis
  s.cancel()
  const u = new SpeechSynthesisUtterance(texte); u.lang = 'fr-FR'; u.rate = 0.95
  const voix = s.getVoices().find(v => v.lang?.startsWith('fr')); if (voix) u.voice = voix
  u.onend = u.onerror = () => { if (courant?.u === u) { courant = null; annoncer() } }
  courant = { texte, etat: 'lecture', u }; annoncer()
  s.speak(u)
}

const ASPECT = {
  lecture: { icone: 'pause-fill', libelle: 'Pause', fond: '#fef3c7', couleur: '#92400e' },
  pause: { icone: 'play-fill', libelle: 'Reprendre', fond: '#dcfce7', couleur: '#166534' },
  arret: { icone: 'volume-up-fill', libelle: 'Écouter', fond: '#e0f2fe', couleur: '#0369a1' },
}

export default function BoutonEcouter({ texte, className = 'px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer' }) {
  const [c, setC] = useState(courant)
  useEffect(() => {
    abonnes.add(setC)
    // Quitter la page (ou changer de texte) arrête la lecture de ce bouton
    return () => {
      abonnes.delete(setC)
      if (courant?.texte === texte) { try { window.speechSynthesis.cancel() } catch { /* rien à arrêter */ } courant = null; annoncer() }
    }
  }, [texte])
  const etat = c?.texte === texte ? c.etat : 'arret'

  const clic = () => {
    try {
      const s = window.speechSynthesis
      if (!s) return toast('Lecture à voix haute indisponible sur cet appareil', 'warning')
      if (etat === 'lecture') {
        s.pause(); courant = { ...courant, etat: 'pause' }; annoncer()
      } else if (etat === 'pause') {
        s.resume(); courant = { ...courant, etat: 'lecture' }; annoncer()
        // Certains téléphones ne savent pas reprendre : on relit depuis le début
        setTimeout(() => { if (courant?.texte === texte && courant.etat === 'lecture' && !s.speaking) lancer(texte) }, 400)
      } else lancer(texte)
    } catch { toast('Lecture à voix haute indisponible', 'warning') }
  }

  const a = ASPECT[etat]
  return (
    <button type="button" onClick={clic} className={className} style={{ borderRadius: 999, background: a.fond, color: a.couleur }} aria-pressed={etat === 'lecture'}>
      <i className={`bi bi-${a.icone} me-1`} />{a.libelle}
    </button>
  )
}
