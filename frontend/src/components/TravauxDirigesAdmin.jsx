import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'

export default function TravauxDirigesAdmin() {
  const [exercices, setExercices] = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    api('GET', '/admin/exercices-td')
      .then(setExercices)
      .catch(e => toast(e.message, 'danger'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Travaux Dirigés</h2>
          <p className="text-sm text-slate-400 mt-0.5">{exercices.length} exercice{exercices.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#f97316] rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Chargement…</span>
        </div>
      ) : exercices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
            <i className="bi bi-journal-x" style={{ fontSize: '1.8rem', color: '#f97316' }} />
          </div>
          <p className="text-slate-400 text-sm">Aucun exercice créé pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercices.map((ex, i) => {
            const isOpen = expanded === ex.id
            return (
              <div key={ex.id} className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

                {/* En-tête carte */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 border-0 bg-transparent cursor-pointer transition-colors hover:bg-slate-50"
                >
                  {/* Numéro */}
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)' }}>
                    {i + 1}
                  </span>

                  {/* Titre + meta */}
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

                  {/* Compteur élèves + chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: ex.eleves.length > 0 ? '#f0fdf4' : '#f8fafc', color: ex.eleves.length > 0 ? '#15803d' : '#94a3b8' }}>
                      <i className="bi bi-people me-1" />
                      {ex.eleves.length} élève{ex.eleves.length !== 1 ? 's' : ''}
                    </span>
                    <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-slate-400`} style={{ fontSize: '.8rem' }} />
                  </div>
                </button>

                {/* Panneau élèves (dépliable) */}
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-slate-100">
                    <div className="pt-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Élèves ayant participé
                      </div>
                      {ex.eleves.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Aucun élève n'a encore répondu à cet exercice.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {ex.eleves.map(e => (
                            <span key={e.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                              <i className="bi bi-person-fill" style={{ fontSize: '.7rem' }} />
                              {e.prenom} {e.nom}
                            </span>
                          ))}
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
  )
}
