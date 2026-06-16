import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, LABELS } from '../utils'
import { toast } from './Toast'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const CATS = ['A', 'A1', 'B', 'C', 'D', 'EB', 'EC']
const EMPTY = { nom: '', prenom: '', telephone: '', email: '', numeroCni: '', numeroPermis: '', dateEmbauche: '', categoriesAutorisees: [], actif: true }

/* ── Statut élève styles ──────────────────────────────────── */
const STATUT_ELEVE = {
  EN_COURS:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb', label: 'En cours' },
  DIPLOME:   { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Diplômé' },
  SUSPENDU:  { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Suspendu' },
  ABANDONNE: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Abandonné' },
}

/* ── En-tête de section réutilisable ────────────────────────── */
function SectionHeader({ gradient, border, icon, iconBg, iconColor, title, subtitle, badge, badgeStyle }) {
  return (
    <div className="flex items-center justify-between px-6 py-3"
      style={{ background: gradient, borderBottom: `2px solid ${border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: iconBg }}>
          <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.85rem' }} />
        </div>
        <div>
          <div className="font-extrabold text-sm leading-tight" style={{ color: title.color }}>{title.text}</div>
          <div className="text-xs mt-0.5" style={{ color: subtitle.color }}>{subtitle.text}</div>
        </div>
      </div>
      {badge != null && (
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={badgeStyle}>{badge}</span>
      )}
    </div>
  )
}

/* ── Badge statut avec point coloré ──────────────────────── */
function StatutBadge({ statut }) {
  if (statut === true || statut === false) {
    const s = statut
      ? { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Actif' }
      : { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: 'Inactif' }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: s.bg, color: s.color }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
        {s.label}
      </span>
    )
  }
  const s = STATUT_ELEVE[statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: statut }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

/* ── Input / Label styles partagés ──────────────────────── */
const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

export default function Moniteurs() {
  const [list, setList]               = useState([])
  const [filtered, setFiltered]       = useState([])
  const [search, setSearch]           = useState('')
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [elevesSelected, setElevesSel] = useState([])
  const [loadingEleves, setLoadingEl] = useState(false)
  const [elevesCount, setElevesCount] = useState({})
  const [page, setPage]               = useState(1)
  const [pageEleves, setPageEleves]   = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('GET', '/moniteurs')
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement moniteurs', 'danger') }
    finally { setLoading(false) }
    try {
      const eleves = await api('GET', '/eleves')
      const counts = {}
      eleves.forEach(e => {
        if (e.moniteur?.id) counts[e.moniteur.id] = (counts[e.moniteur.id] || 0) + 1
      })
      setElevesCount(counts)
    } catch { /* optionnel */ }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(list); return }
    const t = search.toLowerCase()
    setFiltered(list.filter(m => `${m.nom} ${m.prenom}`.toLowerCase().includes(t)))
    setPage(1)
  }, [search, list])

  /* ── Ouvrir le profil ──────────────────────────────────── */
  const openProfile = async (m) => {
    setSelected(m)
    setElevesSel([])
    setPageEleves(1)
    setLoadingEl(true)
    try {
      const eleves = await api('GET', `/moniteurs/${m.id}/eleves`)
      setElevesSel(eleves)
    } catch { toast('Impossible de charger les élèves', 'danger') }
    finally { setLoadingEl(false) }
  }

  const closeProfile = () => { setSelected(null); setElevesSel([]) }

  /* ── Modal création / modification ────────────────────── */
  const openModal = (m = null) => {
    if (m) {
      setEditId(m.id)
      setForm({
        nom: m.nom, prenom: m.prenom, telephone: m.telephone, email: m.email || '',
        numeroCni: m.numeroCni || '', numeroPermis: m.numeroPermis || '',
        dateEmbauche: m.dateEmbauche || '', categoriesAutorisees: m.categoriesAutorisees || [], actif: m.actif
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const toggleCat = (cat) => {
    setForm(f => ({
      ...f,
      categoriesAutorisees: f.categoriesAutorisees.includes(cat)
        ? f.categoriesAutorisees.filter(c => c !== cat)
        : [...f.categoriesAutorisees, cat]
    }))
  }

  const save = async () => {
    if (!form.nom || !form.prenom || !form.telephone) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = {
      ...form,
      email: form.email || null, numeroCni: form.numeroCni || null,
      numeroPermis: form.numeroPermis || null, dateEmbauche: form.dateEmbauche || null
    }
    try {
      if (editId) { await api('PUT', `/moniteurs/${editId}`, data); toast('Moniteur modifié') }
      else { await api('POST', '/moniteurs', data); toast('Moniteur créé') }
      setShowModal(false)
      await load()
      if (editId && selected?.id === editId) {
        const updated = await api('GET', `/moniteurs/${editId}`)
        setSelected(updated)
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  const toggleActif = async (id) => {
    try {
      await api('PATCH', `/moniteurs/${id}/toggle-actif`); toast('Statut mis à jour'); await load()
      if (selected?.id === id) {
        const updated = await api('GET', `/moniteurs/${id}`)
        setSelected(updated)
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce moniteur ?')) return
    try { await api('DELETE', `/moniteurs/${id}`); toast('Moniteur supprimé'); closeProfile(); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  /* ══ MODAL ═══════════════════════════════════════════════════ */
  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white w-full max-w-2xl overflow-hidden"
          style={{ borderRadius: '1.25rem', boxShadow: '0 24px 64px rgba(15,34,64,.35)', maxHeight: '92vh', overflowY: 'auto' }}>

          {/* En-tête modal */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,.18)' }}>
                <i className="bi bi-person-badge-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white leading-tight">
                  {editId ? 'Modifier le moniteur' : 'Nouveau moniteur'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(147,197,253,.85)' }}>
                  {editId ? 'Mettre à jour les informations' : 'Enregistrer un nouveau moniteur'}
                </div>
              </div>
            </div>
            <button onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <i className="bi bi-x-lg" style={{ fontSize: '.85rem' }} />
            </button>
          </div>

          {/* Corps modal */}
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nom <span style={{ color: '#ef4444' }}>*</span></label>
                <input className={inputCls} placeholder="Nom de famille"
                  value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Prénom <span style={{ color: '#ef4444' }}>*</span></label>
                <input className={inputCls} placeholder="Prénom"
                  value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Téléphone <span style={{ color: '#ef4444' }}>*</span></label>
                <input className={inputCls} placeholder="77 000 00 00"
                  value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} placeholder="email@exemple.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Numéro CNI</label>
                <input className={inputCls} placeholder="N° CNI"
                  value={form.numeroCni} onChange={e => setForm(f => ({ ...f, numeroCni: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>N° Permis</label>
                <input className={inputCls} placeholder="Numéro de permis"
                  value={form.numeroPermis} onChange={e => setForm(f => ({ ...f, numeroPermis: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Date d'embauche</label>
                <input type="date" className={inputCls}
                  value={form.dateEmbauche} onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))} />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className={labelCls}>Statut</label>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    background: form.actif ? '#f0fdf4' : '#f8fafc',
                    borderColor: form.actif ? '#86efac' : '#e2e8f0',
                    color: form.actif ? '#15803d' : '#64748b',
                  }}>
                  <div className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                    style={{ background: form.actif ? '#22c55e' : '#cbd5e1' }}>
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                      style={{ left: form.actif ? '1.25rem' : '0.125rem' }} />
                  </div>
                  <span className="text-sm font-semibold">{form.actif ? 'Moniteur actif' : 'Inactif'}</span>
                </button>
              </div>
            </div>

            {/* Catégories */}
            <div>
              <label className={labelCls}>Catégories autorisées</label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-slate-100 bg-slate-50">
                {CATS.map(c => {
                  const sel = form.categoriesAutorisees.includes(c)
                  return (
                    <button key={c} type="button" onClick={() => toggleCat(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0"
                      style={sel
                        ? { background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', color: '#fff', boxShadow: '0 2px 8px rgba(30,58,95,.25)' }
                        : { background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0' }
                      }>
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Pied modal */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
              style={{ background: '#f1f5f9', color: '#64748b' }}>
              Annuler
            </button>
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
              <i className="bi bi-check-lg" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ══ VUE PROFIL ══════════════════════════════════════════════ */
  if (selected) return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Bannière profil navy */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 50%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.3)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />

        <div className="relative px-6 py-2 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar + nom */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d4a017, #f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.4)' }}>
              {selected.nom[0]}{selected.prenom[0]}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>Fiche moniteur</div>
              <div className="text-xl font-extrabold text-white leading-tight">{selected.nom} {selected.prenom}</div>
              {selected.email && <div className="text-sm mt-0.5" style={{ color: '#bfdbfe' }}>{selected.email}</div>}
            </div>
          </div>

          {/* Droite : statut + actions */}
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
              style={{
                background: selected.actif ? 'rgba(34,197,94,.2)' : 'rgba(148,163,184,.2)',
                color: selected.actif ? '#86efac' : '#cbd5e1',
                borderColor: 'rgba(255,255,255,.1)'
              }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 align-middle"
                style={{ background: selected.actif ? '#86efac' : '#94a3b8' }} />
              {selected.actif ? 'Actif' : 'Inactif'}
            </span>
            <button onClick={() => toggleActif(selected.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all"
              style={{ background: selected.actif ? 'rgba(251,191,36,.18)' : 'rgba(34,197,94,.18)', color: selected.actif ? '#fbbf24' : '#86efac' }}>
              <i className={`bi bi-${selected.actif ? 'pause-circle' : 'play-circle'}-fill`} />
              {selected.actif ? 'Désactiver' : 'Activer'}
            </button>
            <button onClick={() => openModal(selected)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,.14)', color: '#e2e8f0' }}>
              <i className="bi bi-pencil-fill" />
              Modifier
            </button>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button onClick={closeProfile}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
        style={{ background: '#f1f5f9', color: '#475569' }}>
        <i className="bi bi-arrow-left" />
        Retour à la liste
      </button>

      {/* Grid 3 colonnes */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Colonne gauche : infos perso ──────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <SectionHeader
            gradient="linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)"
            border="#1e3a5f"
            icon="person-badge-fill"
            iconBg="rgba(255,255,255,.18)"
            iconColor="#fff"
            title={{ text: 'Informations personnelles', color: '#fff' }}
            subtitle={{ text: 'Données du moniteur', color: 'rgba(147,197,253,.85)' }}
          />
          <div className="px-5 py-2">
            {[
              { icon: 'telephone',    label: 'Téléphone',       value: selected.telephone,                           iconBg: '#fef9c3', iconColor: '#b45309' },
              { icon: 'envelope',     label: 'Email',           value: selected.email,                               iconBg: '#eff6ff', iconColor: '#2563eb' },
              { icon: 'credit-card',  label: 'Numéro CNI',      value: selected.numeroCni,                           iconBg: '#f0fdf4', iconColor: '#15803d' },
              { icon: 'card-checklist', label: 'N° Permis',     value: selected.numeroPermis,                        iconBg: '#eef2ff', iconColor: '#4f46e5' },
              { icon: 'calendar-event', label: "Date d'embauche", value: selected.dateEmbauche ? fmtDate(selected.dateEmbauche) : null, iconBg: '#fdf4ff', iconColor: '#9333ea' },
            ].filter(r => r.value).map(({ icon, label, value, iconBg, iconColor }, i, arr) => (
              <div key={label} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg }}>
                  <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.78rem' }} />
                </div>
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-700 font-medium text-right truncate">{value}</span>
                </div>
              </div>
            ))}

            {/* Catégories */}
            {selected.categoriesAutorisees?.length > 0 && (
              <div className="pt-3 pb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catégories autorisées</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.categoriesAutorisees.map(c => (
                    <span key={c} className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                      style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : élèves assignés ──────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <SectionHeader
            gradient="linear-gradient(135deg, #d4a017 0%, #f0bb2a 100%)"
            border="#b8860b"
            icon="people-fill"
            iconBg="rgba(255,255,255,.25)"
            iconColor="#1e3a5f"
            title={{ text: 'Élèves assignés', color: '#1e3a5f' }}
            subtitle={{ text: 'Apprenants encadrés par ce moniteur', color: 'rgba(30,58,95,.6)' }}
            badge={loadingEleves ? '…' : elevesSelected.length}
            badgeStyle={{ background: 'rgba(30,58,95,.15)', color: '#1e3a5f' }}
          />

          {loadingEleves ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1e3a5f] rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Chargement…</span>
              </div>
            </div>
          ) : elevesSelected.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100">
                <i className="bi bi-person-x" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
              </div>
              <div className="text-sm font-medium text-slate-400">Aucun élève assigné à ce moniteur</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nom & Prénom', 'Téléphone', 'Catégorie', 'Statut', 'Inscription'].map((h, i) => (
                      <th key={h} className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elevesSelected.slice((pageEleves-1)*PAGE_SIZE, pageEleves*PAGE_SIZE).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      className="transition-colors hover:bg-blue-50/40">
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold text-slate-300">{(pageEleves-1)*PAGE_SIZE + i + 1}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-semibold text-slate-700">{e.nom} {e.prenom}</div>
                        {e.email && <div className="text-xs text-slate-400 mt-0.5">{e.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-slate-600">{e.telephone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)' }}>
                          {e.categoriePermis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatutBadge statut={e.statut} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-500">{fmtDate(e.dateInscription)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={pageEleves} setPage={setPageEleves} total={elevesSelected.length} pageSize={PAGE_SIZE} />
            </div>
          )}
        </div>
      </div>

      {showModal && renderModal()}
    </div>
  )

  /* ══ VUE LISTE ═══════════════════════════════════════════════ */
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête page */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Moniteurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} moniteur{filtered.length !== 1 ? 's' : ''} enregistré{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
          <i className="bi bi-plus-lg" />
          Nouveau moniteur
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="relative">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '.85rem' }} />
          <input type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
            placeholder="Rechercher par nom ou prénom…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <SectionHeader
          gradient="linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)"
          border="#5b21b6"
          icon="person-badge-fill"
          iconBg="rgba(255,255,255,.18)"
          iconColor="#fff"
          title={{ text: 'Moniteurs', color: '#fff' }}
          subtitle={{ text: 'Personnel enseignant', color: 'rgba(221,214,254,.85)' }}
          badge={filtered.length}
          badgeStyle={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#7c3aed] rounded-full animate-spin" />
              <span className="text-sm text-slate-400 font-medium">Chargement…</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100">
              <i className="bi bi-inbox" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
            </div>
            <div className="text-sm font-medium text-slate-400">Aucun moniteur enregistré</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Nom & Prénom', 'Téléphone', 'Catégories', 'Élèves', 'Permis', 'Statut', 'Embauche', ''].map((h, i) => (
                    <th key={i} className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : i === 8 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button className="text-left border-0 bg-transparent p-0 cursor-pointer"
                        onClick={() => openProfile(m)}>
                        <div className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{m.nom} {m.prenom}</div>
                        {m.email && <div className="text-xs text-slate-400 mt-0.5">{m.email}</div>}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-sm text-slate-600">{m.telephone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(m.categoriesAutorisees || []).map(c => (
                          <span key={c} className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                            style={{ background: '#334155' }}>
                            {c}
                          </span>
                        ))}
                        {!m.categoriesAutorisees?.length && <span className="text-slate-300 text-xs">—</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button onClick={() => openProfile(m)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer transition-all"
                        style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                        <i className="bi bi-people" />
                        {elevesCount[m.id] ?? 0}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-500">{m.numeroPermis || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatutBadge statut={m.actif} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-500">{fmtDate(m.dateEmbauche)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => toggleActif(m.id)}
                          title={m.actif ? 'Désactiver' : 'Activer'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: m.actif ? '#fef9c3' : '#dcfce7', color: m.actif ? '#a16207' : '#15803d' }}>
                          <i className={`bi bi-${m.actif ? 'pause-circle' : 'play-circle'}-fill`} style={{ fontSize: '.8rem' }} />
                        </button>
                        <button onClick={() => openModal(m)}
                          title="Modifier"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#f1f5f9', color: '#475569' }}>
                          <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {showModal && renderModal()}
    </div>
  )
}
