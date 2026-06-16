import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtTime, fmtMontant, BADGES, LABELS } from '../utils'
import Badge from './Badge'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', telephone: '',
  adresse: '', email: '', numeroCni: '', categoriePermis: '', statut: 'EN_COURS', moniteurId: '',
  montantAvance: '',
}

const STATUTS = [
  { value: 'EN_COURS',  label: 'En cours' },
  { value: 'DIPLOME',   label: 'Diplômé' },
  { value: 'SUSPENDU',  label: 'Suspendu' },
  { value: 'ABANDONNE', label: 'Abandonné' },
]

const STATUT_STYLE = {
  EN_COURS:  { bg: '#eff6ff', color: '#1d4ed8', label: 'En cours' },
  DIPLOME:   { bg: '#f0fdf4', color: '#15803d', label: 'Diplômé' },
  SUSPENDU:  { bg: '#fef9c3', color: '#a16207', label: 'Suspendu' },
  ABANDONNE: { bg: '#fef2f2', color: '#b91c1c', label: 'Abandonné' },
}

function age(d) {
  if (!d) return null
  const [y, m, dd] = d.split('-').map(Number)
  const t = new Date(); let a = t.getFullYear() - y
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < dd)) a--
  return a
}

function initials(nom = '', prenom = '') {
  return ((nom[0] || '') + (prenom[0] || '')).toUpperCase()
}

/* ─── Onglet Leçons ─────────────────────────────────────── */
function TabLecons({ lecons }) {
  if (!lecons.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }} />
      <div className="mt-2 text-sm">Aucune leçon enregistrée</div>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {['Date','Horaire','Type','Moniteur','Statut','Observations'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {lecons.map(l => (
            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-500">{fmtDate(l.date)}</td>
              <td className="px-4 py-3 text-slate-600">{fmtTime(l.heureDebut)} – {fmtTime(l.heureFin)}</td>
              <td className="px-4 py-3"><Badge value={l.type} map={BADGES.type_lecon} /></td>
              <td className="px-4 py-3 text-slate-500 text-xs">{l.moniteur ? `${l.moniteur.nom} ${l.moniteur.prenom}` : '—'}</td>
              <td className="px-4 py-3"><Badge value={l.statut} map={BADGES.statut_lecon} /></td>
              <td className="px-4 py-3 text-slate-400 text-xs">{l.observations || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Onglet Examens ────────────────────────────────────── */
function TabExamens({ examens }) {
  if (!examens.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className="bi bi-clipboard-x" style={{ fontSize: '2rem' }} />
      <div className="mt-2 text-sm">Aucun examen enregistré</div>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {['Date','Type','Résultat','Score','Tentative','Observations'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {examens.map(e => (
            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-500">{fmtDate(e.date)}</td>
              <td className="px-4 py-3"><Badge value={e.type} map={BADGES.type_lecon} /></td>
              <td className="px-4 py-3"><Badge value={e.resultat} map={BADGES.resultat} /></td>
              <td className="px-4 py-3 text-slate-600 font-medium">{e.score != null ? `${e.score}/100` : '—'}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">#{e.tentative}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">{e.observations || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Onglet Paiements ──────────────────────────────────── */
function TabPaiements({ paiements, totalPaye }) {
  if (!paiements.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className="bi bi-receipt-cutoff" style={{ fontSize: '2rem' }} />
      <div className="mt-2 text-sm">Aucun paiement enregistré</div>
    </div>
  )
  return (
    <>
      <div className="px-5 pt-4 pb-2">
        <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold px-4 py-2 rounded-xl">
          <i className="bi bi-cash-coin" />
          Total encaissé : {fmtMontant(totalPaye)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {['Réf.','Date','Type','Montant','Statut','Notes'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paiements.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{p.reference}</td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(p.date)}</td>
                <td className="px-4 py-3"><Badge value={p.typePaiement} map={BADGES.type_paiement} /></td>
                <td className="px-4 py-3 font-semibold text-slate-700">{fmtMontant(p.montant)}</td>
                <td className="px-4 py-3"><Badge value={p.statut} map={BADGES.statut_paiement} /></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{p.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ─── Compte élève ──────────────────────────────────────── */
function CompteEleveCard({ eleve }) {
  const [statut, setStatut]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creds, setCreds]     = useState(null)

  useEffect(() => {
    api('GET', `/eleves/${eleve.id}/compte`)
      .then(setStatut).catch(() => {}).finally(() => setLoading(false))
  }, [eleve.id])

  const creerCompte = async () => {
    setCreating(true)
    try {
      const res = await api('POST', `/eleves/${eleve.id}/creer-compte`)
      setCreds(res); setStatut({ compteActif: true, email: res.email })
      toast('Compte créé avec succès')
    } catch (e) { toast(e.message || 'Erreur création compte', 'danger') }
    finally { setCreating(false) }
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#eff6ff' }}>
          <i className="bi bi-person-lock" style={{ color: '#1e3a5f', fontSize: '.8rem' }} />
        </div>
        <span className="font-bold text-slate-700 text-sm">Compte élève</span>
      </div>
      <div className="px-5 py-4">
        {statut?.compteActif ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <i className="bi bi-check-circle-fill" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-700">Compte actif</div>
              <div className="text-xs text-slate-400">{statut.email}</div>
            </div>
          </div>
        ) : eleve.email ? (
          <>
            <div className="text-sm text-slate-400 mb-3 flex items-center gap-1.5">
              <i className="bi bi-info-circle" />Aucun compte créé
            </div>
            <button
              onClick={creerCompte} disabled={creating}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none', cursor: creating ? 'not-allowed' : 'pointer' }}
            >
              {creating
                ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }}></span>Création…</>
                : <><i className="bi bi-person-plus" />Créer le compte</>}
            </button>
            {creds && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                <div className="font-bold text-emerald-700 mb-1">Identifiants créés</div>
                <div>Email : <code className="bg-white px-1 rounded">{creds.email}</code></div>
                <div className="mt-1">Mot de passe : <code className="bg-white px-1 rounded">{creds.motDePasse}</code></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400 flex items-center gap-1.5">
            <i className="bi bi-exclamation-triangle text-amber-500" />
            Renseignez un email pour créer un compte
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Eleves({ initialEleveId }) {
  const { user } = useAuth()
  const isMoniteur = user?.role === 'MONITEUR'

  const [list, setList]           = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [statut, setStatut]       = useState('')
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(1)
  const [profileData, setProfileData] = useState({ lecons: [], examens: [], paiements: [], totalPaye: 0 })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('lecons')

  const load = async () => {
    setLoading(true)
    try {
      const data = isMoniteur ? await api('GET', '/moniteur/mes-eleves') : await api('GET', '/eleves')
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement élèves', 'danger') }
    finally { setLoading(false) }
    if (!isMoniteur) {
      try { setMoniteurs(await api('GET', '/moniteurs')) } catch { /* optionnel */ }
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!initialEleveId) return
    api('GET', `/eleves/${initialEleveId}`)
      .then(eleve => openProfile(eleve))
      .catch(() => toast('Élève introuvable', 'danger'))
  }, [initialEleveId])

  useEffect(() => {
    let r = list
    if (search.trim()) {
      const t = search.toLowerCase()
      r = r.filter(e => `${e.nom} ${e.prenom} ${e.telephone}`.toLowerCase().includes(t))
    }
    if (statut) r = r.filter(e => e.statut === statut)
    setFiltered(r)
    setPage(1)
  }, [search, statut, list])

  const openProfile = async (eleve, initialTab = 'lecons') => {
    setSelected(eleve); setActiveTab(initialTab); setLoadingProfile(true)
    try {
      const [lecons, examens, paiements, tp] = await Promise.all([
        api('GET', `/eleves/${eleve.id}/lecons`),
        api('GET', `/eleves/${eleve.id}/examens`),
        api('GET', `/eleves/${eleve.id}/paiements`),
        api('GET', `/eleves/${eleve.id}/total-paye`),
      ])
      setProfileData({ lecons, examens, paiements, totalPaye: tp?.totalPaye ?? 0 })
    } catch { toast('Erreur chargement profil', 'danger') }
    finally { setLoadingProfile(false) }
  }

  const closeProfile = () => { setSelected(null); setProfileData({ lecons: [], examens: [], paiements: [], totalPaye: 0 }) }

  const changerStatut = async (id, newStatut) => {
    try {
      await api('PATCH', `/eleves/${id}/statut`, { statut: newStatut })
      toast('Statut mis à jour'); await load()
      if (selected?.id === id) setSelected(s => ({ ...s, statut: newStatut }))
    } catch (e) { toast(e.message, 'danger') }
  }

  const openModal = (eleve = null) => {
    if (eleve) {
      setEditId(eleve.id)
      setForm({ nom: eleve.nom, prenom: eleve.prenom, dateNaissance: eleve.dateNaissance,
        telephone: eleve.telephone, adresse: eleve.adresse || '', email: eleve.email || '',
        numeroCni: eleve.numeroCni || '', categoriePermis: eleve.categoriePermis, statut: eleve.statut,
        moniteurId: eleve.moniteur?.id || '' })
    } else { setEditId(null); setForm(EMPTY) }
    setShowModal(true)
  }

  const save = async () => {
    const { nom, prenom, telephone, categoriePermis, dateNaissance } = form
    if (!nom || !prenom || !telephone || !categoriePermis || !dateNaissance) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    if (!editId && (!form.montantAvance || parseFloat(form.montantAvance) <= 0)) {
      toast('Le montant avancé à l\'inscription est obligatoire', 'warning'); return
    }
    const data = { ...form, adresse: form.adresse || null, email: form.email || null,
      numeroCni: form.numeroCni || null, moniteurId: form.moniteurId ? Number(form.moniteurId) : null,
      montantAvance: form.montantAvance ? parseFloat(form.montantAvance) : null }
    try {
      if (editId) {
        await api('PUT', `/eleves/${editId}`, data); toast('Élève modifié')
        setShowModal(false); await load()
        if (selected?.id === editId) setSelected(await api('GET', `/eleves/${editId}`))
      } else {
        const created = await api('POST', '/eleves', data); toast('Élève créé')
        setShowModal(false); await load()
        openProfile(created, 'paiements')
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!confirm('Supprimer cet élève définitivement ?')) return
    try { await api('DELETE', `/eleves/${id}`); toast('Élève supprimé'); closeProfile(); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function Modal() {
    const inputCls = "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
    const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
    return (
      <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem' }}>
            <div className="modal-header border-0 px-6 pt-5 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(212,160,23,.12)', color: '#d4a017' }}>
                  <i className="bi bi-person-plus-fill" />
                </div>
                <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>
                  {editId ? "Modifier l'élève" : 'Nouvel élève'}
                </h5>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <div className="modal-body px-6 py-4">
              <div className="row g-3">
                {[
                  { key: 'nom',           label: 'Nom',             req: true,  type: 'text' },
                  { key: 'prenom',        label: 'Prénom',          req: true,  type: 'text' },
                  { key: 'dateNaissance', label: 'Date de naissance', req: true, type: 'date' },
                  { key: 'telephone',     label: 'Téléphone',       req: true,  type: 'text', ph: '7XXXXXXXX' },
                  { key: 'email',         label: 'Email',           req: false, type: 'email' },
                  { key: 'numeroCni',     label: 'Numéro CNI',      req: false, type: 'text' },
                ].map(f => (
                  <div key={f.key} className="col-md-6">
                    <label className={labelCls}>{f.label}{f.req && <span className="text-red-500 ml-0.5"> *</span>}</label>
                    <input type={f.type} className={inputCls} placeholder={f.ph || ''}
                      value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-md-6">
                  <label className={labelCls}>Catégorie de permis <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={form.categoriePermis}
                    onChange={e => setForm(fm => ({ ...fm, categoriePermis: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {['A','A1','B','C','D','EB','EC'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className={labelCls}>Moniteur assigné</label>
                  <select className={inputCls} value={form.moniteurId}
                    onChange={e => setForm(fm => ({ ...fm, moniteurId: e.target.value }))}>
                    <option value="">— Aucun moniteur —</option>
                    {moniteurs.filter(m => m.actif).map(m => (
                      <option key={m.id} value={m.id}>{m.nom} {m.prenom}</option>
                    ))}
                  </select>
                </div>
                {editId && (
                  <div className="col-md-6">
                    <label className={labelCls}>Statut</label>
                    <select className={inputCls} value={form.statut}
                      onChange={e => setForm(fm => ({ ...fm, statut: e.target.value }))}>
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-12">
                  <label className={labelCls}>Adresse</label>
                  <input className={inputCls} value={form.adresse}
                    onChange={e => setForm(fm => ({ ...fm, adresse: e.target.value }))} />
                </div>
                {!editId && (
                  <div className="col-12">
                    <label className={labelCls}>
                      Montant avancé à l'inscription (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                      placeholder="Ex: 50000 FCFA"
                      value={form.montantAvance}
                      onChange={e => setForm(fm => ({ ...fm, montantAvance: e.target.value }))} />
                    <p className="text-xs text-slate-400 mt-1">
                      Un paiement de type <strong>Inscription</strong> sera automatiquement créé
                    </p>
                  </div>
                )}
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
    )
  }

  /* ══ VUE PROFIL ══════════════════════════════════════════ */
  if (selected) {
    const s = selected
    const st = STATUT_STYLE[s.statut] || { bg: '#f1f5f9', color: '#64748b', label: s.statut }

    return (
      <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Bannière */}
        <div className="rounded-2xl px-6 py-2 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #d4a017 0%, transparent 70%)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={closeProfile}
                className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm font-medium transition-colors border-0 bg-transparent cursor-pointer">
                <i className="bi bi-arrow-left" />
                <span className="hidden sm:inline">Retour</span>
              </button>
              <div className="w-px h-6 bg-white/20" />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                {initials(s.nom, s.prenom)}
              </div>
              <div>
                <div className="font-extrabold text-base leading-tight">{s.nom} {s.prenom}</div>
                {s.email && <div className="text-blue-200 text-xs">{s.email}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>{st.label}</span>
              {!isMoniteur && (
                <>
                  <select className="text-xs font-semibold px-3 py-1.5 rounded-xl border-0 outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}
                    value={s.statut} onChange={e => changerStatut(s.id, e.target.value)}>
                    {STATUTS.map(st => <option key={st.value} value={st.value} style={{ color: '#1e293b' }}>{st.label}</option>)}
                  </select>
                  <button onClick={() => openModal(s)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                    <i className="bi bi-pencil-fill" />Modifier
                  </button>
                  <button onClick={() => del(s.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5' }}>
                    <i className="bi bi-trash-fill" />Supprimer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Colonne gauche */}
          <div className="space-y-4">

            {/* Infos personnelles */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#eff6ff' }}>
                  <i className="bi bi-person-lines-fill" style={{ color: '#1e3a5f', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Informations</span>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Téléphone', value: s.telephone },
                  { label: 'CNI',       value: s.numeroCni },
                  { label: 'Adresse',   value: s.adresse },
                  { label: 'Naissance', value: s.dateNaissance ? `${fmtDate(s.dateNaissance)} (${age(s.dateNaissance)} ans)` : null },
                  { label: 'Inscription', value: fmtDate(s.dateInscription) },
                  { label: 'Catégorie', value: s.categoriePermis },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-slate-700 font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Moniteur assigné */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#fef9c3' }}>
                  <i className="bi bi-person-badge-fill" style={{ color: '#ca8a04', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Moniteur assigné</span>
              </div>
              <div className="px-5 py-4">
                {s.moniteur ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                      style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f' }}>
                      {initials(s.moniteur.nom, s.moniteur.prenom)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-700">{s.moniteur.nom} {s.moniteur.prenom}</div>
                      {s.moniteur.telephone && <div className="text-xs text-slate-400">{s.moniteur.telephone}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 flex items-center gap-1.5 py-1">
                    <i className="bi bi-person-x" />Aucun moniteur assigné
                  </div>
                )}
              </div>
            </div>

            {/* Suivi formation */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                  <i className="bi bi-bar-chart-fill" style={{ color: '#16a34a', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Suivi de formation</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center py-4">
                {[
                  { val: s.nombreLeconsCode,      label: 'Code',     color: '#1e3a5f' },
                  { val: s.nombreLeconsConduite,   label: 'Conduite', color: '#10b981' },
                  { val: s.nombreLeconsCode + s.nombreLeconsConduite, label: 'Total', color: '#6366f1' },
                ].map(({ val, label, color }) => (
                  <div key={label}>
                    <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {!loadingProfile && !isMoniteur && (
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Encaissé</span>
                  <span className="text-sm font-bold text-emerald-600">{fmtMontant(profileData.totalPaye)}</span>
                </div>
              )}
            </div>

            {/* Compte élève */}
            {!isMoniteur && <CompteEleveCard eleve={s} />}
          </div>

          {/* Colonne droite — onglets */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              {/* Onglets */}
              <div className="flex border-b border-slate-100 px-2 pt-2">
                {[
                  { key: 'lecons',    icon: 'journal-text',          label: 'Leçons',    count: profileData.lecons.length },
                  { key: 'examens',   icon: 'clipboard2-check-fill', label: 'Examens',   count: profileData.examens.length },
                  ...(!isMoniteur ? [{ key: 'paiements', icon: 'cash-stack', label: 'Paiements', count: profileData.paiements.length }] : []),
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-0 bg-transparent cursor-pointer transition-all"
                    style={{
                      color: activeTab === tab.key ? '#1e3a5f' : '#94a3b8',
                      borderBottom: activeTab === tab.key ? '2px solid #1e3a5f' : '2px solid transparent',
                    }}>
                    <i className={`bi bi-${tab.icon}`} />
                    {tab.label}
                    {!loadingProfile && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={activeTab === tab.key
                          ? { background: '#eff6ff', color: '#1e3a5f' }
                          : { background: '#f1f5f9', color: '#94a3b8' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {loadingProfile ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {activeTab === 'lecons'    && <TabLecons    lecons={profileData.lecons} />}
                  {activeTab === 'examens'   && <TabExamens   examens={profileData.examens} />}
                  {activeTab === 'paiements' && !isMoniteur && <TabPaiements paiements={profileData.paiements} totalPaye={profileData.totalPaye} />}
                </>
              )}
            </div>
          </div>
        </div>

        {showModal && Modal()}
      </div>
    )
  }

  /* ══ VUE LISTE ═══════════════════════════════════════════ */
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      {!isMoniteur && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Élèves</h2>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} élève{filtered.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => openModal()}
            className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl border-0 cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
            <i className="bi bi-plus-lg" />Nouvel élève
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 flex gap-3 flex-wrap" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-slate-50 border-2 rounded-xl px-3 py-2 focus-within:border-[#f0bb2a] transition-all" style={{ borderColor: '#d4a017' }}>
          <i className="bi bi-search text-slate-400" style={{ fontSize: '.9rem' }} />
          <input className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400"
            placeholder="Nom, prénom, téléphone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="bg-slate-50 border-2 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:border-[#f0bb2a] transition-all cursor-pointer" style={{ borderColor: '#d4a017' }}
          value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-5 py-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#2a4f7c 100%)', borderBottom: '2px solid #142a47' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-people-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{isMoniteur ? 'Mes Élèves' : 'Liste des Élèves'}</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(147,197,253,.85)' }}>
              {filtered.length} élève{filtered.length > 1 ? 's' : ''} · suivi de formation
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {filtered.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['#','Nom & Prénom','Téléphone','Moniteur','Catégorie','Leçons','Statut','Inscription',''].map((h, i) => (
                  <th key={i} className={`px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 8 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="9" className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9">
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem' }} />
                    <div className="mt-2 text-sm font-medium">Aucun élève enregistré</div>
                  </div>
                </td></tr>
              ) : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((e, i) => {
                const st = STATUT_STYLE[e.statut] || { bg: '#f1f5f9', color: '#64748b', label: e.statut }
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <button className="text-left border-0 bg-transparent cursor-pointer p-0"
                        onClick={() => openProfile(e)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                            style={{ background: 'rgba(30,58,95,.08)', color: '#1e3a5f' }}>
                            {initials(e.nom, e.prenom)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1e3a5f] text-sm hover:underline">{e.nom} {e.prenom}</div>
                            {e.email && <div className="text-xs text-slate-400">{e.email}</div>}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{e.telephone}</td>
                    <td className="px-4 py-3.5">
                      {e.moniteur
                        ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                            {e.moniteur.nom} {e.moniteur.prenom}
                          </span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {e.categoriePermis}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span><i className="bi bi-book me-1" />{e.nombreLeconsCode}</span>
                        <span><i className="bi bi-car-front me-1" />{e.nombreLeconsConduite}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{fmtDate(e.dateInscription)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openProfile(e)} title="Voir profil"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                          <i className="bi bi-eye-fill" style={{ fontSize: '.8rem' }} />
                        </button>
                        {!isMoniteur && <>
                          <button onClick={() => openModal(e)} title="Modifier"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#f8fafc', color: '#64748b' }}>
                            <i className="bi bi-pencil-fill" style={{ fontSize: '.8rem' }} />
                          </button>
                          <button onClick={() => del(e.id)} title="Supprimer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#fef2f2', color: '#dc2626' }}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '.8rem' }} />
                          </button>
                        </>}
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

      {showModal && Modal()}
    </div>
  )
}
