import { api } from './api'

/* Élève : séances publiées pour lui dont le quiz n'est pas encore validé (« à faire »). Une séance
   sans cours de code (contenu libre seul) n'a pas de quiz : elle n'est pas comptée. */
export async function compterSeancesAFaire() {
  const [seances, resultats] = await Promise.all([api('GET', '/eleve/seances'), api('GET', '/eleve/seances/resultats')])
  const validees = new Set((resultats || []).filter(r => r.reussi).map(r => r.seanceId))
  return (seances || []).filter(s => (s.programme || []).length > 0 && !validees.has(s.id)).length
}
