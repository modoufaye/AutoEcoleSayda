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
  prochainEntretien: '',
  dateAssurance: '', montantAssurance: '', dureeAssurance: '',
  dateVisiteTechnique: '',
}

function expiryDate(dateStr, months) {
  if (!dateStr || !months) return null
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + parseInt(months))
  return d.toISOString().split('T')[0]
}

function entretienStyle(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr)
  const diff = Math.floor((d - today) / 86400000)
  if (diff < 0)  return { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'En retard' }
  if (diff <= 15) return { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Bientôt' }
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

export default function Vehicules({ onBack }) {
  const [list, setList]               = useState([])
  const [filtered, setFiltered]       = useState([])
  const [statutFilter, setStatutFilter] = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [profil, setProfil]           = useState(null)
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
        prochainEntretien: v.prochainEntretien || '',
        dateAssurance: v.dateAssurance || '', montantAssurance: v.montantAssurance ?? '',
        dureeAssurance: v.dureeAssurance ?? '', dateVisiteTechnique: v.dateVisiteTechnique || '',
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

      {onBack && (
        <button onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
          <i className="bi bi-arrow-left" />Retour
        </button>
      )}

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
                {['#', 'Immatriculation', 'Marque / Modèle', 'Assurance', 'Prochain entretien', 'Visite technique', 'Catégorie', 'Statut', 'Actions'].map((h, i) => (
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
                const assuranceExpiry = expiryDate(v.dateAssurance, v.dureeAssurance)
                const assuranceSt = entretienStyle(assuranceExpiry)
                const visiteSt = entretienStyle(
                  v.dateVisiteTechnique
                    ? new Date(new Date(v.dateVisiteTechnique).setFullYear(new Date(v.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
                    : null
                )
                const isEven = i % 2 === 0
                return (
                  <tr key={v.id}
                    style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button onClick={() => setProfil(v)} className="border-0 bg-transparent p-0 cursor-pointer"
                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                        <span className="font-bold text-sm text-[#1e3a5f] hover:text-[#0d9488] transition-colors">
                          {v.immatriculation}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-semibold text-slate-800">{v.marque}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{v.modele}</div>
                    </td>

                    {/* Assurance — date d'expiration uniquement */}
                    <td className="py-3.5 px-4">
                      {assuranceExpiry ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-700 font-medium whitespace-nowrap">
                            {new Date(assuranceExpiry).toLocaleDateString('fr-SN', { day:'2-digit', month:'short', year:'numeric' })}
                          </span>
                          {assuranceSt && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: assuranceSt.bg, color: assuranceSt.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: assuranceSt.dot }} />
                              {assuranceSt.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Non définie</span>
                      )}
                    </td>

                    {/* Prochain entretien */}
                    <td className="py-3.5 px-4">
                      {v.prochainEntretien ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-700 font-medium">
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

                    {/* Visite technique */}
                    <td className="py-3.5 px-4">
                      {v.dateVisiteTechnique ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-700 font-medium whitespace-nowrap">
                            {new Date(v.dateVisiteTechnique).toLocaleDateString('fr-SN', { day:'2-digit', month:'short', year:'numeric' })}
                          </span>
                          {visiteSt && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: visiteSt.bg, color: visiteSt.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: visiteSt.dot }} />
                              {visiteSt.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Non définie</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: CAT_STYLE.bg, color: CAT_STYLE.color }}>
                        {v.categorie}
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
                          onClick={() => setProfil(v)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#f0fdf4', color: '#16a34a' }}
                          title="Voir le profil">
                          <i className="bi bi-eye-fill" style={{ fontSize: '.75rem' }} />
                        </button>
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
            <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
              <div className="px-6 pt-6 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)' }}>
                <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setShowModal(false)} />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,.2)' }}>
                    <i className="bi bi-car-front-fill" style={{ fontSize: '1.6rem', color: '#fff' }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(209,250,229,.7)' }}>
                      {editId ? 'Modifier le véhicule' : 'Nouveau véhicule'}
                    </div>
                    {editId ? (
                      <>
                        <div className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: 'ui-monospace,monospace' }}>
                          {form.immatriculation || '—'}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: 'rgba(209,250,229,.85)' }}>
                          {form.marque} {form.modele} — {form.annee}
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-extrabold text-white leading-tight">
                        Ajouter un véhicule
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-body px-6 py-4" style={{ background: '#f8fafc' }}>
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
                    <label className={labelCls}>Date d'assurance</label>
                    <input type="date" className={inputCls} value={form.dateAssurance}
                      onChange={e => setForm(f => ({ ...f, dateAssurance: e.target.value }))} />
                  </div>
                  <div className="col-md-3">
                    <label className={labelCls}>Durée assurance (mois)</label>
                    <input type="number" className={inputCls} value={form.dureeAssurance} min="1" max="24" placeholder="12"
                      onChange={e => setForm(f => ({ ...f, dureeAssurance: e.target.value }))} />
                  </div>
                  <div className="col-md-3">
                    <label className={labelCls}>Montant assurance (F CFA)</label>
                    <input type="number" className={inputCls} value={form.montantAssurance} min="0" placeholder="0"
                      onChange={e => setForm(f => ({ ...f, montantAssurance: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Date visite technique</label>
                    <input type="date" className={inputCls} value={form.dateVisiteTechnique}
                      onChange={e => setForm(f => ({ ...f, dateVisiteTechnique: e.target.value }))} />
                    {form.dateVisiteTechnique && (() => {
                      const next = new Date(new Date(form.dateVisiteTechnique).setFullYear(new Date(form.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
                      const s = entretienStyle(next)
                      return s ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                          <span className="text-xs font-semibold" style={{ color: s.color }}>Expire le {new Date(next).toLocaleDateString('fr-SN', { day:'2-digit', month:'short', year:'numeric' })} — {s.label}</span>
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
              <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2" style={{ background: '#f8fafc' }}>
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                  onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn fw-bold text-white px-5" style={{
                  background: 'linear-gradient(135deg,#0d9488,#2dd4bf)', borderRadius: '.75rem', border: 'none' }}
                  onClick={save}>
                  <i className="bi bi-check-lg me-1" />Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Profil ─────────────────────────────────────── */}
      {profil && (() => {
        const st = STATUT_V[profil.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: profil.statut }
        const ent = entretienStyle(profil.prochainEntretien)
        const assuranceExpiry = expiryDate(profil.dateAssurance, profil.dureeAssurance)
        const assuranceSt = entretienStyle(assuranceExpiry)
        const visiteNext = profil.dateVisiteTechnique
          ? new Date(new Date(profil.dateVisiteTechnique).setFullYear(new Date(profil.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
          : null
        const visiteSt = entretienStyle(visiteNext)
        const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

        return (
          <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>

                {/* Bannière */}
                <div className="px-6 pt-6 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)' }}>
                  <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setProfil(null)} />
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,.2)' }}>
                      <i className="bi bi-car-front-fill" style={{ fontSize: '1.6rem', color: '#fff' }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(209,250,229,.7)' }}>Profil véhicule</div>
                      <div className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: 'ui-monospace,monospace' }}>
                        {profil.immatriculation}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: 'rgba(209,250,229,.85)' }}>{profil.marque} {profil.modele} — {profil.annee}</div>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-body px-6 py-5" style={{ background: '#f8fafc' }}>
                  <div className="row g-4">

                    {/* Infos générales */}
                    <div className="col-12">
                      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-info-circle me-1" />Informations générales
                        </div>
                        <div className="row g-3">
                          {[
                            { label: 'Catégorie', value: profil.categorie, icon: 'tag' },
                            { label: 'Kilométrage', value: `${profil.kilometrage?.toLocaleString('fr-SN')} km`, icon: 'speedometer2' },
                            { label: 'Observations', value: profil.observations || '—', icon: 'chat-left-text' },
                          ].map(({ label, value, icon }) => (
                            <div key={label} className="col-md-4">
                              <div className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                                <i className={`bi bi-${icon}`} />
                                {label}
                              </div>
                              <div className="text-sm font-semibold text-slate-800">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Assurance */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-shield-check me-1" />Assurance
                        </div>
                        {profil.dateAssurance ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Date de souscription</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.dateAssurance)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Durée</div>
                              <div className="text-sm font-semibold text-slate-800">{profil.dureeAssurance ? `${profil.dureeAssurance} mois` : '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Expiration</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(assuranceExpiry)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Montant</div>
                              <div className="text-sm font-semibold text-slate-800">{profil.montantAssurance ? `${profil.montantAssurance.toLocaleString('fr-SN')} F CFA` : '—'}</div>
                            </div>
                            {assuranceSt && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: assuranceSt.bg, color: assuranceSt.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: assuranceSt.dot }} />
                                {assuranceSt.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseignée</p>}
                      </div>
                    </div>

                    {/* Visite technique */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-clipboard2-check me-1" />Visite technique
                        </div>
                        {profil.dateVisiteTechnique ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Dernière visite</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.dateVisiteTechnique)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Prochaine visite</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(visiteNext)}</div>
                            </div>
                            {visiteSt && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: visiteSt.bg, color: visiteSt.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: visiteSt.dot }} />
                                {visiteSt.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseignée</p>}
                      </div>
                    </div>

                    {/* Prochain entretien */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-tools me-1" />Prochain entretien
                        </div>
                        {profil.prochainEntretien ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Date prévue</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.prochainEntretien)}</div>
                            </div>
                            {ent && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: ent.bg, color: ent.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ent.dot }} />
                                {ent.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseigné</p>}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-0 px-6 pb-5 pt-2">
                  <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                    onClick={() => setProfil(null)}>Fermer</button>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
