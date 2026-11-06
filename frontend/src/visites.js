/* Visites des pages publiques (accueil, connexion, inscription en ligne), vues par le super admin
   dans Journal → Visites. Une fois par page et par onglet ; sans jeton (visiteur anonyme). Le serveur
   note l'adresse IP et le navigateur ; on lui donne la page et le site d'où vient le visiteur. */
const PAGES = ['/', '/login', '/inscription']

export function noterVisite(page) {
  if (!PAGES.includes(page)) return
  try {
    if (sessionStorage.getItem('visite:' + page)) return
    sessionStorage.setItem('visite:' + page, '1')
  } catch { /* stockage fermé : on note quand même */ }
  // Venu d'une autre page du site : pas de provenance extérieure
  let provenance = document.referrer || ''
  try { if (provenance && new URL(provenance).host === location.host) provenance = '' } catch { provenance = '' }
  fetch('/api/public/visites', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, provenance }) }).catch(() => {})
}
