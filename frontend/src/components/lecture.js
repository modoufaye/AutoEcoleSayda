/* Lecture partagée par les boutons « Écouter » (voix du téléphone, en français) et « Wolof »
   (explication enregistrée) : une seule lecture à la fois, et tous les boutons suivent son état.
   courant : { cle, etat: 'lecture' | 'pause', u (synthèse) ou audio (enregistrement) }. */

let courant = null
const abonnes = new Set()
const annoncer = () => abonnes.forEach(f => f(courant))

export const lectureCourante = () => courant
export function abonner(f) { abonnes.add(f); return () => abonnes.delete(f) }

function couper() {
  try { window.speechSynthesis?.cancel() } catch { /* rien à arrêter */ }
  courant?.audio?.pause()
  courant = null
}

/* Texte lu par la voix française du téléphone. */
export function lireTexte(texte) {
  couper()
  const s = window.speechSynthesis
  const u = new SpeechSynthesisUtterance(texte); u.lang = 'fr-FR'; u.rate = 0.95
  const voix = s.getVoices().find(v => v.lang?.startsWith('fr')); if (voix) u.voice = voix
  u.onend = u.onerror = () => { if (courant?.u === u) { courant = null; annoncer() } }
  courant = { cle: texte, etat: 'lecture', u }; annoncer()
  s.speak(u)
}

/* Enregistrement audio (explication en wolof). Rejette si le téléphone refuse de le lire. */
export function lireAudio(url) {
  couper()
  const a = new Audio(url)
  const fin = () => { if (courant?.audio === a) { courant = null; annoncer() } }
  a.onended = a.onerror = fin
  courant = { cle: 'audio:' + url, etat: 'lecture', audio: a }; annoncer()
  return a.play().catch(e => { fin(); throw e })
}

export function mettreEnPause() {
  if (!courant) return
  if (courant.audio) courant.audio.pause(); else window.speechSynthesis.pause()
  courant = { ...courant, etat: 'pause' }; annoncer()
}

export function reprendre() {
  if (!courant) return
  const c = courant
  courant = { ...c, etat: 'lecture' }; annoncer()
  if (c.audio) { c.audio.play().catch(() => { courant = null; annoncer() }); return }
  const s = window.speechSynthesis
  s.resume()
  // Certains téléphones ne savent pas reprendre : on relit depuis le début
  setTimeout(() => { if (courant?.cle === c.cle && courant.etat === 'lecture' && !s.speaking) lireTexte(c.cle) }, 400)
}

/* Arrête la lecture si c'est celle de cette clé (bouton qui disparaît de l'écran). */
export function arreter(cle) {
  if (courant?.cle === cle) { couper(); annoncer() }
}
