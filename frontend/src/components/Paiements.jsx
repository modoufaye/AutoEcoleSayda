import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import Pagination from './Pagination'
import { FenetreModerne, Etape, Etiquette, Choix, ChampMontant } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import { useAuth } from '../context/AuthContext'
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
  ESPECES:      { label: 'Espèces',      color: '#15803d', icon: 'cash-coin' },
  WAVE:         { label: 'Wave',         color: '#0284c7', icon: 'water' },
  ORANGE_MONEY: { label: 'Orange Money', color: '#ea580c', icon: 'phone-fill' },
}


export default function Paiements({ onEleveClick }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'SUPER_ADMIN'
  const [list, setList]               = useState([])
  const [totalEncaisse, setTotalEncaisse] = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [eleves, setEleves]           = useState([])
  const [page, setPage]               = useState(1)
  const [periode, setPeriode]         = useState('')   // '' | 'jour' | 'semaine' | 'mois'

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

  const resume = p => [
    ['Élève', p.eleve ? `${p.eleve.prenom} ${p.eleve.nom}` : '—'],
    ['Montant', fmtMontant(p.montant)],
    ['Date', fmtDate(p.date)],
    ...(p.transactionId ? [['Transaction', p.transactionId]] : []),
  ]

  const changerStatut = async (p, statut) => {
    const ok = await confirmer(statut === 'PAYE'
      ? { titre: 'Valider ce paiement ?', ton: 'succes', libelle: 'Valider', details: resume(p),
          message: "Vérifiez d'abord la transaction dans votre application Wave ou Orange Money." }
      : { titre: 'Refuser ce paiement ?', ton: 'alerte', icone: 'x-circle-fill', libelle: 'Refuser', details: resume(p),
          message: "Le paiement passera en « Annulé » et ne comptera pas dans l'encaissé." })
    if (!ok) return
    try {
      await api('PATCH', `/paiements/${p.id}/statut`, { statut })
      toast(statut === 'PAYE' ? 'Paiement validé' : 'Paiement refusé')
      load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const enAttente = list.filter(p => p.statut === 'EN_ATTENTE').length

  // Filtres de période sur la date du paiement (jour local ; semaine du lundi au dimanche).
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const auj = new Date()
  const lundi = new Date(auj); lundi.setDate(auj.getDate() - ((auj.getDay() + 6) % 7))
  const dimanche = new Date(lundi); dimanche.setDate(lundi.getDate() + 6)
  const PERIODES = [
    { v: '',        label: 'Tous',          dans: () => true },
    { v: 'jour',    label: "Aujourd'hui",   dans: d => d === iso(auj) },
    { v: 'semaine', label: 'Cette semaine', dans: d => d >= iso(lundi) && d <= iso(dimanche) },
    { v: 'mois',    label: 'Ce mois',       dans: d => d?.slice(0, 7) === iso(auj).slice(0, 7) },
  ]
  const dansPeriode = (p, v) => PERIODES.find(x => x.v === v).dans(p.date)
  const encaisse = v => list.filter(p => p.statut === 'PAYE' && dansPeriode(p, v)).reduce((s, p) => s + Number(p.montant), 0)
  const affiches = list.filter(p => dansPeriode(p, periode))

  // Par élève : acompte (1re tranche payée) et total payé, pour les colonnes Acompte / Reliquat / Total.
  const parEleve = {}
  for (const p of list) {
    if (!p.eleve || p.statut !== 'PAYE') continue
    const s = parEleve[p.eleve.id] ??= { acompte: 0, paye: 0 }
    s.paye += Number(p.montant)
    if (p.typePaiement === 'TRANCHE_1') s.acompte += Number(p.montant)
  }

  const del = async (p) => {
    const ok = await confirmer({ titre: 'Supprimer ce paiement ?', ton: 'danger', libelle: 'Supprimer', details: resume(p),
      message: "Il disparaîtra de la caisse et de la fiche de l'élève. Cette action est définitive." })
    if (!ok) return
    try { await api('DELETE', `/paiements/${p.id}`); toast('Paiement supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── En-tête : titre, chiffres clés, total encaissé ──────── */}
      {(() => {
        // Reste à percevoir : pour chaque élève ayant un prix, prix − payé (jamais négatif).
        const eleves = {}
        for (const p of list) if (p.eleve?.montantTotal != null) eleves[p.eleve.id] = Number(p.eleve.montantTotal)
        const aPercevoir = Object.entries(eleves).reduce((s, [id, tot]) => s + Math.max(0, tot - (parEleve[id]?.paye || 0)), 0)
        const pastille = (icon, txt, couleur = '#bfdbfe', fond = 'rgba(255,255,255,.1)') => (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full sm:whitespace-nowrap"
            style={{ background: fond, color: couleur, border: '1px solid rgba(255,255,255,.12)' }}>
            <i className={`bi bi-${icon}`} />{txt}
          </span>
        )
        return (
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 55%,#2a4f7c 100%)', boxShadow: '0 10px 30px rgba(15,34,64,.25)' }}>
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle,#f0bb2a,transparent 70%)' }} />
            <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
            <div className="relative px-5 sm:px-7 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl"
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 6px 16px rgba(212,160,23,.35)' }}>
                  <i className="bi bi-cash-coin" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>Caisse de l'auto-école</div>
                  <h2 className="text-xl sm:text-2xl text-white leading-tight m-0" style={{ fontWeight: 800 }}>Gestion des paiements</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pastille('receipt', `${list.length} paiement${list.length !== 1 ? 's' : ''} enregistré${list.length !== 1 ? 's' : ''}`)}
                    {enAttente > 0 && pastille('hourglass-split', `${enAttente} à valider`, '#1e3a5f', '#fcd34d')}
                    {pastille('hourglass-bottom', `Reste à percevoir : ${fmtMontant(aPercevoir)}`, '#fde68a')}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between lg:justify-end gap-5 flex-wrap">
                <div className="lg:text-right">
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>Total encaissé</div>
                  <div className="text-3xl font-extrabold leading-tight whitespace-nowrap" style={{ color: '#86efac' }}>
                    {totalEncaisse != null ? fmtMontant(totalEncaisse) : '—'}
                  </div>
                </div>
                <button onClick={() => openModal()}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-extrabold border-0 cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ borderRadius: '.9rem', background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 6px 16px rgba(212,160,23,.35)' }}>
                  <i className="bi bi-plus-lg" />Paiement
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Filtres de période ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PERIODES.map(o => {
          const actif = periode === o.v
          const n = list.filter(p => dansPeriode(p, o.v)).length
          return (
            <button key={o.v || 'tous'} type="button" onClick={() => { setPeriode(o.v); setPage(1) }}
              className="text-left px-4 py-3 cursor-pointer transition-all"
              style={{ borderRadius: '1rem', border: `2px solid ${actif ? '#15803d' : '#e2e8f0'}`,
                background: actif ? '#f0fdf4' : '#fff', boxShadow: actif ? '0 4px 12px rgba(22,163,74,.15)' : 'none' }}>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: actif ? '#15803d' : '#64748b' }}>
                {o.label}
              </div>
              <div className="text-[15px] sm:text-lg font-extrabold leading-tight mt-0.5 whitespace-nowrap" style={{ color: actif ? '#14532d' : '#1e293b' }}>
                {fmtMontant(encaisse(o.v))}
              </div>
              <div className="text-xs text-slate-400">{n} paiement{n !== 1 ? 's' : ''}</div>
            </button>
          )
        })}
      </div>

      {/* ── Liste des versements, groupés par jour ───────────── */}
      {(() => {
        const tries = [...affiches].sort((x, y) => (y.date || '').localeCompare(x.date || '') || y.id - x.id)
        const pageItems = tries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        const groupes = []
        for (const p of pageItems) {
          const g = groupes[groupes.length - 1]
          if (g && g.date === p.date) g.items.push(p); else groupes.push({ date: p.date, items: [p] })
        }
        const hier = new Date(auj); hier.setDate(auj.getDate() - 1)
        // court : version téléphone (« ven. 20 nov. »)
        const libelleJour = (d, court = false) => {
          if (d === iso(auj)) return "Aujourd'hui"
          if (d === iso(hier)) return 'Hier'
          const dt = new Date(`${d}T12:00:00`)
          return dt.toLocaleDateString('fr-FR', { weekday: court ? 'short' : 'long', day: 'numeric', month: court ? 'short' : 'long',
            ...(dt.getFullYear() !== auj.getFullYear() ? { year: 'numeric' } : {}) })
        }
        const encaisseJour = d => list.filter(p => p.date === d && p.statut === 'PAYE').reduce((s, p) => s + Number(p.montant), 0)
        const periodeLabel = PERIODES.find(x => x.v === periode).label
        return (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
            <div className="flex items-center justify-between gap-3 px-5 py-4"
              style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 60%,#2a4f7c 100%)', borderBottom: '3px solid #d4a017' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                  <i className="bi bi-receipt" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-white leading-tight">Historique des versements</div>
                  <div className="text-xs" style={{ color: '#bfdbfe' }}>{periode ? periodeLabel : 'Toutes les dates'} · du plus récent au plus ancien</div>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full flex-shrink-0" style={{ background: '#f0bb2a', color: '#1e3a5f' }}>
                {affiches.length}
              </span>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-[#d4a017] rounded-full animate-spin" />
                <span className="text-sm text-slate-400 font-medium">Chargement…</span>
              </div>
            ) : affiches.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                  <i className="bi bi-receipt" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                </div>
                <div className="text-sm font-medium text-slate-400">{periode ? 'Aucun paiement sur cette période' : 'Aucun paiement enregistré'}</div>
              </div>
            ) : groupes.map(g => (
              <div key={g.date}>
                <div className="flex items-center justify-between gap-3 px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                  style={{ background: '#eef2f7', color: '#475569', borderBottom: '1.5px solid #dbe2ec', borderLeft: '4px solid #d4a017' }}>
                  <span className="truncate"><i className="bi bi-calendar3 me-2" />
                    <span className="hidden sm:inline">{libelleJour(g.date)}</span><span className="sm:hidden">{libelleJour(g.date, true)}</span>
                  </span>
                  <span className="whitespace-nowrap" style={{ color: '#15803d' }}>
                    {fmtMontant(encaisseJour(g.date))}<span className="hidden sm:inline"> encaissés</span>
                  </span>
                </div>
                {g.items.map(p => {
                  const tp = TYPE_P[p.typePaiement] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: p.typePaiement }
                  const st = STATUT_P[p.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: p.statut }
                  const mp = MOYEN_P[p.moyenPaiement || 'ESPECES']
                  const se = (p.eleve && parEleve[p.eleve.id]) || { acompte: 0, paye: 0 }
                  const total = p.eleve?.montantTotal != null ? Number(p.eleve.montantTotal) : null
                  const reste = total != null ? total - se.paye : null
                  const pct = total ? Math.min(100, Math.round(se.paye / total * 100)) : 0
                  const nom = p.eleve ? `${p.eleve.prenom} ${p.eleve.nom}` : '—'
                  const ini = p.eleve ? ((p.eleve.prenom || '')[0] || '') + ((p.eleve.nom || '')[0] || '') : '?'
                  return (
                    <div key={p.id}
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 md:gap-5 items-center px-5 py-4 transition-colors hover:bg-slate-50"
                      style={{ borderBottom: '1.5px solid #dbe2ec', opacity: p.statut === 'ANNULE' ? .6 : 1 }}>
                      {/* Élève */}
                      <div className="flex items-center gap-3 min-w-0">
                        {p.eleve?.photoUrl ? (
                          <img src={p.eleve.photoUrl} alt="" className="w-11 h-11 rounded-full flex-shrink-0"
                            style={{ objectFit: 'cover', objectPosition: 'center 25%', border: '2px solid #f0bb2a' }} />
                        ) : (
                          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-extrabold"
                            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff' }}>{ini.toUpperCase()}</div>
                        )}
                        <div className="min-w-0">
                          {p.eleve && onEleveClick ? (
                            <button onClick={() => onEleveClick(p.eleve.id)}
                              className="block text-left font-bold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-full">{nom}</button>
                          ) : <div className="font-bold text-slate-700 truncate">{nom}</div>}
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
                            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{p.reference}</span>
                            {mp && <span className="font-semibold" style={{ color: mp.color }}><i className={`bi bi-${mp.icon} me-1`} />{mp.label}</span>}
                          </div>
                          {p.transactionId && <div className="text-xs text-slate-500 truncate" style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>Transaction {p.transactionId}</div>}
                        </div>
                      </div>

                      {/* Versement */}
                      <div className="flex md:block items-center justify-between gap-3">
                        <div className="text-lg font-extrabold leading-tight whitespace-nowrap" style={{ color: '#0f2240', textDecoration: p.statut === 'ANNULE' ? 'line-through' : 'none' }}>
                          {fmtMontant(p.montant)}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 whitespace-nowrap"
                          style={{ background: tp.bg, color: tp.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tp.dot }} />{tp.court || tp.label}
                        </span>
                      </div>

                      {/* Avancement de l'élève */}
                      <div className="min-w-0">
                        {total != null ? (
                          <>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                              <span className="text-slate-500">Payé <b className="text-slate-700">{fmtMontant(se.paye)}</b> / {fmtMontant(total)}</span>
                              <span className="font-bold" style={{ color: pct >= 100 ? '#15803d' : '#64748b' }}>{pct} %</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden mt-1.5" style={{ background: '#eef2f7' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg,#22c55e,#15803d)' : 'linear-gradient(90deg,#f0bb2a,#d4a017)' }} />
                            </div>
                            <div className="text-xs font-semibold mt-1" style={{ color: reste > 0 ? '#b45309' : '#15803d' }}>
                              {reste > 0 ? `Reste ${fmtMontant(reste)}` : <><i className="bi bi-check-circle-fill me-1" />Formation soldée</>}
                            </div>
                          </>
                        ) : <div className="text-xs text-slate-400">Prix de la formation non renseigné</div>}
                      </div>

                      {/* Statut et actions */}
                      <div className="flex items-center justify-between md:justify-end gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: st.bg, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />{st.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {p.statut === 'EN_ATTENTE' && <>
                            <button onClick={() => changerStatut(p, 'PAYE')} title="Valider"
                              className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: '999px', background: '#dcfce7', color: '#15803d' }}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button onClick={() => changerStatut(p, 'ANNULE')} title="Refuser"
                              className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: '999px', background: '#fef3c7', color: '#b45309' }}>
                              <i className="bi bi-x-lg" style={{ fontSize: '.8rem' }} />
                            </button>
                          </>}
                          <button onClick={() => openModal(p)} title="Modifier"
                            className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: '999px', background: '#eff6ff', color: '#2563eb' }}>
                            <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                          </button>
                          {/* Supprimer un paiement : admin seulement (refusé aussi par le serveur) */}
                          {isAdmin && <button onClick={() => del(p)} title="Supprimer"
                            className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: '999px', background: '#fee2e2', color: '#b91c1c' }}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '.75rem' }} />
                          </button>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <Pagination page={page} setPage={setPage} total={affiches.length} pageSize={PAGE_SIZE} />
          </div>
        )
      })()}

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
