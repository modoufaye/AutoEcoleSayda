import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import '../landing.css'

const ENDPOINT = {
  ELEVE:       '/eleve/profil',
  MONITEUR:    '/moniteur/profil',
  SUPER_ADMIN: '/compte/profil',
}

const ROLE_LABEL = { SUPER_ADMIN: 'Administrateur', MONITEUR: 'Moniteur', ELEVE: 'Élève' }

const FIELD_META = {
  prenom:     { label: 'Prénom',     icon: 'person-fill',       iconBg: '#eff6ff',  iconColor: '#2563eb' },
  nom:        { label: 'Nom',        icon: 'person-badge-fill', iconBg: '#f5f3ff',  iconColor: '#7c3aed' },
  telephone:  { label: 'Téléphone',  icon: 'telephone-fill',    iconBg: '#fef9c3',  iconColor: '#a16207' },
  email:      { label: 'Email',      icon: 'envelope-fill',     iconBg: '#eff6ff',  iconColor: '#0891b2' },
  adresse:    { label: 'Adresse',    icon: 'geo-alt-fill',      iconBg: '#fdf4ff',  iconColor: '#9333ea' },
  numeroCni:  { label: 'Numéro CNI', icon: 'credit-card-fill',  iconBg: '#f0fdf4',  iconColor: '#16a34a' },
}

function initials(nom = '', prenom = '') {
  return ((prenom[0] || '') + (nom[0] || '')).toUpperCase()
}

export default function MonProfil() {
  const { user } = useAuth()
  const [profil, setProfil]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [edit, setEdit]       = useState(false)
  const [form, setForm]       = useState({})

  const endpoint = ENDPOINT[user?.role] || '/compte/profil'

  useEffect(() => {
    api('GET', endpoint)
      .then(data => { setProfil(data); setForm(toForm(data)) })
      .catch(() => toast('Impossible de charger le profil', 'danger'))
      .finally(() => setLoading(false))
  }, [])

  function toForm(data) {
    return {
      nom:       data.nom       || '',
      prenom:    data.prenom    || '',
      telephone: data.telephone || '',
      email:     data.email     || '',
      adresse:   data.adresse   || '',
      numeroCni: data.numeroCni || '',
    }
  }

  const save = async () => {
    const isAdmin = user?.role === 'SUPER_ADMIN'
    if (!form.nom || (!isAdmin && (!form.prenom || !form.telephone))) {
      toast(isAdmin ? 'Le nom est obligatoire' : 'Nom, prénom et téléphone sont obligatoires', 'warning'); return
    }
    setSaving(true)
    try {
      const updated = await api('PUT', endpoint, form)
      setProfil(updated); setEdit(false)
      toast('Profil mis à jour avec succès')
    } catch (e) { toast(e.message || 'Erreur lors de la sauvegarde', 'danger') }
    finally { setSaving(false) }
  }

  const cancel = () => { setForm(toForm(profil)); setEdit(false) }

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement…</span>
      </div>
    </div>
  )

  if (!profil) return null

  const fields = user?.role === 'SUPER_ADMIN'
    ? [
        { key: 'nom',   editable: true },
        { key: 'email', editable: true },
      ]
    : [
        { key: 'prenom',    editable: true },
        { key: 'nom',       editable: true },
        { key: 'telephone', editable: true },
        { key: 'email',     editable: true },
        { key: 'adresse',   editable: true },
        { key: 'numeroCni', editable: true },
      ]

  const readonlyFields = [
    profil.categoriePermis && { label: 'Catégorie de permis', icon: 'card-checklist',    iconBg: '#eef2ff', iconColor: '#4f46e5', value: profil.categoriePermis },
    profil.statut          && { label: 'Statut',              icon: 'activity',           iconBg: '#f0fdf4', iconColor: '#16a34a', value: { EN_COURS: 'En cours', DIPLOME: 'Diplômé', SUSPENDU: 'Suspendu', ABANDONNE: 'Abandonné' }[profil.statut] || profil.statut },
    profil.dateInscription && { label: "Date d'inscription",  icon: 'calendar-event-fill',iconBg: '#fef9c3', iconColor: '#a16207', value: new Date(profil.dateInscription).toLocaleDateString('fr-FR') },
    profil.moniteur        && { label: 'Moniteur assigné',    icon: 'person-badge-fill',  iconBg: '#f5f3ff', iconColor: '#7c3aed', value: `${profil.moniteur.prenom} ${profil.moniteur.nom}` },
  ].filter(Boolean)

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
  const roCls    = "w-full px-3 py-2.5 bg-slate-100 border-2 border-transparent rounded-xl text-slate-400 text-sm outline-none cursor-not-allowed"
  const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

  return (
    <div className="space-y-5 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Bannière ── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 55%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.28)' }}>

        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />

        <div className="relative px-6 py-2 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
            {initials(profil.nom, profil.prenom)}
          </div>

          {/* Nom + email */}
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold text-white leading-tight truncate">
              {profil.prenom} {profil.nom}
            </div>
            <div className="text-sm mt-0.5 truncate" style={{ color: '#93c5fd' }}>
              {profil.email || user?.email}
            </div>
          </div>

          {/* Badge rôle */}
          <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}>
            {ROLE_LABEL[user?.role] || user?.role}
          </span>
        </div>

      </div>

      {/* ── Informations personnelles ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        {/* En-tête section */}
        <div className="px-6 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-person-lines-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Informations personnelles</div>
            <div className="text-blue-200" style={{ fontSize: '.72rem' }}>
              {edit ? 'Modifiez vos informations ci-dessous' : 'Vos données de contact'}
            </div>
          </div>
          {!edit && (
            <button onClick={() => setEdit(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}>
              <i className="bi bi-pencil-fill" style={{ fontSize: '.72rem' }} />
              Modifier
            </button>
          )}
        </div>

        {/* Mode lecture */}
        {!edit && (
          <div className="divide-y divide-slate-50">
            {fields.map(({ key, editable }) => {
              const meta = FIELD_META[key] || {}
              return (
                <div key={key} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.iconBg }}>
                    <i className={`bi bi-${meta.icon}`} style={{ color: meta.iconColor, fontSize: '.85rem' }} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-1">
                    {meta.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 text-right">
                    {form[key] || <span className="text-slate-300 font-normal">—</span>}
                  </span>
                  {!editable && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ml-2"
                      style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                      Non modifiable
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Mode édition */}
        {edit && (
          <div className="px-6 py-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map(({ key, editable }) => {
                const meta = FIELD_META[key] || {}
                return (
                  <div key={key}>
                    <label className={labelCls}>
                      <i className={`bi bi-${meta.icon} mr-1.5`} style={{ color: meta.iconColor }} />
                      {meta.label}
                    </label>
                    {editable
                      ? <input className={inputCls} value={form[key]}
                          onChange={e => setForm(fm => ({ ...fm, [key]: e.target.value }))} />
                      : <input className={roCls} value={form[key]} readOnly />}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
              <button onClick={cancel}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all"
                style={{ background: '#f1f5f9', color: '#64748b' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)',
                  boxShadow: saving ? 'none' : '0 4px 12px rgba(30,58,95,.25)',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}>
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</>
                  : <><i className="bi bi-check-lg" />Enregistrer</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Informations de formation (lecture seule) ── */}
      {readonlyFields.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="px-6 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', borderBottom: '2px solid #0891b2' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
              <i className="bi bi-info-circle-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">Informations de formation</div>
              <div className="text-cyan-100" style={{ fontSize: '.72rem' }}>Gérées par l'administration</div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>
              Lecture seule
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {readonlyFields.map(({ label, icon, iconBg, iconColor, value }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg }}>
                  <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.85rem' }} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-1">{label}</span>
                <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
