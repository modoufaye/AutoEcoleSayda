/* Programme d'une séance : le moniteur y publie des parties du cours de code ou du parcours
   « Apprendre à conduire », repérées par leurs numéros (thème 1, chapitre 1.2, panneaux n° 1 à 9). Une partie est
   { chapitre, de, a } : identifiant du chapitre (ou de la révision d'un thème) et, si besoin,
   seulement ses panneaux n° de à a (bornes comprises). Sans bornes : tout le chapitre.
   L'élève ne voit dans « Cours Code » et « Cours Conduite » que ce qui lui a été publié, puis
   passe le quiz de la séance. */
import { THEMES_CODE } from './themes'
import { THEMES_CONDUITE } from './conduite'
import { questionsChapitre, questionsRevision } from './signalisation'

/* Les deux cours publiables : code (théorie) et conduite (« Apprendre à conduire »). */
export const COURS = [
  { key: 'code', titre: 'Cours de code', themes: THEMES_CODE },
  { key: 'conduite', titre: 'Cours de conduite', themes: THEMES_CONDUITE },
]
export const coursDe = id => id?.startsWith('conduite-') ? COURS[1] : COURS[0]

/* { theme, ch, revision, conduite } d'après l'identifiant d'un chapitre ou d'une révision. */
export function trouverChapitre(id) {
  for (const theme of [...THEMES_CODE, ...THEMES_CONDUITE]) {
    const conduite = theme.key.startsWith('conduite-')
    if (theme.revision.id === id) return { theme, ch: theme.revision, revision: true, conduite }
    const ch = theme.chapitres.find(c => c.id === id)
    if (ch) return { theme, ch, revision: false, conduite }
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

/* « 1.1 Panneaux de danger · n° 1 à 9 » ; « Conduite 2.1 Circulation urbaine » */
export function libellePartie(p) {
  const t = trouverChapitre(p.chapitre)
  if (!t) return p.chapitre
  const cours = t.conduite ? 'Conduite ' : ''
  if (t.revision) return `${cours}Thème ${t.theme.numero} · ${t.ch.titre} (${t.theme.titre})`
  const base = `${cours}${numeroChapitre(t.theme, t.ch)} ${t.ch.titre}`
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

/* Nombre de séances publiées avec du code et avec de la conduite (suivi de formation). Une séance
   sans partie de cours (contenu libre seul) est de la théorie du code. */
export function compterSeances(seances) {
  const a = genre => seances.filter(s => s.programme.some(p => p.chapitre.startsWith('conduite-') === genre)).length
  return { code: a(false) + seances.filter(s => !s.programme.length).length, conduite: a(true), quizValides: seances.filter(s => s.resultat?.reussi).length, quizPasses: seances.filter(s => s.resultat).length, avecQuiz: seances.filter(s => s.programme.length).length }
}
