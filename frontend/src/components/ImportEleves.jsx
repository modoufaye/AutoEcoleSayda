import { useState } from 'react'
import { uploadFile } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { toast } from './Toast'
import { confirmer } from './confirmer'

/* ── Import des nouveaux inscrits depuis un fichier Excel ──
   1. Le fichier est analysé (rien n'est écrit) : chaque ligne reçoit un statut.
   2. « Importer » renvoie le même fichier avec confirmer=true : les lignes valides sont créées
      (fiche, acompte en 1re tranche, compte de connexion si le téléphone est connu). */
const STATUTS = {
  OK:      { label: 'À importer', bg: '#dcfce7', color: '#15803d' },
  IGNOREE: { label: 'Ignorée',    bg: '#f1f5f9', color: '#64748b' },
  ERREUR:  { label: 'Erreur',     bg: '#fee2e2', color: '#b91c1c' },
}
const MODES = { ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money' }

export default function ImportEleves({ onClose, onDone }) {
  const [fichier, setFichier]   = useState(null)
  const [analyse, setAnalyse]   = useState(null)
  const [resultat, setResultat] = useState(null)
  const [busy, setBusy]         = useState(false)

  const analyser = async (f) => {
    setFichier(f); setAnalyse(null); setResultat(null)
    if (!f) return
    setBusy(true)
    try { setAnalyse(await uploadFile('/eleves/import', f, { confirmer: 'false' })) }
    catch (e) { toast(e.message, 'danger'); setFichier(null) }
    finally { setBusy(false) }
  }

  const importer = async () => {
    if (!(await confirmer({ titre: `Importer ${analyse.valides} élève${analyse.valides > 1 ? 's' : ''} ?`, ton: 'succes', icone: 'file-earmark-spreadsheet-fill', libelle: 'Importer',
      message: 'Chaque élève sera créé avec son acompte (1re tranche) et son compte de connexion.' }))) return
    setBusy(true)
    try {
      const r = await uploadFile('/eleves/import', fichier, { confirmer: 'true' })
      setResultat(r); setAnalyse(null)
      toast(`${r.valides} élève${r.valides > 1 ? 's' : ''} importé${r.valides > 1 ? 's' : ''}`)
      onDone()
    } catch (e) { toast(e.message, 'danger') }
    finally { setBusy(false) }
  }

  const vue = resultat || analyse

  return (
    <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <div className="px-6 pt-5 pb-4 relative" style={{ background: 'linear-gradient(135deg,#142a47 0%,#1e3a5f 50%,#2a4f7c 100%)' }}>
            <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={onClose} />
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>Nouveaux inscrits</div>
            <div className="text-lg font-extrabold text-white">Importer un fichier Excel</div>
          </div>

          <div className="modal-body px-6 py-4">
            {!resultat && (
              <>
                <p className="text-sm text-slate-500 mb-2">
                  Colonnes attendues : <strong>Prénoms, Noms, Adresse, Tel, Type de permis, Date d'inscription,
                  Acompte, Total, Mode de règlement, Lieu d'inscription</strong>. Le reliquat est calculé tout seul.
                </p>
                <p className="text-sm text-slate-500 mb-2">
                  <i className="bi bi-speedometer2 me-1" style={{ color: '#d4a017' }} />
                  Perfectionnement : dans <strong>Type de permis</strong>, écrivez <strong>CP M</strong> (boîte manuelle)
                  ou <strong>CP A</strong> (boîte automatique).
                </p>
                <label className="btn fw-bold text-white mb-3" style={{ borderRadius: '.75rem',
                  background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none', cursor: busy ? 'wait' : 'pointer' }}>
                  <i className="bi bi-file-earmark-excel me-1" />{fichier ? 'Choisir un autre fichier' : 'Choisir le fichier'}
                  <input type="file" hidden disabled={busy}
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={e => { analyser(e.target.files?.[0]); e.target.value = '' }} />
                </label>
                {fichier && <span className="ms-2 text-sm text-slate-500">{fichier.name}</span>}
              </>
            )}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
                <span className="spinner-border spinner-border-sm" />{analyse ? 'Import en cours…' : 'Analyse du fichier…'}
              </div>
            )}

            {vue && (
              <>
                {resultat ? (
                  <div className="rounded-xl p-3 mb-3 text-sm" style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#065f46' }}>
                    <i className="bi bi-check-circle-fill me-1" />
                    <strong>{resultat.valides} élève{resultat.valides > 1 ? 's' : ''} importé{resultat.valides > 1 ? 's' : ''}</strong>,
                    avec leur acompte et leur compte. Pour leur envoyer leurs identifiants, ouvrez chaque fiche
                    et cliquez sur « Message de bienvenue ».
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[['OK', vue.valides], ['IGNOREE', vue.ignorees], ['ERREUR', vue.erreurs]].map(([k, n]) => (
                      <span key={k} className="text-sm font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: STATUTS[k].bg, color: STATUTS[k].color }}>
                        {n} {STATUTS[k].label.toLowerCase()}{n > 1 && k !== 'OK' ? 's' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl" style={{ border: '1.5px solid #e2e8f0' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-bold text-slate-400 uppercase">
                        {['Ligne', 'Statut', 'Élève', 'Tél.', 'Permis', 'Inscription', 'Acompte', 'Total', 'Règlement', 'Lieu'].map(h =>
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
                                style={{ background: st.bg, color: st.color }}>{resultat && l.statut === 'OK' ? 'Importé' : st.label}</span>
                              {l.message && <div className="text-xs text-slate-500 mt-0.5" style={{ minWidth: 180 }}>{l.message}</div>}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{l.nom} {l.prenom}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.telephone || <span className="text-amber-600">—</span>}</td>
                            <td className="px-3 py-2">{l.permis}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.dateInscription ? fmtDate(l.dateInscription) : '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.acompte != null ? fmtMontant(l.acompte) : '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.total != null ? fmtMontant(l.total) : '—'}</td>
                            <td className="px-3 py-2">{MODES[l.mode] || l.mode}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{l.lieu}</td>
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
                <i className="bi bi-upload me-1" />Importer {analyse.valides} élève{analyse.valides > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
