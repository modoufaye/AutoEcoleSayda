/* Racine d'URL du tableau de bord selon le rôle.
   Sert à la redirection après connexion et à la navigation entre sections. */
export const ROLE_BASE = {
  SUPER_ADMIN: '/dashboard/admin',
  MONITEUR:    '/dashboard/moniteur',
  ELEVE:       '/dashboard/eleve',
  SECRETAIRE:  '/dashboard/secretariat',
}

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
  site:            { MAZALIK_JINAN: 'primary', GUEDIAWAYE: 'secondary', KEUR_MASSAR: 'warning text-dark', EN_LIGNE: 'info text-dark' },
}

export const LABELS = {
  EN_COURS: 'En cours', DIPLOME: 'Diplômé', SUSPENDU: 'Suspendu', ABANDONNE: 'Abandonné',
  DISPONIBLE: 'Disponible', EN_MAINTENANCE: 'En maintenance', HORS_SERVICE: 'Hors service',
  PLANIFIEE: 'Planifiée', TERMINEE: 'Terminée', ANNULEE: 'Annulée',
  ADMIS: 'Admis', REFUSE: 'Refusé', EN_ATTENTE: 'En attente',
  CODE: 'Code', CONDUITE: 'Conduite',
  PAYE: 'Payé', ANNULE: 'Annulé',
  TRANCHE_1: '1re tranche (acompte)', TRANCHE_2: '2e tranche', TRANCHE_3: '3e tranche',
  MAZALIK_JINAN: 'Massalikoul Djinane', GUEDIAWAYE: 'Guédiawaye', KEUR_MASSAR: 'Keur Massar', EN_LIGNE: 'En ligne',
}

/* Bureaux de rattachement des élèves (champ `site` côté API). */
export const BUREAUX = [
  { value: 'MAZALIK_JINAN', label: 'Massalikoul Djinane' },
  { value: 'KEUR_MASSAR',   label: 'Keur Massar' },
  { value: 'GUEDIAWAYE',    label: 'Guédiawaye' },
]

/* Lieux d'inscription : les bureaux, plus « En ligne » (l'élève est alors suivi par Massalikoul Djinane). */
export const LIEUX_INSCRIPTION = [...BUREAUX, { value: 'EN_LIGNE', label: 'En ligne' }]


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
