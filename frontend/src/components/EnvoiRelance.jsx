import { useEffect, useState } from 'react'
import { api } from '../api'
import { waLink, fmtDate } from '../utils'
import { msgRelanceJamais, msgRelanceInactif } from '../messages'
import { afficherTelephone } from '../telephones'
import { useEcole } from '../ecole'
import { FenetreModerne } from './FenetreModerne'

/* Relance WhatsApp des élèves du permis qui préparent le code et ne travaillent pas :
   jamais connectés (le message contient de nouveaux identifiants, sans risque puisqu'ils ne s'en
   sont jamais servis) ou inactifs depuis 7 jours. Même file que l'envoi des identifiants : un clic
   par élève ouvre WhatsApp avec le message rempli. Relancés, ou identifiants envoyés (« Envoi
   groupé », message de bienvenue), il y a moins de 7 jours : décochés, pour éviter deux messages
   et deux mots de passe différents. */

const GROUPES = [
  { cle: 'JAMAIS', nom: 'Jamais connectés', icone: 'person-x', aide: "Le message contient de nouveaux identifiants. Décochés : identifiants envoyés ou relancés il y a moins de 7 jours." },
  { cle: 'INACTIF', nom: 'Inactifs', icone: 'moon', aide: "Le message rappelle où ils en sont, sans changer leur mot de passe." },
]
const recent = d => d && (Date.now() - new Date(d).getTime()) < 7 * 86400000
const quand = d => d ? fmtDate(String(d).slice(0, 10)) : ''
// Message récent : relance, ou identifiants tout juste envoyés à un élève jamais connecté
const dejaContacte = e => recent(e.relanceLe) || (e.groupe === 'JAMAIS' && recent(e.bienvenueEnvoyeeLe))

export default function EnvoiRelance({ donnees, onClose, onRelance }) {
  const ecole = useEcole()
  const [groupe, setGroupe] = useState(donnees.jamais > 0 ? 'JAMAIS' : 'INACTIF')
  const joignables = donnees.eleves.filter(e => waLink(e.telephone))
  const [coches, setCoches] = useState(() => new Set(joignables.filter(e => !dejaContacte(e)).map(e => e.id)))
  const [file, setFile] = useState(null)
  const [index, setIndex] = useState(0)
  const [envoyes, setEnvoyes] = useState(0)
  const [reponse, setReponse] = useState(null)   // identifiants générés pour l'élève courant (jamais connecté)

  const courant = file?.[index]
  useEffect(() => {
    if (!courant || courant.groupe !== 'JAMAIS') return
    let annule = false
    api('POST', `/eleves/${courant.id}/identifiants`)
      .then(c => { if (!annule) setReponse({ id: courant.id, creds: c }) })
      .catch(e => { if (!annule) setReponse({ id: courant.id, erreur: e.message || 'Identifiants impossibles à générer' }) })
    return () => { annule = true }
  }, [courant])

  const liste = joignables.filter(e => e.groupe === groupe)
  const injoignables = donnees.eleves.filter(e => e.groupe === groupe && !waLink(e.telephone))
  const basculer = id => setCoches(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const tousCoches = liste.length > 0 && liste.every(e => coches.has(e.id))
  const cochesGroupe = liste.filter(e => coches.has(e.id))

  /* ── Étape 1 : choix ── */
  if (!file) {
    const g = GROUPES.find(x => x.cle === groupe)
    return (
      <FenetreModerne surTitre="Élèves qui ne travaillent pas" titre="Relancer les élèves" icone="whatsapp"
        details={[['person-x', `${donnees.jamais} jamais connecté${donnees.jamais > 1 ? 's' : ''}`], ['moon', `${donnees.inactifs} inactif${donnees.inactifs > 1 ? 's' : ''} depuis ${donnees.joursInactif} jours`]]}
        onClose={onClose} libelleSave={`Commencer l'envoi (${cochesGroupe.length})`}
        onSave={() => { if (cochesGroupe.length) { setFile(cochesGroupe); setIndex(0) } }}
        piedGauche="Un clic par élève : WhatsApp s'ouvre avec le message déjà rempli.">
        <div className="grid grid-cols-2 gap-2">
          {GROUPES.map(x => {
            const n = joignables.filter(e => e.groupe === x.cle).length, actif = groupe === x.cle
            return (
              <button key={x.cle} type="button" onClick={() => setGroupe(x.cle)} className="px-3 py-2.5 text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
                style={{ borderRadius: '.85rem', border: `2px solid ${actif ? '#1e3a5f' : '#e2e8f0'}`, background: actif ? '#eff6ff' : '#fff', color: actif ? '#1e3a5f' : '#64748b' }}>
                <i className={`bi bi-${x.icone}`} />{x.nom} · {n}
              </button>
            )
          })}
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #eef2f7' }}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs text-slate-500"><i className="bi bi-info-circle me-1" />{g.aide}</span>
            {liste.length > 0 && (
              <button type="button" className="bg-transparent border-0 p-0 text-xs font-bold cursor-pointer flex-shrink-0" style={{ color: '#2563eb' }}
                onClick={() => setCoches(s => { const n = new Set(s); liste.forEach(e => tousCoches ? n.delete(e.id) : n.add(e.id)); return n })}>
                {tousCoches ? 'Tout décocher' : 'Tout cocher'}
              </button>
            )}
          </div>
          {liste.length === 0 && <div className="text-sm text-slate-500">Personne dans ce groupe.</div>}
          <div className="divide-y divide-slate-100" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {liste.map(e => (
              <label key={e.id} className="flex items-center gap-3 py-2 cursor-pointer mb-0" style={{ display: 'flex' }}>
                <input type="checkbox" className="form-check-input m-0 flex-shrink-0" checked={coches.has(e.id)} onChange={() => basculer(e.id)} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-700 truncate">{e.prenom} {e.nom}</span>
                  <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                    {e.groupe === 'INACTIF' ? <span>Inactif depuis {e.joursInactif} jours</span> : <span>Inscrit le {quand(e.dateInscription)}</span>}
                    {e.groupe === 'INACTIF' && <span>{e.seancesAssimilees}/{donnees.seancesPubliees} séances</span>}
                    {e.groupe === 'JAMAIS' && e.bienvenueEnvoyeeLe && <span className="font-bold px-1.5 rounded" style={{ background: recent(e.bienvenueEnvoyeeLe) ? '#dcfce7' : '#f1f5f9', color: recent(e.bienvenueEnvoyeeLe) ? '#15803d' : '#64748b' }}>Identifiants envoyés le {quand(e.bienvenueEnvoyeeLe)}</span>}
                    {e.relanceLe && <span className="font-bold px-1.5 rounded" style={{ background: recent(e.relanceLe) ? '#dbeafe' : '#f1f5f9', color: recent(e.relanceLe) ? '#1d4ed8' : '#64748b' }}>Relancé le {quand(e.relanceLe)}</span>}
                  </span>
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap">{afficherTelephone(e.telephone)}</span>
              </label>
            ))}
          </div>
        </div>
        {injoignables.length > 0 && (
          <div className="rounded-2xl p-3 text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
            <i className="bi bi-exclamation-triangle-fill me-1" />
            {injoignables.length} sans numéro WhatsApp valide (à corriger sur leur fiche) : {injoignables.slice(0, 8).map(e => `${e.prenom} ${e.nom}`).join(', ')}{injoignables.length > 8 ? '…' : ''}
          </div>
        )}
      </FenetreModerne>
    )
  }

  /* ── Fin ── */
  if (index >= file.length) {
    return (
      <FenetreModerne surTitre="Relance" titre="Envoi terminé" icone="check2-all" onClose={onClose} libelleAnnuler="Fermer" taille="">
        <div className="bg-white rounded-2xl p-5 text-center" style={{ border: '1px solid #eef2f7' }}>
          <i className="bi bi-whatsapp" style={{ fontSize: '2.2rem', color: '#25d366' }} />
          <div className="text-lg font-extrabold text-slate-800 mt-2">{envoyes} élève{envoyes > 1 ? 's' : ''} relancé{envoyes > 1 ? 's' : ''}</div>
          <div className="text-sm text-slate-500 mt-1">Leur relance est notée : ils seront décochés pendant 7 jours.</div>
        </div>
      </FenetreModerne>
    )
  }

  /* ── Étape 2 : un élève à la fois ── */
  const jamais = courant.groupe === 'JAMAIS'
  const pourCourant = reponse && reponse.id === courant.id ? reponse : null
  const message = jamais
    ? pourCourant?.creds && msgRelanceJamais(courant, ecole?.nom, pourCourant.creds, donnees.seancesPubliees)
    : msgRelanceInactif(courant, ecole?.nom, donnees.seancesPubliees)
  const suivant = () => setIndex(i => i + 1)
  const envoyer = () => {
    api('POST', `/eleves/${courant.id}/relance`).then(() => onRelance?.(courant.id)).catch(() => {})
    if (jamais) api('POST', `/eleves/${courant.id}/bienvenue-envoyee`).catch(() => {})
    setEnvoyes(n => n + 1)
    setTimeout(suivant, 300)
  }
  return (
    <FenetreModerne surTitre={`Élève ${index + 1} sur ${file.length}`} titre={`${courant.prenom} ${courant.nom}`} icone="whatsapp"
      details={[['telephone-fill', afficherTelephone(courant.telephone)], ['check2-all', `${envoyes} relancé${envoyes > 1 ? 's' : ''}`]]}
      onClose={onClose} libelleAnnuler="Arrêter l'envoi" taille=""
      piedGauche="Revenez sur cette page après chaque envoi pour passer au suivant.">
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(index / file.length * 100)}%`, background: 'linear-gradient(90deg,#10b981,#25d366)' }} />
      </div>
      {jamais && pourCourant?.erreur ? (
        <div className="rounded-2xl p-4 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
          <i className="bi bi-x-circle-fill me-1" />{pourCourant.erreur}.
          <div className="mt-2"><button type="button" onClick={suivant} className="btn btn-light btn-sm fw-semibold">Passer à l'élève suivant</button></div>
        </div>
      ) : !message ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><span className="spinner-border spinner-border-sm" />Préparation des identifiants…</div>
      ) : (
        <>
          <a href={waLink(courant.telephone, message)} target="_blank" rel="noopener noreferrer" onClick={envoyer}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-base font-extrabold"
            style={{ background: '#25d366', color: '#fff', textDecoration: 'none', boxShadow: '0 6px 18px rgba(37,211,102,.35)' }}>
            <i className="bi bi-whatsapp" />Relancer {courant.prenom} sur WhatsApp
          </a>
          <div className="text-center">
            <button type="button" onClick={suivant} className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-400 cursor-pointer underline">Passer {courant.prenom}</button>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aperçu du message</div>
            <div className="text-sm text-slate-700 bg-white rounded-xl p-3" style={{ whiteSpace: 'pre-wrap', border: '1px solid #eef2f7' }}>{message}</div>
          </div>
        </>
      )}
    </FenetreModerne>
  )
}
