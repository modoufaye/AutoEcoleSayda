/* Outils partagés des cours de code (CoursCode, SeanceCode). */

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
