import { useEffect, useState } from 'react'
import { api } from '../api'
import { waLink } from '../utils'
import { msgBienvenue } from '../messages'
import { afficherTelephone } from '../telephones'
import { FenetreModerne } from './FenetreModerne'

/* ─── Envoi groupé des identifiants (message de bienvenue WhatsApp) ───────────────
   WhatsApp ne laisse pas un site envoyer seul : on prépare une file, et chaque clic sur
   « Envoyer » ouvre WhatsApp déjà rempli pour l'élève suivant.
   Les identifiants d'un élève sont générés quand il arrive en tête de file (pas tous d'avance) :
   le lien est ensuite un vrai clic de l'utilisateur, que les navigateurs mobiles ne bloquent pas.
   Seuls des élèves sans message envoyé et jamais connectés sont proposés : générer un nouveau mot
   de passe ne coupe donc l'accès de personne. */
export default function EnvoiGroupeIdentifiants({ eleves, ecole, onClose, onEnvoye }) {
  const joignables = eleves.filter(e => waLink(e.telephone))
  const injoignables = eleves.filter(e => !waLink(e.telephone))
  const [coches, setCoches] = useState(() => new Set(joignables.map(e => e.id)))
  const [file, setFile] = useState(null)            // élèves retenus, dans l'ordre d'envoi
  const [index, setIndex] = useState(0)
  // Réponse pour un élève donné : { id, creds } ou { id, erreur } ; ignorée si ce n'est plus l'élève courant
  const [reponse, setReponse] = useState(null)
  const [bilan, setBilan] = useState({ envoyes: 0, passes: 0 })

  const courant = file?.[index]
  const termine = file && index >= file.length

  // Nouvel élève en tête de file : ses identifiants sont générés
  useEffect(() => {
    if (!courant) return
    let annule = false
    api('POST', `/eleves/${courant.id}/identifiants`)
      .then(c => { if (!annule) setReponse({ id: courant.id, creds: c }) })
      .catch(e => { if (!annule) setReponse({ id: courant.id, erreur: e.message || 'Identifiants impossibles à générer' }) })
    return () => { annule = true }
  }, [courant])
  const pourCourant = reponse && courant && reponse.id === courant.id ? reponse : null
  const creds = pourCourant?.creds
  const erreur = pourCourant?.erreur

  const basculer = id => setCoches(s => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })
  const tousCoches = coches.size === joignables.length

  const suivant = envoye => {
    setBilan(b => envoye ? { ...b, envoyes: b.envoyes + 1 } : { ...b, passes: b.passes + 1 })
    setIndex(i => i + 1)
  }

  // Le lien WhatsApp s'ouvre (clic) : la fiche retient l'envoi, puis on passe au suivant
  const envoyer = () => {
    const eleve = courant
    api('POST', `/eleves/${eleve.id}/bienvenue-envoyee`).then(e => onEnvoye?.(eleve.id, e.bienvenueEnvoyeeLe)).catch(() => {})
    setTimeout(() => suivant(true), 300)
  }

  /* ── Étape 1 : choix des élèves ── */
  if (!file) {
    return (
      <FenetreModerne surTitre="Message de bienvenue" titre="Envoi groupé des identifiants" icone="whatsapp"
        details={[['people-fill', `${joignables.length} élève${joignables.length > 1 ? 's' : ''} à qui envoyer`]]}
        onClose={onClose} libelleSave={`Commencer l'envoi (${coches.size})`}
        onSave={() => { if (coches.size) setFile(joignables.filter(e => coches.has(e.id))) }}
        piedGauche="Un clic par élève : WhatsApp s'ouvre avec le message déjà rempli.">
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #eef2f7' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-extrabold text-slate-700">Élèves qui n'ont pas encore reçu leurs identifiants</span>
            {joignables.length > 0 && (
              <button type="button" className="bg-transparent border-0 p-0 text-xs font-bold cursor-pointer" style={{ color: '#2563eb' }}
                onClick={() => setCoches(tousCoches ? new Set() : new Set(joignables.map(e => e.id)))}>
                {tousCoches ? 'Tout décocher' : 'Tout cocher'}
              </button>
            )}
          </div>
          {joignables.length === 0 && <div className="text-sm text-slate-500">Aucun élève à qui envoyer ses identifiants dans la liste affichée.</div>}
          <div className="divide-y divide-slate-100">
            {joignables.map(e => (
              <label key={e.id} className="flex items-center gap-3 py-2 cursor-pointer mb-0">
                <input type="checkbox" className="form-check-input m-0" checked={coches.has(e.id)} onChange={() => basculer(e.id)} />
                <span className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">{e.prenom} {e.nom}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap">{afficherTelephone(e.telephone)}</span>
              </label>
            ))}
          </div>
        </div>
        {injoignables.length > 0 && (
          <div className="rounded-2xl p-4 text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
            <i className="bi bi-exclamation-triangle-fill me-1" />
            Sans numéro WhatsApp valide (à corriger sur leur fiche) : {injoignables.map(e => `${e.prenom} ${e.nom}`).join(', ')}
          </div>
        )}
        <div className="text-xs text-slate-500">
          <i className="bi bi-info-circle me-1" />Un nouveau mot de passe est créé pour chaque élève au moment de l'envoi.
        </div>
      </FenetreModerne>
    )
  }

  /* ── Fin de la file ── */
  if (termine) {
    return (
      <FenetreModerne surTitre="Message de bienvenue" titre="Envoi terminé" icone="check2-all"
        onClose={onClose} onSave={onClose} libelleSave="Fermer" taille="">
        <div className="bg-white rounded-2xl p-5 text-center" style={{ border: '1px solid #eef2f7' }}>
          <i className="bi bi-whatsapp" style={{ fontSize: '2.2rem', color: '#25d366' }} />
          <div className="text-lg font-extrabold text-slate-800 mt-2">
            {bilan.envoyes} message{bilan.envoyes > 1 ? 's' : ''} envoyé{bilan.envoyes > 1 ? 's' : ''}
          </div>
          {bilan.passes > 0 && <div className="text-sm text-slate-500 mt-1">{bilan.passes} élève{bilan.passes > 1 ? 's' : ''} passé{bilan.passes > 1 ? 's' : ''} : ils restent dans « Identifiants à envoyer ».</div>}
        </div>
      </FenetreModerne>
    )
  }

  /* ── Étape 2 : la file, un élève à la fois ── */
  const message = creds && msgBienvenue(courant, ecole, creds)
  const pct = Math.round(index / file.length * 100)
  return (
    <FenetreModerne surTitre={`Élève ${index + 1} sur ${file.length}`} titre={`${courant.prenom} ${courant.nom}`} icone="whatsapp"
      details={[['telephone-fill', afficherTelephone(courant.telephone)], ['check2-all', `${bilan.envoyes} envoyé${bilan.envoyes > 1 ? 's' : ''}`]]}
      onClose={onClose} onSave={() => suivant(false)} libelleSave="Passer cet élève" taille=""
      piedGauche="Revenez sur cette page après chaque envoi pour passer au suivant.">
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#25d366)' }} />
      </div>

      {erreur ? (
        <div className="rounded-2xl p-4 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <i className="bi bi-x-circle-fill me-1" />{erreur}. Passez cet élève et corrigez sa fiche.
        </div>
      ) : !creds ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <span className="spinner-border spinner-border-sm" />Préparation des identifiants…
        </div>
      ) : (
        <>
          <a href={waLink(courant.telephone, message)} target="_blank" rel="noopener noreferrer" onClick={envoyer}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-base font-extrabold"
            style={{ background: '#25d366', color: '#fff', textDecoration: 'none', boxShadow: '0 6px 18px rgba(37,211,102,.35)' }}>
            <i className="bi bi-whatsapp" />Envoyer à {courant.prenom} sur WhatsApp
          </a>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aperçu du message</div>
            <div className="text-sm text-slate-700 bg-white rounded-xl p-3" style={{ whiteSpace: 'pre-wrap', border: '1px solid #eef2f7' }}>{message}</div>
          </div>
        </>
      )}
    </FenetreModerne>
  )
}
