import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate } from '../utils'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import '../landing.css'

const today = () => new Date().toISOString().split('T')[0]
const EMPTY     = { date: today(), eleveId: '', type: '', resultat: 'EN_ATTENTE', score: '', observations: '' }
const RES_EMPTY = { resultat: 'EN_ATTENTE', score: '', observations: '' }

const RES_STYLE = {
  ADMIS:      { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Admis' },
  REFUSE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Refusé' },
  EN_ATTENTE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En attente' },
}

const TYPE_STYLE = {
  CODE:     { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb', label: 'Code' },
  CONDUITE: { bg: '#f0fdf4', color: '#15803d', dot: '#16a34a', label: 'Conduite' },
}

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all'
const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5'

export default function Examens({ onEleveClick }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'

  const [list, setList]                     = useState([])
  const [search, setSearch]                 = useState('')
  const [filterType, setFilterType]         = useState('')
  const [filterResultat, setFilterResultat] = useState('')
  const [filterTentative, setFilterTentative] = useState('')
  const [filterDateDe, setFilterDateDe]     = useState('')
  const [filterDateA, setFilterDateA]       = useState('')
  const [form, setForm]                     = useState(EMPTY)
  const [resForm, setResForm]               = useState(RES_EMPTY)
  const [resId, setResId]                   = useState(null)
  const [showModal, setShowModal]           = useState(false)
  const [showResModal, setShowResModal]     = useState(false)
  const [loading, setLoading]               = useState(true)
  const [eleves, setEleves]                 = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const data = isEleve
        ? await api('GET', '/eleve/mes-examens')
        : await api('GET', '/examens')
      setList(data)
    } catch { toast('Erreur chargement examens', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openModal = async () => {
    const ev = await api('GET', '/eleves')
    setEleves(ev); setForm(EMPTY); setShowModal(true)
  }

  const save = async () => {
    const { date, eleveId, type } = form
    if (!date || !eleveId || !type) { toast('Veuillez remplir tous les champs obligatoires', 'warning'); return }
    const data = {
      date, eleveId: parseInt(eleveId), type,
      resultat: form.resultat,
      score: form.score ? parseInt(form.score) : null,
      observations: form.observations || null,
    }
    try {
      await api('POST', '/examens', data); toast('Examen enregistré')
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const openResultat = (e) => {
    setResId(e.id)
    setResForm({ resultat: e.resultat || 'EN_ATTENTE', score: e.score ?? '', observations: e.observations || '' })
    setShowResModal(true)
  }

  const saveResultat = async () => {
    const body = {
      resultat: resForm.resultat,
      score: resForm.score ? parseInt(resForm.score) : null,
      observations: resForm.observations || null,
    }
    try {
      await api('PATCH', `/examens/${resId}/resultat`, body); toast('Résultat mis à jour')
      setShowResModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!confirm('Supprimer cet examen ?')) return
    try { await api('DELETE', `/examens/${id}`); toast('Examen supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const tentatives = [...new Set(list.map(e => e.tentative))].sort((a, b) => a - b)

  const filtered = list
    .filter(e => !search.trim() || `${e.eleve?.nom ?? ''} ${e.eleve?.prenom ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter(e => !filterType      || e.type      === filterType)
    .filter(e => !filterResultat  || e.resultat  === filterResultat)
    .filter(e => !filterTentative || e.tentative === parseInt(filterTentative))
    .filter(e => !filterDateDe    || e.date >= filterDateDe)
    .filter(e => !filterDateA     || e.date <= filterDateA)

  const colSpan = isEleve ? 6 : 8

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête page (admin uniquement) ─────────────────── */}
      {!isEleve && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Examens</h1>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} examen{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}
          >
            <i className="bi bi-plus-lg" />
            Nouvel examen
          </button>
        </div>
      )}

      {/* ── Filtres (admin uniquement) ───────────────────────── */}
      {!isEleve && (
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Recherche */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl">
              <i className="bi bi-search text-slate-400" style={{ fontSize: '.85rem' }} />
              <input
                type="text"
                placeholder="Rechercher par nom ou prénom…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            {/* Select Type */}
            <select className="px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
              value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous les types</option>
              <option value="CODE">Code</option>
              <option value="CONDUITE">Conduite</option>
            </select>
            {/* Select Résultat */}
            <select className="px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
              value={filterResultat} onChange={e => setFilterResultat(e.target.value)}>
              <option value="">Tous les résultats</option>
              <option value="ADMIS">Admis</option>
              <option value="REFUSE">Refusé</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
            {/* Select Tentative */}
            <select className="px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
              value={filterTentative} onChange={e => setFilterTentative(e.target.value)}>
              <option value="">Toutes les tentatives</option>
              {tentatives.map(t => (
                <option key={t} value={t}>{t}{t === 1 ? 'ère' : 'ème'}</option>
              ))}
            </select>
            {/* Dates */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Du</span>
              <input type="date"
                className="px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
                value={filterDateDe} onChange={e => setFilterDateDe(e.target.value)} />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">au</span>
              <input type="date"
                className="px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1e3a5f] transition-all"
                value={filterDateA} onChange={e => setFilterDateA(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tableau ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        {/* En-tête tableau */}
        <div className="flex items-center justify-between px-6 py-3"
          style={isEleve
            ? { background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)', borderBottom: '2px solid #450a0a' }
            : { background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', borderBottom: '2px solid #b8860b' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: isEleve ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.25)' }}>
              <i className="bi bi-clipboard2-check-fill"
                style={{ color: isEleve ? '#fff' : '#1e3a5f', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight"
                style={{ color: isEleve ? '#fff' : '#1e3a5f' }}>
                {isEleve ? 'Mes Examens' : 'Examens'}
              </div>
              <div className="text-xs mt-0.5"
                style={{ color: isEleve ? 'rgba(255,237,213,.85)' : 'rgba(30,58,95,.6)' }}>
                {isEleve ? 'Historique de vos passages' : 'Résultats et suivi des passages'}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={isEleve
              ? { background: 'rgba(255,255,255,.18)', color: '#fff' }
              : { background: 'rgba(30,58,95,.15)', color: '#1e3a5f' }}>
            {filtered.length}
          </span>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Date', ...(!isEleve ? ['Élève'] : []), 'Type', 'Résultat', 'Score', 'Tentative', ...(!isEleve ? ['Actions'] : [])].map((h, i) => (
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
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#d4a017] rounded-full animate-spin" />
                      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: '#f1f5f9' }}>
                        <i className="bi bi-clipboard2-check" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                      </div>
                      <div className="text-sm font-medium text-slate-400">Aucun examen trouvé</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((e, i) => {
                const resSt  = RES_STYLE[e.resultat]  || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: e.resultat }
                const typeSt = TYPE_STYLE[e.type]      || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: e.type }
                const isEven = i % 2 === 0
                return (
                  <tr key={e.id} style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-700">
                      {fmtDate(e.date)}
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4">
                        {e.eleve
                          ? onEleveClick
                            ? <button
                                onClick={() => onEleveClick(e.eleve.id)}
                                className="text-sm font-semibold text-[#1e3a5f] underline-offset-2 hover:underline bg-transparent border-0 cursor-pointer p-0 text-left">
                                {e.eleve.nom} {e.eleve.prenom}
                              </button>
                            : <span className="text-sm font-medium text-slate-700">{e.eleve.nom} {e.eleve.prenom}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: typeSt.bg, color: typeSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeSt.dot }} />
                        {typeSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: resSt.bg, color: resSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: resSt.dot }} />
                        {resSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {e.score != null
                        ? <><span className="text-sm font-bold text-slate-700">{e.score}</span><span className="text-xs text-slate-400">/100</span></>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        {e.tentative}
                      </span>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openResultat(e)} title="Saisir le résultat"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                            style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <i className="bi bi-pencil-square" style={{ fontSize: '.82rem' }} />
                          </button>
                          <button onClick={() => del(e.id)} title="Supprimer"
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
      </div>

      {/* ── Modal nouvel examen ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white w-full max-w-lg overflow-hidden" style={{ borderRadius: '1.25rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', borderBottom: '2px solid #b8860b' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.25)' }}>
                  <i className="bi bi-clipboard2-plus-fill" style={{ color: '#1e3a5f', fontSize: '.85rem' }} />
                </div>
                <span className="font-extrabold text-sm" style={{ color: '#1e3a5f' }}>Nouvel examen</span>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                style={{ background: 'rgba(30,58,95,.12)', color: '#1e3a5f' }}>
                <i className="bi bi-x-lg" style={{ fontSize: '.85rem' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date <span className="text-red-400 normal-case">*</span></label>
                  <input type="date" className={inputCls} value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Élève <span className="text-red-400 normal-case">*</span></label>
                  <select className={inputCls} value={form.eleveId}
                    onChange={e => setForm(f => ({ ...f, eleveId: e.target.value }))}>
                    <option value="">Choisir un élève…</option>
                    {eleves.map(e => (
                      <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Type <span className="text-red-400 normal-case">*</span></label>
                  <select className={inputCls} value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="">Choisir…</option>
                    <option value="CODE">Code</option>
                    <option value="CONDUITE">Conduite</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Résultat</label>
                  <select className={inputCls} value={form.resultat}
                    onChange={e => setForm(f => ({ ...f, resultat: e.target.value }))}>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="ADMIS">Admis</option>
                    <option value="REFUSE">Refusé</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Score (/100)</label>
                  <input type="number" className={inputCls} value={form.score} min="0" max="100"
                    onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Observations</label>
                <textarea className={inputCls} rows={2} value={form.observations}
                  onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Annuler
              </button>
              <button onClick={save}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}>
                <i className="bi bi-check-lg" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal résultat (petit) ───────────────────────────── */}
      {showResModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white w-full max-w-sm overflow-hidden" style={{ borderRadius: '1.25rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderBottom: '2px solid #bbf7d0' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#bbf7d0' }}>
                  <i className="bi bi-clipboard2-check-fill" style={{ color: '#15803d', fontSize: '.85rem' }} />
                </div>
                <span className="font-extrabold text-sm text-slate-700">Mettre à jour le résultat</span>
              </div>
              <button onClick={() => setShowResModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                style={{ background: '#d1fae5', color: '#15803d' }}>
                <i className="bi bi-x-lg" style={{ fontSize: '.85rem' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={labelCls}>Résultat <span className="text-red-400 normal-case">*</span></label>
                <select className={inputCls} value={resForm.resultat}
                  onChange={e => setResForm(f => ({ ...f, resultat: e.target.value }))}>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="ADMIS">Admis</option>
                  <option value="REFUSE">Refusé</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Score (/100)</label>
                <input type="number" className={inputCls} value={resForm.score} min="0" max="100"
                  onChange={e => setResForm(f => ({ ...f, score: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Observations</label>
                <textarea className={inputCls} rows={2} value={resForm.observations}
                  onChange={e => setResForm(f => ({ ...f, observations: e.target.value }))} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setShowResModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Annuler
              </button>
              <button onClick={saveResultat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', boxShadow: '0 4px 12px rgba(21,128,61,.3)' }}>
                <i className="bi bi-check-lg" />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
