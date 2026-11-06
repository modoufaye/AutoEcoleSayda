/* Textes des messages WhatsApp envoyés par l'administration.
   Modifier ici pour changer la formulation partout dans l'application. */
import { fmtDate } from './utils'

const ECOLE_DEFAUT = 'Auto-École Khadija'

const CATEGORIE = { A: 'A', B: 'B', C: 'C', D: 'D' }

const TYPE_EXAMEN = {
  CODE:     'examen du code',
  CONDUITE: 'examen de conduite',
}

/** Jours entre aujourd'hui et une date ISO (yyyy-mm-dd) ; négatif si passée. */
export function joursAvant(dateIso) {
  const [y, m, d] = dateIso.split('-').map(Number)
  const cible = new Date(y, m - 1, d)
  const auj = new Date(); auj.setHours(0, 0, 0, 0)
  return Math.round((cible - auj) / 86400000)
}

function quand(dateIso) {
  const j = joursAvant(dateIso)
  if (j === 0) return "aujourd'hui"
  if (j === 1) return 'demain'
  return `le ${fmtDate(dateIso)}`
}

/* identifiants : { identifiant, motDePasse } renvoyés par POST /moniteurs/{id}/identifiants */
export function msgBienvenueMoniteur(moniteur, ecole, identifiants) {
  const nom = ecole || ECOLE_DEFAUT
  return [
    `Bonjour ${moniteur.prenom} 👋`,
    '',
    `Votre compte moniteur ${nom} est prêt.`,
    `Retrouvez vos élèves, vos séances et les travaux dirigés : ${window.location.origin}`,
    `Identifiant : ${identifiants.identifiant}`,
    `Mot de passe : ${identifiants.motDePasse}`,
    '',
    'Pensez à changer votre mot de passe après la première connexion.',
  ].join('\n')
}

/* identifiants : { nom, identifiant, motDePasse } renvoyés par POST /admin/secretaires */
export function msgBienvenueSecretaire(identifiants, ecole) {
  const nom = ecole || ECOLE_DEFAUT
  return [
    `Bonjour ${identifiants.nom.split(' ')[0]} 👋`,
    '',
    `Votre compte secrétariat ${nom} est prêt.`,
    `Inscrivez les élèves, encaissez les paiements, suivez leçons et examens : ${window.location.origin}`,
    `Identifiant : ${identifiants.identifiant}`,
    `Mot de passe : ${identifiants.motDePasse}`,
    '',
    'Pensez à changer votre mot de passe après la première connexion (bouton « Changer le mot de passe » en bas du menu).',
  ].join('\n')
}

export function msgBienvenueAdmin(identifiants, ecole) {
  const nom = ecole || ECOLE_DEFAUT
  return [
    `Bonjour ${identifiants.nom.split(' ')[0]} 👋`,
    '',
    `Votre compte ${identifiants.role === 'SUPER_ADMIN' ? 'super admin' : 'administrateur'} ${nom} est prêt : ${window.location.origin}`,
    `Identifiant : ${identifiants.identifiant}`,
    `Mot de passe : ${identifiants.motDePasse}`,
    '',
    'Changez ce mot de passe dès la première connexion (bouton « Changer le mot de passe » en bas du menu) et ne le partagez avec personne.',
  ].join('\n')
}

/* identifiants : { identifiant, motDePasse } renvoyés par POST /eleves/{id}/identifiants */
export function msgBienvenue(eleve, ecole, identifiants) {
  const nom = ecole || ECOLE_DEFAUT
  const m = eleve.moniteur
  const lignes = [
    `Bonjour ${eleve.prenom} 👋`,
    '',
    eleve.typeFormation === 'PERFECTIONNEMENT'
      ? `Bienvenue à ${nom} ! Votre inscription au cours de perfectionnement (boîte ${eleve.boiteVitesse === 'AUTOMATIQUE' ? 'automatique' : 'manuelle'}) est bien enregistrée.`
      : `Bienvenue à ${nom} ! Votre inscription${CATEGORIE[eleve.categoriePermis] ? ` au permis ${CATEGORIE[eleve.categoriePermis]}` : ''} est bien enregistrée.`,
  ]
  if (m) lignes.push(`Votre moniteur est ${m.prenom} ${m.nom}${m.telephone ? ` (${m.telephone})` : ''}.`)
  lignes.push(
    '',
    `Suivez vos cours, examens et paiements dans votre espace élève : ${window.location.origin}`,
  )
  // Permis : les séries d'examen et les quiz des cours (le perfectionnement n'a que la conduite)
  if (eleve.typeFormation !== 'PERFECTIONNEMENT')
    lignes.push("📝 Vous y trouverez aussi des entraînements et des examens blancs corrigés pour bien préparer l'examen du code.")
  if (identifiants) {
    lignes.push(
      '',
      `Identifiant : ${identifiants.identifiant}`,
      `Mot de passe : ${identifiants.motDePasse}`,
      '',
      'Pensez à changer votre mot de passe après votre première connexion.',
    )
  }
  lignes.push('', 'À très bientôt !', nom)
  return lignes.join('\n')
}

export function msgRappelExamen(examen, ecole) {
  const nom = ecole || ECOLE_DEFAUT
  return [
    `Bonjour ${examen.eleve?.prenom ?? ''},`,
    '',
    `Rappel : votre ${TYPE_EXAMEN[examen.type] || 'examen'} a lieu ${quand(examen.date)}.`,
    "Pensez à apporter votre pièce d'identité et à arriver en avance.",
    '',
    'Bonne chance ! 🍀',
    nom,
  ].join('\n')
}
