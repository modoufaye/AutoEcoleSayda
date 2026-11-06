import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtMontant, waLink, BUREAUX } from '../utils'
import { afficherTelephone } from '../telephones'
import { msgBienvenue } from '../messages'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { EnteteListe } from './ListeModerne'

const FORMATION = d => d.typeFormation === 'PERFECTIONNEMENT'
  ? `Perfectionnement · boîte ${d.boiteVitesse === 'AUTOMATIQUE' ? 'automatique' : 'manuelle'}`
  : `Permis ${d.categoriePermis}`
const MOYEN = { WAVE: 'Wave', ORANGE_MONEY: 'Orange Money' }

/* Tableau de bord (admin, secrétariat) : inscriptions faites en ligne, à vérifier puis approuver.
   À l'approbation, l'élève est créé et le message de bienvenue WhatsApp est prêt à partir.
   Rien ne s'affiche tant qu'il n'y a pas de demande. */
export default function DemandesInscription({ onTraitee }) {
  const [demandes, setDemandes] = useState([])
  const [ecole, setEcole] = useState('')
  const [approbation, setApprobation] = useState(null)   // { demande, total, site }
  const [bienvenue, setBienvenue] = useState(null)        // { eleve, identifiants }
  const [busy, setBusy] = useState(false)
  const load = () => api('GET', '/demandes-inscription').then(setDemandes).catch(() => {})
  useEffect(() => { load(); api('GET', '/config').then(c => setEcole(c?.nom || '')).catch(() => {}) }, [])

  const approuver = async () => {
    const total = parseFloat(approbation.total)
    if (!(total > 0)) { toast('Indiquez le montant total de la formation', 'warning'); return }
    setBusy(true)
    try {
      const r = await api('POST', `/demandes-inscription/${approbation.demande.id}/approuver`, { montantTotal: total, site: approbation.site })
      setApprobation(null); setBienvenue(r); toast(`${r.eleve.prenom} ${r.eleve.nom} est inscrit(e)`)
      load(); onTraitee?.()
    } catch (e) { toast(e.message, 'danger') }
    finally { setBusy(false) }
  }

  const refuser = async (d) => {
    if (!(await confirmer({ titre: `Refuser la demande de ${d.prenom} ${d.nom} ?`, ton: 'danger', libelle: 'Refuser',
      message: "Aucun élève n'est créé. Pensez à prévenir la personne si un paiement a été fait." }))) return
    try { await api('POST', `/demandes-inscription/${d.id}/refuser`, {}); toast('Demande refusée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  if (demandes.length === 0 && !bienvenue) return null
  const message = bienvenue && msgBienvenue(bienvenue.eleve, ecole, bienvenue.identifiants)

  return (
    <>
      {demandes.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1.5px solid #fde68a' }}>
          <EnteteListe icone="person-plus-fill" titre="Demandes d'inscription en ligne"
            sousTitre="Vérifiez l'acompte (Wave / Orange Money), puis approuvez" nombre={demandes.length} />
          <div className="divide-y divide-slate-100">
            {demandes.map(d => (
              <div key={d.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#1e3a5f]">{d.prenom} {d.nom}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    <span><i className="bi bi-telephone me-1" />{afficherTelephone(d.telephone)}</span>
                    <span><i className="bi bi-mortarboard me-1" />{FORMATION(d)}</span>
                    {d.formule && <span><i className="bi bi-award me-1" />Formule {d.formule}{d.montantFormule ? ` · ${fmtMontant(d.montantFormule)}` : ''}</span>}
                    <span><i className="bi bi-calendar3 me-1" />{fmtDate(d.dateDemande)}</span>
                  </div>
                </div>
                <div className="text-sm md:text-right">
                  <div className="font-extrabold" style={{ color: '#15803d' }}>{fmtMontant(d.montantAcompte)}</div>
                  <div className="text-xs text-slate-500">{MOYEN[d.moyenPaiement]}{d.transactionId && <> · réf. <b className="text-slate-700">{d.transactionId}</b></>}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setApprobation({ demande: d, total: d.montantFormule ? String(d.montantFormule) : '', site: 'MAZALIK_JINAN' })}
                    className="flex items-center gap-1.5 text-sm font-bold px-4 border-0 cursor-pointer"
                    style={{ minHeight: 36, borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                    <i className="bi bi-check2-circle" />Approuver
                  </button>
                  <button type="button" onClick={() => refuser(d)} title="Refuser"
                    className="flex items-center justify-center border-0 cursor-pointer"
                    style={{ width: 36, height: 36, borderRadius: 999, background: '#fee2e2', color: '#b91c1c' }}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approbation : le total de la formation et le bureau de suivi */}
      {approbation && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div data-saisie className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 55%,#2a4f7c)', borderBottom: '4px solid #d4a017' }}>
                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>Approuver l'inscription</div>
                <div className="text-lg font-extrabold">{approbation.demande.prenom} {approbation.demande.nom}</div>
                <div className="text-xs" style={{ color: '#bfdbfe' }}>{FORMATION(approbation.demande)}{approbation.demande.formule ? ` · formule ${approbation.demande.formule}` : ''} · acompte {fmtMontant(approbation.demande.montantAcompte)} ({MOYEN[approbation.demande.moyenPaiement]})</div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Montant total de la formation</label>
                  <div className="relative">
                    <input type="number" min="0" className="form-control" style={{ paddingRight: '3.5rem' }} placeholder="125000" autoFocus
                      value={approbation.total} onChange={e => setApprobation(a => ({ ...a, total: e.target.value }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span>
                  </div>
                  {parseFloat(approbation.total) > 0 && (
                    <div className="text-xs text-slate-500 mt-1">Reliquat : <b>{fmtMontant(Math.max(0, parseFloat(approbation.total) - approbation.demande.montantAcompte))}</b></div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bureau de suivi</label>
                  <select className="form-control" value={approbation.site} onChange={e => setApprobation(a => ({ ...a, site: e.target.value }))}>
                    {BUREAUX.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div className="text-xs rounded-xl px-3 py-2" style={{ background: '#fffbeb', color: '#92400e' }}>
                  <i className="bi bi-info-circle me-1" />Vérifiez d'abord que l'acompte est bien arrivé sur le compte {MOYEN[approbation.demande.moyenPaiement]}{approbation.demande.transactionId ? ` (réf. ${approbation.demande.transactionId})` : ` : ${fmtMontant(approbation.demande.montantAcompte)} depuis le ${afficherTelephone(approbation.demande.telephone)}`}.
                </div>
              </div>
              <div className="px-5 pb-4 flex justify-end gap-2">
                <button className="btn btn-light fw-semibold" style={{ borderRadius: '.7rem' }} onClick={() => setApprobation(null)}>Annuler</button>
                <button className="btn fw-bold" disabled={busy} onClick={approuver}
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.7rem', border: 'none' }}>
                  <i className="bi bi-check2-circle me-1" />Inscrire l'élève
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Après l'approbation : message de bienvenue WhatsApp avec les identifiants */}
      {bienvenue && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg,#128c4a,#25d366)' }}>
                <div className="text-lg font-extrabold"><i className="bi bi-whatsapp me-2" />Message de bienvenue</div>
                <div className="text-xs">Pour {bienvenue.eleve.prenom} {bienvenue.eleve.nom} · {afficherTelephone(bienvenue.eleve.telephone)}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aperçu du message</div>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
              </div>
              <div className="px-5 pb-4 flex justify-end gap-2">
                <button className="btn btn-light fw-semibold" style={{ borderRadius: '.7rem' }} onClick={() => setBienvenue(null)}>Plus tard</button>
                <a href={waLink(bienvenue.eleve.telephone, message)} target="_blank" rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setBienvenue(null), 300)}
                  className="btn fw-bold text-white d-inline-flex align-items-center gap-2"
                  style={{ background: '#25d366', borderRadius: '.7rem', border: 'none' }}>
                  <i className="bi bi-whatsapp" />Envoyer sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
