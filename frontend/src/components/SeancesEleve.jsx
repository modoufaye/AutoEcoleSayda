import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from './Pagination'
import '../landing.css'

const PAGE_SIZE = 10

const THEMES = {
  FEUX_SIGNALISATION:     '🚦 Feux de signalisation',
  PANNEAUX_SIGNALISATION: '🪧 Panneaux de signalisation',
  SIGNALISATION_SOL:      '⚠️ Signalisation au sol',
  REGLES_PRIORITE:        '🛣️ Règles de priorité',
  CONDUITE_NUIT:          '🌙 Conduite de nuit',
  CONDUITE_AUTOROUTE:     '🏎️ Conduite sur autoroute',
  STATIONNEMENT:          '🅿️ Stationnement',
  SECURITE_ROUTIERE:      '🦺 Sécurité routière',
  AUTRE:                  '📋 Autre',
}

function BlocViewer({ bloc }) {
  if (bloc.typeBloc === 'TEXTE') return (
    <div className="px-6 py-4 rounded-xl mb-3 leading-relaxed text-slate-700"
      style={{ background: '#f8fafc', whiteSpace: 'pre-line', fontSize: '.95rem', lineHeight: 1.9 }}>
      {bloc.contenu}
    </div>
  )
  if (bloc.typeBloc === 'IMAGE') return (
    <div className="text-center mb-4">
      <img src={bloc.mediaUrl} alt=""
        className="rounded-2xl"
        style={{ maxHeight: 360, maxWidth: '100%', objectFit: 'contain', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} />
    </div>
  )
  if (bloc.typeBloc === 'VIDEO') return (
    <div className="mb-4">
      <video controls className="w-full rounded-2xl" style={{ maxHeight: 400, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
        <source src={bloc.mediaUrl} />
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    </div>
  )
  if (bloc.typeBloc === 'AUDIO') return (
    <div className="mb-4 px-4 py-4 rounded-2xl flex items-center gap-4" style={{ background: '#fdf4ff', border: '1.5px solid #e9d5ff' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#9333ea' }}>
        <i className="bi bi-music-note-beamed" style={{ color: '#fff', fontSize: '1.1rem' }} />
      </div>
      <audio controls className="flex-1" style={{ accentColor: '#9333ea' }}>
        <source src={bloc.mediaUrl} />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    </div>
  )
  return null
}

function blocIcon(blocs) {
  if (blocs.some(b => b.typeBloc === 'VIDEO')) return 'camera-video-fill'
  if (blocs.some(b => b.typeBloc === 'AUDIO')) return 'music-note-beamed'
  if (blocs.some(b => b.typeBloc === 'IMAGE')) return 'image-fill'
  return 'file-text-fill'
}

export default function SeancesEleve({ onBack }) {
  const [seances, setSeances]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [page, setPage]         = useState(1)

  useEffect(() => {
    api('GET', '/eleve/seances')
      .then(setSeances)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement des cours…</span>
      </div>
    </div>
  )

  /* ── Détail d'une séance ── */
  if (selected) return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* Bouton retour */}
      <button
        onClick={() => setSelected(null)}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
        style={{ background: '#f1f5f9', color: '#475569' }}
        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
      >
        <i className="bi bi-arrow-left" />
        Retour aux cours
      </button>

      {/* En-tête séance */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-6 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className={`bi bi-${blocIcon(selected.blocs)}`} style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-white text-lg leading-tight">{selected.titre}</div>
            {selected.theme && (
              <div className="text-blue-200 text-sm mt-0.5">{THEMES[selected.theme] || selected.theme}</div>
            )}
          </div>
          {selected.dateHeure && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:inline-block"
              style={{ background: 'rgba(255,255,255,.15)', color: '#e2e8f0' }}>
              <i className="bi bi-calendar3 me-1" />
              {new Date(selected.dateHeure).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </span>
          )}
        </div>

        <div className="px-6 py-3 flex flex-wrap gap-4 border-b border-slate-50"
          style={{ background: '#fafbfc', fontSize: '.82rem', color: '#64748b' }}>
          <span className="flex items-center gap-1.5">
            <i className="bi bi-person-fill text-[#1e3a5f]" />
            <span className="font-medium">Moniteur :</span>
            {selected.moniteurNom}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bi bi-layers-fill text-[#1e3a5f]" />
            {selected.blocs.length} bloc(s) de contenu
          </span>
        </div>

        <div className="px-6 py-5">
          {selected.blocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <i className="bi bi-inbox" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
              </div>
              <div className="text-sm font-medium text-slate-400">Aucun contenu dans cette séance</div>
            </div>
          ) : (
            selected.blocs.map((bloc, i) => <BlocViewer key={i} bloc={bloc} />)
          )}
        </div>
      </div>
    </div>
  )

  /* ── Liste des séances ── */
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

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
          Retour
        </button>
      )}

      {/* Contenu */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        {/* En-tête section */}
        <div className="px-6 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-collection-play-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Cours disponibles</div>
            <div className="text-blue-200" style={{ fontSize: '.72rem' }}>Contenu pédagogique en ligne</div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
            {seances.length}
          </span>
        </div>

        {seances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <i className="bi bi-book" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
            </div>
            <div className="text-sm font-medium text-slate-400">Aucun cours disponible pour le moment</div>
            <div className="text-xs text-slate-300">Votre moniteur publiera bientôt des séances</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {seances.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((s, idx) => {
              const icon = blocIcon(s.blocs)
              const nVid  = s.blocs.filter(b => b.typeBloc === 'VIDEO').length
              const nAud  = s.blocs.filter(b => b.typeBloc === 'AUDIO').length
              const nImg  = s.blocs.filter(b => b.typeBloc === 'IMAGE').length
              const nTxt  = s.blocs.filter(b => b.typeBloc === 'TEXTE').length
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-blue-50/40"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}
                  onClick={() => setSelected(s)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                    <i className={`bi bi-${icon}`} style={{ color: '#1e3a5f', fontSize: '1rem' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{s.titre}</div>
                    <div className="flex flex-wrap gap-3 mt-1" style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                      {s.theme && <span>{THEMES[s.theme] || s.theme}</span>}
                      {s.dateHeure && (
                        <span className="flex items-center gap-1">
                          <i className="bi bi-calendar3" />
                          {new Date(s.dateHeure).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="bi bi-person" />
                        {s.moniteurNom}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="bi bi-layers" />
                        {[nVid > 0 && `${nVid} vidéo`, nAud > 0 && `${nAud} audio`, nImg > 0 && `${nImg} image`, nTxt > 0 && `${nTxt} texte`].filter(Boolean).join(' · ') || `${s.blocs.length} bloc(s)`}
                      </span>
                    </div>
                  </div>

                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff', boxShadow: '0 2px 8px rgba(30,58,95,.2)' }}
                    onClick={e => { e.stopPropagation(); setSelected(s) }}
                  >
                    Voir
                    <i className="bi bi-arrow-right" style={{ fontSize: '.7rem' }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} setPage={setPage} total={seances.length} pageSize={PAGE_SIZE} />
      </div>
    </div>
  )
}
