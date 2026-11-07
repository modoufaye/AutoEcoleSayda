import { useEffect, useState } from 'react'
import { toast } from './Toast'
import { abonner, arreter, lectureCourante, lireAudio, lireTexte, mettreEnPause, reprendre } from './lecture'

/* Boutons de lecture : « Écouter » (synthèse du navigateur, voix française si disponible) et
   « Wolof » (explication enregistrée). Un clic lance la lecture, un autre la met en pause, un
   troisième la reprend. Une seule lecture à la fois (lecture.js) : lancer l'une arrête l'autre. */

const ASPECT = {
  lecture: { icone: 'pause-fill', libelle: 'Pause', fond: '#fef3c7', couleur: '#92400e' },
  pause: { icone: 'play-fill', libelle: 'Reprendre', fond: '#dcfce7', couleur: '#166534' },
}
const ARRET_FR = { icone: 'volume-up-fill', libelle: 'Écouter', fond: '#e0f2fe', couleur: '#0369a1' }
const ARRET_WO = { icone: 'headphones', libelle: 'Wolof', fond: '#d1fae5', couleur: '#047857' }

/* État de la lecture pour cette clé ; la quitter (bouton qui disparaît) l'arrête. */
function useLecture(cle) {
  const [c, setC] = useState(lectureCourante())
  useEffect(() => {
    const fin = abonner(setC)
    return () => { fin(); arreter(cle) }
  }, [cle])
  return c?.cle === cle ? c.etat : 'arret'
}

function Bouton({ etat, arret, onClick, className, titre }) {
  const a = ASPECT[etat] || arret
  return (
    <button type="button" onClick={onClick} className={className} title={titre}
      style={{ borderRadius: 999, background: a.fond, color: a.couleur, whiteSpace: 'nowrap' }} aria-pressed={etat === 'lecture'}>
      <i className={`bi bi-${a.icone} me-1`} />{a.libelle}{etat !== 'arret' && arret === ARRET_WO ? ' · wolof' : ''}
    </button>
  )
}

export default function BoutonEcouter({ texte, className = 'px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer' }) {
  const etat = useLecture(texte)
  const clic = () => {
    try {
      if (!window.speechSynthesis) return toast('Lecture à voix haute indisponible sur cet appareil', 'warning')
      if (etat === 'lecture') mettreEnPause()
      else if (etat === 'pause') reprendre()
      else lireTexte(texte)
    } catch { toast('Lecture à voix haute indisponible', 'warning') }
  }
  return <Bouton etat={etat} arret={ARRET_FR} onClick={clic} className={className} titre="Écouter en français" />
}

/* Explication enregistrée en wolof (url de /uploads/audios). */
export function BoutonWolof({ url, className = 'px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer' }) {
  const etat = useLecture('audio:' + url)
  const clic = () => {
    if (etat === 'lecture') mettreEnPause()
    else if (etat === 'pause') reprendre()
    else lireAudio(url).catch(() => toast("Impossible de lire l'audio en wolof sur cet appareil", 'warning'))
  }
  return <Bouton etat={etat} arret={ARRET_WO} onClick={clic} className={className} titre="Écouter l'explication en wolof" />
}
