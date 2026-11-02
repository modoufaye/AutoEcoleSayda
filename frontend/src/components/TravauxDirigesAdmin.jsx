import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { EnteteListe, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche } from './ListeModerne'

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', text: '#047857' },
  D: { base: '#8b5cf6', light: '#fdf4ff', text: '#6d28d9' },
}

function ReponseBadge({ lettre }) {
  const c = BTN_COLORS[lettre] || BTN_COLORS.A
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '.35rem',
      background: c.base, color: '#fff', fontWeight: 800, fontSize: '.72rem',
    }}>{lettre}</span>
  )
}

export default function TravauxDirigesAdmin() {
  const [exercices, setExercices] = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    api('GET', '/admin/exercices-td')
      .then(setExercices)
      .catch(e => toast(e.message, 'danger'))
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const visibles = q ? exercices.filter(ex => `${ex.titre} ${ex.moniteur?.prenom || ''} ${ex.moniteur?.nom || ''}`.toLowerCase().includes(q)) : exercices

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Travaux Dirigés</h2>
        <p className="text-sm text-slate-400 mt-0.5">{exercices.length} exercice{exercices.length !== 1 ? 's' : ''}</p>
      </div>

      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder="Titre de l'exercice ou moniteur…" />
      </BarreFiltres>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="pencil-square" titre="Exercices" sousTitre="Séries créées par les moniteurs" nombre={visibles.length} />
      {loading ? <ListeChargement />
      : visibles.length === 0 ? <ListeVide texte={q ? 'Aucun exercice trouvé' : "Aucun exercice créé pour l'instant"} icone="journal-x" />
      : (
        <div>
          {visibles.map((ex, i) => {
            const isOpen = expanded === ex.id
            return (
              <div key={ex.id} style={{ borderBottom: '1.5px solid #dbe2ec' }}>

                {/* En-tête carte */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 border-0 bg-transparent cursor-pointer transition-colors hover:bg-slate-50"
                >
<span className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-extrabold"
                    style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate">{ex.titre}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">
                        <i className="bi bi-question-circle me-1" />
                        {ex.nbQuestions} question{ex.nbQuestions !== 1 ? 's' : ''}
                      </span>
                      {ex.moniteur ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#eff6ff', color: '#2563eb' }}>
                          <i className="bi bi-person-badge me-1" />
                          {ex.moniteur.prenom} {ex.moniteur.nom}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Moniteur non renseigné</span>
                      )}
                      <span className="text-xs text-slate-400">
                        <i className="bi bi-calendar3 me-1" />
                        {new Date(ex.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Pastille couleur={ex.eleves.length > 0 ? '#15803d' : '#94a3b8'} fond={ex.eleves.length > 0 ? '#dcfce7' : '#f1f5f9'}>
                      {ex.eleves.length} élève{ex.eleves.length !== 1 ? 's' : ''}
                    </Pastille>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isOpen ? '#1e3a5f' : '#eff6ff', color: isOpen ? '#fff' : '#1e3a5f' }}>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '.75rem' }} />
                    </span>
                  </div>
                </button>

                {/* Panneau dépliable */}
                {isOpen && (
                  <div style={{ background: '#f8fafc', borderTop: '1px solid #eef2f7' }}>

                    {/* Questions */}
                    <div className="px-5 pt-4 pb-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        <i className="bi bi-images me-1" />Questions & réponses du moniteur
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {(ex.questions || []).map((q, qi) => {
                          const bonnes = q.bonneReponse ? q.bonneReponse.split(',') : []
                          return (
                            <div key={q.id} style={{
                              background: '#fff', border: '1.5px solid #e2e8f0',
                              borderRadius: '.75rem', overflow: 'hidden', width: 140, flexShrink: 0,
                            }}>
                              <img src={q.imageUrl} alt={`Q${qi + 1}`}
                                style={{ width: '100%', height: 90, objectFit: 'contain', background: '#fff', padding: '.4rem' }} />
                              <div className="px-2 py-1.5 flex items-center justify-between">
                                <span style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 700 }}>Q{qi + 1}</span>
                                <div className="flex items-center gap-1">
                                  <span style={{ fontSize: '.65rem', color: '#64748b', fontWeight: 600 }}>Rep :</span>
                                  {bonnes.map(b => <ReponseBadge key={b} lettre={b} />)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Élèves ayant participé */}
                    <div className="px-5 pb-4 pt-3" style={{ borderTop: '1px dashed #dbe2ec' }}>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <i className="bi bi-people me-1" />Élèves ayant participé
                      </div>
                      {ex.eleves.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Aucun élève n'a encore répondu à cet exercice.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {ex.eleves.map(e => {
                            const pct = e.total > 0 ? Math.round(e.bonnes / e.total * 100) : 0
                            const scoreColor = pct >= 70 ? '#15803d' : pct >= 40 ? '#b45309' : '#b91c1c'
                            const scoreBg   = pct >= 70 ? '#f0fdf4' : pct >= 40 ? '#fefce8' : '#fef2f2'
                            const scoreBorder = pct >= 70 ? '#bbf7d0' : pct >= 40 ? '#fde68a' : '#fecaca'
                            return (
                              <span key={e.id}
                                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                                style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}` }}>
                                <i className="bi bi-person-fill" style={{ fontSize: '.7rem' }} />
                                {e.prenom} {e.nom}
                                <span className="font-extrabold">{e.bonnes}/{e.total}</span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
