/* Séries d'examen et catalogues des annales publiés dans une séance : { serie, mode }, mode
   ENTRAINEMENT (correction à chaque question) ou EXAMEN (examen blanc). L'élève ne voit dans
   Travaux Dirigés que les séries, et les modes, qui lui ont été publiés. */
import { SERIES } from './seriesExamen'
import { ANNALES } from './annales'

export const MODES = [
  { key: 'ENTRAINEMENT', libelle: 'Entraînement', icone: 'mortarboard-fill', couleur: '#0f766e', fond: '#ccfbf1' },
  { key: 'EXAMEN', libelle: 'Examen blanc', icone: 'stopwatch-fill', couleur: '#a16207', fond: '#fef3c7' },
]
export const GROUPES = [
  { titre: 'Annales', sousTitre: "Catalogues des questions fréquentes à l'examen", series: ANNALES },
  { titre: "Séries d'examen", sousTitre: "25 questions au format de l'examen", series: SERIES },
]
const serieDe = id => [...ANNALES, ...SERIES].find(s => s.id === id)

/* « Catalogue B1 · Examen blanc » */
export const libelleSerie = x => `${serieDe(x.serie)?.titre || x.serie} · ${MODES.find(m => m.key === x.mode)?.libelle || ''}`

/* Séries ouvertes par des séances publiées : id → Set des modes ('entrainement', 'examen'). */
export function seriesOuvertes(seances) {
  const ouv = {}
  for (const s of seances || []) for (const x of s.series || []) (ouv[x.serie] ||= new Set()).add(x.mode.toLowerCase())
  return ouv
}
