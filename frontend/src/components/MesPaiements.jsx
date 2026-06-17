import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import '../landing.css'

const TYPE_LABEL = {
  INSCRIPTION: 'Inscription',
  LECON:       'Leçon',
  EXAMEN:      'Examen',
  AUTRE:       'Autre',
}

const STATUT_CFG = {
  PAYE:       { label: 'Payé',       bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  EN_ATTENTE: { label: 'En attente', bg: '#fefce8', color: '#a16207', dot: '#ca8a04' },
  ANNULE:     { label: 'Annulé',     bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
}

const PAGE_SIZE = 10

export default function MesPaiements({ onBack }) {
  const { user } = useAuth()
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)

  useEffect(() => {
    api('GET', '/eleve/mes-paiements')
      .then(setPaiements)
      .finally(() => setLoading(false))
  }, [])

  const total = paiements
    .filter(p => p.statut === 'PAYE')
    .reduce((s, p) => s + parseFloat(p.montant), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#14532d] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement…</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Bouton retour */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          Mon Espace
        </button>
      )}

      {/* Bannière */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#14532d 0%,#15803d 55%,#16a34a 100%)', boxShadow: '0 8px 32px rgba(20,83,45,.28)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle,#d4a017,transparent)' }} />
        <div className="relative px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-cash-stack" style={{ color: '#fff', fontSize: '1.3rem' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(187,247,208,.7)' }}>Mes Paiements</div>
            <div className="text-xl font-extrabold text-white leading-tight">{user?.nom}</div>
            {user?.email && <div className="text-sm mt-0.5" style={{ color: 'rgba(187,247,208,.85)' }}>{user.email}</div>}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(187,247,208,.8)' }}>Total payé</div>
            <div className="text-xl font-extrabold text-white">
              {total.toLocaleString('fr-FR')} <span className="text-sm font-semibold">FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        <div className="px-5 py-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#14532d 0%,#15803d 100%)', borderBottom: '2px solid #14532d' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-receipt" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Historique des paiements</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(187,247,208,.85)' }}>Suivi de vos règlements</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {paiements.length}
          </span>
        </div>

        {paiements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <i className="bi bi-cash-stack" style={{ color: '#16a34a', fontSize: '1.5rem' }} />
            </div>
            <p className="text-slate-400 text-sm">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {paiements.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(p => {
              const cfg = STATUT_CFG[p.statut] || STATUT_CFG.PAYE
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">

                  {/* Icône type */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f0fdf4' }}>
                    <i className="bi bi-receipt-cutoff" style={{ color: '#15803d', fontSize: '1rem' }} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{TYPE_LABEL[p.typePaiement] || p.typePaiement}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                      {p.description && <><span>·</span><span className="truncate">{p.description}</span></>}
                    </div>
                  </div>

                  {/* Statut */}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>

                  {/* Montant */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-800 text-sm">
                      {parseFloat(p.montant).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-xs text-slate-400">FCFA</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} setPage={setPage} total={paiements.length} pageSize={PAGE_SIZE} />
      </div>
    </div>
  )
}
