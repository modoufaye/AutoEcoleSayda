import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from './Pagination'
import { EnteteListe, ListeVide, ListeChargement, BarreFiltres, Recherche } from './ListeModerne'
import '../landing.css'
import { correspond } from '../utils'
import { ProgrammeEleve } from './SeanceCode'

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

export default function SeancesEleve({ onBack, seanceId, onOuvrir, onFermer }) {
  const [seances, setSeances]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    api('GET', '/eleve/seances')
      .then(setSeances)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}><ListeChargement /></div>
  )

  /* Séance dans l'URL (…/seances-eleve/12) quand la mise en page le gère : Retour (bouton,
     navigateur, Android) revient à la liste des cours au lieu de quitter la page. */
  const ouverte = onOuvrir ? seances.find(s => String(s.id) === String(seanceId)) : selected
  const ouvrir = s => onOuvrir ? onOuvrir(s.id) : setSelected(s)
  const fermer = () => onFermer ? onFermer() : setSelected(null)

  /* ── Détail d'une séance ── */
  if (ouverte) return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* Bouton retour */}
      <button onClick={fermer} className="btn-retour">
        <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
        Retour aux cours
      </button>

      {/* En-tête séance */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-6 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className={`bi bi-${blocIcon(ouverte.blocs)}`} style={{ color: '#fff', fontSize: '1.1rem' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-white text-lg leading-tight">{ouverte.titre}</div>
            {ouverte.theme && (
              <div className="text-blue-200 text-sm mt-0.5">{THEMES[ouverte.theme] || ouverte.theme}</div>
            )}
          </div>
          {ouverte.dateHeure && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:inline-block"
              style={{ background: 'rgba(255,255,255,.15)', color: '#e2e8f0' }}>
              <i className="bi bi-calendar3 me-1" />
              {new Date(ouverte.dateHeure).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </span>
          )}
        </div>

        <div className="px-6 py-3 flex flex-wrap gap-4 border-b border-slate-50"
          style={{ background: '#fafbfc', fontSize: '.82rem', color: '#64748b' }}>
          {ouverte.moniteurNom && (
            <span className="flex items-center gap-1.5">
              <i className="bi bi-person-fill text-[#1e3a5f]" />
              <span className="font-medium">Moniteur :</span>
              {ouverte.moniteurNom}
            </span>
          )}
          {ouverte.blocs.length > 0 && (
            <span className="flex items-center gap-1.5">
              <i className="bi bi-layers-fill text-[#1e3a5f]" />
              {ouverte.blocs.length} bloc(s) de contenu
            </span>
          )}
          {(ouverte.programme || []).length > 0 && (
            <span className="flex items-center gap-1.5">
              <i className="bi bi-signpost-split-fill text-[#1e3a5f]" />
              {ouverte.programme.length} partie(s) de cours · quiz
            </span>
          )}
        </div>

        {(ouverte.programme || []).length > 0 && <div className="px-4 sm:px-6 py-5" style={{ background: '#f8fafc' }}><ProgrammeEleve seance={ouverte} /></div>}

        {(ouverte.blocs.length > 0 || !(ouverte.programme || []).length) && <div className="px-6 py-5">
          {ouverte.blocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <i className="bi bi-inbox" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
              </div>
              <div className="text-sm font-medium text-slate-400">Aucun contenu dans cette séance</div>
            </div>
          ) : (
            ouverte.blocs.map((bloc, i) => <BlocViewer key={i} bloc={bloc} />)
          )}
        </div>}
      </div>
    </div>
  )

  /* ── Liste des séances ── */
  const visibles = seances.filter(s => correspond([s.titre, THEMES[s.theme] || s.theme, s.moniteurNom], search))

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* Même disposition que les autres pages : Retour, recherche, puis bandeau bleu nuit souligné d'or */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
            Retour
          </button>
        </div>
      )}
      <BarreFiltres>
        <Recherche value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Titre, thème ou moniteur…" />
      </BarreFiltres>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="collection-play-fill" titre="Mes séances" sousTitre="Cours en ligne publiés par vos moniteurs" nombre={visibles.length} />

        {visibles.length === 0 ? (
          <ListeVide icone="book" texte={search.trim() ? 'Aucune séance trouvée' : 'Aucun cours disponible pour le moment · votre moniteur publiera bientôt des séances'} />
        ) : (
          <div>
            {visibles.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(s => {
              const icon = blocIcon(s.blocs)
              const nVid  = s.blocs.filter(b => b.typeBloc === 'VIDEO').length
              const nAud  = s.blocs.filter(b => b.typeBloc === 'AUDIO').length
              const nImg  = s.blocs.filter(b => b.typeBloc === 'IMAGE').length
              const nTxt  = s.blocs.filter(b => b.typeBloc === 'TEXTE').length
              return (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ borderBottom: '1.5px solid #dbe2ec' }}
                  onClick={() => ouvrir(s)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#f0bb2a' }}>
                      <i className={`bi bi-${icon}`} style={{ fontSize: '1rem' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: '#1e3a5f' }}>{s.titre}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1" style={{ fontSize: '.75rem', color: '#64748b' }}>
                        {s.theme && <span>{THEMES[s.theme] || s.theme}</span>}
                        {s.dateHeure && (
                          <span className="flex items-center gap-1">
                            <i className="bi bi-calendar3" />
                            {new Date(s.dateHeure).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                          </span>
                        )}
                        {s.moniteurNom && (
                          <span className="flex items-center gap-1">
                            <i className="bi bi-person" />
                            {s.moniteurNom}
                          </span>
                        )}
                        {(s.programme || []).length > 0 && (
                          <span className="flex items-center gap-1 font-bold" style={{ color: '#a16207' }}>
                            <i className="bi bi-signpost-split" />
                            Cours · quiz
                          </span>
                        )}
                        {s.blocs.length > 0 && <span className="flex items-center gap-1">
                          <i className="bi bi-layers" />
                          {[nVid > 0 && `${nVid} vidéo`, nAud > 0 && `${nAud} audio`, nImg > 0 && `${nImg} image`, nTxt > 0 && `${nTxt} texte`].filter(Boolean).join(' · ') || `${s.blocs.length} bloc(s)`}
                        </span>}
                      </div>
                    </div>
                  </div>

                  <button
                    className="self-end sm:self-auto flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 border-0 cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{ minHeight: 34, borderRadius: 999, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff', boxShadow: '0 2px 8px rgba(30,58,95,.2)' }}
                    onClick={e => { e.stopPropagation(); ouvrir(s) }}
                  >
                    Voir
                    <i className="bi bi-arrow-right" style={{ fontSize: '.7rem' }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} setPage={setPage} total={visibles.length} pageSize={PAGE_SIZE} />
      </div>
    </div>
  )
}
