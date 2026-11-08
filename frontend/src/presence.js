import { useEffect, useState } from 'react'
import { api } from './api'

/* Présence en ligne des élèves et des moniteurs (super admin et administrateurs).
   Un compte est « en ligne » s'il a le site ouvert (requête depuis moins de 2 minutes). */

/* { eleves: Set(id), moniteurs: Set(id) }, relu toutes les 30 secondes ; null si inactif. */
export function usePresence(actif) {
  const [presence, setPresence] = useState(null)
  useEffect(() => {
    if (!actif) return
    const relire = () => api('GET', '/presence')
      .then(r => setPresence({ eleves: new Set(r.eleves || []), moniteurs: new Set(r.moniteurs || []) }))
      .catch(() => {})
    relire()
    const t = setInterval(relire, 30000)
    return () => clearInterval(t)
  }, [actif])
  return actif ? presence : null
}
