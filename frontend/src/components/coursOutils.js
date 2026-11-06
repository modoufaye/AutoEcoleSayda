/* Outils partagés des cours de code (CoursCode, SeanceCode). */
import { toast } from './Toast'

/* Ce que liste un chapitre : panneaux, marquages, signaux (feux, agent) ou situations. */
export function genre(ch) {
  const tous = cle => ch.panneaux.every(x => x[cle])
  if (ch.situations) return 'situations'
  if (tous('image')) return 'panneaux'
  if (tous('marquage')) return 'marquages'
  if (tous('voyant')) return 'voyants'
  if (tous('dessin')) return 'signaux'
  return 'repères'   // chapitre mixte : panneaux, pictogrammes, marquages
}

export const estScene = item => !!item?.dessin?.startsWith('scene-')   // carrefour vu du dessus : affiché en grand

/* Lecture à voix haute (synthèse du navigateur, voix française si disponible). */
export function lire(texte) {
  try {
    const s = window.speechSynthesis; if (!s) return toast('Lecture à voix haute indisponible sur cet appareil', 'warning')
    s.cancel(); const u = new SpeechSynthesisUtterance(texte); u.lang = 'fr-FR'; u.rate = 0.95
    const voix = s.getVoices().find(v => v.lang?.startsWith('fr')); if (voix) u.voice = voix
    s.speak(u)
  } catch { toast('Lecture à voix haute indisponible', 'warning') }
}
