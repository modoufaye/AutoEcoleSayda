import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
}

const emptyQuestion = () => ({ imageUrl: '', uploadError: '', uploading: false, avecOptionC: true, bonneReponse: '' })

export default function TravauxDirigesMoniteur({ onBack }) {
  const [exercices, setExercices] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [titre, setTitre]         = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [saving, setSaving]       = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    try { setExercices(await api('GET', '/moniteur/exercices-td')) }
    catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  function openForm() {
    setTitre('')
    setQuestions([emptyQuestion()])
    setShowForm(true)
  }

  function updateQuestion(i, field, value) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion()])
  }

  function removeQuestion(i) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }

  async function handleImage(i, e) {
    const file = e.target.files[0]
    if (!file) return
    updateQuestion(i, 'uploading', true)
    updateQuestion(i, 'uploadError', '')
    updateQuestion(i, 'imageUrl', '')
    try {
      const res = await uploadFile('/moniteur/upload/image', file)
      updateQuestion(i, 'imageUrl', res.url)
    } catch (err) {
      updateQuestion(i, 'uploadError', err.message || 'Erreur lors du chargement')
    } finally {
      updateQuestion(i, 'uploading', false)
    }
  }

  async function handleSave() {
    if (!titre.trim()) { toast('Le titre est obligatoire', 'warning'); return }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.imageUrl) { toast(`Question ${i + 1} : image manquante`, 'warning'); return }
      if (!q.bonneReponse) { toast(`Question ${i + 1} : choisissez la bonne réponse`, 'warning'); return }
    }
    setSaving(true)
    try {
      await api('POST', '/moniteur/exercices-td', {
        titre: titre.trim(),
        questions: questions.map((q, i) => ({
          imageUrl: q.imageUrl,
          avecOptionC: q.avecOptionC,
          bonneReponse: q.bonneReponse,
          ordre: i,
        })),
      })
      toast('Exercice créé avec succès')
      setShowForm(false)
      charger()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet exercice et toutes ses questions ?')) return
    try {
      await api('DELETE', `/moniteur/exercices-td/${id}`)
      toast('Exercice supprimé')
      setExercices(prev => prev.filter(e => e.id !== id))
    } catch (e) { toast(e.message, 'danger') }
  }

  return (
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

      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#1e3a5f' }}>Travaux Dirigés</h4>
          <p className="text-muted mb-0" style={{ fontSize: '.85rem' }}>
            {exercices.length} exercice{exercices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn fw-bold text-white"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none', padding: '.55rem 1.2rem' }}
          onClick={openForm}
        >
          <i className="bi bi-plus-lg me-2" />Nouvel exercice
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-4" style={{ color: '#1e3a5f' }}>
              <i className="bi bi-pencil-square me-2 text-warning" />Nouvel exercice
            </h6>

            {/* Titre */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '.85rem', color: '#475569' }}>
                Titre de l'exercice <span className="text-danger">*</span>
              </label>
              <input
                type="text" className="form-control" style={{ borderRadius: '.6rem' }}
                placeholder="Ex : Signalisation routière — Série 1"
                value={titre} onChange={e => setTitre(e.target.value)}
              />
            </div>

            {/* Questions */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '.85rem', color: '#475569' }}>
                Questions
              </label>

              {questions.map((q, i) => (
                <div key={i} className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-bold" style={{ color: '#1e3a5f', fontSize: '.85rem' }}>
                      Question {i + 1}
                    </span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} style={{
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: '.5rem', padding: '.25rem .6rem', cursor: 'pointer', fontSize: '.78rem',
                      }}>
                        <i className="bi bi-trash3 me-1" />Supprimer
                      </button>
                    )}
                  </div>

                  {/* Upload image */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#64748b' }}>
                      Image <span className="text-danger">*</span>
                    </label>
                    <input type="file" accept="image/*" className="form-control"
                      style={{ borderRadius: '.6rem', fontSize: '.82rem' }}
                      onChange={e => handleImage(i, e)} disabled={q.uploading} />
                    {q.uploading && (
                      <div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: '.8rem', color: '#64748b' }}>
                        <span className="spinner-border spinner-border-sm" />Chargement…
                      </div>
                    )}
                    {q.uploadError && !q.uploading && (
                      <div className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded-3"
                        style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: '.8rem', fontWeight: 600 }}>
                        <i className="bi bi-exclamation-circle-fill" />{q.uploadError} — Réessayez
                      </div>
                    )}
                    {q.imageUrl && !q.uploading && (
                      <>
                        <div className="d-flex align-items-center gap-2 mt-2 px-3 py-1.5 rounded-3"
                          style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', fontSize: '.8rem', fontWeight: 600 }}>
                          <i className="bi bi-check-circle-fill" />Image chargée
                        </div>
                        <img src={q.imageUrl} alt="" className="mt-2 rounded-3"
                          style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain', border: '1.5px solid #e2e8f0' }} />
                      </>
                    )}
                  </div>

                  {/* Option C */}
                  <div className="mb-3 d-flex align-items-center gap-2">
                    <input type="checkbox" id={`optionC-${i}`} checked={q.avecOptionC}
                      onChange={e => {
                        updateQuestion(i, 'avecOptionC', e.target.checked)
                        if (!e.target.checked && q.bonneReponse === 'C') updateQuestion(i, 'bonneReponse', '')
                      }}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <label htmlFor={`optionC-${i}`} style={{ fontSize: '.82rem', color: '#475569', fontWeight: 600, cursor: 'pointer', marginBottom: 0 }}>
                      Inclure l'option C
                    </label>
                    {!q.avecOptionC && (
                      <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>(seules A et B s'afficheront)</span>
                    )}
                  </div>

                  {/* Bonne réponse */}
                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#64748b' }}>
                      Bonne réponse <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-2">
                      {['A', 'B', ...(q.avecOptionC ? ['C'] : [])].map(r => {
                        const c = BTN_COLORS[r]
                        const selected = q.bonneReponse === r
                        return (
                          <button key={r} onClick={() => updateQuestion(i, 'bonneReponse', r)} style={{
                            width: 48, height: 48, borderRadius: '.75rem', fontWeight: 800, fontSize: '1.1rem',
                            border: selected ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                            background: selected ? c.base : c.light,
                            color: selected ? '#fff' : c.text,
                            cursor: 'pointer', transition: 'all .15s',
                            boxShadow: selected ? `0 4px 10px ${c.base}44` : 'none',
                          }}>{r}</button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addQuestion} style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: '#f0f9ff', color: '#0369a1', border: '1.5px dashed #7dd3fc',
                borderRadius: '.75rem', padding: '.5rem 1rem',
                fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', width: '100%',
                justifyContent: 'center',
              }}>
                <i className="bi bi-plus-lg" />Ajouter une question
              </button>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-light fw-semibold" style={{ borderRadius: '.6rem' }}
                onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn fw-bold text-white"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.6rem', border: 'none' }}
                onClick={handleSave}
                disabled={saving || questions.some(q => q.uploading)}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Enregistrement…</>
                  : <><i className="bi bi-check-lg me-1" />Enregistrer l'exercice</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des exercices */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" />Chargement…
        </div>
      ) : exercices.length === 0 ? (
        <div className="text-center py-5" style={{ color: '#94a3b8' }}>
          <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '.75rem' }} />
          Aucun exercice créé pour l'instant
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {exercices.map((ex, ei) => (
            <div key={ex.id} className="card border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
              <div className="card-body p-0">
                {/* En-tête exercice */}
                <div className="d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '1rem 1rem 0 0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <span style={{
                      background: '#1e3a5f', color: '#fff', borderRadius: '.5rem',
                      padding: '.2rem .55rem', fontSize: '.72rem', fontWeight: 700,
                    }}>#{ei + 1}</span>
                    <span className="fw-bold" style={{ color: '#1e3a5f' }}>{ex.titre}</span>
                    <span style={{ fontSize: '.78rem', color: '#94a3b8' }}>
                      {ex.questions?.length || 0} question{(ex.questions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(ex.id)} style={{
                    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                    borderRadius: '.5rem', padding: '.3rem .65rem', cursor: 'pointer', fontSize: '.8rem',
                  }}><i className="bi bi-trash3" /></button>
                </div>

                {/* Questions */}
                <div className="d-flex gap-3 p-3 flex-wrap">
                  {(ex.questions || []).map((q, qi) => {
                    const c = BTN_COLORS[q.bonneReponse] || BTN_COLORS.A
                    return (
                      <div key={q.id} style={{
                        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '.75rem',
                        overflow: 'hidden', width: 140, flexShrink: 0,
                      }}>
                        <img src={q.imageUrl} alt={`Q${qi + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'contain', background: '#f8fafc', padding: '.5rem' }} />
                        <div className="d-flex align-items-center justify-content-between px-2 py-1.5">
                          <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>Q{qi + 1}</span>
                          <div className="d-flex gap-1 align-items-center">
                            {!q.avecOptionC && (
                              <span style={{ fontSize: '.65rem', color: '#94a3b8' }}>A/B</span>
                            )}
                            <span style={{
                              width: 24, height: 24, borderRadius: '.35rem', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              background: c.base, color: '#fff', fontWeight: 800, fontSize: '.8rem',
                            }}>{q.bonneReponse}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
