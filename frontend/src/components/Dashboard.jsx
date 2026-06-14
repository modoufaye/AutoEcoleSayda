import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtMontant } from '../utils'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import '../landing.css'

/* ══════════════════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
══════════════════════════════════════════════════════════ */

function StatCard({ title, value, icon, accent, sub, cardStyle }) {
  return (
    <div className="bg-white rounded-2xl px-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
      style={{ borderLeft: `4px solid ${accent}`, boxShadow: '0 1px 6px rgba(0,0,0,.06)', paddingTop: 20, paddingBottom: 20, ...cardStyle }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}>
        <i className={`bi bi-${icon}`} style={{ fontSize: '1.3rem', color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</div>
        <div className="text-xs font-medium text-slate-400 mt-0.5 truncate">{title}</div>
        {sub && <div className="text-xs text-slate-300 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function SectionGroup({ label, children, cols = 4 }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-4`}>{children}</div>
    </div>
  )
}

function FinanceCard({ value, label, icon, accent }) {
  return (
    <div className="rounded-2xl p-6 text-white flex items-center gap-4"
      style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`, boxShadow: `0 8px 24px ${accent}44` }}>
      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
        <i className={`bi bi-${icon}`} style={{ fontSize: '1.6rem' }} />
      </div>
      <div>
        <div className="text-2xl font-extrabold leading-tight">{value}</div>
        <div className="text-sm opacity-80 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD MONITEUR
══════════════════════════════════════════════════════════ */

function DashboardMoniteur({ stats, user }) {
  const [eleves, setEleves] = useState([])
  const [loadingEleves, setLoadingEleves] = useState(true)

  useEffect(() => {
    api('GET', '/moniteur/mes-eleves')
      .then(setEleves)
      .catch(() => {})
      .finally(() => setLoadingEleves(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const enCours   = eleves.filter(e => e.statut === 'EN_COURS').length
  const diplomes  = eleves.filter(e => e.statut === 'DIPLOME').length
  const suspendus = eleves.filter(e => e.statut === 'SUSPENDU').length
  const tauxReussite = stats.totalExamens > 0
    ? Math.round((stats.examensAdmis / stats.totalExamens) * 100)
    : null

  const kpis = [
    { label: 'Mes élèves', value: eleves.length,          icon: 'people-fill',          color: '#60a5fa' },
    { label: 'En cours',   value: enCours,                icon: 'person-check-fill',    color: '#4ade80' },
    { label: 'Diplômés',   value: diplomes,               icon: 'award-fill',           color: '#fbbf24' },
    { label: 'Réussite',   value: tauxReussite != null ? `${tauxReussite}%` : '—', icon: 'patch-check-fill', color: '#a78bfa' },
  ]

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Bannière moniteur ── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 55%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.28)' }}>

        <div className="absolute top-0 right-0 w-80 h-80 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />

        {/* Contenu haut */}
        <div className="relative px-6 pt-2 pb-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
              {(user?.nom?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-extrabold text-white leading-tight">{greeting}, {user?.nom?.split(' ')[0]} 👋</div>
              <div className="text-sm text-blue-200 mt-0.5">Moniteur — Auto-École Khadija</div>
            </div>
          </div>

          {/* Badge taux de réussite */}
          {tauxReussite != null && (
            <div className="rounded-2xl px-5 text-center border flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', paddingTop: '5px', paddingBottom: '5px' }}>
              <div className="text-xs text-blue-300 font-semibold mb-1">Taux de réussite</div>
              <div className="text-3xl font-extrabold" style={{ color: tauxReussite >= 70 ? '#4ade80' : tauxReussite >= 50 ? '#fbbf24' : '#f87171' }}>
                {tauxReussite}%
              </div>
              <div className="text-xs text-blue-300 mt-0.5">{stats.examensAdmis} / {stats.totalExamens} examens</div>
            </div>
          )}
        </div>

        {/* Barre KPIs */}
        <div className="grid grid-cols-4 border-t" style={{ borderColor: 'rgba(255,255,255,.08)', background: 'rgba(0,0,0,.15)' }}>
          {kpis.map(({ label, value, icon, color }, i) => (
            <div key={label} className={`flex flex-col items-center py-2 ${i > 0 ? 'border-l' : ''}`}
              style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <i className={`bi bi-${icon}`} style={{ color, fontSize: '.9rem', marginBottom: 5 }} />
              <div className="text-lg font-extrabold text-white leading-none">{value}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mes Élèves ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#1e3a5f,#2a4f7c)' }} />
          <span className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Mes Élèves</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total élèves"  value={loadingEleves ? '…' : eleves.length} icon="people-fill"       accent="#1e3a5f" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="En formation"  value={loadingEleves ? '…' : enCours}       icon="person-check-fill" accent="#3b82f6" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="Diplômés"      value={loadingEleves ? '…' : diplomes}      icon="award-fill"        accent="#10b981" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="Suspendus"     value={loadingEleves ? '…' : suspendus}     icon="person-x-fill"     accent="#f59e0b" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
        </div>
      </div>

      {/* ── Formation (leçons + examens) ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(#d4a017,#f0bb2a)' }} />
          <span className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Formation</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total leçons"     value={stats.totalLecons}     icon="journal-text"          accent="#1e3a5f" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="Leçons terminées" value={stats.leconsTerminees} icon="check-circle-fill"     accent="#10b981" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="Total examens"    value={stats.totalExamens}    icon="clipboard2-check-fill" accent="#3b82f6" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
          <StatCard title="Admis"            value={stats.examensAdmis}    icon="emoji-smile-fill"      accent="#10b981" cardStyle={{ paddingTop: 15, paddingBottom: 15 }} />
        </div>
      </div>

      {/* ── Barre de progression réussite + Séances ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Réussite aux examens */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
              <i className="bi bi-bar-chart-fill text-white" style={{ fontSize: '.9rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-sm">Résultats aux examens</div>
              <div className="text-xs text-slate-400">Performance globale de mes élèves</div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Admis',       value: stats.examensAdmis,     total: stats.totalExamens, color: '#10b981', bg: '#dcfce7' },
              { label: 'Refusés',     value: stats.examensRefuses,   total: stats.totalExamens, color: '#ef4444', bg: '#fee2e2' },
              { label: 'En attente',  value: stats.examensEnAttente, total: stats.totalExamens, color: '#f59e0b', bg: '#fef9c3' },
            ].map(({ label, value, total, color, bg }) => {
              const pct = total > 0 ? Math.round(value / total * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color }}>{value}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Séances vidéo */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)' }}>
              <i className="bi bi-camera-video-fill" style={{ color: '#1e3a5f', fontSize: '.9rem' }} />
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-sm">Mes Séances</div>
              <div className="text-xs text-slate-400">Cours vidéo publiés et en préparation</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',      value: stats.totalSeances,    icon: 'camera-video',    accent: '#6366f1' },
              { label: 'Publiées',   value: stats.seancesPubliees, icon: 'broadcast',       accent: '#10b981' },
              { label: 'Brouillons', value: stats.seancesBrouillon,icon: 'pencil-square',   accent: '#f59e0b' },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className="rounded-2xl p-4 text-center"
                style={{ background: `${accent}10`, border: `1px solid ${accent}22` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${accent}20` }}>
                  <i className={`bi bi-${icon}`} style={{ color: accent, fontSize: '.85rem' }} />
                </div>
                <div className="text-2xl font-extrabold" style={{ color: accent }}>{value}</div>
                <div className="text-xs font-medium text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {stats.totalSeances > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Taux de publication</span>
                <span className="text-xs font-bold text-emerald-600">
                  {Math.round(stats.seancesPubliees / stats.totalSeances * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(stats.seancesPubliees / stats.totalSeances * 100)}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD ADMIN
══════════════════════════════════════════════════════════ */

function SectionTitle({ gradient, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 rounded-full" style={{ background: gradient }} />
      <span className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

function DashboardAdmin({ stats, user }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const tauxReussite = stats.totalExamens > 0 ? Math.round((stats.examensAdmis / stats.totalExamens) * 100) : null

  const bannerKpis = [
    { label: 'Élèves',    value: stats.totalEleves,        icon: 'people-fill',          color: '#60a5fa' },
    { label: 'Moniteurs', value: stats.moniteursActifs,    icon: 'person-badge-fill',    color: '#a78bfa' },
    { label: 'Véhicules', value: stats.vehiculesDisponibles, icon: 'car-front-fill',     color: '#34d399' },
    { label: 'Réussite',  value: tauxReussite != null ? `${tauxReussite}%` : '—', icon: 'patch-check-fill', color: '#fbbf24' },
  ]

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══ BANNIÈRE ══════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 55%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.28)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 opacity-5 rounded-full translate-y-1/3 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />

        <div className="relative px-6 pt-2 pb-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
              {(user?.nom?.[0] || 'A').toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-extrabold text-white leading-tight">{greeting}, {user?.nom?.split(' ')[0]} 👋</div>
              <div className="text-sm text-blue-200 mt-0.5">Administrateur — Auto-École Khadija</div>
            </div>
          </div>

          {/* Finance rapide */}
          <div className="rounded-2xl px-5 py-3 border flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)' }}>
            <div className="text-xs text-blue-300 font-semibold mb-1">Total encaissé</div>
            <div className="text-2xl font-extrabold text-white">{fmtMontant(stats.totalEncaisse)}</div>
            <div className="text-xs text-blue-300 mt-0.5">{stats.totalPaiements} paiement{stats.totalPaiements > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Barre KPIs */}
        <div className="grid grid-cols-4 border-t" style={{ borderColor: 'rgba(255,255,255,.08)', background: 'rgba(0,0,0,.15)' }}>
          {bannerKpis.map(({ label, value, icon, color }, i) => (
            <div key={label} className={`flex flex-col items-center py-3.5 ${i > 0 ? 'border-l' : ''}`}
              style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <i className={`bi bi-${icon}`} style={{ color, fontSize: '.9rem', marginBottom: 5 }} />
              <div className="text-lg font-extrabold text-white leading-none">{value}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ÉLÈVES ════════════════════════════════════════════ */}
      <div>
        <SectionTitle gradient="linear-gradient(#1e3a5f,#2a4f7c)" label="Élèves" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total élèves" value={stats.totalEleves}     icon="people-fill"       accent="#1e3a5f" />
          <StatCard title="En formation" value={stats.elevesEnCours}   icon="person-check-fill" accent="#3b82f6" />
          <StatCard title="Diplômés"     value={stats.elevesDiplomes}  icon="award-fill"        accent="#10b981" />
          <StatCard title="Suspendus"    value={stats.elevesSuspendus} icon="person-x-fill"     accent="#f59e0b" />
        </div>

        {/* Barre de répartition élèves */}
        {stats.totalEleves > 0 && (
          <div className="mt-3 bg-white rounded-2xl px-5 py-4" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Répartition des élèves</span>
              <span className="text-xs text-slate-400">{stats.totalEleves} au total</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {[
                { val: stats.elevesEnCours,   color: '#3b82f6' },
                { val: stats.elevesDiplomes,  color: '#10b981' },
                { val: stats.elevesSuspendus, color: '#f59e0b' },
              ].map(({ val, color }, i) => val > 0 && (
                <div key={i} className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${val / stats.totalEleves * 100}%`, background: color }} />
              ))}
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'En formation', color: '#3b82f6', val: stats.elevesEnCours },
                { label: 'Diplômés',     color: '#10b981', val: stats.elevesDiplomes },
                { label: 'Suspendus',    color: '#f59e0b', val: stats.elevesSuspendus },
              ].map(({ label, color, val }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-400">{label} ({val})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ PERSONNEL & FLOTTE ════════════════════════════════ */}
      <div>
        <SectionTitle gradient="linear-gradient(#8b5cf6,#a78bfa)" label="Personnel & Flotte" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Moniteurs */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' }}>
                <i className="bi bi-person-badge-fill text-white" style={{ fontSize: '1rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">Moniteurs</div>
                <div className="text-xs text-slate-400">{stats.moniteursActifs} actifs / {stats.totalMoniteurs} total</div>
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full" style={{ width: stats.totalMoniteurs > 0 ? `${stats.moniteursActifs / stats.totalMoniteurs * 100}%` : '0%', background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }} />
            </div>
            <div className="text-right text-xs font-bold mt-1.5" style={{ color: '#8b5cf6' }}>
              {stats.totalMoniteurs > 0 ? Math.round(stats.moniteursActifs / stats.totalMoniteurs * 100) : 0}% actifs
            </div>
          </div>

          {/* Véhicules disponibles */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
                <i className="bi bi-car-front-fill text-white" style={{ fontSize: '1rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">Véhicules</div>
                <div className="text-xs text-slate-400">{stats.vehiculesDisponibles} dispos / {stats.totalVehicules} total</div>
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full" style={{ width: stats.totalVehicules > 0 ? `${stats.vehiculesDisponibles / stats.totalVehicules * 100}%` : '0%', background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
            </div>
            <div className="text-right text-xs font-bold mt-1.5" style={{ color: '#10b981' }}>
              {stats.totalVehicules > 0 ? Math.round(stats.vehiculesDisponibles / stats.totalVehicules * 100) : 0}% disponibles
            </div>
          </div>

          {/* En maintenance */}
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4"
            style={{ borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#fef9c3' }}>
              <i className="bi bi-tools" style={{ fontSize: '1.2rem', color: '#d97706' }} />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-800">{stats.vehiculesEnMaintenance}</div>
              <div className="text-xs font-medium text-slate-400 mt-0.5">En maintenance</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FORMATION + EXAMENS ════════════════════════════════ */}
      <div>
        <SectionTitle gradient="linear-gradient(#d4a017,#f0bb2a)" label="Formation & Examens" />
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Leçons */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                <i className="bi bi-journal-text text-white" style={{ fontSize: '.9rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">Leçons</div>
                <div className="text-xs text-slate-400">{stats.totalLecons} leçons planifiées</div>
              </div>
              <span className="ml-auto text-2xl font-extrabold" style={{ color: '#1e3a5f' }}>{stats.totalLecons}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Terminées',  value: stats.leconsTerminees,  color: '#10b981', bg: '#f0fdf4', icon: 'check-circle-fill' },
                { label: 'Planifiées', value: stats.leconsPlanifiees, color: '#3b82f6', bg: '#eff6ff', icon: 'calendar-check-fill' },
              ].map(({ label, value, color, bg, icon }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ background: bg }}>
                  <i className={`bi bi-${icon}`} style={{ color, fontSize: '1.1rem' }} />
                  <div className="text-xl font-extrabold mt-1" style={{ color }}>{value}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            {stats.totalLecons > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                  <span>Progression</span>
                  <span className="text-emerald-600">{Math.round(stats.leconsTerminees / stats.totalLecons * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <div className="h-full rounded-full" style={{ width: `${stats.leconsTerminees / stats.totalLecons * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Examens */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)' }}>
                <i className="bi bi-clipboard2-check-fill" style={{ color: '#1e3a5f', fontSize: '.9rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">Examens</div>
                <div className="text-xs text-slate-400">{stats.totalExamens} examens passés</div>
              </div>
              <span className="ml-auto text-2xl font-extrabold" style={{ color: '#1e3a5f' }}>{stats.totalExamens}</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Admis',      value: stats.examensAdmis,     color: '#10b981', bg: '#dcfce7' },
                { label: 'Refusés',    value: stats.examensRefuses,   color: '#ef4444', bg: '#fee2e2' },
                { label: 'En attente', value: stats.examensEnAttente, color: '#f59e0b', bg: '#fef9c3' },
              ].map(({ label, value, color, bg }) => {
                const pct = stats.totalExamens > 0 ? Math.round(value / stats.totalExamens * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold" style={{ color }}>{value}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}99,${color})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SÉANCES & FINANCE ═════════════════════════════════ */}
      <div>
        <SectionTitle gradient="linear-gradient(#6366f1,#818cf8)" label="Séances & Finance" />
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Séances */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                <i className="bi bi-camera-video-fill text-white" style={{ fontSize: '.85rem' }} />
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">Cours vidéo</div>
                <div className="text-xs text-slate-400">{stats.totalSeances} séances</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total',      value: stats.totalSeances,    color: '#6366f1', bg: '#eef2ff' },
                { label: 'Publiées',   value: stats.seancesPubliees, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Brouillons', value: stats.seancesBrouillon,color: '#f59e0b', bg: '#fefce8' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                  <div className="text-lg font-extrabold" style={{ color }}>{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Finance x2 */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            <FinanceCard value={fmtMontant(stats.totalEncaisse)} label="Total encaissé"        icon="cash-coin" accent="#10b981" />
            <FinanceCard value={stats.totalPaiements}            label="Paiements enregistrés" icon="receipt"   accent="#1e3a5f" />
          </div>
        </div>
      </div>

    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EXPORT PRINCIPAL
══════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth()
  const isMoniteur = user?.role === 'MONITEUR'
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api('GET', '/dashboard/stats')
      .then(setStats)
      .catch(() => toast('Erreur chargement tableau de bord', 'danger'))
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Chargement…</span>
      </div>
    </div>
  )

  return isMoniteur
    ? <DashboardMoniteur stats={stats} user={user} />
    : <DashboardAdmin    stats={stats} user={user} />
}
