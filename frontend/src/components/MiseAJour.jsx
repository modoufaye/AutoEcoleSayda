import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const VERIFICATION_MS = 30 * 60 * 1000
const ATTENTE_MS = 5 * 1000

/* Une saisie est en cours : fenêtre ouverte (formulaire, confirmation), champ actif,
   ou écran de saisie marqué data-saisie (éditeur de séance, nouvel exercice, profil, paramètres). */
function saisieEnCours() {
  if (document.querySelector('.modal.show, [data-saisie]')) return true
  const actif = document.activeElement
  return !!actif && ['INPUT', 'TEXTAREA', 'SELECT'].includes(actif.tagName) && actif.type !== 'search'
}

/*
 * Mise à jour automatique de l'application.
 * L'application installée garde une copie du site pour fonctionner hors ligne. Quand une nouvelle
 * version est déployée, elle s'installe toute seule (rechargement de la page), mais jamais au
 * milieu d'une saisie : on attend que la fenêtre soit fermée ou l'écran de saisie quitté.
 * Le service worker reste en registerType « prompt » pour que ce soit nous qui choisissions le moment.
 */
export default function MiseAJour() {
  const { needRefresh: [besoin], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // Onglet ou application restés ouverts longtemps : on revérifie régulièrement,
      // et à chaque retour sur l'application (téléphone sorti de veille, onglet réaffiché).
      setInterval(() => reg.update(), VERIFICATION_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update()
      })
    },
  })

  useEffect(() => {
    if (!besoin) return
    const essayer = () => { if (!saisieEnCours()) updateServiceWorker(true) }
    essayer()
    const minuteur = setInterval(essayer, ATTENTE_MS)
    return () => clearInterval(minuteur)
  }, [besoin, updateServiceWorker])

  return null
}
