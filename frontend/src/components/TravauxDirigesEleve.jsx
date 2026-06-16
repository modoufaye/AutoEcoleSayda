import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'

const REPONSES = ['A', 'B', 'C']

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
}

export default function TravauxDirigesEleve({ onBack }) {
  const [exercices, setExercices]     = useState([])
  const [reponses, setReponses]       = useState({}) // exerciceId -> {reponse, estCorrecte, bonneReponse}
  const [loading, setLoading]         = useState(true)
  const [current, setCurrent]         = useState(0)
  const [loadingRep, setLoadingRep]   = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    try {
      const [exs, mes] = await Promise.all([
        api('GET', '/eleve/exercices-td'),
        api('GET', '/eleve/exercices-td/mes-reponses'),
      ])
      setExercices(exs)
      const map = {}
      mes.forEach(r => {
        map[r.exercice.id] = { reponse: r.reponse, estCorrecte: r.estCorrecte, bonneReponse: r.exercice.bonneReponse }
      })
      setReponses(map)
    } catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  async function handleRepondre(exerciceId, reponse) {
    setLoadingRep(true)
    try {
      const res = await api('POST', `/eleve/exercices-td/${exerciceId}/repondre`, { reponse })
      setReponses(prev => ({ ...prev, [exerciceId]: { reponse, ...res } }))
    } catch (e) { toast(e.message, 'danger') }
    finally { setLoadingRep(false) }
  }

  const total   = exercices.length
  const repondus = Object.keys(reponses).length
  const corrects = Object.values(reponses).filter(r => r.estCorrecte).length

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Chargement…
    </div>
  )

  if (total === 0) return (
    <div className="text-center py-5" style={{ color: '#94a3b8' }}>
      <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '.75rem' }} />
      Aucun exercice disponible pour l'instant
    </div>
  )

  const ex      = exercices[current]
  const repInfo = reponses[ex?.id]

  return (
    <div>
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#1e3a5f' }}>Travaux Dirigés</h4>
          <p className="text-muted mb-0" style={{ fontSize: '.85rem' }}>
            {repondus}/{total} répondu{repondus !== 1 ? 's' : ''} — {corrects} correct{corrects !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Score */}
        {repondus > 0 && (
          <div style={{
            background: corrects === repondus ? '#f0fdf4' : '#fffbeb',
            border: `1.5px solid ${corrects === repondus ? '#a7f3d0' : '#fde68a'}`,
            borderRadius: '.75rem', padding: '.4rem 1rem',
            color: corrects === repondus ? '#047857' : '#b45309',
            fontWeight: 700, fontSize: '.9rem',
          }}>
            <i className={`bi bi-${corrects === repondus ? 'trophy-fill' : 'star-half'} me-2`} />
            {corrects}/{repondus}
          </div>
        )}
      </div>

      {/* Navigation exercices */}
      <div className="d-flex gap-1 flex-wrap mb-4">
        {exercices.map((e, i) => {
          const r = reponses[e.id]
          let bg = '#f1f5f9', color = '#64748b', border = '#e2e8f0'
          if (r) {
            bg = r.estCorrecte ? '#f0fdf4' : '#fef2f2'
            color = r.estCorrecte ? '#15803d' : '#dc2626'
            border = r.estCorrecte ? '#86efac' : '#fca5a5'
          }
          if (i === current) { border = '#1e3a5f'; bg = '#1e3a5f'; color = '#fff' }
          return (
            <button key={e.id} onClick={() => setCurrent(i)} style={{
              width: 36, height: 36, borderRadius: '.5rem', border: `2px solid ${border}`,
              background: bg, color, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r ? (r.estCorrecte ? <i className="bi bi-check-lg" /> : <i className="bi bi-x-lg" />) : i + 1}
            </button>
          )
        })}
      </div>

      {/* Carte exercice courant */}
      {ex && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '1.25rem', overflow: 'hidden', maxWidth: 560, margin: '0 auto' }}>
          {/* Image */}
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '1.5rem', textAlign: 'center' }}>
            <span style={{
              display: 'inline-block', background: '#1e3a5f', color: '#fff',
              borderRadius: '.5rem', padding: '.2rem .7rem',
              fontSize: '.75rem', fontWeight: 700, marginBottom: '.75rem',
            }}>Exercice {current + 1} / {total}</span>
            <img src={ex.imageUrl} alt={`Exercice ${current + 1}`}
              style={{ maxHeight: 260, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>

          {/* Boutons de réponse */}
          <div className="card-body p-4">
            <p className="fw-semibold mb-3" style={{ color: '#475569', fontSize: '.9rem' }}>
              Quelle est la bonne réponse ?
            </p>
            <div className="d-flex gap-3 justify-content-center mb-3">
              {REPONSES.map(r => {
                const c = BTN_COLORS[r]
                let bg = c.light, border = c.border, color = c.text, shadow = 'none'

                if (repInfo) {
                  if (r === repInfo.bonneReponse) {
                    bg = '#f0fdf4'; border = '#86efac'; color = '#15803d'
                  } else if (r === repInfo.reponse && !repInfo.estCorrecte) {
                    bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626'
                  }
                } else {
                  shadow = `0 2px 8px ${c.base}22`
                }

                return (
                  <button key={r} onClick={() => !repInfo && !loadingRep && handleRepondre(ex.id, r)}
                    disabled={!!repInfo || loadingRep}
                    style={{
                      width: 72, height: 72, borderRadius: '1rem',
                      fontWeight: 900, fontSize: '1.6rem',
                      border: `2.5px solid ${border}`,
                      background: bg, color,
                      cursor: repInfo ? 'default' : 'pointer',
                      transition: 'all .15s', boxShadow: shadow,
                      opacity: repInfo && r !== repInfo.reponse && r !== repInfo.bonneReponse ? 0.5 : 1,
                      position: 'relative',
                    }}
                  >
                    {r}
                    {repInfo && r === repInfo.bonneReponse && (
                      <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '.75rem' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {repInfo && (
              <div style={{
                borderRadius: '.75rem', padding: '.75rem 1rem',
                background: repInfo.estCorrecte ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${repInfo.estCorrecte ? '#86efac' : '#fca5a5'}`,
                color: repInfo.estCorrecte ? '#15803d' : '#dc2626',
                fontWeight: 600, fontSize: '.88rem', textAlign: 'center',
              }}>
                {repInfo.estCorrecte
                  ? <><i className="bi bi-check-circle-fill me-2" />Bonne réponse !</>
                  : <><i className="bi bi-x-circle-fill me-2" />Mauvaise réponse. La bonne réponse était <strong>{repInfo.bonneReponse}</strong>.</>}
              </div>
            )}

            {loadingRep && (
              <div className="text-center mt-2 text-muted" style={{ fontSize: '.82rem' }}>
                <span className="spinner-border spinner-border-sm me-1" />Vérification…
              </div>
            )}

            {/* Navigation précédent / suivant */}
            <div className="d-flex justify-content-between mt-4">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                style={{
                  background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                  borderRadius: '.6rem', padding: '.45rem 1rem', cursor: current === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '.85rem', opacity: current === 0 ? .5 : 1,
                }}
              ><i className="bi bi-arrow-left me-1" />Précédent</button>
              <button
                onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
                disabled={current === total - 1}
                style={{
                  background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                  borderRadius: '.6rem', padding: '.45rem 1rem', cursor: current === total - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '.85rem', opacity: current === total - 1 ? .5 : 1,
                }}
              >Suivant<i className="bi bi-arrow-right ms-1" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
