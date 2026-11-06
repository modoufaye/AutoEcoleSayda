/* Quiz en cours gardé sur l'appareil : si l'élève quitte la page (ou ferme l'application) au
   milieu d'un quiz, il le reprend à la même question, avec les mêmes questions tirées, son
   score et ses erreurs. Une sauvegarde par compte et par quiz, oubliée après 30 jours. */

const DUREE = 30 * 24 * 3600 * 1000
const cle = id => { let qui = ''; try { qui = localStorage.getItem('email') || '' } catch { /* stockage fermé */ } return `quiz-en-cours:${qui}:${id}` }

export function lireQuiz(id) {
  if (!id) return null
  try {
    const x = JSON.parse(localStorage.getItem(cle(id)))
    return x && Date.now() - x.le < DUREE ? x : null
  } catch { return null }
}

export function ecrireQuiz(id, etat) {
  if (!id) return
  try { localStorage.setItem(cle(id), JSON.stringify({ ...etat, le: Date.now() })) } catch { /* stockage plein ou fermé : pas de reprise */ }
}

export function effacerQuiz(id) {
  if (!id) return
  try { localStorage.removeItem(cle(id)) } catch { /* rien */ }
}
