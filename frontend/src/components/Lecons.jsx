import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtTime } from '../utils'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
const EMPTY = { date: today(), heureDebut: '08:00', heureFin: '10:00', type: '', eleveId: '', moniteurId: '', vehiculeId: '', observations: '' }

const TYPE_STYLE = {
  CODE:     { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb', label: 'Code' },
  CONDUITE: { bg: '#f0fdf4', color: '#15803d', dot: '#16a34a', label: 'Conduite' },
}

const STATUT_STYLE = {
  PLANIFIEE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Planifiée' },
  TERMINEE:  { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Terminée' },
  ANNULEE:   { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Annulée' },
  EN_COURS:  { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb', label: 'En cours' },
}

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all'
const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5'

export default function Lecons({ onBack }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'

  const [list, setList]           = useState([])
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [eleves, setEleves]       = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [vehicules, setVehicules] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const data = isEleve
        ? await api('GET', '/eleve/mes-lecons')
        : await api('GET', '/lecons')
      setList(data)
    } catch { toast('Erreur chargement leçons', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openModal = async (l = null) => {
    const [ev, mo, ve] = await Promise.all([
      api('GET', '/eleves'), api('GET', '/moniteurs/actifs'), api('GET', '/vehicules/disponibles')
    ])
    setEleves(ev); setMoniteurs(mo); setVehicules(ve)
    if (l) {
      setEditId(l.id)
      setForm({
        date: l.date,
        heureDebut: l.heureDebut.substring(0, 5),
        heureFin: l.heureFin.substring(0, 5),
        type: l.type,
        eleveId: l.eleve?.id || '',
        moniteurId: l.moniteur?.id || '',
        vehiculeId: l.vehicule?.id || '',
        observations: l.observations || '',
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const save = async () => {
    const { date, heureDebut, heureFin, eleveId, moniteurId, type, vehiculeId } = form
    if (!date || !heureDebut || !heureFin || !eleveId || !moniteurId || !type) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    if (type === 'CONDUITE' && !vehiculeId) {
      toast('Un véhicule est obligatoire pour une leçon de conduite', 'warning'); return
    }
    const data = {
      date, heureDebut, heureFin,
      eleveId: parseInt(eleveId),
      moniteurId: parseInt(moniteurId),
      vehiculeId: vehiculeId ? parseInt(vehiculeId) : null,
      type,
      observations: form.observations || null,
    }
    try {
      if (editId) { await api('PUT', `/lecons/${editId}`, data); toast('Leçon modifiée') }
      else { await api('POST', '/lecons', data); toast('Leçon planifiée') }
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const terminer = async (id) => {
    if (!confirm('Marquer cette leçon comme terminée ?')) return
    try { await api('PATCH', `/lecons/${id}/terminer`); toast('Leçon terminée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const annuler = async (id) => {
    if (!confirm('Annuler cette leçon ?')) return
    try { await api('PATCH', `/lecons/${id}/annuler`); toast('Leçon annulée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!confirm('Supprimer cette leçon ?')) return
    try { await api('DELETE', `/lecons/${id}`); toast('Leçon supprimée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const colSpan = isEleve ? 6 : 8

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          {isEleve ? 'Mon Espace' : 'Tableau de bord'}
        </button>
      )}

      {/* ── En-tête page (admin uniquement) ─────────────────── */}
      {!isEleve && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Cours Conduite</h2>
            <p className="text-sm text-slate-400 mt-0.5">{list.length} leçon{list.length !== 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}
          >
            <i className="bi bi-plus-lg" />
            Planifier une leçon
          </button>
        </div>
      )}

      {/* ── Tableau ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        {/* En-tête tableau */}
        <div className="flex items-center justify-between px-6 py-3"
          style={isEleve
            ? { background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', borderBottom: '2px solid #4d1f04' }
            : { background: 'linear-gradient(135deg, #db2777, #f472b6)', borderBottom: '2px solid #be185d' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'rgba(255,255,255,.18)' }}>
              <i className={`bi bi-${isEleve ? 'car-front-fill' : 'calendar2-check'}`}
                style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">
                {isEleve ? 'Cours Conduite' : 'Cours Conduite'}
              </div>
              <div className="text-xs mt-0.5"
                style={{ color: isEleve ? 'rgba(253,230,138,.85)' : 'rgba(251,207,232,.85)' }}>
                {isEleve ? 'Formation pratique à la conduite' : 'Planning des leçons'}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {list.length}
          </span>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Date & Horaire', ...(!isEleve ? ['Élève'] : []), 'Moniteur', 'Véhicule', 'Type', 'Statut', ...(!isEleve ? ['Actions'] : [])].map((h, i) => (
                  <th key={h + i}
                    className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : h === 'Actions' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#f472b6] rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: '#f1f5f9' }}>
                        <i className="bi bi-calendar2-check" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                      </div>
                      <div className="text-sm font-medium text-slate-400">Aucune leçon planifiée</div>
                    </div>
                  </td>
                </tr>
              ) : list.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((l, i) => {
                const editable   = l.statut === 'PLANIFIEE'
                const terminable = l.statut === 'PLANIFIEE' || l.statut === 'EN_COURS'
                const typeSt     = TYPE_STYLE[l.type]   || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: l.type }
                const statutSt   = STATUT_STYLE[l.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: l.statut }
                const isEven     = i % 2 === 0
                return (
                  <tr key={l.id} style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-semibold text-slate-700">{fmtDate(l.date)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {l.heureDebut ? `${l.heureDebut.slice(0,5)} – ${l.heureFin?.slice(0,5)}` : '—'}
                      </div>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4 text-sm text-slate-600 font-medium">
                        {l.eleve ? `${l.eleve.nom} ${l.eleve.prenom}` : '—'}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-sm text-slate-600">
                      {l.moniteur ? `${l.moniteur.nom} ${l.moniteur.prenom}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {l.vehicule
                        ? <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{l.vehicule.immatriculation}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: typeSt.bg, color: typeSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeSt.dot }} />
                        {typeSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: statutSt.bg, color: statutSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statutSt.dot }} />
                        {statutSt.label}
                      </span>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {terminable && (
                            <button onClick={() => terminer(l.id)} title="Terminer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#dcfce7', color: '#15803d' }}>
                              <i className="bi bi-check-lg" style={{ fontSize: '.85rem' }} />
                            </button>
                          )}
                          {editable && (
                            <button onClick={() => annuler(l.id)} title="Annuler"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#fef9c3', color: '#a16207' }}>
                              <i className="bi bi-x-lg" style={{ fontSize: '.85rem' }} />
                            </button>
                          )}
                          {editable && (
                            <button onClick={() => openModal(l)} title="Modifier"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#f1f5f9', color: '#475569' }}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: '.78rem' }} />
                            </button>
                          )}
                          <button onClick={() => del(l.id)} title="Supprimer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                            style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '.78rem' }} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} total={list.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Modal planifier / modifier ───────────────────────── */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem' }}>
              <div className="modal-header border-0 px-6 pt-5 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f' }}>
                    <i className="bi bi-calendar2-plus" />
                  </div>
                  <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>
                    {editId ? 'Modifier la leçon' : 'Planifier une leçon'}
                  </h5>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body px-6 py-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className={labelCls}>Date <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="date" className={inputCls} value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <label className={labelCls}>Heure début <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="time" className={inputCls} value={form.heureDebut}
                      onChange={e => setForm(f => ({ ...f, heureDebut: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <label className={labelCls}>Heure fin <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="time" className={inputCls} value={form.heureFin}
                      onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Type <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="">Choisir…</option>
                      <option value="CODE">Code</option>
                      <option value="CONDUITE">Conduite</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Élève <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.eleveId}
                      onChange={e => setForm(f => ({ ...f, eleveId: e.target.value }))}>
                      <option value="">Choisir un élève…</option>
                      {eleves.map(e => (
                        <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.categoriePermis})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Moniteur <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.moniteurId}
                      onChange={e => setForm(f => ({ ...f, moniteurId: e.target.value }))}>
                      <option value="">Choisir un moniteur…</option>
                      {moniteurs.map(m => (
                        <option key={m.id} value={m.id}>{m.nom} {m.prenom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6" style={{ opacity: form.type === 'CODE' ? 0.5 : 1 }}>
                    <label className={labelCls}>
                      Véhicule {form.type === 'CONDUITE' && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select className={inputCls} value={form.vehiculeId}
                      onChange={e => setForm(f => ({ ...f, vehiculeId: e.target.value }))}>
                      <option value="">Aucun / Non applicable</option>
                      {vehicules.map(v => (
                        <option key={v.id} value={v.id}>{v.immatriculation} – {v.marque} {v.modele} ({v.categorie})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Observations</label>
                    <textarea className={inputCls} rows={2} value={form.observations}
                      onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
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
