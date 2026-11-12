/* Classes d'élèves (/api/classes) : groupes d'élèves arrivés ensemble, pour cocher d'un coup les
   élèves d'une séance, d'une publication, d'une annonce ou d'un examen. Liste partagée par tous les
   écrans et relue après une modification (rechargerClasses). */
import { useEffect, useState } from 'react'
import { api } from './api'

let liste = []
let demande = null
const abonnes = new Set()

function charger() {
  if (demande) return demande
  demande = api('GET', '/classes')
    .then(d => { liste = Array.isArray(d) ? d : []; abonnes.forEach(f => f(liste)) })
    .catch(() => { demande = null })
  return demande
}

/** Classes visibles (un moniteur n'y voit que ses élèves) : [{ id, nom, eleveIds, nombre, modifiable, auteur }] */
export function useClasses() {
  const [l, setL] = useState(liste)
  useEffect(() => {
    abonnes.add(setL)
    charger()
    return () => { abonnes.delete(setL) }
  }, [])
  return l
}

export function rechargerClasses() {
  demande = null
  return charger()
}
