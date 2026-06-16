import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToastManager, ToastContainer } from '../components/Toast'
import { api } from '../api'
import { toast } from '../components/Toast'
import Dashboard from '../components/Dashboard'
import Eleves from '../components/Eleves'
import Moniteurs from '../components/Moniteurs'
import Vehicules from '../components/Vehicules'
import Lecons from '../components/Lecons'
import Examens from '../components/Examens'
import Paiements from '../components/Paiements'
import Cours from '../components/Cours'
import SeancesMoniteur from '../components/SeancesMoniteur'
import SeancesEleve from '../components/SeancesEleve'
import ElevePortail from '../components/ElevePortail'
import MonProfil from '../components/MonProfil'
import MesPaiements from '../components/MesPaiements'

const ALL_SECTIONS = [
  { key: 'mon-espace',       label: 'Mon Espace',       icon: 'house-fill',            color: '#60a5fa', roles: ['ELEVE'] },
  { key: 'dashboard',        label: 'Tableau de bord',  icon: 'speedometer2',          color: '#818cf8', roles: ['SUPER_ADMIN', 'MONITEUR'] },
  { key: 'eleves',           label: 'Élèves',           icon: 'people-fill',           color: '#38bdf8', roles: ['SUPER_ADMIN', 'MONITEUR'] },
  { key: 'moniteurs',        label: 'Moniteurs',        icon: 'person-badge-fill',     color: '#a78bfa', roles: ['SUPER_ADMIN'] },
  { key: 'vehicules',        label: 'Véhicules',        icon: 'car-front',             color: '#2dd4bf', roles: ['SUPER_ADMIN', 'MONITEUR'] },
  { key: 'cours',            label: 'Cours Code',       icon: 'sign-turn-right-fill',  color: '#fbbf24', roles: ['SUPER_ADMIN', 'MONITEUR', 'ELEVE'] },
  { key: 'lecons',           label: 'Cours Conduite',   icon: 'calendar2-check',       color: '#f472b6', roles: ['SUPER_ADMIN', 'MONITEUR', 'ELEVE'] },
  { key: 'seances-moniteur', label: 'Séances de cours',  icon: 'camera-video-fill',     color: '#c084fc', roles: ['MONITEUR', 'SUPER_ADMIN'] },
  { key: 'seances-eleve',    label: 'Mes Séances',      icon: 'play-circle-fill',      color: '#06b6d4', roles: ['ELEVE'] },
  { key: 'examens',          label: 'Examens',          icon: 'clipboard2-check-fill', color: '#fb923c', roles: ['SUPER_ADMIN', 'ELEVE'] },
  { key: 'paiements',        label: 'Paiements',        icon: 'cash-stack',            color: '#4ade80', roles: ['SUPER_ADMIN'] },
  { key: 'mes-paiements',   label: 'Mes Paiements',    icon: 'cash-stack',            color: '#4ade80', roles: ['ELEVE'] },
  { key: 'mon-profil',       label: 'Mon Profil',       icon: 'person-circle',         color: '#f87171', roles: ['SUPER_ADMIN', 'MONITEUR'] },
]

const COMPONENTS = {
  'mon-espace': ElevePortail,
  dashboard: Dashboard, eleves: Eleves, moniteurs: Moniteurs,
  vehicules: Vehicules, lecons: Lecons, cours: Cours,
  examens: Examens, paiements: Paiements, 'mes-paiements': MesPaiements,
  'seances-moniteur': SeancesMoniteur,
  'seances-eleve': SeancesEleve,
  'mon-profil': MonProfil,
}

const ROLE_LABELS = {
  SUPER_ADMIN: 'Administrateur',
  MONITEUR:    'Moniteur',
  ELEVE:       'Élève',
}

function initials(nom = '') {
  return nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { toasts } = useToastManager()
  const [collapsed, setCollapsed] = useState(false)

  const sections = ALL_SECTIONS.filter(s => s.roles.includes(user?.role))
  const [section, setSection] = useState(sections[0]?.key || 'dashboard')
  const [history, setHistory] = useState([])
  const [navigateToEleve, setNavigateToEleve] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') document.querySelector('.modal.show .btn-close')?.click()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const [showMdp, setShowMdp]     = useState(false)
  const [mdpForm, setMdpForm]     = useState({ ancien: '', nouveau: '', confirm: '' })
  const [mdpSaving, setMdpSaving] = useState(false)

  const saveMdp = async () => {
    if (!mdpForm.ancien || !mdpForm.nouveau) { toast('Remplissez tous les champs', 'warning'); return }
    if (mdpForm.nouveau !== mdpForm.confirm)  { toast('Les mots de passe ne correspondent pas', 'warning'); return }
    if (mdpForm.nouveau.length < 6)           { toast('Minimum 6 caractères', 'warning'); return }
    setMdpSaving(true)
    try {
      await api('PUT', '/compte/changer-mot-de-passe', { ancienMotDePasse: mdpForm.ancien, nouveauMotDePasse: mdpForm.nouveau })
      toast('Mot de passe modifié avec succès')
      setShowMdp(false)
      setMdpForm({ ancien: '', nouveau: '', confirm: '' })
    } catch (e) { toast(e.message || 'Erreur', 'danger') }
    finally { setMdpSaving(false) }
  }

  const handleEleveClick = (eleveId) => {
    setHistory(h => [...h, section])
    setNavigateToEleve(eleveId)
    setSection('eleves')
  }
  const handleSectionChange = (key) => {
    setHistory(h => [...h, section])
    setSection(key)
    setNavigateToEleve(null)
  }
  const handleBack = () => {
    setHistory(h => {
      const prev = h[h.length - 1]
      if (prev) { setSection(prev); setNavigateToEleve(null) }
      return h.slice(0, -1)
    })
  }

  const activeSection = sections.find(s => s.key === section)
  const ActiveComponent = COMPONENTS[section]

  return (
    <>
      {/* ── Sidebar ── */}
      <div id="sidebar" className={collapsed ? 'collapsed' : ''}>

        {/* Logo */}
        <button className="sidebar-brand w-100" onClick={() => handleSectionChange(sections[0]?.key)}>
          <div className="brand-text">
            <div>Auto-École Sayda</div>
          </div>
        </button>

        {/* Navigation */}
        <ul className="sidebar-menu list-unstyled">
          {sections.map(s => (
            <li key={s.key}>
              <button
                className={`nav-link${section === s.key ? ' active' : ''}`}
                onClick={() => handleSectionChange(s.key)}
                title={collapsed ? s.label : undefined}
              >
                <i className={`bi bi-${s.icon}`} style={section !== s.key ? { color: s.color } : {}}></i>
                <span className="nav-text">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer utilisateur */}
        <div className="sidebar-footer">
          <button
            onClick={() => setShowMdp(true)}
            title="Changer le mot de passe"
            style={{
              display: 'flex', alignItems: 'center', gap: '.6rem',
              width: '100%', padding: '.6rem .9rem',
              background: 'linear-gradient(135deg, rgba(212,160,23,.18), rgba(212,160,23,.08))',
              border: '1px solid rgba(212,160,23,.35)',
              borderRadius: '.6rem', color: '#f0bb2a',
              fontSize: '.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,160,23,.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,160,23,.18), rgba(212,160,23,.08))'}
          >
            <i className="bi bi-key-fill" style={{ fontSize: '1rem', flexShrink: 0 }}></i>
            <span className="nav-text">Changer le mot de passe</span>
          </button>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div id="content">

        {/* Top bar */}
        <nav className="top-bar">
          <button className="toggle-btn" onClick={() => setCollapsed(c => !c)}>
            <i className="bi bi-list"></i>
          </button>

          <div>
            <div className="page-title">{activeSection?.label || ''}</div>
            <div className="page-breadcrumb">Auto-École Sayda</div>
          </div>

          <div className="ms-auto">
            <button
              onClick={logout}
              className="d-flex align-items-center gap-2"
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '2rem',
                fontSize: '.8rem',
                fontWeight: 600,
                padding: '.45rem 1.1rem',
                cursor: 'pointer',
                transition: 'all .15s',
                letterSpacing: '.01em',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
            >
              Déconnexion
            </button>
          </div>
        </nav>

        <main className="main-content">
          {user?.role === 'SUPER_ADMIN' && history.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={handleBack}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.45rem',
                  background: '#f1f5f9', color: '#475569',
                  border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
                  fontSize: '.8rem', fontWeight: 600,
                  padding: '.45rem 1rem', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e3a5f' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
              >
                <i className="bi bi-arrow-left" style={{ fontSize: '.8rem' }} />
                {sections.find(s => s.key === history[history.length - 1])?.label || 'Retour'}
              </button>
            </div>
          )}
          {section === 'mon-espace'
            ? <ElevePortail key="mon-espace" onGoSection={handleSectionChange} />
            : section === 'seances-moniteur' && user?.role === 'SUPER_ADMIN'
            ? <SeancesMoniteur key="seances-admin" isAdmin={true} />
            : section === 'seances-eleve'
            ? <SeancesEleve key="seances-eleve" onBack={() => handleSectionChange('mon-espace')} />
            : section === 'examens'
            ? <Examens key="examens" onEleveClick={handleEleveClick} onBack={user?.role === 'ELEVE' ? () => handleSectionChange('mon-espace') : undefined} />
            : section === 'lecons'
            ? <ActiveComponent key={section} onBack={user?.role === 'ELEVE' ? () => handleSectionChange('mon-espace') : undefined} />
            : section === 'cours'
            ? <ActiveComponent key={section} onBack={user?.role === 'ELEVE' ? () => handleSectionChange('mon-espace') : undefined} />
            : section === 'mes-paiements'
            ? <ActiveComponent key={section} onBack={() => handleSectionChange('mon-espace')} />
            : section === 'eleves'
            ? <Eleves key={`eleves-${navigateToEleve ?? 'list'}`} initialEleveId={navigateToEleve} />
            : <ActiveComponent key={section} />}
        </main>
      </div>

      <ToastContainer toasts={toasts} />

      {/* Modal changement de mot de passe */}
      {showMdp && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1rem' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded-lg"
                    style={{ width: 36, height: 36, background: 'rgba(212,160,23,.12)', color: '#d4a017', borderRadius: '.5rem' }}>
                    <i className="bi bi-key-fill"></i>
                  </div>
                  <h5 className="modal-title mb-0 fw-bold" style={{ color: '#1e293b' }}>Changer le mot de passe</h5>
                </div>
                <button className="btn-close" onClick={() => setShowMdp(false)}></button>
              </div>
              <div className="modal-body px-4 py-3 d-flex flex-column gap-3">
                {[
                  { key: 'ancien',  label: 'Ancien mot de passe',           ph: '••••••••' },
                  { key: 'nouveau', label: 'Nouveau mot de passe',          ph: 'Minimum 6 caractères' },
                  { key: 'confirm', label: 'Confirmer le nouveau mot de passe', ph: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#475569' }}>{f.label}</label>
                    <input
                      type="password"
                      className="form-control"
                      style={{ borderRadius: '.6rem', borderColor: '#e2e8f0', fontSize: '.875rem' }}
                      placeholder={f.ph}
                      value={mdpForm[f.key]}
                      onChange={e => setMdpForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
                <button className="btn btn-light fw-semibold" style={{ borderRadius: '.6rem' }} onClick={() => setShowMdp(false)}>
                  Annuler
                </button>
                <button
                  className="btn fw-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.6rem', border: 'none' }}
                  onClick={saveMdp}
                  disabled={mdpSaving}
                >
                  {mdpSaving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Enregistrement…</>
                    : <><i className="bi bi-check-lg me-1"></i>Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
