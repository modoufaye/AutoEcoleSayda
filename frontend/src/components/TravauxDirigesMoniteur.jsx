import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
  D: { base: '#8b5cf6', light: '#fdf4ff', border: '#e9d5ff', text: '#6d28d9' },
}

const emptyQuestion = () => ({
  imageUrl: '', uploadError: '', uploading: false,
  avecOptionC: true, avecOptionD: false, bonneReponse: '',
})

export default function TravauxDirigesMoniteur({ onBack }) {
  const [exercices, setExercices] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [titre, setTitre]         = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [saving, setSaving]       = useState(false)
  const [editingQ, setEditingQ]       = useState(null)
  const [editingTitre, setEditingTitre] = useState(null)
  // editingTitre = { exId, valeur, saving }
  // editingQ = { exId, qId, qIdx, avecOptionC, avecOptionD, bonneReponse, imageUrl, uploading, uploadError, saving }

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    try { setExercices(await api('GET', '/moniteur/exercices-td')) }
    catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  // ── Création ─────────────────────────────────────────────────────────────

  function openForm() {
    setTitre('')
    setQuestions([emptyQuestion()])
    setShowForm(true)
    setEditingQ(null)
  }

  function updateQuestion(i, field, value) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function addQuestion() { setQuestions(qs => [...qs, emptyQuestion()]) }

  function removeQuestion(i) { setQuestions(qs => qs.filter((_, idx) => idx !== i)) }

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

  function toggleBonneReponse4(i, r) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== i) return q
      const current = q.bonneReponse ? q.bonneReponse.split(',') : []
      const isAB = r === 'A' || r === 'B'
      const filtered = current.filter(x => isAB ? x !== 'A' && x !== 'B' : x !== 'C' && x !== 'D')
      const next = current.includes(r) ? filtered : [...filtered, r].sort()
      return { ...q, bonneReponse: next.join(',') }
    }))
  }

  async function handleSave() {
    if (!titre.trim()) { toast('Le titre est obligatoire', 'warning'); return }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.imageUrl) { toast(`Question ${i + 1} : image manquante`, 'warning'); return }
      if (q.avecOptionD) {
        const parts = q.bonneReponse ? q.bonneReponse.split(',') : []
        if (parts.length !== 2) { toast(`Question ${i + 1} : choisissez exactement 2 bonnes réponses`, 'warning'); return }
      } else {
        if (!q.bonneReponse) { toast(`Question ${i + 1} : choisissez la bonne réponse`, 'warning'); return }
      }
    }
    setSaving(true)
    try {
      await api('POST', '/moniteur/exercices-td', {
        titre: titre.trim(),
        questions: questions.map((q, i) => ({
          imageUrl: q.imageUrl,
          avecOptionC: q.avecOptionD ? true : q.avecOptionC,
          avecOptionD: q.avecOptionD,
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
      if (editingQ?.exId === id) setEditingQ(null)
    } catch (e) { toast(e.message, 'danger') }
  }

  // ── Édition d'une question ────────────────────────────────────────────────

  function openEdit(exId, q, qIdx) {
    if (editingQ?.qId === q.id) { setEditingQ(null); return }
    setEditingQ({
      exId, qIdx, qId: q.id,
      avecOptionC: q.avecOptionC,
      avecOptionD: q.avecOptionD,
      bonneReponse: q.bonneReponse,
      imageUrl: q.imageUrl,
      uploading: false, uploadError: '', saving: false,
    })
  }

  function updateEditQ(field, value) {
    setEditingQ(prev => prev ? { ...prev, [field]: value } : prev)
  }

  function toggleBonneReponse4Edit(r) {
    setEditingQ(prev => {
      if (!prev) return prev
      const current = prev.bonneReponse ? prev.bonneReponse.split(',') : []
      const isAB = r === 'A' || r === 'B'
      const filtered = current.filter(x => isAB ? x !== 'A' && x !== 'B' : x !== 'C' && x !== 'D')
      const next = current.includes(r) ? filtered : [...filtered, r].sort()
      return { ...prev, bonneReponse: next.join(',') }
    })
  }

  async function handleEditImage(e) {
    const file = e.target.files[0]
    if (!file) return
    updateEditQ('uploading', true)
    updateEditQ('uploadError', '')
    try {
      const res = await uploadFile('/moniteur/upload/image', file)
      updateEditQ('imageUrl', res.url)
    } catch (err) {
      updateEditQ('uploadError', err.message || 'Erreur upload')
    } finally {
      updateEditQ('uploading', false)
    }
  }

  async function handleEditSave() {
    if (!editingQ) return
    if (editingQ.avecOptionD) {
      const parts = editingQ.bonneReponse ? editingQ.bonneReponse.split(',') : []
      if (parts.length !== 2) { toast('Choisissez 1 réponse parmi A/B et 1 parmi C/D', 'warning'); return }
    } else {
      if (!editingQ.bonneReponse) { toast('Choisissez la bonne réponse', 'warning'); return }
    }
    updateEditQ('saving', true)
    try {
      await api('PUT', `/moniteur/exercices-td/questions/${editingQ.qId}`, {
        avecOptionC: editingQ.avecOptionD ? true : editingQ.avecOptionC,
        avecOptionD: editingQ.avecOptionD,
        bonneReponse: editingQ.bonneReponse,
        imageUrl: editingQ.imageUrl,
      })
      toast('Question modifiée')
      setExercices(prev => prev.map(ex => {
        if (ex.id !== editingQ.exId) return ex
        return {
          ...ex,
          questions: ex.questions.map(q => q.id !== editingQ.qId ? q : {
            ...q,
            avecOptionC: editingQ.avecOptionD ? true : editingQ.avecOptionC,
            avecOptionD: editingQ.avecOptionD,
            bonneReponse: editingQ.bonneReponse,
            imageUrl: editingQ.imageUrl,
          }),
        }
      }))
      setEditingQ(null)
    } catch (e) {
      toast(e.message, 'danger')
      updateEditQ('saving', false)
    }
  }

  // ── Édition du titre ─────────────────────────────────────────────────────

  function openEditTitre(ex) {
    setEditingTitre({ exId: ex.id, valeur: ex.titre, saving: false })
    setEditingQ(null)
  }

  async function handleSaveTitre() {
    if (!editingTitre) return
    if (!editingTitre.valeur.trim()) { toast('Le titre ne peut pas être vide', 'warning'); return }
    setEditingTitre(prev => ({ ...prev, saving: true }))
    try {
      await api('PATCH', `/moniteur/exercices-td/${editingTitre.exId}`, { titre: editingTitre.valeur.trim() })
      setExercices(prev => prev.map(ex =>
        ex.id === editingTitre.exId ? { ...ex, titre: editingTitre.valeur.trim() } : ex
      ))
      setEditingTitre(null)
      toast('Titre modifié')
    } catch (e) {
      toast(e.message, 'danger')
      setEditingTitre(prev => ({ ...prev, saving: false }))
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

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

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '.85rem', color: '#475569' }}>
                Questions
              </label>

              {questions.map((q, i) => {
                const selected4 = q.avecOptionD ? (q.bonneReponse ? q.bonneReponse.split(',') : []) : []
                return (
                  <div key={i} className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="fw-bold" style={{ color: '#1e3a5f', fontSize: '.85rem' }}>Question {i + 1}</span>
                      {questions.length > 1 && (
                        <button onClick={() => removeQuestion(i)} style={{
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '.5rem', padding: '.25rem .6rem', cursor: 'pointer', fontSize: '.78rem',
                        }}>
                          <i className="bi bi-trash3 me-1" />Supprimer
                        </button>
                      )}
                    </div>

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

                    <div className="mb-3 d-flex flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <input type="checkbox" id={`optionC-${i}`}
                          checked={q.avecOptionD ? true : q.avecOptionC}
                          disabled={q.avecOptionD}
                          onChange={e => {
                            updateQuestion(i, 'avecOptionC', e.target.checked)
                            if (!e.target.checked && q.bonneReponse === 'C') updateQuestion(i, 'bonneReponse', '')
                          }}
                          style={{ width: 16, height: 16, cursor: q.avecOptionD ? 'not-allowed' : 'pointer' }} />
                        <label htmlFor={`optionC-${i}`} style={{
                          fontSize: '.82rem', color: q.avecOptionD ? '#94a3b8' : '#475569',
                          fontWeight: 600, cursor: q.avecOptionD ? 'not-allowed' : 'pointer', marginBottom: 0,
                        }}>Inclure l'option C</label>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <input type="checkbox" id={`optionD-${i}`} checked={q.avecOptionD}
                          onChange={e => {
                            updateQuestion(i, 'avecOptionD', e.target.checked)
                            if (e.target.checked) updateQuestion(i, 'avecOptionC', true)
                            updateQuestion(i, 'bonneReponse', '')
                          }}
                          style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        <label htmlFor={`optionD-${i}`} style={{ fontSize: '.82rem', color: '#475569', fontWeight: 600, cursor: 'pointer', marginBottom: 0 }}>
                          Inclure l'option D
                        </label>
                        {q.avecOptionD && <span style={{ fontSize: '.75rem', color: '#8b5cf6', fontWeight: 600 }}>→ 2 bonnes réponses</span>}
                      </div>
                    </div>

                    <div>
                      <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#64748b' }}>
                        {q.avecOptionD ? 'Bonnes réponses (choisissez 2)' : 'Bonne réponse'} <span className="text-danger">*</span>
                      </label>
                      {q.avecOptionD ? (
                        <div className="d-flex flex-column gap-3">
                          {[['A','B'], ['C','D']].map(([r1, r2], gi) => (
                            <div key={gi}>
                              <div className="mb-1" style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>Entre {r1} et {r2} :</div>
                              <div className="d-flex gap-2">
                                {[r1, r2].map(r => {
                                  const c = BTN_COLORS[r]
                                  const sel = selected4.includes(r)
                                  return (
                                    <button key={r} onClick={() => toggleBonneReponse4(i, r)} style={{
                                      width: 48, height: 48, borderRadius: '.75rem', fontWeight: 800, fontSize: '1.1rem',
                                      border: sel ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                                      background: sel ? c.base : c.light, color: sel ? '#fff' : c.text,
                                      cursor: 'pointer', transition: 'all .15s',
                                      boxShadow: sel ? `0 4px 10px ${c.base}44` : 'none',
                                    }}>{r}</button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          {selected4.length === 2 && (
                            <div style={{ fontSize: '.78rem', color: '#8b5cf6', fontWeight: 600 }}>
                              <i className="bi bi-check-circle-fill me-1" />Bonnes réponses : {selected4.join(' et ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          {['A', 'B', ...(q.avecOptionC ? ['C'] : [])].map(r => {
                            const c = BTN_COLORS[r]
                            const selected = q.bonneReponse === r
                            return (
                              <button key={r} onClick={() => updateQuestion(i, 'bonneReponse', r)} style={{
                                width: 48, height: 48, borderRadius: '.75rem', fontWeight: 800, fontSize: '1.1rem',
                                border: selected ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                                background: selected ? c.base : c.light, color: selected ? '#fff' : c.text,
                                cursor: 'pointer', transition: 'all .15s',
                                boxShadow: selected ? `0 4px 10px ${c.base}44` : 'none',
                              }}>{r}</button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

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
                  <div className="d-flex align-items-center gap-3 flex-grow-1 me-3" style={{ minWidth: 0 }}>
                    <span style={{
                      background: '#1e3a5f', color: '#fff', borderRadius: '.5rem',
                      padding: '.2rem .55rem', fontSize: '.72rem', fontWeight: 700, flexShrink: 0,
                    }}>#{ei + 1}</span>

                    {editingTitre?.exId === ex.id ? (
                      /* Champ d'édition inline du titre */
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          style={{ borderRadius: '.5rem', fontWeight: 700, color: '#1e3a5f', maxWidth: 320 }}
                          value={editingTitre.valeur}
                          onChange={e => setEditingTitre(prev => ({ ...prev, valeur: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveTitre(); if (e.key === 'Escape') setEditingTitre(null) }}
                          autoFocus
                          disabled={editingTitre.saving}
                        />
                        <button onClick={handleSaveTitre} disabled={editingTitre.saving} style={{
                          background: '#1e3a5f', color: '#fff', border: 'none',
                          borderRadius: '.5rem', padding: '.3rem .65rem', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0,
                        }}>
                          {editingTitre.saving
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-check-lg" />}
                        </button>
                        <button onClick={() => setEditingTitre(null)} style={{
                          background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                          borderRadius: '.5rem', padding: '.3rem .65rem', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0,
                        }}><i className="bi bi-x-lg" /></button>
                      </div>
                    ) : (
                      /* Affichage normal du titre avec bouton crayon */
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{ color: '#1e3a5f' }}>{ex.titre}</span>
                        <button onClick={() => openEditTitre(ex)} title="Modifier le titre" style={{
                          background: 'none', border: 'none', color: '#94a3b8',
                          cursor: 'pointer', padding: '0 .25rem', fontSize: '.78rem', lineHeight: 1,
                        }}>
                          <i className="bi bi-pencil" />
                        </button>
                        <span style={{ fontSize: '.78rem', color: '#94a3b8' }}>
                          {ex.questions?.length || 0} question{(ex.questions?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(ex.id)} style={{
                    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                    borderRadius: '.5rem', padding: '.3rem .65rem', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0,
                  }}><i className="bi bi-trash3" /></button>
                </div>

                {/* Questions miniatures */}
                <div className="d-flex gap-3 p-3 flex-wrap">
                  {(ex.questions || []).map((q, qi) => {
                    const bonnes = q.bonneReponse ? q.bonneReponse.split(',') : []
                    const isEditing = editingQ?.qId === q.id
                    return (
                      <div key={q.id} style={{
                        background: isEditing ? '#eff6ff' : '#fff',
                        border: `1.5px solid ${isEditing ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius: '.75rem', overflow: 'hidden', width: 140, flexShrink: 0,
                        transition: 'border-color .15s, background .15s',
                      }}>
                        <img src={q.imageUrl} alt={`Q${qi + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'contain', background: '#f8fafc', padding: '.5rem' }} />
                        <div className="d-flex align-items-center justify-content-between px-2 py-1" style={{ gap: 4 }}>
                          <span style={{ fontSize: '.72rem', color: '#94a3b8', fontWeight: 600 }}>Q{qi + 1}</span>
                          <div className="d-flex gap-1 align-items-center">
                            {bonnes.map(b => {
                              const c = BTN_COLORS[b] || BTN_COLORS.A
                              return (
                                <span key={b} style={{
                                  width: 20, height: 20, borderRadius: '.3rem', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  background: c.base, color: '#fff', fontWeight: 800, fontSize: '.7rem',
                                }}>{b}</span>
                              )
                            })}
                            {/* Bouton crayon */}
                            <button
                              onClick={() => openEdit(ex.id, q, qi)}
                              title="Modifier les choix"
                              style={{
                                background: isEditing ? '#3b82f6' : '#f1f5f9',
                                color: isEditing ? '#fff' : '#64748b',
                                border: 'none', borderRadius: '.3rem',
                                width: 22, height: 22, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 0, fontSize: '.68rem', transition: 'all .15s',
                              }}
                            >
                              <i className={`bi bi-${isEditing ? 'x-lg' : 'pencil-fill'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Panneau d'édition inline */}
                {editingQ && editingQ.exId === ex.id && (() => {
                  const sel4 = editingQ.bonneReponse ? editingQ.bonneReponse.split(',') : []
                  return (
                    <div className="px-3 pb-3">
                      <div className="p-3 rounded-3" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                        <div className="fw-bold mb-3" style={{ color: '#1e3a5f', fontSize: '.85rem' }}>
                          <i className="bi bi-pencil-square me-2" style={{ color: '#3b82f6' }} />
                          Modifier Question {editingQ.qIdx + 1}
                        </div>

                        {/* Image (optionnel — conserver ou remplacer) */}
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#64748b' }}>
                            Image (optionnel — laisser vide pour garder l'actuelle)
                          </label>
                          <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                            <img src={editingQ.imageUrl} alt=""
                              style={{ height: 60, maxWidth: 100, objectFit: 'contain', borderRadius: '.5rem', border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: 4 }} />
                            <input type="file" accept="image/*" className="form-control form-control-sm"
                              style={{ borderRadius: '.6rem', maxWidth: 260 }}
                              onChange={handleEditImage} disabled={editingQ.uploading} />
                          </div>
                          {editingQ.uploading && (
                            <div className="text-muted" style={{ fontSize: '.8rem' }}>
                              <span className="spinner-border spinner-border-sm me-1" />Chargement…
                            </div>
                          )}
                          {editingQ.uploadError && (
                            <div style={{ color: '#dc2626', fontSize: '.8rem' }}>{editingQ.uploadError}</div>
                          )}
                        </div>

                        {/* Options C / D */}
                        <div className="mb-3 d-flex flex-wrap gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <input type="checkbox" id="edit-optC"
                              checked={editingQ.avecOptionD ? true : editingQ.avecOptionC}
                              disabled={editingQ.avecOptionD}
                              onChange={e => {
                                updateEditQ('avecOptionC', e.target.checked)
                                if (!e.target.checked && editingQ.bonneReponse === 'C') updateEditQ('bonneReponse', '')
                              }}
                              style={{ width: 16, height: 16, cursor: editingQ.avecOptionD ? 'not-allowed' : 'pointer' }} />
                            <label htmlFor="edit-optC" style={{
                              fontSize: '.82rem', color: editingQ.avecOptionD ? '#94a3b8' : '#475569',
                              fontWeight: 600, cursor: editingQ.avecOptionD ? 'not-allowed' : 'pointer', marginBottom: 0,
                            }}>Inclure l'option C</label>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <input type="checkbox" id="edit-optD" checked={editingQ.avecOptionD}
                              onChange={e => {
                                updateEditQ('avecOptionD', e.target.checked)
                                if (e.target.checked) updateEditQ('avecOptionC', true)
                                updateEditQ('bonneReponse', '')
                              }}
                              style={{ width: 16, height: 16, cursor: 'pointer' }} />
                            <label htmlFor="edit-optD" style={{ fontSize: '.82rem', color: '#475569', fontWeight: 600, cursor: 'pointer', marginBottom: 0 }}>
                              Inclure l'option D
                            </label>
                            {editingQ.avecOptionD && (
                              <span style={{ fontSize: '.75rem', color: '#8b5cf6', fontWeight: 600 }}>→ 2 bonnes réponses</span>
                            )}
                          </div>
                        </div>

                        {/* Bonne(s) réponse(s) */}
                        <div className="mb-3">
                          <label className="form-label fw-semibold" style={{ fontSize: '.82rem', color: '#64748b' }}>
                            {editingQ.avecOptionD ? 'Bonnes réponses' : 'Bonne réponse'} <span className="text-danger">*</span>
                          </label>
                          {editingQ.avecOptionD ? (
                            <div className="d-flex flex-column gap-2">
                              {[['A','B'], ['C','D']].map(([r1, r2], gi) => (
                                <div key={gi}>
                                  <div className="mb-1" style={{ fontSize: '.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                    Entre {r1} et {r2} :
                                  </div>
                                  <div className="d-flex gap-2">
                                    {[r1, r2].map(r => {
                                      const c = BTN_COLORS[r]
                                      const sel = sel4.includes(r)
                                      return (
                                        <button key={r} onClick={() => toggleBonneReponse4Edit(r)} style={{
                                          width: 44, height: 44, borderRadius: '.75rem', fontWeight: 800, fontSize: '1rem',
                                          border: sel ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                                          background: sel ? c.base : c.light, color: sel ? '#fff' : c.text,
                                          cursor: 'pointer', transition: 'all .15s',
                                          boxShadow: sel ? `0 4px 10px ${c.base}44` : 'none',
                                        }}>{r}</button>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                              {sel4.length === 2 && (
                                <div style={{ fontSize: '.78rem', color: '#8b5cf6', fontWeight: 600 }}>
                                  <i className="bi bi-check-circle-fill me-1" />Bonnes réponses : {sel4.join(' et ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="d-flex gap-2">
                              {['A', 'B', ...(editingQ.avecOptionC ? ['C'] : [])].map(r => {
                                const c = BTN_COLORS[r]
                                const sel = editingQ.bonneReponse === r
                                return (
                                  <button key={r} onClick={() => updateEditQ('bonneReponse', r)} style={{
                                    width: 44, height: 44, borderRadius: '.75rem', fontWeight: 800, fontSize: '1rem',
                                    border: sel ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                                    background: sel ? c.base : c.light, color: sel ? '#fff' : c.text,
                                    cursor: 'pointer', transition: 'all .15s',
                                    boxShadow: sel ? `0 4px 10px ${c.base}44` : 'none',
                                  }}>{r}</button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2">
                          <button className="btn btn-light btn-sm fw-semibold" style={{ borderRadius: '.6rem' }}
                            onClick={() => setEditingQ(null)}>Annuler</button>
                          <button
                            className="btn btn-sm fw-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.6rem', border: 'none' }}
                            onClick={handleEditSave}
                            disabled={editingQ.saving || editingQ.uploading}
                          >
                            {editingQ.saving
                              ? <><span className="spinner-border spinner-border-sm me-1" />Enregistrement…</>
                              : <><i className="bi bi-check-lg me-1" />Sauvegarder</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
