import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const EMPTY = {
  immatriculation: '', marque: '', modele: '',
  annee: new Date().getFullYear(), categorie: '',
  kilometrage: 0, statut: 'DISPONIBLE', observations: '',
  prochainEntretien: ''
}

function entretienStyle(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr)
  const diff = Math.floor((d - today) / 86400000)
  if (diff < 0)  return { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'En retard' }
  if (diff <= 30) return { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Bientôt' }
  return { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'OK' }
}

const STATUT_V = {
  DISPONIBLE:     { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Disponible' },
  EN_COURS:       { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', label: 'En cours' },
  EN_MAINTENANCE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En maintenance' },
  HORS_SERVICE:   { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Hors service' },
}

const CAT_STYLE = {
  bg: '#eff6ff', color: '#1d4ed8',
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

export default function Vehicules() {
  const [list, setList]               = useState([])
  const [filtered, setFiltered]       = useState([])
  const [statutFilter, setStatutFilter] = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('GET', '/vehicules')
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement véhicules', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = list
    if (statutFilter) result = result.filter(v => v.statut === statutFilter)
    if (catFilter)    result = result.filter(v => v.categorie === catFilter)
    setFiltered(result)
    setPage(1)
  }, [statutFilter, catFilter, list])

  const openModal = (v = null) => {
    if (v) {
      setEditId(v.id)
      setForm({
        immatriculation: v.immatriculation, marque: v.marque, modele: v.modele,
        annee: v.annee, categorie: v.categorie, kilometrage: v.kilometrage,
        statut: v.statut, observations: v.observations || '',
        prochainEntretien: v.prochainEntretien || ''
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const save = async () => {
    const { immatriculation, marque, modele, annee, categorie } = form
    if (!immatriculation || !marque || !modele || !annee || !categorie) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = { ...form, observations: form.observations || null }
    try {
      if (editId) { await api('PUT', `/vehicules/${editId}`, data); toast('Véhicule modifié') }
      else        { await api('POST', '/vehicules', data);          toast('Véhicule créé') }
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce véhicule ?')) return
    try { await api('DELETE', `/vehicules/${id}`); toast('Véhicule supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête de page ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Véhicules</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gérez votre flotte de véhicules et leur entretien</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}>
          <i className="bi bi-plus-lg" style={{ fontSize: '.9rem' }} />
          Nouveau véhicule
        </button>
      </div>

      {/* ── Barre de filtres ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-wrap gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <i className="bi bi-funnel text-slate-400" style={{ fontSize: '.85rem' }} />
          <select
            className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] cursor-pointer"
            value={statutFilter}
            onChange={e => setStatutFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="EN_COURS">En cours</option>
            <option value="EN_MAINTENANCE">En maintenance</option>
            <option value="HORS_SERVICE">Hors service</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <i className="bi bi-tag text-slate-400" style={{ fontSize: '.85rem' }} />
          <select
            className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] cursor-pointer"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}>
            <option value="">Toutes catégories</option>
            {[{v:'POIDS_LEGER',l:'Poids léger'},{v:'POIDS_LOURD',l:'Poids lourd'},{v:'TRANSPORT',l:'Transport'},{v:'C1',l:'C1'},{v:'INTERNATIONAL',l:'International'}].map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </div>
        {(statutFilter || catFilter) && (
          <button
            onClick={() => { setStatutFilter(''); setCatFilter('') }}
            className="px-3 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer transition-all"
            style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <i className="bi bi-x-lg me-1" style={{ fontSize: '.7rem' }} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Tableau ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        {/* En-tête tableau gold */}
        <div className="flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', borderBottom: '2px solid #0f766e' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-car-front-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight" style={{ color: '#fff' }}>Véhicules</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(209,250,229,.85)' }}>Flotte de l'auto-école</div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {filtered.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Immatriculation', 'Marque / Modèle', 'Année', 'Catégorie', 'Kilométrage', 'Prochain entretien', 'Statut', 'Actions'].map((h, i) => (
                  <th key={h}
                    className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 8 ? 'text-right' : i === 0 ? 'text-center w-10' : 'text-left'}`}>
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
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#2dd4bf] rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: '#f1f5f9' }}>
                        <i className="bi bi-car-front" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                      </div>
                      <div className="text-sm font-medium text-slate-400">Aucun véhicule enregistré</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((v, i) => {
                const st = STATUT_V[v.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: v.statut }
                const ent = entretienStyle(v.prochainEntretien)
                const isEven = i % 2 === 0
                return (
                  <tr key={v.id}
                    style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-sm text-[#1e3a5f]"
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                        {v.immatriculation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-semibold text-slate-800">{v.marque}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{v.modele}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm text-slate-600">{v.annee}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: CAT_STYLE.bg, color: CAT_STYLE.color }}>
                        {v.categorie}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm text-slate-600">
                        {v.kilometrage.toLocaleString('fr-SN')} km
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.prochainEntretien ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-slate-700 font-medium">
                            {new Date(v.prochainEntretien).toLocaleDateString('fr-SN', { day:'2-digit', month:'short', year:'numeric' })}
                          </span>
                          {ent && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                              style={{ background: ent.bg, color: ent.color }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ent.dot }} />
                              {ent.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Non défini</span>
                      )}
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
                          onClick={() => openModal(v)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#eff6ff', color: '#2563eb' }}
                          title="Modifier">
                          <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                        </button>
                        <button
                          onClick={() => del(v.id)}
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
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
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
                    <i className="bi bi-car-front-fill" />
                  </div>
                  <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>
                    {editId ? 'Modifier le véhicule' : 'Nouveau véhicule'}
                  </h5>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body px-6 py-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className={labelCls}>Immatriculation <span className="text-red-500 ml-0.5">*</span></label>
                    <input className={inputCls} value={form.immatriculation} placeholder="DK-XXXX-AB"
                      onChange={e => setForm(f => ({ ...f, immatriculation: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Marque <span className="text-red-500 ml-0.5">*</span></label>
                    <input className={inputCls} value={form.marque} placeholder="Toyota"
                      onChange={e => setForm(f => ({ ...f, marque: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Modèle <span className="text-red-500 ml-0.5">*</span></label>
                    <input className={inputCls} value={form.modele} placeholder="Corolla"
                      onChange={e => setForm(f => ({ ...f, modele: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Année <span className="text-red-500 ml-0.5">*</span></label>
                    <input type="number" className={inputCls} value={form.annee} min="1990" max="2030"
                      onChange={e => setForm(f => ({ ...f, annee: parseInt(e.target.value) }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Catégorie <span className="text-red-500 ml-0.5">*</span></label>
                    <select className={inputCls} value={form.categorie}
                      onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                      <option value="">Choisir…</option>
                      {[{v:'POIDS_LEGER',l:'Poids léger'},{v:'POIDS_LOURD',l:'Poids lourd'},{v:'TRANSPORT',l:'Transport'},{v:'C1',l:'C1'},{v:'INTERNATIONAL',l:'International'}].map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Kilométrage</label>
                    <input type="number" className={inputCls} value={form.kilometrage} min="0"
                      onChange={e => setForm(f => ({ ...f, kilometrage: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Statut</label>
                    <select className={inputCls} value={form.statut}
                      onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="EN_MAINTENANCE">En maintenance</option>
                      <option value="HORS_SERVICE">Hors service</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Prochain entretien</label>
                    <input type="date" className={inputCls} value={form.prochainEntretien}
                      onChange={e => setForm(f => ({ ...f, prochainEntretien: e.target.value }))} />
                    {form.prochainEntretien && (() => {
                      const s = entretienStyle(form.prochainEntretien)
                      return s ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                          <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Observations</label>
                    <textarea className={inputCls} rows="2" value={form.observations}
                      style={{ resize: 'vertical' }}
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
