import { useState } from 'react'
import { uploadFile, fetchBlob } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { afficherTelephone } from '../telephones'
import { toast } from './Toast'
import { confirmer } from './confirmer'

/* ── Versements de plusieurs élèves (2e, 3e tranche…) depuis un fichier Excel ──
   Même principe que l'import des élèves :
   1. Le fichier est analysé (rien n'est écrit) : chaque ligne reçoit un statut.
   2. « Enregistrer » renvoie le même fichier avec confirmer=true : les lignes valides sont créées.
   La tranche du fichier sert de contrôle : déjà enregistrée → ignorée (pas de doublon). */
const STATUTS = {
  OK:      { label: 'À enregistrer', bg: '#dcfce7', color: '#15803d' },
  IGNOREE: { label: 'Ignorée',       bg: '#f1f5f9', color: '#64748b' },
  ERREUR:  { label: 'Erreur',        bg: '#fee2e2', color: '#b91c1c' },
}
const MODES = { ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money' }
const tranche = n => n == null ? '—' : n === 1 ? '1re' : `${n}e`

export default function ImportPaiements({ onClose, onDone }) {
  const [fichier, setFichier]   = useState(null)
  const [analyse, setAnalyse]   = useState(null)
  const [resultat, setResultat] = useState(null)
  const [busy, setBusy]         = useState(false)

  const analyser = async (f) => {
    setFichier(f); setAnalyse(null); setResultat(null)
    if (!f) return
    setBusy(true)
    try { setAnalyse(await uploadFile('/paiements/import', f, { confirmer: 'false' })) }
    catch (e) { toast(e.message, 'danger'); setFichier(null) }
    finally { setBusy(false) }
  }

  const importer = async () => {
    const n = analyse.valides
    if (!(await confirmer({ titre: `Enregistrer ${n} versement${n > 1 ? 's' : ''} ?`, ton: 'succes', icone: 'cash-coin', libelle: 'Enregistrer',
      message: `${fmtMontant(analyse.totalValide)} au total. Chaque versement apparaîtra dans la caisse et sur la fiche de l'élève.` }))) return
    setBusy(true)
    try {
      const r = await uploadFile('/paiements/import', fichier, { confirmer: 'true' })
      setResultat(r); setAnalyse(null)
      toast(`${r.valides} versement${r.valides > 1 ? 's' : ''} enregistré${r.valides > 1 ? 's' : ''}`)
      onDone()
    } catch (e) { toast(e.message, 'danger') }
    finally { setBusy(false) }
  }

  const telechargerModele = async () => {
    try {
      const url = URL.createObjectURL(await fetchBlob('/paiements/import/modele'))
      const a = document.createElement('a')
      a.href = url; a.download = 'modele-versements.xlsx'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { toast(e.message || 'Modèle indisponible', 'danger') }
  }

  const vue = resultat || analyse

  return (
    <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <div className="px-6 pt-5 pb-4 relative" style={{ background: 'linear-gradient(135deg,#142a47 0%,#1e3a5f 50%,#2a4f7c 100%)' }}>
            <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={onClose} />
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>Versements de plusieurs élèves</div>
            <div className="text-lg font-extrabold text-white">Importer un fichier Excel</div>
          </div>

          <div className="modal-body px-6 py-4">
            {!resultat && (
              <>
                <p className="text-sm text-slate-500 mb-2">
                  Colonnes attendues : <strong>Prénom, Nom, Téléphone, Montant, Tranche, Mode de règlement</strong>,
                  et <strong>Date</strong> si le versement n'est pas d'aujourd'hui.
                </p>
                <p className="text-sm text-slate-500 mb-3">
                  <i className="bi bi-shield-check me-1" style={{ color: '#15803d' }} />
                  L'élève est retrouvé par son téléphone (ou son nom). Une tranche déjà enregistrée est ignorée :
                  importer deux fois le même fichier ne crée pas de doublon. Mode vide = Espèces.
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <label className="btn fw-bold text-white mb-0" style={{ borderRadius: '.75rem',
                    background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none', cursor: busy ? 'wait' : 'pointer' }}>
                    <i className="bi bi-file-earmark-excel me-1" />{fichier ? 'Choisir un autre fichier' : 'Choisir le fichier'}
                    <input type="file" hidden disabled={busy}
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={e => { analyser(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                  <button type="button" onClick={telechargerModele} className="btn btn-light fw-semibold" style={{ borderRadius: '.75rem' }}>
                    <i className="bi bi-download me-1" />Télécharger le modèle
                  </button>
                  {fichier && <span className="text-sm text-slate-500">{fichier.name}</span>}
                </div>
              </>
            )}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                <span className="spinner-border spinner-border-sm" />{analyse ? 'Enregistrement en cours…' : 'Analyse du fichier…'}
              </div>
            )}

            {vue && (
              <>
                {resultat ? (
                  <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#065f46' }}>
                    <i className="bi bi-check-circle-fill me-1" />
                    <strong>{resultat.valides} versement{resultat.valides > 1 ? 's' : ''} enregistré{resultat.valides > 1 ? 's' : ''}</strong>
                    {' '}({fmtMontant(resultat.totalValide)}).
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {[['OK', vue.valides], ['IGNOREE', vue.ignorees], ['ERREUR', vue.erreurs]].map(([k, n]) => (
                      <span key={k} className="text-sm font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: STATUTS[k].bg, color: STATUTS[k].color }}>
                        {n} {STATUTS[k].label.toLowerCase()}{n > 1 && k !== 'OK' ? 's' : ''}
                      </span>
                    ))}
                    {vue.valides > 0 && <span className="text-sm font-bold text-slate-600 ms-1">Total : {fmtMontant(vue.totalValide)}</span>}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl" style={{ border: '1.5px solid #e2e8f0' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-bold text-slate-400 uppercase">
                        {['Ligne', 'Statut', 'Élève', 'Tél.', 'Montant', 'Tranche', 'Règlement', 'Date'].map(h =>
                          <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vue.lignes.map(l => {
                        const st = STATUTS[l.statut]
                        return (
                          <tr key={l.numero}>
                            <td className="px-3 py-2 text-slate-400">{l.numero}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{ background: st.bg, color: st.color }}>{resultat && l.statut === 'OK' ? 'Enregistré' : st.label}</span>
                              {l.message && <div className="text-xs text-slate-500 mt-0.5" style={{ minWidth: 180 }}>{l.message}</div>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="font-semibold text-slate-700">{l.prenom} {l.nom}</div>
                              {/* Fiche retrouvée, quand son nom diffère de celui du fichier */}
                              {l.eleveTrouve && l.eleveTrouve.toLowerCase() !== `${l.prenom} ${l.nom}`.toLowerCase() &&
                                <div className="text-xs text-slate-400"><i className="bi bi-arrow-return-right me-1" />{l.eleveTrouve}</div>}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.telephone ? afficherTelephone(l.telephone) : <span className="text-slate-400">—</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.montant != null ? fmtMontant(l.montant) : '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{tranche(l.tranche)}</td>
                            <td className="px-3 py-2">{MODES[l.mode] || l.mode}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.date ? fmtDate(l.date) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2">
            <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }} onClick={onClose}>
              {resultat ? 'Fermer' : 'Annuler'}
            </button>
            {analyse && analyse.valides > 0 && (
              <button className="btn fw-bold text-white px-4" disabled={busy} onClick={importer}
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '.75rem', border: 'none' }}>
                <i className="bi bi-upload me-1" />Enregistrer {analyse.valides} versement{analyse.valides > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
