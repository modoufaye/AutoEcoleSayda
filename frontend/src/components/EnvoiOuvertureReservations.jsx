import { useEffect, useState } from 'react'
import { api } from '../api'
import { waLink } from '../utils'
import { msgOuvertureReservations } from '../messages'
import { afficherTelephone } from '../telephones'
import { useEcole } from '../ecole'
import { FenetreModerne } from './FenetreModerne'

/* Prévenir les élèves par WhatsApp qu'une semaine est ouverte aux réservations de conduite.
   WhatsApp ne laisse pas un site envoyer seul : file d'élèves, un clic par élève ouvre WhatsApp
   avec le message déjà rempli. Les élèves déjà prévenus pour cette semaine (sur cet appareil) et
   ceux qui ont déjà une leçon cette semaine-là sont décochés au départ. */

const cle = lundi => `prevenus-reservations-${lundi}`
function lirePrevenus(lundi) {
  try { return new Set(JSON.parse(localStorage.getItem(cle(lundi)) || '[]')) } catch { return new Set() }
}
function noterPrevenu(lundi, id) {
  try { const s = lirePrevenus(lundi); s.add(id); localStorage.setItem(cle(lundi), JSON.stringify([...s])) } catch { /* stockage indisponible */ }
}

export default function EnvoiOuvertureReservations({ lundi, periode, onClose }) {
  const ecole = useEcole()
  const [eleves, setEleves] = useState(null)
  const [prevenus, setPrevenus] = useState(() => lirePrevenus(lundi))
  const [coches, setCoches] = useState(new Set())
  const [file, setFile] = useState(null)
  const [index, setIndex] = useState(0)
  const [envoyes, setEnvoyes] = useState(0)

  useEffect(() => {
    api('GET', `/semaines-reservation/${lundi}/eleves`).then(l => {
      setEleves(l)
      const deja = lirePrevenus(lundi)
      setCoches(new Set(l.filter(e => waLink(e.telephone) && !e.dejaReserve && !deja.has(e.id)).map(e => e.id)))
    }).catch(() => setEleves([]))
  }, [lundi])

  const nomEcole = ecole?.nom
  if (!eleves) return (
    <FenetreModerne surTitre="Réservations ouvertes" titre="Prévenir les élèves" icone="whatsapp" onClose={onClose} taille="">
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><span className="spinner-border spinner-border-sm" />Recherche des élèves…</div>
    </FenetreModerne>
  )

  const joignables = eleves.filter(e => waLink(e.telephone))
  const injoignables = eleves.filter(e => !waLink(e.telephone))
  const basculer = id => setCoches(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const tousCoches = joignables.length > 0 && joignables.every(e => coches.has(e.id))

  /* ── Étape 1 : choix ── */
  if (!file) {
    return (
      <FenetreModerne surTitre="Réservations ouvertes" titre="Prévenir les élèves" icone="whatsapp"
        details={[['calendar-week', `Semaine ${periode}`], ['people-fill', `${eleves.length} élève${eleves.length > 1 ? 's' : ''} peuvent réserver`]]}
        onClose={onClose} libelleSave={`Commencer l'envoi (${coches.size})`}
        onSave={() => { if (coches.size) setFile(joignables.filter(e => coches.has(e.id))) }}
        piedGauche="Un clic par élève : WhatsApp s'ouvre avec le message déjà rempli.">
        <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #eef2f7' }}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-sm font-extrabold text-slate-700">Élèves qui peuvent réserver (perfectionnement ou admis au code)</span>
            {joignables.length > 0 && (
              <button type="button" className="bg-transparent border-0 p-0 text-xs font-bold cursor-pointer flex-shrink-0" style={{ color: '#2563eb' }}
                onClick={() => setCoches(tousCoches ? new Set() : new Set(joignables.map(e => e.id)))}>
                {tousCoches ? 'Tout décocher' : 'Tout cocher'}
              </button>
            )}
          </div>
          {joignables.length === 0 && <div className="text-sm text-slate-500">Aucun élève ne peut encore réserver : il faut être en perfectionnement ou admis au code, avec un moniteur.</div>}
          <div className="divide-y divide-slate-100">
            {joignables.map(e => (
              <label key={e.id} className="flex items-center gap-3 py-2 cursor-pointer mb-0" style={{ display: 'flex' }}>
                <input type="checkbox" className="form-check-input m-0" checked={coches.has(e.id)} onChange={() => basculer(e.id)} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-700 truncate">{e.prenom} {e.nom}</span>
                  <span className="flex flex-wrap gap-1 mt-0.5">
                    <span className="text-[11px] text-slate-400">{e.moniteur}</span>
                    {e.dejaReserve && <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: '#dcfce7', color: '#15803d' }}>Déjà une leçon</span>}
                    {prevenus.has(e.id) && <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Déjà prévenu</span>}
                    {!e.connecte && <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>Jamais connecté</span>}
                  </span>
                </span>
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
      </FenetreModerne>
    )
  }

  /* ── Fin ── */
  if (index >= file.length) {
    return (
      <FenetreModerne surTitre="Réservations ouvertes" titre="Envoi terminé" icone="check2-all" onClose={onClose} libelleAnnuler="Fermer" taille="">
        <div className="bg-white rounded-2xl p-5 text-center" style={{ border: '1px solid #eef2f7' }}>
          <i className="bi bi-whatsapp" style={{ fontSize: '2.2rem', color: '#25d366' }} />
          <div className="text-lg font-extrabold text-slate-800 mt-2">{envoyes} élève{envoyes > 1 ? 's' : ''} prévenu{envoyes > 1 ? 's' : ''}</div>
          <div className="text-sm text-slate-500 mt-1">Ils peuvent réserver leur heure de conduite pour la semaine {periode}.</div>
        </div>
      </FenetreModerne>
    )
  }

  /* ── Étape 2 : un élève à la fois ── */
  const courant = file[index]
  const message = msgOuvertureReservations(courant, periode, nomEcole)
  const suivant = () => setIndex(i => i + 1)
  const envoyer = () => {
    noterPrevenu(lundi, courant.id)
    setPrevenus(lirePrevenus(lundi))
    setEnvoyes(n => n + 1)
    setTimeout(suivant, 300)
  }
  return (
    <FenetreModerne surTitre={`Élève ${index + 1} sur ${file.length}`} titre={`${courant.prenom} ${courant.nom}`} icone="whatsapp"
      details={[['telephone-fill', afficherTelephone(courant.telephone)], ['check2-all', `${envoyes} prévenu${envoyes > 1 ? 's' : ''}`]]}
      onClose={onClose} libelleAnnuler="Arrêter l'envoi" taille=""
      piedGauche="Revenez sur cette page après chaque envoi pour passer au suivant.">
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(index / file.length * 100)}%`, background: 'linear-gradient(90deg,#10b981,#25d366)' }} />
      </div>
      <a href={waLink(courant.telephone, message)} target="_blank" rel="noopener noreferrer" onClick={envoyer}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-base font-extrabold"
        style={{ background: '#25d366', color: '#fff', textDecoration: 'none', boxShadow: '0 6px 18px rgba(37,211,102,.35)' }}>
        <i className="bi bi-whatsapp" />Prévenir {courant.prenom} sur WhatsApp
      </a>
      <div className="text-center">
        <button type="button" onClick={suivant} className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-400 cursor-pointer underline">
          Passer {courant.prenom}
        </button>
      </div>
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aperçu du message</div>
        <div className="text-sm text-slate-700 bg-white rounded-xl p-3" style={{ whiteSpace: 'pre-wrap', border: '1px solid #eef2f7' }}>{message}</div>
      </div>
    </FenetreModerne>
  )
}
