/* Quiz en cours : si l'élève quitte la page (ou ferme l'application, ou change d'appareil) au
   milieu d'un quiz, il le reprend à la même question, avec les mêmes questions tirées, son
   score et ses erreurs. La partie est gardée sur le serveur (élèves, /eleve/quiz-en-cours) et
   copiée sur l'appareil (secours sans connexion, et pour les autres rôles). Oubliée à la fin du
   quiz, au redémarrage, ou après 30 jours. */
import { api } from '../api'

const DUREE = 30 * 24 * 3600 * 1000
const lireLocal = k => { try { return localStorage.getItem(k) } catch { return null } }
const qui = () => lireLocal('email') || ''
const eleve = () => lireLocal('role') === 'ELEVE'
const cle = id => `quiz-en-cours:${qui()}:${id}`
const envois = {}   // envois au serveur en attente, par quiz
const valide = x => (x && Date.now() - x.le < DUREE ? x : null)

/* Copie de l'appareil seulement (lecture immédiate). */
export function lireQuiz(id) {
  if (!id) return null
  try { return valide(JSON.parse(lireLocal(cle(id)))) } catch { return null }
}

/* Quiz en cours du serveur (élève), relu au plus toutes les 2 secondes ; null si le serveur
   n'a pas répondu (hors connexion) ou pour les autres rôles. */
let liste = null
function serveur() {
  if (!eleve()) return Promise.resolve(null)
  if (!liste || Date.now() - liste.le > 2000) {
    liste = { le: Date.now(), p: api('GET', '/eleve/quiz-en-cours')
      .then(l => Object.fromEntries((l || []).map(x => { try { return [x.cle, JSON.parse(x.etat)] } catch { return [x.cle, null] } })))
      .catch(() => null) }
  }
  return liste.p
}

/* Partie à reprendre. Élève connecté : le serveur fait foi (une partie finie ou redémarrée sur
   un autre appareil n'y est plus), sauf une réponse de cet appareil pas encore envoyée. Sans
   réponse du serveur : la copie de l'appareil. */
export async function chargerQuiz(id) {
  if (!id) return null
  const local = lireQuiz(id), tous = await serveur()
  if (!tous) return local
  const distant = valide(tous[id])
  const enAttente = local && (envois[id] || Date.now() - local.le < 5000)
  if (!distant) {
    if (enAttente) return local
    if (local) try { localStorage.removeItem(cle(id)) } catch { /* rien */ }
    return null
  }
  return enAttente && local.le > distant.le ? local : distant
}

/* Toutes les parties en cours (liste des séries d'examen). */
export async function chargerQuizs(ids) {
  const r = {}
  await Promise.all(ids.map(async id => { r[id] = await chargerQuiz(id) }))
  return r
}

export function ecrireQuiz(id, etat) {
  if (!id) return
  const x = { ...etat, le: Date.now() }
  try { localStorage.setItem(cle(id), JSON.stringify(x)) } catch { /* stockage plein ou fermé */ }
  if (!eleve()) return
  // Une réponse par seconde au plus vers le serveur : la dernière l'emporte
  clearTimeout(envois[id])
  envois[id] = setTimeout(() => { delete envois[id]; liste = null; api('PUT', `/eleve/quiz-en-cours/${id}`, { etat: JSON.stringify(x) }).catch(() => {}) }, 800)
}

export function effacerQuiz(id) {
  if (!id) return
  clearTimeout(envois[id]); delete envois[id]
  try { localStorage.removeItem(cle(id)) } catch { /* rien */ }
  liste = null
  if (eleve()) api('DELETE', `/eleve/quiz-en-cours/${id}`).catch(() => {})
}
