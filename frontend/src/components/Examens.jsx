import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, waLink } from '../utils'
import { msgRappelExamen, joursAvant } from '../messages'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import { FenetreModerne, Etape, Etiquette, Choix, ChampMontant } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import '../landing.css'

const PAGE_SIZE = 10

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


export default function Examens({ onEleveClick, onBack }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'

  const [list, setList]                     = useState([])
  const [search, setSearch]                 = useState('')
  const [filterType, setFilterType]         = useState('')
  const [filterResultat, setFilterResultat] = useState('')
  const [filterTentative, setFilterTentative] = useState('')
  const [page, setPage]                     = useState(1)
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

  const [ecole, setEcole] = useState('')

  useEffect(() => {
    load()
    if (!isEleve) api('GET', '/config').then(c => setEcole(c.nom || '')).catch(() => {})
  }, [])

  /* Lien de rappel WhatsApp : seulement pour un examen à venir, sans résultat, avec un numéro exploitable. */
  const lienRappel = (e) =>
    e.resultat === 'EN_ATTENTE' && joursAvant(e.date) >= 0 && e.eleve
      ? waLink(e.eleve.telephone, msgRappelExamen(e, ecole))
      : null

  const aRappeler = list
    .filter(e => e.resultat === 'EN_ATTENTE' && joursAvant(e.date) >= 0 && joursAvant(e.date) <= 7)
    .sort((a, b) => a.date.localeCompare(b.date))

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
    if (!(await confirmer({ titre: 'Supprimer cet examen ?', ton: 'danger', libelle: 'Supprimer', message: 'Cette action est définitive.' }))) return
    try { await api('DELETE', `/examens/${id}`); toast('Examen supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  useEffect(() => { setPage(1) }, [search, filterType, filterResultat, filterTentative, filterDateDe, filterDateA])

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

      {/* ── Bouton retour (élève) ────────────────────────────── */}
      {isEleve && onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          Retour
        </button>
      )}

      {/* ── En-tête page (admin uniquement) ─────────────────── */}
      {!isEleve && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Examens</h2>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} examen{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}
          >
            <i className="bi bi-plus-lg" />
            Examen
          </button>
        </div>
      )}

      {/* ── Rappels à envoyer : examens des 7 prochains jours (admin) ── */}
      {!isEleve && aRappeler.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <i className="bi bi-whatsapp" style={{ color: '#16a34a', fontSize: '.95rem' }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800">Rappels à envoyer</div>
              <div className="text-xs text-slate-400">Examens des 7 prochains jours</div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
              {aRappeler.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {aRappeler.map(e => {
              const lien = lienRappel(e)
              const j = joursAvant(e.date)
              return (
                <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{e.eleve?.prenom} {e.eleve?.nom}</div>
                    <div className="text-xs text-slate-400">
                      {(TYPE_STYLE[e.type]?.label) || e.type} · {fmtDate(e.date)}
                      <span className="font-semibold" style={{ color: j <= 1 ? '#dc2626' : '#a16207' }}>
                        {' '}· {j === 0 ? "aujourd'hui" : j === 1 ? 'demain' : `dans ${j} jours`}
                      </span>
                    </div>
                  </div>
                  {lien ? (
                    <a href={lien} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold no-underline flex-shrink-0"
                      style={{ background: '#25d366', color: '#fff' }}>
                      <i className="bi bi-whatsapp" />Rappeler
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 flex-shrink-0">Pas de numéro</span>
                  )}
                </div>
              )
            })}
          </div>
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
            : { background: 'linear-gradient(135deg, #ea580c, #fb923c)', borderBottom: '2px solid #c2410c' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-clipboard2-check-fill"
                style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight"
                style={{ color: '#fff' }}>
                {isEleve ? 'Mes Examens' : 'Examens'}
              </div>
              <div className="text-xs mt-0.5"
                style={{ color: isEleve ? 'rgba(255,237,213,.85)' : 'rgba(255,237,213,.85)' }}>
                {isEleve ? 'Historique de vos passages' : 'Résultats et suivi des passages'}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={isEleve
              ? { background: 'rgba(255,255,255,.18)', color: '#fff' }
              : { background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {filtered.length}
          </span>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full table-cards">
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
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#fb923c] rounded-full animate-spin" />
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
              ) : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((e, i) => {
                const resSt  = RES_STYLE[e.resultat]  || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: e.resultat }
                const typeSt = TYPE_STYLE[e.type]      || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: e.type }
                const isEven = i % 2 === 0
                return (
                  <tr key={e.id} style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center cell-hide">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    {/* Côté élève la date fait office de titre ; côté admin c'est le nom de l'élève. */}
                    <td className={`py-3.5 px-4 text-sm font-semibold text-slate-700${isEleve ? ' cell-title' : ''}`}
                      data-label="Date">
                      {fmtDate(e.date)}
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4 cell-title">
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
                    <td className="py-3.5 px-4" data-label="Type">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: typeSt.bg, color: typeSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeSt.dot }} />
                        {typeSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" data-label="Résultat">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: resSt.bg, color: resSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: resSt.dot }} />
                        {resSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" data-label="Score">
                      {e.score != null
                        ? <><span className="text-sm font-bold text-slate-700">{e.score}</span><span className="text-xs text-slate-400">/100</span></>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3.5 px-4" data-label="Tentative">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        {e.tentative}
                      </span>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4 cell-actions">
                        <div className="flex items-center justify-end gap-1">
                          {lienRappel(e) && (
                            <a href={lienRappel(e)} target="_blank" rel="noopener noreferrer" title="Rappel WhatsApp"
                              className="w-8 h-8 rounded-lg flex items-center justify-center no-underline transition-all hover:opacity-80"
                              style={{ background: '#dcfce7', color: '#16a34a' }}>
                              <i className="bi bi-whatsapp" style={{ fontSize: '.85rem' }} />
                            </a>
                          )}
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
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Fenêtre nouvel examen ────────────────────────────── */}
      {showModal && (() => {
        const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
        const eleve = eleves.find(e => String(e.id) === String(form.eleveId))
        return (
          <FenetreModerne
            titre={eleve ? `${eleve.prenom} ${eleve.nom}` : 'Nouvel examen'}
            icone="clipboard2-check-fill"
            details={[
              form.type && ['journal-text', TYPE_STYLE[form.type].label],
              form.date && ['calendar-event', fmtDate(form.date)],
              eleve?.categoriePermis && ['award', `Permis ${eleve.categoriePermis}`],
            ]}
            onClose={() => setShowModal(false)} onSave={save} libelleSave="Enregistrer l'examen">
            <Etape n={1} icon="person" titre="Candidat">
              <div className="row g-3">
                <div className="col-md-7">
                  <Etiquette requis>Élève</Etiquette>
                  <select className={champCls} value={form.eleveId} onChange={e => set('eleveId', e.target.value)}>
                    <option value="">Choisir un élève…</option>
                    {eleves.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
                  </select>
                </div>
                <div className="col-md-5">
                  <Etiquette requis>Date de l'examen</Etiquette>
                  <input type="date" className={champCls} value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
              </div>
            </Etape>

            <Etape n={2} icon="journal-check" titre="Épreuve">
              <Etiquette requis>Type</Etiquette>
              <div className="mb-4">
                <Choix tuiles cols={2} value={form.type} onChange={v => set('type', v)} options={[
                  { v: 'CODE',     label: 'Code',     icon: 'signpost-2-fill', sous: 'Code de la route', color: TYPE_STYLE.CODE.color, bg: TYPE_STYLE.CODE.bg },
                  { v: 'CONDUITE', label: 'Conduite', icon: 'car-front-fill',  sous: 'Épreuve pratique', color: TYPE_STYLE.CONDUITE.color, bg: TYPE_STYLE.CONDUITE.bg },
                ]} />
              </div>
              <Etiquette>Résultat</Etiquette>
              <div className="mb-4">
                <Choix cols={3} value={form.resultat} onChange={v => set('resultat', v)}
                  options={['EN_ATTENTE', 'ADMIS', 'REFUSE'].map(v => ({ v, label: RES_STYLE[v].label, color: RES_STYLE[v].color, bg: RES_STYLE[v].bg,
                    icon: { EN_ATTENTE: 'hourglass-split', ADMIS: 'check-circle-fill', REFUSE: 'x-circle-fill' }[v] }))} />
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <Etiquette>Score</Etiquette>
                  <ChampMontant suffixe="/ 100" placeholder="—" value={form.score} onChange={v => set('score', v)} />
                </div>
                <div className="col-md-8">
                  <Etiquette>Observations</Etiquette>
                  <input className={champCls} value={form.observations} placeholder="Facultatif" onChange={e => set('observations', e.target.value)} />
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}

      {/* ── Fenêtre saisie du résultat ───────────────────────── */}
      {showResModal && (() => {
        const ex = list.find(e => e.id === resId)
        const setR = (k, v) => setResForm(f => ({ ...f, [k]: v }))
        return (
          <FenetreModerne taille={null}
            surTitre="Résultat de l'examen"
            titre={ex?.eleve ? `${ex.eleve.prenom} ${ex.eleve.nom}` : "Résultat de l'examen"}
            icone="clipboard2-check-fill"
            details={[
              ex?.type && ['journal-text', TYPE_STYLE[ex.type]?.label || ex.type],
              ex?.date && ['calendar-event', fmtDate(ex.date)],
              ex?.tentative > 1 && ['arrow-repeat', `${ex.tentative}e tentative`],
            ]}
            onClose={() => setShowResModal(false)} onSave={saveResultat} libelleSave="Valider"
            piedGauche={RES_STYLE[resForm.resultat] && <>Résultat : <strong style={{ color: RES_STYLE[resForm.resultat].color }}>{RES_STYLE[resForm.resultat].label}</strong></>}>
            <Etape n={1} icon="trophy" titre="Résultat">
              <Choix tuiles cols={3} value={resForm.resultat} onChange={v => setR('resultat', v)}
                options={['ADMIS', 'REFUSE', 'EN_ATTENTE'].map(v => ({ v, label: RES_STYLE[v].label, color: RES_STYLE[v].color, bg: RES_STYLE[v].bg,
                  icon: { EN_ATTENTE: 'hourglass-split', ADMIS: 'check-circle-fill', REFUSE: 'x-circle-fill' }[v] }))} />
            </Etape>
            <Etape n={2} icon="pencil-square" titre="Détails">
              <div className="row g-3">
                <div className="col-sm-5">
                  <Etiquette>Score</Etiquette>
                  <ChampMontant suffixe="/ 100" placeholder="—" value={resForm.score} onChange={v => setR('score', v)} />
                </div>
                <div className="col-sm-7">
                  <Etiquette>Observations</Etiquette>
                  <input className={champCls} value={resForm.observations} placeholder="Facultatif"
                    onChange={e => setR('observations', e.target.value)} />
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}
    </div>
  )
}
