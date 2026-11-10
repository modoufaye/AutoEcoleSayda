/* Racine d'URL du tableau de bord selon le rôle.
   Sert à la redirection après connexion et à la navigation entre sections. */
export const ROLE_BASE = {
  SUPER_ADMIN: '/dashboard/admin',
  ADMIN:       '/dashboard/admin',
  MONITEUR:    '/dashboard/moniteur',
  ELEVE:       '/dashboard/eleve',
  SECRETAIRE:  '/dashboard/secretariat',
}

/* Super admin ou administrateur : mêmes écrans et mêmes droits, sauf la gestion des comptes
   administrateurs (super admin seulement, voir Parametres et AdministrateurController). */
export const estAdmin = role => role === 'SUPER_ADMIN' || role === 'ADMIN'

export function fmtDate(s) {
  if (!s) return '-'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function fmtMontant(n) {
  if (n == null) return '-'
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

/* Lien wa.me vers un numéro saisi librement ("77 123 45 67", "+221…", "00221…").
   Un numéro local à 9 chiffres est considéré sénégalais (+221). null si inexploitable. */
export function waLink(telephone, message = '') {
  let n = (telephone || '').replace(/\D/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (n.length === 9) n = '221' + n
  if (n.length < 10) return null
  return `https://wa.me/${n}${message ? '?text=' + encodeURIComponent(message) : ''}`
}

export function fmtTime(t) {
  return t ? t.substring(0, 5) : ''
}

export const BADGES = {
  statut_eleve:    { EN_COURS: 'primary', DIPLOME: 'success', SUSPENDU: 'warning text-dark', ABANDONNE: 'danger' },
  statut_vehicule: { DISPONIBLE: 'success', EN_COURS: 'primary', EN_MAINTENANCE: 'warning text-dark', HORS_SERVICE: 'danger' },
  statut_lecon:    { PLANIFIEE: 'info text-dark', EN_COURS: 'primary', TERMINEE: 'success', ANNULEE: 'secondary' },
  resultat:        { ADMIS: 'success', REFUSE: 'danger', EN_ATTENTE: 'warning text-dark' },
  type_lecon:      { CODE: 'secondary', CONDUITE: 'primary' },
  statut_paiement: { PAYE: 'success', EN_ATTENTE: 'warning text-dark', ANNULE: 'secondary' },
  type_paiement:   { TRANCHE_1: 'info text-dark', TRANCHE_2: 'primary', TRANCHE_3: 'warning text-dark' },
}

export const LABELS = {
  EN_COURS: 'En cours', DIPLOME: 'Diplômé', SUSPENDU: 'Suspendu', ABANDONNE: 'Abandonné',
  DISPONIBLE: 'Disponible', EN_MAINTENANCE: 'En maintenance', HORS_SERVICE: 'Hors service',
  PLANIFIEE: 'Planifiée', TERMINEE: 'Terminée', ANNULEE: 'Annulée',
  ADMIS: 'Admis', REFUSE: 'Refusé', EN_ATTENTE: 'En attente',
  CODE: 'Code', CONDUITE: 'Conduite',
  PAYE: 'Payé', ANNULE: 'Annulé',
  TRANCHE_1: '1re tranche (acompte)', TRANCHE_2: '2e tranche', TRANCHE_3: '3e tranche',
}

/* Bureaux : réglés dans Paramètres, voir bureaux.jsx (useBureaux). */


/* Recherche : chaque mot tapé doit se trouver dans le texte, dans n'importe quel ordre,
   sans tenir compte des accents ni des majuscules (« awa diop » trouve « DIOP Awa »).
   Les chiffres se comparent sans les espaces (« 77 123 » trouve 771234567). */
const sansAccents = s => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
export function correspond(champs, recherche) {
  const mots = sansAccents(recherche).split(/\s+/).filter(Boolean)
  if (!mots.length) return true
  const texte = sansAccents([].concat(champs).join(' '))
  const chiffres = texte.replace(/\D/g, '')
  // Une suite de chiffres (« 77 123 45 67 ») se cherche d'un bloc dans les numéros
  const numero = sansAccents(recherche).replace(/\s+/g, '')
  if (/^\+?\d{3,}$/.test(numero) && chiffres.includes(numero.replace('+', ''))) return true
  return mots.every(m => texte.includes(m))
}

/* Élève inscrit dans les 7 derniers jours (aujourd'hui compris) ; date « AAAA-MM-JJ… ». */
export function inscritCetteSemaine(date) {
  if (!date) return false
  const d = new Date(); d.setDate(d.getDate() - 6)
  const limite = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return date.slice(0, 10) >= limite
}
