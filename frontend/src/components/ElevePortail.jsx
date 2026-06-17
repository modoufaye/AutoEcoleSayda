import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate } from '../utils'
import { useAuth } from '../context/AuthContext'
import { toast } from './Toast'
import '../landing.css'

const RES_STYLE = {
  ADMIS:      { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Admis' },
  REFUSE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Refusé' },
  EN_ATTENTE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En attente' },
}
const TYPE_STYLE = {
  CODE:     { bg: '#eff6ff', color: '#2563eb', label: 'Code' },
  CONDUITE: { bg: '#f0fdf4', color: '#16a34a', label: 'Conduite' },
}
const STATUT_LECON = {
  PLANIFIEE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Planifiée' },
  TERMINEE:  { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Terminée' },
  ANNULEE:   { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Annulée' },
}

const FIELD_META_PERSO = [
  { key: 'prenom',    label: 'Prénom',     icon: 'person-fill',       iconBg: '#eff6ff', iconColor: '#2563eb' },
  { key: 'nom',       label: 'Nom',        icon: 'person-badge-fill', iconBg: '#f5f3ff', iconColor: '#7c3aed' },
  { key: 'telephone', label: 'Téléphone',  icon: 'telephone-fill',    iconBg: '#fef9c3', iconColor: '#a16207' },
  { key: 'email',     label: 'Email',      icon: 'envelope-fill',     iconBg: '#ecfeff', iconColor: '#0891b2' },
  { key: 'adresse',   label: 'Adresse',    icon: 'geo-alt-fill',      iconBg: '#fdf4ff', iconColor: '#9333ea' },
  { key: 'numeroCni', label: 'Numéro CNI', icon: 'credit-card-fill',  iconBg: '#f0fdf4', iconColor: '#16a34a' },
]

function initials(prenom = '', nom = '') {
  return ((prenom[0] || '') + (nom[0] || '')).toUpperCase()
}

function TableLecons({ lecons, empty }) {
  if (!lecons.length) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <i className={`bi bi-${empty.icon}`} style={{ fontSize: '1.2rem', color: '#94a3b8' }} />
      </div>
      <div className="text-sm font-medium text-slate-400">{empty.text}</div>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['#', 'Date', 'Horaire', 'Moniteur', 'Statut', 'Observations'].map((h, i) => (
              <th key={h} className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...lecons].sort((a, b) => b.date.localeCompare(a.date)).map((l, i) => {
            const st = STATUT_LECON[l.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: l.statut }
            return (
              <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                className="transition-colors hover:bg-blue-50/40">
                <td className="py-3.5 px-4 text-center">
                  <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-sm font-semibold text-slate-700">{fmtDate(l.date)}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-500">
                    {l.heureDebut ? `${l.heureDebut.slice(0,5)} – ${l.heureFin?.slice(0,5)}` : '—'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-xs text-slate-500">
                    {l.moniteur ? `${l.moniteur.prenom} ${l.moniteur.nom}` : '—'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                    {st.label}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[160px] truncate">{l.observations || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ElevePortail({ onGoSection }) {
  const { user } = useAuth()
  const [profil, setProfil]   = useState(null)
  const [examens, setExamens] = useState([])
  const [lecons, setLecons]   = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur]   = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    Promise.all([
      api('GET', '/eleve/profil'),
      api('GET', '/eleve/mes-examens'),
      api('GET', '/eleve/mes-lecons'),
    ])
      .then(([p, e, l]) => { setProfil(p); setExamens(e); setLecons(l); setForm(toForm(p)) })
      .catch(err => setErreur(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  function toForm(p) {
    return { prenom: p.prenom || '', nom: p.nom || '', telephone: p.telephone || '',
      email: p.email || '', adresse: p.adresse || '', numeroCni: p.numeroCni || '' }
  }

  const saveInfos = async () => {
    if (!form.prenom || !form.nom || !form.telephone) {
      toast('Prénom, nom et téléphone sont obligatoires', 'warning'); return
    }
    setSaving(true)
    try {
      const updated = await api('PUT', '/eleve/profil', form)
      setProfil(updated); setForm(toForm(updated)); setEditMode(false)
      toast('Informations mises à jour')
    } catch (e) { toast(e.message || 'Erreur lors de la sauvegarde', 'danger') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Chargement de votre espace…</span>
      </div>
    </div>
  )

  if (erreur) return (
    <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
        <i className="bi bi-exclamation-triangle-fill text-amber-500" style={{ fontSize: '1.1rem' }} />
      </div>
      <div>
        <div className="font-bold">{erreur}</div>
        <div className="text-sm mt-0.5 text-amber-600">Votre compte n'est pas encore lié à un profil élève. Contactez l'administration.</div>
      </div>
    </div>
  )

  const today          = new Date().toISOString().split('T')[0]
  const prochainExamen = examens.filter(e => e.date >= today && e.resultat === 'EN_ATTENTE').sort((a, b) => a.date.localeCompare(b.date))[0]
  const leconsConduite = lecons.filter(l => l.type === 'CONDUITE')
  const leconsCode     = lecons.filter(l => l.type === 'CODE')
  const examensAdmis   = examens.filter(e => e.resultat === 'ADMIS')
  const joursAvant     = prochainExamen ? Math.ceil((new Date(prochainExamen.date) - new Date()) / 86400000) : null
  const statutLabel    = { DIPLOME: 'Diplômé', EN_COURS: 'En formation', SUSPENDU: 'Suspendu', ABANDONNE: 'Abandonné' }[profil.statut] || profil.statut
  const statutColor    = { DIPLOME: { bg: 'rgba(212,160,23,.28)', color: '#fbbf24' }, EN_COURS: { bg: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.92)' }, SUSPENDU: { bg: 'rgba(239,68,68,.25)', color: '#fca5a5' }, ABANDONNE: { bg: 'rgba(100,116,139,.25)', color: '#cbd5e1' } }[profil.statut] || { bg: 'rgba(255,255,255,.15)', color: '#fff' }

  const admisCode     = examens.some(e => e.type === 'CODE'     && e.resultat === 'ADMIS')
  const admisConduite = examens.some(e => e.type === 'CONDUITE' && e.resultat === 'ADMIS')

  const journeySteps = [
    { icon: 'pencil-fill',           label: 'Inscription',     done: true },
    { icon: 'sign-turn-right-fill',  label: 'Cours Code',      done: leconsCode.length > 0 },
    { icon: 'car-front-fill',        label: 'Cours Conduite',  done: leconsConduite.length > 0 },
    { icon: 'clipboard2-check-fill', label: 'Examen Code',     done: admisCode },
    { icon: 'car-front',             label: 'Examen Conduite', done: admisConduite },
    { icon: 'award-fill',            label: 'Diplôme',         done: profil.statut === 'DIPLOME' },
  ]
  const currentStep = journeySteps.findIndex(s => !s.done)
  const activeIdx   = currentStep === -1 ? journeySteps.length - 1 : currentStep

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
  const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══ BANNIÈRE ══════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 50%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.3)' }}>

        <div className="absolute top-0 right-0 w-72 h-72 opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5 rounded-full translate-y-1/2 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />

        <div className="relative px-6 py-2 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold"
                style={{ background: 'linear-gradient(135deg, #d4a017, #f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.4)' }}>
                {initials(profil.prenom, profil.nom)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center"
                style={{ background: profil.statut === 'DIPLOME' ? '#d4a017' : profil.statut === 'EN_COURS' ? '#22c55e' : '#94a3b8' }}>
                <i className={`bi bi-${profil.statut === 'DIPLOME' ? 'award-fill' : profil.statut === 'EN_COURS' ? 'play-fill' : 'pause-fill'}`}
                  style={{ fontSize: '.45rem', color: '#fff' }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-0.5">Mon espace</div>
              <div className="text-xl font-extrabold text-white leading-tight">{profil.prenom} {profil.nom}</div>
              {profil.email && <div className="text-sm text-blue-200 mt-0.5">{profil.email}</div>}
            </div>
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
              style={{ background: statutColor.bg, color: statutColor.color, borderColor: 'rgba(255,255,255,.1)' }}>
              {statutLabel}
            </span>

            {prochainExamen && (
              <div className="rounded-xl px-4 py-2.5 text-center border"
                style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)' }}>
                <div className="text-xs text-blue-300 font-medium mb-1">Prochain examen</div>
                <div className="font-extrabold text-white text-base leading-none">{fmtDate(prochainExamen.date)}</div>
                <div className="mt-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: TYPE_STYLE[prochainExamen.type]?.bg, color: TYPE_STYLE[prochainExamen.type]?.color }}>
                    {TYPE_STYLE[prochainExamen.type]?.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barre de stats */}
        <div className="grid grid-cols-4 border-t" style={{ borderColor: 'rgba(255,255,255,.08)', background: 'rgba(0,0,0,.15)' }}>
          {[
            { label: 'Cours conduite', value: leconsConduite.length, icon: 'car-front-fill',        color: '#60a5fa' },
            { label: 'Cours code',     value: leconsCode.length,     icon: 'sign-turn-right-fill',  color: '#a78bfa' },
            { label: 'Examens',        value: examens.length,        icon: 'clipboard2-check-fill', color: '#38bdf8' },
            { label: 'Admis',          value: examensAdmis.length,   icon: 'patch-check-fill',      color: '#4ade80' },
          ].map(({ label, value, icon, color }, i) => (
            <div key={label} className={`flex flex-col items-center py-2 ${i > 0 ? 'border-l' : ''}`}
              style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <i className={`bi bi-${icon}`} style={{ color, fontSize: '.85rem', marginBottom: 4 }} />
              <div className="text-lg font-extrabold text-white leading-none">{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerte examen proche ── */}
      {prochainExamen && joursAvant <= 30 && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium"
          style={joursAvant <= 7
            ? { background: 'linear-gradient(135deg,#fef2f2,#fff5f5)', color: '#dc2626', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(220,38,38,.1)' }
            : { background: 'linear-gradient(135deg,#fefce8,#fffef5)', color: '#a16207', border: '1px solid #fde68a', boxShadow: '0 2px 8px rgba(161,98,7,.08)' }
          }>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: joursAvant <= 7 ? '#fee2e2' : '#fef9c3' }}>
            <i className="bi bi-alarm-fill" style={{ fontSize: '.9rem' }} />
          </div>
          <div>
            <span className="font-bold">Examen {TYPE_STYLE[prochainExamen.type]?.label} dans {joursAvant} jour{joursAvant > 1 ? 's' : ''}</span>
            <span className="font-normal opacity-80"> — le {fmtDate(prochainExamen.date)}</span>
          </div>
        </div>
      )}

      {/* ── Raccourcis rapides ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: 'play-circle-fill',      label: 'Mes Séances',  sub: 'Cours vidéo',                  color: '#06b6d4', bg: 'linear-gradient(135deg,#ecfeff,#f0fdff)', border: '#a5f3fc', sec: 'seances-eleve' },
          { icon: 'sign-turn-right-fill',  label: 'Cours Code',   sub: 'Théorie du code de la route',  color: '#d4a017', bg: 'linear-gradient(135deg,#fefce8,#fffbeb)', border: '#fde68a', sec: 'cours' },
          { icon: 'clipboard2-check-fill', label: 'Mes Examens',  sub: `${examens.length} au total`,   color: '#fb923c', bg: 'linear-gradient(135deg,#fff7ed,#fffbf5)', border: '#fed7aa', sec: 'examens' },
        ].map(({ icon, label, sub, color, bg, border, sec }) => (
          <button key={sec}
            onClick={() => onGoSection?.(sec)}
            className="flex items-center gap-3 p-4 rounded-2xl border text-left w-full cursor-pointer transition-all"
            style={{ background: bg, borderColor: border, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: color + '22', border: `1px solid ${color}44` }}>
              <i className={`bi bi-${icon}`} style={{ color, fontSize: '1.1rem' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-slate-800 text-sm leading-tight">{label}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{sub}</div>
            </div>
            <i className="bi bi-chevron-right flex-shrink-0" style={{ color: '#cbd5e1', fontSize: '.75rem' }} />
          </button>
        ))}
      </div>

      {/* ── Parcours de formation ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="flex items-center gap-3 px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.18)' }}>
            <i className="bi bi-map-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white leading-tight">Parcours de formation</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(147,197,253,.85)' }}>Votre progression étape par étape</div>
          </div>
          <span className="ms-auto text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
            {Math.round((journeySteps.filter(s => s.done).length / journeySteps.length) * 100)}%
          </span>
        </div>
        <div className="px-4 py-5">
          <div className="flex items-start">
            {journeySteps.map((step, i) => (
              <div key={step.label} className="flex-1 flex flex-col items-center relative">
                {i < journeySteps.length - 1 && (
                  <div className="absolute h-0.5 z-0"
                    style={{
                      top: 20, left: '50%', width: '100%',
                      background: step.done && journeySteps[i + 1]?.done
                        ? 'linear-gradient(90deg,#1e3a5f,#2a4f7c)'
                        : i < activeIdx
                        ? 'linear-gradient(90deg,#1e3a5f,#d4a017)'
                        : '#e2e8f0'
                    }} />
                )}
                <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2"
                  style={
                    step.done
                      ? { background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderColor: '#1e3a5f', boxShadow: '0 2px 10px rgba(30,58,95,.35)' }
                      : i === activeIdx
                      ? { background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', borderColor: '#d4a017', boxShadow: '0 2px 10px rgba(212,160,23,.4)' }
                      : { background: '#f8fafc', borderColor: '#e2e8f0' }
                  }>
                  <i className={`bi bi-${step.icon}`}
                    style={{ fontSize: '.8rem', color: step.done ? '#fff' : i === activeIdx ? '#1e3a5f' : '#cbd5e1' }} />
                </div>
                <div className="mt-2 text-center px-1">
                  <div className="text-xs font-bold leading-tight"
                    style={{ color: step.done ? '#1e3a5f' : i === activeIdx ? '#d4a017' : '#94a3b8' }}>
                    {step.label}
                  </div>
                  {step.done
                    ? <div className="text-xs mt-0.5 font-semibold" style={{ color: '#22c55e' }}>Complété</div>
                    : i === activeIdx
                    ? <div className="text-xs mt-0.5 font-semibold" style={{ color: '#d4a017' }}>En cours</div>
                    : <div className="text-xs mt-0.5" style={{ color: '#e2e8f0' }}>—</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ COURS CODE ════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', borderBottom: '2px solid #052e16' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.18)' }}>
              <i className="bi bi-sign-turn-right-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">Cours Code</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(147,197,253,.85)' }}>Formation théorique du code de la route</div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {leconsCode.length}
          </span>
        </div>
        <TableLecons lecons={leconsCode} empty={{ icon: 'book', text: 'Aucun cours de code enregistré' }} />
      </div>

      {/* ══ COURS CONDUITE ════════════════════════════════════ */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', borderBottom: '2px solid #4d1f04' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.18)' }}>
              <i className="bi bi-car-front-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">Cours Conduite</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(253,230,138,.85)' }}>Formation pratique à la conduite</div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {leconsConduite.length}
          </span>
        </div>
        <TableLecons lecons={leconsConduite} empty={{ icon: 'car-front', text: 'Aucun cours de conduite enregistré' }} />
      </div>

      {/* ══ INFOS : 2 colonnes ════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Informations personnelles */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 px-6 py-3"
            style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)', borderBottom: '2px solid #3b0764' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-person-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight text-white">Informations personnelles</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(221,214,254,.85)' }}>Modifiables à tout moment</div>
            </div>
          </div>

          {editMode ? (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[{ key: 'prenom', label: 'Prénom' }, { key: 'nom', label: 'Nom' }].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input className={inputCls} value={form[f.key]}
                      onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              {[
                { key: 'telephone', label: 'Téléphone', type: 'tel' },
                { key: 'adresse',   label: 'Adresse',   type: 'text' },
                { key: 'numeroCni', label: 'Numéro CNI', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input className={inputCls} type={f.type} value={form[f.key]}
                    onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={form.email} readOnly
                  style={{ cursor: 'not-allowed', opacity: .6 }}
                  title="L'email ne peut pas être modifié ici" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setForm(toForm(profil)); setEditMode(false) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Annuler
                </button>
                <button onClick={saveInfos} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer"
                  style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: saving ? 'none' : '0 4px 12px rgba(30,58,95,.3)' }}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13 }}></span>Enregistrement…</>
                    : <><i className="bi bi-check-lg" />Enregistrer</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-2">
                {FIELD_META_PERSO.map(({ key, label, icon, iconBg, iconColor }, i, arr) => (
                  <div key={key} className={`flex items-center gap-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                      <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.78rem' }} />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                      <span className="text-sm text-slate-700 font-medium text-right truncate max-w-[55%]">
                        {profil[key] || <span className="text-slate-300 font-normal">—</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-50">
                <button onClick={() => setEditMode(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)', color: '#fff', boxShadow: '0 4px 12px rgba(76,29,149,.35)' }}>
                  <i className="bi bi-pencil-fill" style={{ fontSize: '.8rem' }} />
                  Modifier mes informations
                </button>
              </div>
            </>
          )}
        </div>

        {/* Informations de formation */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 px-6 py-3"
            style={{ background: 'linear-gradient(135deg, #164e63 0%, #0891b2 100%)', borderBottom: '2px solid #0c3547' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-mortarboard-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">Informations de formation</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(165,243,252,.85)' }}>Gérées par l'administration</div>
            </div>
          </div>
          <div className="px-6 py-2">
            {[
              { icon: 'card-checklist', iconBg: '#eff6ff', iconColor: '#2563eb', label: 'Catégorie',     value: profil.categoriePermis },
              { icon: 'circle-fill',    iconBg: '#f0fdf4', iconColor: '#16a34a', label: 'Statut',        value: statutLabel,
                badge: { DIPLOME: { bg: '#fef9c3', color: '#a16207' }, EN_COURS: { bg: '#dcfce7', color: '#15803d' }, SUSPENDU: { bg: '#fef9c3', color: '#a16207' }, ABANDONNE: { bg: '#fee2e2', color: '#b91c1c' } }[profil.statut] },
              { icon: 'calendar-event', iconBg: '#fdf4ff', iconColor: '#9333ea', label: 'Inscription',   value: fmtDate(profil.dateInscription) },
              { icon: 'person-badge',   iconBg: '#fef9c3', iconColor: '#b45309', label: 'Moniteur',      value: profil.moniteur ? `${profil.moniteur.prenom} ${profil.moniteur.nom}` : null },
              { icon: 'trophy',         iconBg: '#fef2ff', iconColor: '#a855f7', label: 'Examens admis', value: `${examensAdmis.length} / ${examens.length}` },
            ].map(({ icon, iconBg, iconColor, label, value, badge }, i, arr) => (
              <div key={label} className={`flex items-center gap-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                  <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.78rem' }} />
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                  {badge
                    ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={badge}>{value}</span>
                    : <span className="text-sm text-slate-700 font-medium text-right">{value || <span className="text-slate-300 font-normal">—</span>}</span>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Documents du dossier */}
          <div className="mx-6 mb-4 mt-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <i className="bi bi-folder2-open me-1" />Documents du dossier
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'docCertResidence',  label: 'Certificat de résidence' },
                { key: 'docCniLegalisee',   label: 'CNI légalisée' },
                { key: 'docGroupeSanguin',  label: 'Groupe sanguin' },
                { key: 'docVisiteMedicale', label: 'Visite médicale' },
                { key: 'docPhotos',         label: 'Photos d\'identité' },
                { key: 'docTimbre',         label: 'Timbre fiscal' },
                { key: 'docEnrolement',     label: 'Enrôlement' },
                { key: 'docDelivrance',     label: 'Délivrance' },
              ].map(({ key, label }) => {
                const ok = !!profil[key]
                return (
                  <div key={key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                    style={{ background: ok ? '#f0fdf4' : '#f8fafc', border: `1px solid ${ok ? '#bbf7d0' : '#e2e8f0'}` }}>
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: ok ? '#16a34a' : '#e2e8f0' }}>
                      <i className={`bi bi-${ok ? 'check-lg' : 'x-lg'}`}
                        style={{ color: ok ? '#fff' : '#94a3b8', fontSize: '.55rem' }} />
                    </div>
                    <span className="text-xs font-medium truncate"
                      style={{ color: ok ? '#15803d' : '#94a3b8' }}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {examens.length > 0 && (
            <div className="mx-6 mb-5 mt-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f7fa)', border: '1px solid #bae6fd' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-700">Taux de réussite</span>
                <span className="text-sm font-extrabold text-cyan-700">
                  {Math.round(examensAdmis.length / examens.length * 100)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#bae6fd' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(examensAdmis.length / examens.length * 100)}%`, background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }} />
              </div>
              <div className="text-xs text-cyan-600 mt-1.5">{examensAdmis.length} admis sur {examens.length} examen{examens.length > 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
      </div>

      {/* ══ EXAMENS ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)', borderBottom: '2px solid #450a0a' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-clipboard2-check-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">Mes Examens</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,237,213,.85)' }}>Historique de vos passages</div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {examens.length}
          </span>
        </div>
        {examens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <i className="bi bi-clipboard2-check" style={{ fontSize: '1.2rem', color: '#94a3b8' }} />
            </div>
            <div className="text-sm font-medium text-slate-400">Aucun examen enregistré</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Date', 'Type', 'Résultat', 'Observations'].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...examens].sort((a, b) => b.date.localeCompare(a.date)).map((ex, i) => {
                  const rs = RES_STYLE[ex.resultat] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: ex.resultat }
                  const ts = TYPE_STYLE[ex.type]    || { bg: '#f1f5f9', color: '#64748b', label: ex.type }
                  return (
                    <tr key={ex.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      className="transition-colors hover:bg-red-50/20">
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-semibold text-slate-700">{fmtDate(ex.date)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: rs.bg, color: rs.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rs.dot }} />
                          {rs.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[180px] truncate">{ex.observations || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
