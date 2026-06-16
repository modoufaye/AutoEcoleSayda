import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../landing.css'

const SAVED_EMAIL_KEY = 'rememberedEmail'

export default function LoginPage() {
  const { login } = useAuth()
  const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) || ''
  const [form, setForm]       = useState({ email: savedEmail, motDePasse: '' })
  const [remember, setRemember]     = useState(!!savedEmail)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.motDePasse)
      if (remember) localStorage.setItem(SAVED_EMAIL_KEY, form.email)
      else          localStorage.removeItem(SAVED_EMAIL_KEY)
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const map = {
      admin:    { email: 'admin@autoecole.sn',    motDePasse: 'Admin@2024' },
      moniteur: { email: 'moniteur@autoecole.sn', motDePasse: 'Moniteur@2024' },
      eleve:    { email: 'eleve@autoecole.sn',    motDePasse: 'Eleve@2024' },
    }
    setForm(map[role])
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'linear-gradient(160deg, #0f2240 0%, #1e3a5f 50%, #1a3355 100%)',
      }}
    >
      {/* ── Cercles décoratifs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #d4a017 0%, transparent 65%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)' }} />
        {/* Grille subtile */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* ── Lien retour (coin haut-droit) ── */}
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-semibold no-underline transition-all"
        style={{
          position: 'fixed',
          top: 49,
          right: 24,
          zIndex: 50,
          color: '#93c5fd',
          background: 'rgba(255,255,255,.08)',
          border: '1px solid rgba(255,255,255,.14)',
          padding: '8px 18px',
          borderRadius: '999px',
          backdropFilter: 'blur(6px)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.16)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#93c5fd' }}
      >
        <i className="bi bi-arrow-left" style={{ fontSize: '.9rem' }} />
        Retour à l'accueil
      </Link>

      {/* ── Carte principale ── */}
      <div className="relative w-full max-w-md">

        {/* Effet lueur dorée derrière la carte */}
        <div className="absolute -inset-1 rounded-3xl opacity-20 blur-xl"
          style={{ background: 'linear-gradient(135deg, #d4a017, #1e3a5f)' }} />

        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ── En-tête coloré ── */}
          <div
            className="px-8 pt-3 pb-3 text-center"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}
          >
            {/* Icône voiture dans un cercle doré */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #d4a017, #f0bb2a)' }}>
              <svg viewBox="0 0 24 24" fill="white" style={{ width: 24, height: 24 }}>
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-white mb-1 tracking-tight">
              Auto-École Sayda
            </h1>
            <p className="text-blue-200 text-xs uppercase tracking-[0.15em] font-medium">
              Dakar · Sénégal
            </p>
          </div>

          {/* ── Corps du formulaire ── */}
          <div className="px-8 py-4">

            <h2 className="text-xl font-bold text-slate-800 mb-0.5">Connexion</h2>
            <p className="text-slate-400 text-sm mb-4">Accédez à votre espace personnel</p>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Champ email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#1e3a5f]"
                    placeholder="exemple@autoecole.sn"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Champ mot de passe */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#1e3a5f]"
                    placeholder="••••••••"
                    value={form.motDePasse}
                    onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword
                      ? <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  <div
                    className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150"
                    style={{
                      background:   remember ? '#1e3a5f' : 'white',
                      borderColor:  remember ? '#1e3a5f' : '#cbd5e1',
                    }}
                  >
                    {remember && (
                      <svg viewBox="0 0 24 24" fill="white" style={{ width: 12, height: 12 }}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-500">Se souvenir de moi</span>
              </label>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 mt-1"
                style={{
                  background:   loading ? '#9ab0c8' : 'linear-gradient(135deg, #d4a017 0%, #f0bb2a 100%)',
                  cursor:       loading ? 'not-allowed' : 'pointer',
                  boxShadow:    loading ? 'none' : '0 8px 24px rgba(212,160,23,0.35)',
                  color:        '#1e3a5f',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}>
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* ── Comptes démo (discret) ── */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-center text-xs text-slate-400 mb-2 uppercase tracking-widest font-semibold">
                Accès rapide démo
              </p>
              <div className="flex gap-2">
                {[
                  { label: 'Admin',    role: 'admin',    color: '#1e3a5f' },
                  { label: 'Moniteur', role: 'moniteur', color: '#059669' },
                  { label: 'Élève',    role: 'eleve',    color: '#d4a017' },
                ].map(({ label, role, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fillDemo(role)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
                    style={{ background: color }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Pied de page sous la carte ── */}
        <p className="text-center text-blue-300/60 text-xs mt-6">
          © 2026 Auto-École Sayda — Agréé par le Ministère des Transports
        </p>
      </div>
    </div>
  )
}
