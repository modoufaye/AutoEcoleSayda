/* Racine d'URL du tableau de bord selon le rôle.
   Sert à la redirection après connexion et à la navigation entre sections. */
export const ROLE_BASE = {
  SUPER_ADMIN: '/dashboard/admin',
  MONITEUR:    '/dashboard/moniteur',
  ELEVE:       '/dashboard/eleve',
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
  type_paiement:   { TARIF_INSCRIPTION: 'info text-dark', TARIF_CODE: 'primary', TARIF_CONDUITE: 'warning text-dark',
                     INSCRIPTION: 'info text-dark', LECON: 'primary', EXAMEN: 'secondary', AUTRE: 'secondary' },
  site:            { MAZALIK_JINAN: 'primary', GUEDIAWAYE: 'secondary', KEUR_MASSAR: 'warning text-dark' },
}

export const LABELS = {
  EN_COURS: 'En cours', DIPLOME: 'Diplômé', SUSPENDU: 'Suspendu', ABANDONNE: 'Abandonné',
  DISPONIBLE: 'Disponible', EN_MAINTENANCE: 'En maintenance', HORS_SERVICE: 'Hors service',
  PLANIFIEE: 'Planifiée', TERMINEE: 'Terminée', ANNULEE: 'Annulée',
  ADMIS: 'Admis', REFUSE: 'Refusé', EN_ATTENTE: 'En attente',
  CODE: 'Code', CONDUITE: 'Conduite',
  PAYE: 'Payé', ANNULE: 'Annulé',
  TARIF_INSCRIPTION: 'Tarif inscription', TARIF_CODE: 'Tarif code', TARIF_CONDUITE: 'Tarif conduite',
  INSCRIPTION: 'Inscription', LECON: 'Leçon', EXAMEN: 'Examen', AUTRE: 'Autre',
  MAZALIK_JINAN: 'Massalikoul Djinane', GUEDIAWAYE: 'Guédiawaye (fermé)', KEUR_MASSAR: 'Keur Massar',
}

/* Bureaux de rattachement des élèves (champ `site` côté API). Guédiawaye, fermé, n'est plus proposé. */
export const BUREAUX = [
  { value: 'MAZALIK_JINAN', label: 'Massalikoul Djinane' },
  { value: 'KEUR_MASSAR',   label: 'Keur Massar' },
]

