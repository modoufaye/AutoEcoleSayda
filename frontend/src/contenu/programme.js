/* Programme de code d'une séance : le moniteur y publie des parties du cours de code, repérées
   par leurs numéros (thème 1, chapitre 1.2, panneaux n° 1 à 9). Une partie est
   { chapitre, de, a } : identifiant du chapitre (ou de la révision d'un thème) et, si besoin,
   seulement ses panneaux n° de à a (bornes comprises). Sans bornes : tout le chapitre.
   L'élève ne voit dans « Cours Code » que ce qui lui a été publié, puis passe le quiz de la séance. */
import { THEMES_CODE } from './themes'
import { questionsChapitre, questionsRevision } from './signalisation'

/* { theme, ch, revision } d'après l'identifiant d'un chapitre ou d'une révision. */
export function trouverChapitre(id) {
  for (const theme of THEMES_CODE) {
    if (theme.revision.id === id) return { theme, ch: theme.revision, revision: true }
    const ch = theme.chapitres.find(c => c.id === id)
    if (ch) return { theme, ch, revision: false }
  }
  return null
}

export const numeroChapitre = (theme, ch) => `${theme.numero}.${ch.numero}`
export const complete = p => p.de == null || p.a == null

/* Panneaux d'une partie, avec leur numéro dans le chapitre. */
export function panneauxPartie(ch, p) {
  const tous = (ch.panneaux || []).map((pa, i) => ({ ...pa, numero: i + 1 }))
  return complete(p) ? tous : tous.slice(p.de - 1, p.a)
}

/* « 1.1 Panneaux de danger · n° 1 à 9 » */
export function libellePartie(p) {
  const t = trouverChapitre(p.chapitre)
  if (!t) return p.chapitre
  if (t.revision) return `Thème ${t.theme.numero} · ${t.ch.titre} (${t.theme.titre})`
  const base = `${numeroChapitre(t.theme, t.ch)} ${t.ch.titre}`
  if (complete(p)) return base
  return p.de === p.a ? `${base} · n° ${p.de}` : `${base} · n° ${p.de} à ${p.a}`
}

/* Questions d'une partie : celles de ses panneaux (les mauvaises réponses viennent de tout le
   chapitre), plus les questions de règles quand tout le chapitre est publié, ou quand la partie
   n'a pas de question de panneau (situations, pictogrammes). Révision : tirage sur le thème. */
export function questionsPartie(p) {
  const t = trouverChapitre(p.chapitre)
  if (!t) return []
  if (t.revision) return questionsRevision(t.theme.chapitres, t.ch.nombre)
  const toutes = questionsChapitre(t.ch)
  if (complete(p)) return toutes
  const ids = new Set(panneauxPartie(t.ch, p).map(pa => `${t.ch.id}:${pa.id}`))
  const choisies = toutes.filter(q => ids.has(q.id))
  return choisies.length ? choisies : toutes.filter(q => /:q\d+$/.test(q.id))
}

export const QUESTIONS_MAX = 40

/* Quiz d'une séance : les questions de toutes ses parties, sans doublon, mélangées (40 au plus). */
export function questionsSeance(programme) {
  const vues = new Set(), liste = []
  for (const p of programme || []) for (const q of questionsPartie(p)) if (!vues.has(q.id)) { vues.add(q.id); liste.push(q) }
  for (let i = liste.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [liste[i], liste[j]] = [liste[j], liste[i]] }
  return liste.slice(0, QUESTIONS_MAX)
}

/* Ce que les séances publiées ouvrent à l'élève : chapitre → { complet, numeros } (numéros de
   panneaux ouverts quand seule une partie du chapitre l'est). */
export function ouverturesCode(seances) {
  const ouv = {}
  for (const s of seances || []) for (const p of s.programme || []) {
    const o = ouv[p.chapitre] || (ouv[p.chapitre] = { complet: false, numeros: new Set() })
    if (complete(p)) o.complet = true
    else for (let n = p.de; n <= p.a; n++) o.numeros.add(n)
  }
  return ouv
}
