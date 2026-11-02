import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { toast } from './Toast'
import Pagination from './Pagination'
import { FenetreModerne, Etape, Etiquette, Choix, ChampMontant } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import '../landing.css'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
const EMPTY = { date: today(), eleveId: '', montant: '', statut: 'PAYE', description: '' }

const TYPE_P = {
  TRANCHE_1: { bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6', label: '1re tranche (acompte)', court: '1re tranche' },
  TRANCHE_2: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', label: '2e tranche' },
  TRANCHE_3: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: '3e tranche' },
}

const STATUT_P = {
  PAYE:       { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Payé' },
  EN_ATTENTE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En attente' },
  ANNULE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Annulé' },
}

const MOYEN_P = {
  WAVE:         { label: 'Wave',         color: '#0284c7' },
  ORANGE_MONEY: { label: 'Orange Money', color: '#ea580c' },
}


export default function Paiements({ onEleveClick }) {
  const [list, setList]               = useState([])
  const [totalEncaisse, setTotalEncaisse] = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [eleves, setEleves]           = useState([])
  const [page, setPage]               = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const [data, total] = await Promise.all([
        api('GET', '/paiements'),
        api('GET', '/paiements/total-encaisse'),
      ])
      setList(data); setTotalEncaisse(total.totalEncaisse)
    } catch { toast('Erreur chargement paiements', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openModal = async (p = null) => {
    const ev = await api('GET', '/eleves')
    setEleves(ev)
    if (p) {
      setEditId(p.id)
      setForm({
        date: p.date, eleveId: p.eleve?.id || '', montant: p.montant,
        statut: p.statut, description: p.description || ''
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const save = async () => {
    const { date, montant, eleveId } = form
    if (!date || !montant || !eleveId) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = {
      date, montant: parseFloat(montant), eleveId: parseInt(eleveId),
      statut: form.statut, description: form.description || null
    }
    try {
      if (editId) { await api('PUT', `/paiements/${editId}`, data); toast('Paiement modifié') }
      else        { await api('POST', '/paiements', data);           toast('Paiement enregistré') }
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const changerStatut = async (p, statut) => {
    const msg = statut === 'PAYE'
      ? `Valider ce paiement de ${fmtMontant(p.montant)} ? Vérifiez d'abord la transaction ${p.transactionId || ''} dans votre application.`
      : 'Refuser ce paiement ?'
    if (!confirm(msg)) return
    try {
      await api('PATCH', `/paiements/${p.id}/statut`, { statut })
      toast(statut === 'PAYE' ? 'Paiement validé' : 'Paiement refusé')
      load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const enAttente = list.filter(p => p.statut === 'EN_ATTENTE').length

  // Par élève : acompte (1re tranche payée) et total payé, pour les colonnes Acompte / Reliquat / Total.
  const parEleve = {}
  for (const p of list) {
    if (!p.eleve || p.statut !== 'PAYE') continue
    const s = parEleve[p.eleve.id] ??= { acompte: 0, paye: 0 }
    s.paye += Number(p.montant)
    if (p.typePaiement === 'TRANCHE_1') s.acompte += Number(p.montant)
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce paiement ?')) return
    try { await api('DELETE', `/paiements/${id}`); toast('Paiement supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête de page ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Paiements</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {list.length} paiement{list.length !== 1 ? 's' : ''} enregistré{list.length !== 1 ? 's' : ''}
            {enAttente > 0 && <span className="font-semibold" style={{ color: '#a16207' }}> · {enAttente} à valider</span>}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}>
          <i className="bi bi-plus-lg" style={{ fontSize: '.9rem' }} />
          Paiement
        </button>
      </div>

      {/* ── Banner total encaissé ────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', boxShadow: '0 8px 24px rgba(74,222,128,.25)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />
        <div className="relative flex items-center gap-5 px-6 py-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(4px)' }}>
            <i className="bi bi-cash-coin" style={{ color: '#fff', fontSize: '1.5rem' }} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">Total encaissé</div>
            <div className="text-3xl font-extrabold text-white leading-none">
              {totalEncaisse != null ? fmtMontant(totalEncaisse) : '—'}
            </div>
            <div className="text-sm text-emerald-100 mt-1 font-medium">
              {list.length} paiement{list.length !== 1 ? 's' : ''} enregistré{list.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tableau ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        {/* En-tête tableau navy */}
        <div className="flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', borderBottom: '2px solid #15803d' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-receipt" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight" style={{ color: '#fff' }}>Paiements</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(187,247,208,.85)' }}>Historique des encaissements</div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {list.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-cards">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Référence', 'Date', 'Élève', 'Type', 'Acompte', 'Reliquat', 'Total', 'Statut', 'Actions'].map((h, i) => (
                  <th key={h}
                    className={`py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 8 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#4ade80] rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: '#f1f5f9' }}>
                        <i className="bi bi-receipt" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                      </div>
                      <div className="text-sm font-medium text-slate-400">Aucun paiement enregistré</div>
                    </div>
                  </td>
                </tr>
              ) : list.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((p, i) => {
                const tp = TYPE_P[p.typePaiement]   || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: p.typePaiement }
                const st = STATUT_P[p.statut]       || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: p.statut }
                const isEven = i % 2 === 0
                const se = (p.eleve && parEleve[p.eleve.id]) || { acompte: 0, paye: 0 }
                const total = p.eleve?.montantTotal != null ? Number(p.eleve.montantTotal) : null
                const reliquat = total != null ? total - se.paye : null
                return (
                  <tr key={p.id}
                    style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-3" data-label="Référence">
                      <span className="text-xs text-slate-400"
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                        {p.reference}
                      </span>
                      {p.moyenPaiement && MOYEN_P[p.moyenPaiement] && (
                        <div className="text-xs mt-0.5 font-semibold" style={{ color: MOYEN_P[p.moyenPaiement].color }}>
                          {MOYEN_P[p.moyenPaiement].label}
                          {p.transactionId && <span className="text-slate-500 font-normal"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}> · {p.transactionId}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3" data-label="Date">
                      <span className="text-sm font-semibold text-slate-700">{fmtDate(p.date)}</span>
                    </td>
                    <td className="py-3.5 px-3 cell-title">
                      {p.eleve
                        ? onEleveClick
                          ? <button
                              onClick={() => onEleveClick(p.eleve.id)}
                              className="text-sm font-semibold text-[#1e3a5f] underline-offset-2 hover:underline bg-transparent border-0 cursor-pointer p-0 text-left">
                              {p.eleve.nom} {p.eleve.prenom}
                            </button>
                          : <span className="text-sm text-slate-700">{p.eleve.nom} {p.eleve.prenom}</span>
                        : <span className="text-sm text-slate-700">—</span>}
                    </td>
                    <td className="py-3.5 px-3" data-label="Type">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: tp.bg, color: tp.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tp.dot }} />
                        {tp.court || tp.label}
                      </span>
                      {/* Montant de ce versement */}
                      <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">{fmtMontant(p.montant)}</div>
                    </td>
                    <td className="py-3.5 px-3" data-label="Acompte">
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#7c3aed' }}>{fmtMontant(se.acompte)}</span>
                    </td>
                    <td className="py-3.5 px-3" data-label="Reliquat">
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: reliquat > 0 ? '#b45309' : '#059669' }}>
                        {reliquat != null ? fmtMontant(Math.max(0, reliquat)) : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3" data-label="Total">
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#1e3a5f' }}>
                        {total != null ? fmtMontant(total) : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3" data-label="Statut">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 cell-actions">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.statut === 'EN_ATTENTE' && <>
                          <button
                            onClick={() => changerStatut(p, 'PAYE')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#dcfce7', color: '#15803d' }}
                            title="Valider">
                            <i className="bi bi-check-lg" style={{ fontSize: '.9rem' }} />
                          </button>
                          <button
                            onClick={() => changerStatut(p, 'ANNULE')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#fef3c7', color: '#b45309' }}
                            title="Refuser">
                            <i className="bi bi-x-lg" style={{ fontSize: '.8rem' }} />
                          </button>
                        </>}
                        <button
                          onClick={() => openModal(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#eff6ff', color: '#2563eb' }}
                          title="Modifier">
                          <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                        </button>
                        <button
                          onClick={() => del(p.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#fee2e2', color: '#b91c1c' }}
                          title="Supprimer">
                          <i className="bi bi-trash-fill" style={{ fontSize: '.75rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} total={list.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Fenêtre ajout / modification ─────────────────────── */}
      {showModal && (() => {
        const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
        const eleve = eleves.find(e => String(e.id) === String(form.eleveId))
        // Situation de l'élève : ses autres versements payés, plus celui-ci s'il est « Payé ».
        const dejaPaye = list.filter(p => p.eleve && String(p.eleve.id) === String(form.eleveId) && p.statut === 'PAYE' && p.id !== editId)
                             .reduce((s, p) => s + Number(p.montant), 0)
        const montant = parseFloat(form.montant) || 0
        const apres = dejaPaye + (form.statut === 'PAYE' ? montant : 0)
        const total = eleve?.montantTotal != null ? Number(eleve.montantTotal) : null
        const pct = total ? Math.min(100, Math.round(apres / total * 100)) : 0
        return (
          <FenetreModerne
            surTitre={editId ? 'Modifier le paiement' : 'Nouveau paiement'}
            titre={eleve ? `${eleve.prenom} ${eleve.nom}` : 'Nouveau paiement'}
            icone="receipt"
            details={[
              montant > 0 && ['cash-stack', fmtMontant(montant)],
              form.date && ['calendar-event', fmtDate(form.date)],
              STATUT_P[form.statut] && ['circle-fill', STATUT_P[form.statut].label],
            ]}
            onClose={() => setShowModal(false)} onSave={save}
            libelleSave={editId ? 'Enregistrer' : 'Enregistrer le paiement'}
            piedGauche={total != null ? <>Reliquat après ce versement : <strong className="text-slate-700">{fmtMontant(Math.max(0, total - apres))}</strong></> : null}>
            <Etape n={1} icon="person" titre="Élève">
              <Etiquette requis>Élève</Etiquette>
              <select className={champCls} value={form.eleveId} onChange={e => set('eleveId', e.target.value)}>
                <option value="">Choisir un élève…</option>
                {eleves.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
              {eleve && (
                <div className="mt-3 rounded-xl p-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                  <div className="grid grid-cols-3 text-center">
                    {[['Prix', total, '#fff'], ['Payé après', apres, '#86efac'], ['Reliquat', total != null ? Math.max(0, total - apres) : null, '#fcd34d']].map(([l, v, c]) => (
                      <div key={l}>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#93c5fd' }}>{l}</div>
                        <div className="text-sm sm:text-base font-extrabold" style={{ color: c }}>{v != null ? fmtMontant(v) : '—'}</div>
                      </div>
                    ))}
                  </div>
                  {total != null && (
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)', transition: 'width .3s' }} />
                    </div>
                  )}
                  <div className="text-[11px] mt-1.5" style={{ color: '#bfdbfe' }}>
                    {total == null ? "Prix de la formation non renseigné dans la fiche de l'élève"
                      : apres > total ? '⚠️ Ce versement dépasse le prix de la formation' : `${pct} % payé après ce versement`}
                  </div>
                </div>
              )}
            </Etape>

            <Etape n={2} icon="wallet2" titre="Versement">
              <div className="row g-3">
                <div className="col-md-6">
                  <Etiquette requis>Montant</Etiquette>
                  <ChampMontant min={1} placeholder="50000" value={form.montant} onChange={v => set('montant', v)} />
                  {eleve && total != null && total - dejaPaye > 0 && !form.montant && (
                    <button type="button" onClick={() => set('montant', String(total - dejaPaye))}
                      className="mt-1.5 text-[11px] font-semibold border-0 bg-transparent p-0 cursor-pointer" style={{ color: '#b45309' }}>
                      <i className="bi bi-lightning-charge-fill me-1" />Mettre le reliquat ({fmtMontant(total - dejaPaye)})
                    </button>
                  )}
                </div>
                <div className="col-md-6">
                  <Etiquette requis>Date</Etiquette>
                  <input type="date" className={champCls} value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div className="col-12">
                  <Etiquette>Statut</Etiquette>
                  <Choix cols={3} value={form.statut} onChange={v => set('statut', v)}
                    options={['PAYE', 'EN_ATTENTE', 'ANNULE'].map(v => ({ v, label: STATUT_P[v].label, color: STATUT_P[v].color, bg: STATUT_P[v].bg,
                      icon: { PAYE: 'check-circle-fill', EN_ATTENTE: 'hourglass-split', ANNULE: 'x-circle-fill' }[v] }))} />
                </div>
                <div className="col-12">
                  <Etiquette>Description</Etiquette>
                  <input className={champCls} value={form.description} placeholder="Facultatif" onChange={e => set('description', e.target.value)} />
                  <div className="text-[11px] text-slate-400 mt-1">La tranche (1re, 2e, 3e) est attribuée automatiquement selon la date des versements.</div>
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}
    </div>
  )
}
