/* Bureaux de l'auto-école, réglés dans Paramètres (/api/public/bureaux) : chaque auto-école a les
   siens. L'élève garde le code de son bureau (champ `site` côté API) ; « EN_LIGNE » est un lieu
   d'inscription, jamais un bureau : l'élève est alors suivi par le bureau principal.
   Les bureaux fermés restent dans la liste (actif = false) pour nommer ceux des anciens élèves. */
import { useEffect, useState } from 'react'

export const EN_LIGNE = 'EN_LIGNE'
const CLE = 'ecole.bureaux'
// Couleurs des pastilles, dans l'ordre des bureaux
const COULEURS = ['#1e3a5f', '#10b981', '#0ea5e9', '#8b5cf6', '#f97316', '#e11d48', '#64748b']

function lireCache() {
  try { return JSON.parse(localStorage.getItem(CLE)) || [] } catch { return [] }
}

let liste = lireCache()
let demande = null
const abonnes = new Set()

function charger() {
  if (demande) return demande
  demande = fetch('/api/public/bureaux')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!Array.isArray(d)) return
      liste = d
      try { localStorage.setItem(CLE, JSON.stringify(d)) } catch { /* stockage indisponible */ }
      abonnes.forEach(f => f(d))
    })
    .catch(() => { demande = null })
  return demande
}

function vue(tous) {
  const actifs = tous.filter(b => b.actif)
  const principal = actifs.find(b => b.principal) || actifs[0] || null
  const parCode = Object.fromEntries(tous.map(b => [b.code, b]))
  return {
    tous,
    actifs,
    principal,
    /** Nom affiché : « Keur Massar », « En ligne » ; un code inconnu reste tel quel. */
    libelle: code => (code === EN_LIGNE ? 'En ligne' : parCode[code]?.nom || code || ''),
    /** Couleur stable d'un bureau (pastilles, graphiques). */
    couleur: code => (code === EN_LIGNE ? '#d4a017' : COULEURS[Math.max(0, tous.findIndex(b => b.code === code)) % COULEURS.length]),
    /** Lieux d'inscription proposés : les bureaux ouverts, puis « En ligne ». */
    lieux: [...actifs.map(b => ({ value: b.code, label: b.nom })), { value: EN_LIGNE, label: 'En ligne' }],
  }
}

/** { tous, actifs, principal, libelle(code), couleur(code), lieux } ; se met à jour après Paramètres. */
export function useBureaux() {
  const [l, setL] = useState(liste)
  useEffect(() => {
    abonnes.add(setL)
    charger()
    return () => { abonnes.delete(setL) }
  }, [])
  return vue(l)
}

/** Après une modification dans Paramètres : relire la liste partout. */
export function rechargerBureaux() {
  demande = null
  return charger()
}
