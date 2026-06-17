import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { toast } from './Toast'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
const EMPTY = { date: today(), eleveId: '', montant: '', typePaiement: '', statut: 'PAYE', description: '' }

const TYPE_P = {
  TARIF_INSCRIPTION: { bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6', label: 'Tarif inscription' },
  TARIF_CODE:        { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', label: 'Tarif code' },
  TARIF_CONDUITE:    { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Tarif conduite' },
}

const STATUT_P = {
  PAYE:       { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Payé' },
  EN_ATTENTE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En attente' },
  ANNULE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Annulé' },
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

export default function Paiements() {
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
        typePaiement: p.typePaiement, statut: p.statut, description: p.description || ''
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const save = async () => {
    const { date, montant, eleveId, typePaiement } = form
    if (!date || !montant || !eleveId || !typePaiement) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = {
      date, montant: parseFloat(montant), eleveId: parseInt(eleveId),
      typePaiement, statut: form.statut, description: form.description || null
    }
    try {
      if (editId) { await api('PUT', `/paiements/${editId}`, data); toast('Paiement modifié') }
      else        { await api('POST', '/paiements', data);           toast('Paiement enregistré') }
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
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
          <p className="text-sm text-slate-400 mt-0.5">{list.length} paiement{list.length !== 1 ? 's' : ''} enregistré{list.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}>
          <i className="bi bi-plus-lg" style={{ fontSize: '.9rem' }} />
          Nouveau paiement
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
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Référence', 'Date', 'Élève', 'Montant', 'Type', 'Statut', 'Actions'].map((h, i) => (
                  <th key={h}
                    className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 7 ? 'text-right' : i === 0 ? 'text-center w-10' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#4ade80] rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
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
                return (
                  <tr key={p.id}
                    style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-400"
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                        {p.reference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-semibold text-slate-700">{fmtDate(p.date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm text-slate-700">
                        {p.eleve ? `${p.eleve.nom} ${p.eleve.prenom}` : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-bold" style={{ color: '#059669' }}>
                        {fmtMontant(p.montant)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: tp.bg, color: tp.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tp.dot }} />
                        {tp.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
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

      {/* ── Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem' }}>
              <div className="modal-header border-0 px-6 pt-5 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f' }}>
                    <i className="bi bi-receipt" />
                  </div>
                  <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>
                    {editId ? 'Modifier le paiement' : 'Nouveau paiement'}
                  </h5>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body px-6 py-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className={labelCls}>Date <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="date" className={inputCls} value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Statut</label>
                    <select className={inputCls} value={form.statut}
                      onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                      <option value="PAYE">Payé</option>
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="ANNULE">Annulé</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Élève <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.eleveId}
                      onChange={e => setForm(f => ({ ...f, eleveId: e.target.value }))}>
                      <option value="">Choisir un élève…</option>
                      {eleves.map(e => (
                        <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Montant (FCFA) <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="number" className={inputCls} value={form.montant} min="1"
                      placeholder="Ex: 50000"
                      onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Type <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.typePaiement}
                      onChange={e => setForm(f => ({ ...f, typePaiement: e.target.value }))}>
                      <option value="">Choisir…</option>
                      <option value="TARIF_INSCRIPTION">Tarif inscription</option>
                      <option value="TARIF_CODE">Tarif code</option>
                      <option value="TARIF_CONDUITE">Tarif conduite</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Description</label>
                    <input className={inputCls} value={form.description}
                      placeholder="Ex: Paiement mensuel…"
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2">
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                  onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn fw-bold text-white px-5" style={{
                  background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none' }}
                  onClick={save}>
                  <i className="bi bi-check-lg me-1" />Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
