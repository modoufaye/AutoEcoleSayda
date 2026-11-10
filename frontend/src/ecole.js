/* Identité de l'auto-école installée : nom, coordonnées, logo (Paramètres, via /api/public/ecole).
   Une même application sert plusieurs auto-écoles, chacune son installation : aucun nom n'est
   écrit dans le code. Avant la réponse du serveur, on affiche le dernier nom connu sur cet
   appareil, sinon celui de l'installation (VITE_ECOLE_NOM, fichier .env du site). */
import { useEffect, useState } from 'react'

export const NOM_INSTALLATION = import.meta.env.VITE_ECOLE_NOM || 'Auto-École'
/* Ville affichée sous le nom (page de connexion) : « Dakar · Sénégal », « Thiès · Sénégal »… */
export const LIEU_INSTALLATION = import.meta.env.VITE_ECOLE_LIEU || 'Sénégal'
const CLE = 'ecole.identite'

function lireCache() {
  try { return JSON.parse(localStorage.getItem(CLE)) || null } catch { return null }
}

let identite = { nom: NOM_INSTALLATION, ...(lireCache() || {}) }
let demande = null
const abonnes = new Set()

function charger() {
  if (demande) return demande
  demande = fetch('/api/public/ecole')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!d) return
      identite = { ...d, nom: d.nom || NOM_INSTALLATION }
      try { localStorage.setItem(CLE, JSON.stringify(identite)) } catch { /* stockage indisponible */ }
      abonnes.forEach(f => f(identite))
    })
    .catch(() => { demande = null })   // hors connexion : on réessaiera au prochain affichage
  return demande
}

/** Nom de l'auto-école, utilisable hors composant (textes des messages WhatsApp…). */
export const nomEcole = () => identite.nom

/** { nom, telephone, email, adresse, logoUrl } ; se met à jour quand le serveur répond. */
export function useEcole() {
  const [e, setE] = useState(identite)
  useEffect(() => {
    abonnes.add(setE)
    charger()
    return () => { abonnes.delete(setE) }
  }, [])
  return e
}

/** Après un changement dans Paramètres : relire tout de suite le nom partout. */
export function rechargerEcole() {
  demande = null
  return charger()
}
