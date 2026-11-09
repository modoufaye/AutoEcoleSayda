/* Séries d'examen et catalogues des annales publiés en Travaux Dirigés : { serie, mode }, mode
   ENTRAINEMENT (correction à chaque question) ou EXAMEN (examen blanc). L'élève ne voit dans
   Travaux Dirigés que les séries, et les modes, qui lui ont été publiés. */
import { SERIES } from './seriesExamen'
import { ANNALES } from './annales'

export const MODES = [
  { key: 'ENTRAINEMENT', libelle: 'Entraînement', icone: 'mortarboard-fill', couleur: '#0f766e', fond: '#ccfbf1' },
  { key: 'EXAMEN', libelle: 'Examen blanc', icone: 'stopwatch-fill', couleur: '#a16207', fond: '#fef3c7' },
]
export const GROUPES = [
  { key: 'annales', titre: 'Annales', unite: 'catalogue', sousTitre: "Catalogues des questions fréquentes à l'examen", series: ANNALES },
  { key: 'series', titre: "Séries d'examen", unite: 'série', sousTitre: "25 questions au format de l'examen", series: SERIES },
]
export const serieDe = id => [...ANNALES, ...SERIES].find(s => s.id === id)

/* « Catalogue B1 · Examen blanc » */
export const libelleSerie = x => `${serieDe(x.serie)?.titre || x.serie} · ${MODES.find(m => m.key === x.mode)?.libelle || ''}`

/* Séries publiées pour l'élève ([{ serie, mode }]) : id → Set des modes ('entrainement', 'examen'). */
export function seriesOuvertes(publiees) {
  const ouv = {}
  for (const x of publiees || []) (ouv[x.serie] ||= new Set()).add(x.mode.toLowerCase())
  return ouv
}
