import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { EnteteListe, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche } from './ListeModerne'

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
  D: { base: '#8b5cf6', light: '#fdf4ff', border: '#e9d5ff', text: '#6d28d9' },
}

function OptionBtn({ r, rep, bonnes, student, pending, loadingRep, onToggle, onDirect, is4 }) {
  const c = BTN_COLORS[r]
  if (rep) {
    const isCorrect      = bonnes.includes(r)
    const isStudentChoice = student.includes(r)
    let bg = '#f8fafc', border = '#e2e8f0', color = '#cbd5e1'
    if (isCorrect)       { bg = '#f0fdf4'; border = '#86efac'; color = '#15803d' }
    else if (isStudentChoice) { bg = '#fef2f2'; border = '#fca5a5'; color = '#dc2626' }
    return (
      <button disabled style={{
        width: 76, height: 76, borderRadius: '1.1rem',
        fontWeight: 900, fontSize: '1.6rem',
        border: `2.5px solid ${border}`, background: bg, color,
        cursor: 'default', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {r}
        {isCorrect && (
          <span style={{
            position: 'absolute', top: -8, right: -8,
            background: '#16a34a', color: '#fff',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.65rem',
          }}>✓</span>
        )}
      </button>
    )
  }
  const sel = pending?.includes(r)
  return (
    <button
      onClick={() => is4 ? onToggle(r) : onDirect(r)}
      disabled={loadingRep}
      style={{
        width: 76, height: 76, borderRadius: '1.1rem',
        fontWeight: 900, fontSize: '1.6rem',
        border: sel ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
        background: sel ? c.base : c.light,
        color: sel ? '#fff' : c.text,
        cursor: 'pointer', transition: 'transform .12s, box-shadow .12s',
        boxShadow: sel ? `0 6px 18px ${c.base}44` : `0 2px 8px ${c.base}1a`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => { if (!loadingRep) e.currentTarget.style.transform = 'scale(1.06)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >{r}</button>
  )
}

export default function TravauxDirigesEleve({ onBack }) {
  const [exercices, setExercices]   = useState([])
  const [reponses, setReponses]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [currentQ, setCurrentQ]     = useState(0)
  const [loadingRep, setLoadingRep] = useState(false)
  const [pending, setPending]       = useState([])
  const [reviewMode, setReviewMode] = useState(false)
  const [search, setSearch]         = useState('')

  useEffect(() => { charger() }, [])
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
    <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}><ListeChargement /></div>
  )

  // ── Vue liste ──────────────────────────────────────────────────────────────
  const recherche = search.trim().toLowerCase()
  const visibles = recherche ? exercices.filter(ex => (ex.titre || '').toLowerCase().includes(recherche)) : exercices

  if (!selected) return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Même disposition que les autres pages : Retour, recherche, puis bandeau bleu nuit souligné d'or */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Retour
          </button>
        </div>
      )}

      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder="Titre de l'exercice…" />
      </BarreFiltres>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
      <EnteteListe icone="pencil-square" titre="Mes exercices" sousTitre="Séries de questions préparées par vos moniteurs" nombre={visibles.length} />
      {visibles.length === 0 ? (
        <ListeVide texte={recherche ? 'Aucun exercice trouvé' : "Aucun exercice disponible pour l'instant"} icone="journal-x" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {visibles.map(ex => {
            const i = exercices.indexOf(ex)
            const { total, repondues, correctes } = scoreExercice(ex)
            const termine = repondues === total && total > 0
            const pct = total > 0 ? Math.round((correctes / total) * 100) : 0
            const etat = termine
              ? (pct >= 50 ? { label: `Réussi · ${pct} %`, couleur: '#15803d', fond: '#dcfce7' } : { label: `À revoir · ${pct} %`, couleur: '#b91c1c', fond: '#fee2e2' })
              : repondues > 0 ? { label: 'En cours', couleur: '#b45309', fond: '#fef3c7' }
              : { label: 'À commencer', couleur: '#1d4ed8', fond: '#dbeafe' }
            return (
              <button key={ex.id} type="button" onClick={() => openExercice(ex)}
                className="text-left bg-white rounded-2xl overflow-hidden border-0 p-0 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderRadius: '1rem', boxShadow: '0 2px 12px rgba(15,34,64,.07)', outline: '1px solid #e2e8f0' }}>
                {/* En-tête bleu nuit souligné d'or */}
                <div className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 60%,#2a4f7c 100%)', borderBottom: '3px solid #d4a017' }}>
                  <span className="rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-white truncate">{ex.titre}</div>
                    <div className="text-xs" style={{ color: '#bfdbfe' }}>{total} question{total !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Pastille couleur={etat.couleur} fond={etat.fond}>{etat.label}</Pastille>
                    <span className="text-xs font-bold" style={{ color: '#1e3a5f' }}>
                      {termine ? 'Revoir' : repondues > 0 ? 'Continuer' : 'Commencer'} <i className="bi bi-arrow-right" />
                    </span>
                  </div>
                  <div style={{ background: '#eef2f7', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, transition: 'width .3s',
                      width: total > 0 ? `${(repondues / total) * 100}%` : '0%',
                      background: 'linear-gradient(90deg,#d4a017,#f0bb2a)',
                    }} />
                  </div>
                  <p className="mb-0 mt-2 text-xs text-slate-400">
                    {repondues}/{total} répondue{repondues !== 1 ? 's' : ''}
                    {repondues > 0 && ` · ${correctes} correcte${correctes !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )

  // ── Données question courante ──────────────────────────────────────────────
  const qs      = selected.questions || []
  const q       = qs[currentQ]
  const rep     = q ? reponses[q.id] : null
  const is4     = q?.avecOptionD
  const options = q ? ['A', 'B', ...(q.avecOptionC || is4 ? ['C'] : []), ...(is4 ? ['D'] : [])] : []
  const bonnes  = rep ? rep.bonneReponse.split(',') : []
  const student = rep ? rep.reponse.split(',') : []
  const { correctes, repondues } = scoreExercice(selected)
  const termine = repondues === qs.length && qs.length > 0
  const pct     = qs.length > 0 ? Math.round((correctes / qs.length) * 100) : 0
  const succes  = pct >= 50

  // ── Écran de score final ──────────────────────────────────────────────────
  if (termine && !reviewMode) return (
    <div>
      <button onClick={() => setSelected(null)} className="btn-retour" style={{ marginBottom: '1.5rem' }}>
        <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Retour aux exercices
      </button>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '1.25rem', maxWidth: 480, margin: '0 auto' }}>
        <div className="card-body p-4 text-center">
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

          <h5 className="fw-bold mb-1" style={{ color: '#1e3a5f' }}>{selected.titre}</h5>
          <p className="text-muted mb-3" style={{ fontSize: '.85rem' }}>Série terminée</p>

          <div style={{
            background: succes ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${succes ? '#86efac' : '#fca5a5'}`,
            borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem',
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

  // ── Vue question ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Barre de navigation supérieure */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setSelected(null)} className="btn-retour" style={{ flexShrink: 0 }}>
          <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Exercices
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fw-bold text-truncate" style={{ color: '#1e3a5f', fontSize: '.95rem' }}>{selected.titre}</div>
          <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>
            {repondues}/{qs.length} répondue{repondues !== 1 ? 's' : ''} · {correctes} correcte{correctes !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          {repondues > 0 && (
            <span style={{
              background: correctes === repondues ? '#f0fdf4' : '#fffbeb',
              border: `1.5px solid ${correctes === repondues ? '#a7f3d0' : '#fde68a'}`,
              borderRadius: '.6rem', padding: '.3rem .8rem',
              color: correctes === repondues ? '#047857' : '#b45309',
              fontWeight: 700, fontSize: '.82rem',
            }}>
              <i className={`bi bi-${correctes === repondues ? 'trophy-fill' : 'star-half'} me-1`} />
              {correctes}/{repondues}
            </span>
          )}
          {reviewMode && (
            <button onClick={() => setReviewMode(false)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: '#1e3a5f', color: '#fff',
              border: 'none', borderRadius: '.75rem',
              fontSize: '.8rem', fontWeight: 600,
              padding: '.4rem .9rem', cursor: 'pointer',
            }}>
              <i className="bi bi-bar-chart-fill" style={{ fontSize: '.75rem' }} />Score
            </button>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ background: '#f1f5f9', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{
          height: '100%', borderRadius: 99, transition: 'width .4s ease',
          width: qs.length > 0 ? `${(repondues / qs.length) * 100}%` : '0%',
          background: 'linear-gradient(90deg,#3b82f6,#6366f1)',
        }} />
      </div>

      {/* Pastilles de navigation */}
      <div className="d-flex gap-1 flex-wrap mb-3">
        {qs.map((question, i) => {
          const r = reponses[question.id]
          let bg = '#f1f5f9', color = '#64748b', border = '#e2e8f0'
          if (r) {
            bg = r.estCorrecte ? '#f0fdf4' : '#fef2f2'
            color = r.estCorrecte ? '#15803d' : '#dc2626'
            border = r.estCorrecte ? '#86efac' : '#fca5a5'
          }
          if (i === currentQ) { bg = '#1e3a5f'; color = '#fff'; border = '#1e3a5f' }
          return (
            <button key={question.id} onClick={() => setCurrentQ(i)} style={{
              width: 34, height: 34, borderRadius: '.45rem', border: `2px solid ${border}`,
              background: bg, color, fontWeight: 700, fontSize: '.78rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
              {r ? (r.estCorrecte ? <i className="bi bi-check-lg" /> : <i className="bi bi-x-lg" />) : i + 1}
            </button>
          )
        })}
      </div>

      {/* Layout deux colonnes : image | options */}
      {q && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)',
          gap: '1rem',
          alignItems: 'start',
        }}
          className="td-question-grid"
        >
          {/* Colonne gauche : image */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '1.1rem', overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(145deg, #f0f4ff 0%, #f8fafc 100%)',
              padding: '1rem', position: 'relative', textAlign: 'center',
              minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              {/* Badges en haut */}
              <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '.4rem' }}>
                <span style={{
                  background: '#1e3a5f', color: '#fff',
                  borderRadius: '.5rem', padding: '.2rem .65rem',
                  fontSize: '.72rem', fontWeight: 700,
                }}>Q {currentQ + 1} / {qs.length}</span>
                {is4 && (
                  <span style={{
                    background: '#fdf4ff', color: '#8b5cf6',
                    border: '1.5px solid #e9d5ff',
                    borderRadius: '.5rem', padding: '.2rem .65rem',
                    fontSize: '.72rem', fontWeight: 700,
                  }}>2 réponses</span>
                )}
              </div>

              <img
                src={q.imageUrl}
                alt={`Question ${currentQ + 1}`}
                style={{
                  maxHeight: 320, maxWidth: '100%',
                  objectFit: 'contain', display: 'block',
                  marginTop: '1.5rem',
                }}
              />
            </div>
          </div>

          {/* Colonne droite : options + feedback + nav */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '1.1rem' }}>
            <div className="card-body" style={{ padding: '1.25rem' }}>
              <p className="fw-semibold mb-3" style={{ color: '#475569', fontSize: '.88rem' }}>
                {is4 ? '1 réponse parmi A/B et 1 parmi C/D :' : 'Quelle est la bonne réponse ?'}
              </p>

              {/* Options */}
              {is4 ? (
                <div className="mb-3">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                    {['A', 'B'].map(r => (
                      <OptionBtn key={r} r={r} rep={rep} bonnes={bonnes} student={student}
                        pending={pending} loadingRep={loadingRep}
                        onToggle={togglePending} onDirect={() => {}} is4 />
                    ))}
                    <div style={{ width: 1, height: 52, background: '#e2e8f0', margin: '0 .25rem', flexShrink: 0 }} />
                    {['C', 'D'].map(r => (
                      <OptionBtn key={r} r={r} rep={rep} bonnes={bonnes} student={student}
                        pending={pending} loadingRep={loadingRep}
                        onToggle={togglePending} onDirect={() => {}} is4 />
                    ))}
                  </div>
                  {!rep && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '.5rem' }}>
                      <span style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 600 }}>A ou B</span>
                      <span style={{ fontSize: '.7rem', color: '#94a3b8', fontWeight: 600 }}>C ou D</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginBottom: '.75rem' }}>
                  {options.map(r => (
                    <OptionBtn key={r} r={r} rep={rep} bonnes={bonnes} student={student}
                      pending={pending} loadingRep={loadingRep}
                      onToggle={togglePending} onDirect={(rv) => !loadingRep && handleRepondre(q.id, rv)} is4={false} />
                  ))}
                </div>
              )}

              {/* Bouton Valider (4 options) */}
              {is4 && !rep && (
                <div className="text-center mb-3">
                  <button
                    onClick={() => validerSelections(q.id)}
                    disabled={pending.length !== 2 || loadingRep}
                    style={{
                      background: pending.length === 2 ? 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' : '#e2e8f0',
                      color: pending.length === 2 ? '#fff' : '#94a3b8',
                      border: 'none', borderRadius: '.75rem',
                      padding: '.5rem 1.25rem', fontWeight: 700, fontSize: '.85rem',
                      cursor: pending.length === 2 ? 'pointer' : 'not-allowed',
                      transition: 'all .2s',
                    }}
                  >
                    {loadingRep
                      ? <><span className="spinner-border spinner-border-sm me-2" />Vérification…</>
                      : pending.length === 2
                        ? `Valider — ${[...pending].sort().join(' et ')}`
                        : `Valider (${pending.length}/2)`}
                  </button>
                </div>
              )}

              {loadingRep && !is4 && (
                <div className="text-center mb-3 text-muted" style={{ fontSize: '.82rem' }}>
                  <span className="spinner-border spinner-border-sm me-1" />Vérification…
                </div>
              )}

              {/* Feedback */}
              {rep && (
                <div style={{
                  borderRadius: '.85rem', padding: '.8rem 1rem', marginBottom: '.75rem',
                  background: rep.estCorrecte ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${rep.estCorrecte ? '#86efac' : '#fca5a5'}`,
                  color: rep.estCorrecte ? '#15803d' : '#dc2626',
                  fontWeight: 600, fontSize: '.84rem', textAlign: 'center',
                }}>
                  {rep.estCorrecte
                    ? <><i className="bi bi-check-circle-fill me-2" />{is4 ? 'Les 2 bonnes réponses !' : 'Bonne réponse !'}</>
                    : <><i className="bi bi-x-circle-fill me-2" />
                        {is4
                          ? <>Réponses : <strong>{bonnes.join(' et ')}</strong></>
                          : <>Bonne réponse : <strong>{rep.bonneReponse}</strong></>}
                      </>}
                </div>
              )}

              {/* Navigation Précédent / Suivant */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
                <button
                  onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                  disabled={currentQ === 0}
                  style={{
                    background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                    borderRadius: '.6rem', padding: '.4rem .9rem',
                    cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '.82rem', opacity: currentQ === 0 ? .45 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                  }}>
                  <i className="bi bi-arrow-left" />Précédent
                </button>
                <button
                  onClick={() => setCurrentQ(c => Math.min(qs.length - 1, c + 1))}
                  disabled={currentQ === qs.length - 1}
                  style={{
                    background: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0',
                    borderRadius: '.6rem', padding: '.4rem .9rem',
                    cursor: currentQ === qs.length - 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '.82rem', opacity: currentQ === qs.length - 1 ? .45 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                  }}>
                  Suivant<i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive : une colonne sur mobile */}
      <style>{`
        @media (max-width: 640px) {
          .td-question-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
