import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
  D: { base: '#8b5cf6', light: '#fdf4ff', border: '#e9d5ff', text: '#6d28d9' },
}

export default function TravauxDirigesEleve({ onBack }) {
  const [exercices, setExercices]     = useState([])
  const [reponses, setReponses]       = useState({}) // questionId -> {reponse, estCorrecte, bonneReponse}
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [currentQ, setCurrentQ]       = useState(0)
  const [loadingRep, setLoadingRep]   = useState(false)
  const [pending, setPending]         = useState([]) // sélections en cours pour questions à 4 options
  const [reviewMode, setReviewMode]   = useState(false) // parcourir les questions après l'écran de score

  useEffect(() => { charger() }, [])

  // Réinitialise les sélections pendantes quand on change de question
  useEffect(() => { setPending([]) }, [currentQ, selected])

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
        map[r.question.id] = {
          reponse: r.reponse,
          estCorrecte: r.estCorrecte,
          bonneReponse: r.question.bonneReponse,
        }
      })
      setReponses(map)
    } catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  async function handleRepondre(questionId, reponse) {
    setLoadingRep(true)
    try {
      const res = await api('POST', `/eleve/exercices-td/questions/${questionId}/repondre`, { reponse })
      setReponses(prev => ({ ...prev, [questionId]: { reponse, ...res } }))
    } catch (e) { toast(e.message, 'danger') }
    finally { setLoadingRep(false) }
  }

  // Sélection par paire : A/B sont exclusifs entre eux, C/D aussi
  function togglePending(r) {
    const isAB = r === 'A' || r === 'B'
    setPending(p => {
      const filtered = p.filter(x => isAB ? x !== 'A' && x !== 'B' : x !== 'C' && x !== 'D')
      return p.includes(r) ? filtered : [...filtered, r]
    })
  }

  async function validerSelections(questionId) {
    const reponse = [...pending].sort().join(',')
    await handleRepondre(questionId, reponse)
    setPending([])
  }

  function openExercice(ex) {
    setSelected(ex)
    setCurrentQ(0)
    setReviewMode(false)
  }

  async function rejouer() {
    if (!selected) return
    try {
      await api('DELETE', `/eleve/exercices-td/${selected.id}/mes-reponses`)
      const qIds = new Set((selected.questions || []).map(q => q.id))
      setReponses(prev => {
        const next = { ...prev }
        qIds.forEach(id => delete next[id])
        return next
      })
      setCurrentQ(0)
      setPending([])
      setReviewMode(false)
    } catch (e) { toast(e.message, 'danger') }
  }

  function scoreExercice(ex) {
    const qs = ex.questions || []
    const repondues = qs.filter(q => reponses[q.id])
    const correctes = repondues.filter(q => reponses[q.id]?.estCorrecte)
    return { total: qs.length, repondues: repondues.length, correctes: correctes.length }
  }

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Chargement…
    </div>
  )

  // ── Vue liste des exercices ──
  if (!selected) return (
    <div>
      {onBack && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.45rem',
          background: '#f1f5f9', color: '#475569',
          border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
          fontSize: '.8rem', fontWeight: 600,
          padding: '.45rem 1rem', cursor: 'pointer', marginBottom: '1rem',
        }}>
          <i className="bi bi-arrow-left" style={{ fontSize: '.8rem' }} />Retour
        </button>
      )}

      <h4 className="fw-bold mb-1" style={{ color: '#1e3a5f' }}>Travaux Dirigés</h4>
      <p className="text-muted mb-4" style={{ fontSize: '.85rem' }}>
        {exercices.length} exercice{exercices.length !== 1 ? 's' : ''} disponible{exercices.length !== 1 ? 's' : ''}
      </p>

      {exercices.length === 0 ? (
        <div className="text-center py-5" style={{ color: '#94a3b8' }}>
          <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '.75rem' }} />
          Aucun exercice disponible pour l'instant
        </div>
      ) : (
        <div className="row g-3">
          {exercices.map((ex, i) => {
            const { total, repondues, correctes } = scoreExercice(ex)
            const termine = repondues === total && total > 0
            const pct = total > 0 ? Math.round((correctes / total) * 100) : 0
            return (
              <div key={ex.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ borderRadius: '1rem', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
                  onClick={() => openExercice(ex)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: '.75rem', background: '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#2563eb', fontWeight: 800, fontSize: '1rem',
                      }}>{i + 1}</div>
                      {termine && (
                        <span style={{
                          background: pct >= 50 ? '#f0fdf4' : '#fef2f2',
                          color: pct >= 50 ? '#15803d' : '#dc2626',
                          border: `1.5px solid ${pct >= 50 ? '#86efac' : '#fca5a5'}`,
                          borderRadius: '.5rem', padding: '.2rem .6rem',
                          fontSize: '.72rem', fontWeight: 700,
                        }}>{pct}%</span>
                      )}
                    </div>
                    <h6 className="fw-bold mb-1" style={{ color: '#1e3a5f' }}>{ex.titre}</h6>
                    <p className="mb-3" style={{ fontSize: '.8rem', color: '#94a3b8' }}>
                      {total} question{total !== 1 ? 's' : ''}
                    </p>
                    <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, transition: 'width .3s',
                        width: total > 0 ? `${(repondues / total) * 100}%` : '0%',
                        background: 'linear-gradient(90deg,#3b82f6,#6366f1)',
                      }} />
                    </div>
                    <p className="mb-0 mt-1" style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                      {repondues}/{total} répondue{repondues !== 1 ? 's' : ''}
                      {repondues > 0 && ` · ${correctes} correcte${correctes !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Vue questions d'un exercice ──
  const qs  = selected.questions || []
  const q   = qs[currentQ]
  const rep = q ? reponses[q.id] : null
  const is4 = q?.avecOptionD
  const options = q
    ? ['A', 'B', ...(q.avecOptionC || is4 ? ['C'] : []), ...(is4 ? ['D'] : [])]
    : []
  const bonnes  = rep ? rep.bonneReponse.split(',') : []
  const student = rep ? rep.reponse.split(',') : []
  const { correctes, repondues } = scoreExercice(selected)
  const termine = repondues === qs.length && qs.length > 0
  const pct     = qs.length > 0 ? Math.round((correctes / qs.length) * 100) : 0
  const succes  = pct >= 50

  // ── Écran de score final ──────────────────────────────────────────────────
  if (termine && !reviewMode) return (
    <div>
      <button onClick={() => setSelected(null)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '.45rem',
        background: '#f1f5f9', color: '#475569',
        border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
        fontSize: '.8rem', fontWeight: 600,
        padding: '.45rem 1rem', cursor: 'pointer', marginBottom: '1.5rem',
      }}>
        <i className="bi bi-arrow-left" style={{ fontSize: '.8rem' }} />Retour aux exercices
      </button>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '1.25rem', maxWidth: 480, margin: '0 auto' }}>
        <div className="card-body p-4 text-center">

          {/* Icône résultat */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
            background: succes ? '#f0fdf4' : '#fef2f2',
            border: `3px solid ${succes ? '#86efac' : '#fca5a5'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            <i className={`bi bi-${succes ? 'trophy-fill' : 'emoji-frown'}`}
              style={{ color: succes ? '#16a34a' : '#dc2626' }} />
          </div>

          {/* Titre */}
          <h5 className="fw-bold mb-1" style={{ color: '#1e3a5f' }}>{selected.titre}</h5>
          <p className="text-muted mb-3" style={{ fontSize: '.85rem' }}>Série terminée</p>

          {/* Score */}
          <div style={{
            background: succes ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${succes ? '#86efac' : '#fca5a5'}`,
            borderRadius: '1rem', padding: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: succes ? '#16a34a' : '#dc2626', lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: succes ? '#15803d' : '#b91c1c', marginTop: '.25rem' }}>
              {correctes} / {qs.length} correcte{correctes !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '.82rem', color: succes ? '#16a34a' : '#dc2626', marginTop: '.25rem' }}>
              {succes ? '✓ Bonne série !' : '✗ À retravailler'}
            </div>
          </div>

          {/* Détail question par question — clic pour revoir */}
          <div className="d-flex justify-content-center gap-2 flex-wrap mb-4">
            {qs.map((question, i) => {
              const r = reponses[question.id]
              return (
                <button key={question.id} title={`Revoir Q${i + 1}`}
                  onClick={() => { setCurrentQ(i); setReviewMode(true) }}
                  style={{
                    width: 36, height: 36, borderRadius: '.5rem', border: 'none',
                    background: r?.estCorrecte ? '#f0fdf4' : '#fef2f2',
                    color: r?.estCorrecte ? '#16a34a' : '#dc2626',
                    fontWeight: 700, fontSize: '.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {r?.estCorrecte ? <i className="bi bi-check-lg" /> : <i className="bi bi-x-lg" />}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="d-flex gap-3 justify-content-center">
            <button onClick={rejouer} style={{
              background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff',
              border: 'none', borderRadius: '.75rem',
              padding: '.6rem 1.5rem', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
            }}>
              <i className="bi bi-arrow-repeat me-2" />Rejouer
            </button>
            <button onClick={() => setSelected(null)} style={{
              background: '#f1f5f9', color: '#475569',
              border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
              padding: '.6rem 1.5rem', fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
            }}>
              Retour aux exercices
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button onClick={() => setSelected(null)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.45rem',
          background: '#f1f5f9', color: '#475569',
          border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
          fontSize: '.8rem', fontWeight: 600,
          padding: '.45rem 1rem', cursor: 'pointer',
        }}>
          <i className="bi bi-arrow-left" style={{ fontSize: '.8rem' }} />Retour aux exercices
        </button>
        {reviewMode && (
          <button onClick={() => setReviewMode(false)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '.45rem',
            background: '#1e3a5f', color: '#fff',
            border: 'none', borderRadius: '.75rem',
            fontSize: '.8rem', fontWeight: 600,
            padding: '.45rem 1rem', cursor: 'pointer',
          }}>
            <i className="bi bi-bar-chart-fill" style={{ fontSize: '.8rem' }} />Voir le score
          </button>
        )}
      </div>

      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#1e3a5f' }}>{selected.titre}</h5>
          <p className="text-muted mb-0" style={{ fontSize: '.82rem' }}>
            {repondues}/{qs.length} répondue{repondues !== 1 ? 's' : ''} — {correctes} correcte{correctes !== 1 ? 's' : ''}
          </p>
        </div>
        {repondues > 0 && (
          <div style={{
            background: correctes === repondues ? '#f0fdf4' : '#fffbeb',
            border: `1.5px solid ${correctes === repondues ? '#a7f3d0' : '#fde68a'}`,
            borderRadius: '.75rem', padding: '.4rem 1rem',
            color: correctes === repondues ? '#047857' : '#b45309',
            fontWeight: 700, fontSize: '.9rem',
          }}>
            <i className={`bi bi-${correctes === repondues ? 'trophy-fill' : 'star-half'} me-2`} />
            {correctes}/{repondues}
          </div>
        )}
      </div>

      {/* Navigation questions */}
      <div className="d-flex gap-1 flex-wrap mb-4">
        {qs.map((question, i) => {
          const r = reponses[question.id]
          let bg = '#f1f5f9', color = '#64748b', border = '#e2e8f0'
          if (r) { bg = r.estCorrecte ? '#f0fdf4' : '#fef2f2'; color = r.estCorrecte ? '#15803d' : '#dc2626'; border = r.estCorrecte ? '#86efac' : '#fca5a5' }
          if (i === currentQ) { bg = '#1e3a5f'; color = '#fff'; border = '#1e3a5f' }
          return (
            <button key={question.id} onClick={() => setCurrentQ(i)} style={{
              width: 36, height: 36, borderRadius: '.5rem', border: `2px solid ${border}`,
              background: bg, color, fontWeight: 700, fontSize: '.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r ? (r.estCorrecte ? <i className="bi bi-check-lg" /> : <i className="bi bi-x-lg" />) : i + 1}
            </button>
          )
        })}
      </div>

      {/* Carte question courante */}
      {q && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '1.25rem', overflow: 'hidden', maxWidth: 520, margin: '0 auto' }}>
          {/* Image */}
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '1.5rem', textAlign: 'center' }}>
            <span style={{
              display: 'inline-block', background: '#1e3a5f', color: '#fff',
              borderRadius: '.5rem', padding: '.2rem .7rem',
              fontSize: '.75rem', fontWeight: 700, marginBottom: '.75rem',
            }}>Question {currentQ + 1} / {qs.length}</span>
            {is4 && (
              <span style={{
                display: 'inline-block', marginLeft: '.5rem',
                background: '#fdf4ff', color: '#8b5cf6',
                border: '1.5px solid #e9d5ff',
                borderRadius: '.5rem', padding: '.2rem .7rem',
                fontSize: '.75rem', fontWeight: 700, marginBottom: '.75rem',
              }}>2 réponses à donner</span>
            )}
            <img src={q.imageUrl} alt={`Question ${currentQ + 1}`}
              style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>

          {/* Boutons réponse */}
          <div className="card-body p-4">
            <p className="fw-semibold mb-3" style={{ color: '#475569', fontSize: '.9rem' }}>
              {is4 ? '1 réponse parmi A/B et 1 parmi C/D :' : 'Quelle est la bonne réponse ?'}
            </p>

            {is4 ? (
              /* Mode 4 options : 2 groupes A/B et C/D */
              <div className="d-flex flex-column gap-3 mb-3">
                {[['A','B'], ['C','D']].map(([r1, r2], gi) => (
                  <div key={gi}>
                    <div className="text-center mb-2" style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      {rep ? (gi === 0 ? 'A ou B' : 'C ou D') : (gi === 0 ? 'Choisissez entre A et B :' : 'Choisissez entre C et D :')}
                    </div>
                    <div className="d-flex gap-3 justify-content-center">
                      {[r1, r2].map(r => {
                        const c = BTN_COLORS[r]
                        if (rep) {
                          const isCorrect = bonnes.includes(r)
                          const isStudentChoice = student.includes(r)
                          let bg, border, color
                          if (isCorrect)                      { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d' }
                          else if (isStudentChoice)           { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626' }
                          else                                { bg = '#f8fafc'; border = '#e2e8f0'; color = '#cbd5e1' }
                          return (
                            <button key={r} disabled style={{
                              width: 68, height: 68, borderRadius: '1rem',
                              fontWeight: 900, fontSize: '1.5rem',
                              border: `2.5px solid ${border}`, background: bg, color,
                              cursor: 'default', position: 'relative',
                            }}>
                              {r}
                              {isCorrect && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '.85rem' }}>✓</span>}
                            </button>
                          )
                        }
                        const sel = pending.includes(r)
                        return (
                          <button key={r}
                            onClick={() => !loadingRep && togglePending(r)}
                            disabled={loadingRep}
                            style={{
                              width: 68, height: 68, borderRadius: '1rem',
                              fontWeight: 900, fontSize: '1.5rem',
                              border: sel ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                              background: sel ? c.base : c.light,
                              color: sel ? '#fff' : c.text,
                              cursor: 'pointer', transition: 'all .15s',
                              boxShadow: sel ? `0 4px 12px ${c.base}44` : `0 2px 8px ${c.base}22`,
                            }}
                          >{r}</button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Mode 2-3 options : réponse directe */
              <div className="d-flex gap-3 justify-content-center mb-3">
                {options.map(r => {
                  const c = BTN_COLORS[r]
                  if (rep) {
                    const isCorrect = bonnes.includes(r)
                    const isStudentChoice = student.includes(r)
                    let bg, border, color
                    if (isCorrect)            { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d' }
                    else if (isStudentChoice) { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626' }
                    else                      { bg = '#f8fafc'; border = '#e2e8f0'; color = '#cbd5e1' }
                    return (
                      <button key={r} disabled style={{
                        width: 68, height: 68, borderRadius: '1rem',
                        fontWeight: 900, fontSize: '1.5rem',
                        border: `2.5px solid ${border}`, background: bg, color,
                        cursor: 'default', position: 'relative',
                      }}>
                        {r}
                        {isCorrect && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: '.85rem' }}>✓</span>}
                      </button>
                    )
                  }
                  return (
                    <button key={r}
                      onClick={() => !loadingRep && handleRepondre(q.id, r)}
                      disabled={loadingRep}
                      style={{
                        width: 68, height: 68, borderRadius: '1rem',
                        fontWeight: 900, fontSize: '1.5rem',
                        border: `2px solid ${c.border}`, background: c.light, color: c.text,
                        cursor: 'pointer', transition: 'all .15s',
                        boxShadow: `0 2px 8px ${c.base}22`,
                      }}
                    >{r}</button>
                  )
                })}
              </div>
            )}

            {/* Bouton Valider pour 4 options */}
            {is4 && !rep && (
              <div className="text-center mb-3">
                <button
                  onClick={() => validerSelections(q.id)}
                  disabled={pending.length !== 2 || loadingRep}
                  style={{
                    background: pending.length === 2 ? 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' : '#e2e8f0',
                    color: pending.length === 2 ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: '.75rem',
                    padding: '.55rem 1.5rem', fontWeight: 700, fontSize: '.9rem',
                    cursor: pending.length === 2 ? 'pointer' : 'not-allowed',
                    transition: 'all .2s',
                  }}
                >
                  {loadingRep
                    ? <><span className="spinner-border spinner-border-sm me-2" />Vérification…</>
                    : pending.length === 2
                      ? `Valider — ${pending.sort().join(' et ')}`
                      : `Valider (${pending.length}/2 — A/B et C/D)`}
                </button>
              </div>
            )}

            {loadingRep && !is4 && (
              <div className="text-center mt-2 text-muted" style={{ fontSize: '.82rem' }}>
                <span className="spinner-border spinner-border-sm me-1" />Vérification…
              </div>
            )}

            {/* Feedback */}
            {rep && (
              <div style={{
                borderRadius: '.75rem', padding: '.75rem 1rem', textAlign: 'center',
                background: rep.estCorrecte ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${rep.estCorrecte ? '#86efac' : '#fca5a5'}`,
                color: rep.estCorrecte ? '#15803d' : '#dc2626',
                fontWeight: 600, fontSize: '.88rem',
              }}>
                {rep.estCorrecte
                  ? <><i className="bi bi-check-circle-fill me-2" />{is4 ? 'Parfait ! Vous avez trouvé les 2 bonnes réponses.' : 'Bonne réponse !'}</>
                  : <><i className="bi bi-x-circle-fill me-2" />
                      {is4
                        ? <>Mauvaises réponses — Les bonnes réponses étaient <strong>{bonnes.join(' et ')}</strong>.</>
                        : <>Mauvaise réponse — La bonne réponse était <strong>{rep.bonneReponse}</strong>.</>}
                    </>}
              </div>
            )}

            {/* Navigation */}
            <div className="d-flex justify-content-between mt-4">
              <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
                style={{
                  background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                  borderRadius: '.6rem', padding: '.45rem 1rem', cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '.85rem', opacity: currentQ === 0 ? .5 : 1,
                }}>
                <i className="bi bi-arrow-left me-1" />Précédent
              </button>
              <button onClick={() => setCurrentQ(c => Math.min(qs.length - 1, c + 1))} disabled={currentQ === qs.length - 1}
                style={{
                  background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                  borderRadius: '.6rem', padding: '.45rem 1rem', cursor: currentQ === qs.length - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '.85rem', opacity: currentQ === qs.length - 1 ? .5 : 1,
                }}>
                Suivant<i className="bi bi-arrow-right ms-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
