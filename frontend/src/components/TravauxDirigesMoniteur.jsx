import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'

const REPONSES = ['A', 'B', 'C']

const BTN_COLORS = {
  A: { base: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  B: { base: '#f59e0b', light: '#fffbeb', border: '#fde68a', text: '#b45309' },
  C: { base: '#10b981', light: '#f0fdf4', border: '#a7f3d0', text: '#047857' },
}

export default function TravauxDirigesMoniteur() {
  const [exercices, setExercices] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [imageUrl, setImageUrl]   = useState('')
  const [bonneReponse, setBonneReponse] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    try { setExercices(await api('GET', '/moniteur/exercices-td')) }
    catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  async function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    setImageUrl('')
    try {
      const res = await uploadFile('/moniteur/upload/image', file)
      setImageUrl(res.url)
    } catch (e) {
      setUploadError(e.message || 'Erreur lors du chargement de l\'image')
    }
    finally { setUploading(false) }
  }

  async function handleSave() {
    if (!imageUrl) { toast('Veuillez charger une image', 'warning'); return }
    if (!bonneReponse) { toast('Veuillez choisir la bonne réponse', 'warning'); return }
    setSaving(true)
    try {
      await api('POST', '/moniteur/exercices-td', { imageUrl, bonneReponse })
      toast('Exercice créé avec succès')
      setShowForm(false)
      setImageUrl('')
      setBonneReponse('')
      charger()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet exercice ?')) return
    try {
      await api('DELETE', `/moniteur/exercices-td/${id}`)
      toast('Exercice supprimé')
      setExercices(prev => prev.filter(e => e.id !== id))
    } catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div>
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#1e3a5f' }}>Travaux Dirigés</h4>
          <p className="text-muted mb-0" style={{ fontSize: '.85rem' }}>
            {exercices.length} exercice{exercices.length !== 1 ? 's' : ''} créé{exercices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn fw-bold text-white"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none', padding: '.55rem 1.2rem' }}
          onClick={() => { setShowForm(true); setImageUrl(''); setBonneReponse(''); setUploadError('') }}
        >
          <i className="bi bi-plus-lg me-2" />Nouvel exercice
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3" style={{ color: '#1e3a5f' }}>
              <i className="bi bi-image-fill me-2 text-primary" />Nouvel exercice
            </h6>

            {/* Upload image */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '.85rem', color: '#475569' }}>
                Image de l'exercice <span className="text-danger">*</span>
              </label>
              <input
                type="file" accept="image/*"
                className="form-control"
                style={{ borderRadius: '.6rem' }}
                onChange={handleImage}
                disabled={uploading}
              />
              {uploading && (
                <div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: '.82rem', color: '#64748b' }}>
                  <span className="spinner-border spinner-border-sm" />Chargement de l'image en cours…
                </div>
              )}
              {uploadError && !uploading && (
                <div className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded-3"
                  style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: '.82rem', fontWeight: 600 }}>
                  <i className="bi bi-exclamation-circle-fill" />
                  {uploadError} — Veuillez réessayer
                </div>
              )}
              {imageUrl && !uploading && (
                <>
                  <div className="d-flex align-items-center gap-2 mt-2 px-3 py-2 rounded-3"
                    style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d', fontSize: '.82rem', fontWeight: 600 }}>
                    <i className="bi bi-check-circle-fill" />Image chargée avec succès
                  </div>
                  <img src={imageUrl} alt="aperçu" className="mt-2 rounded-3"
                    style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', border: '1.5px solid #e2e8f0' }} />
                </>
              )}
            </div>

            {/* Choix de la bonne réponse */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '.85rem', color: '#475569' }}>
                Bonne réponse <span className="text-danger">*</span>
              </label>
              <div className="d-flex gap-3">
                {REPONSES.map(r => {
                  const c = BTN_COLORS[r]
                  const selected = bonneReponse === r
                  return (
                    <button
                      key={r}
                      onClick={() => setBonneReponse(r)}
                      style={{
                        width: 56, height: 56, borderRadius: '1rem', fontWeight: 800, fontSize: '1.3rem',
                        border: selected ? `2.5px solid ${c.base}` : `2px solid ${c.border}`,
                        background: selected ? c.base : c.light,
                        color: selected ? '#fff' : c.text,
                        cursor: 'pointer', transition: 'all .15s',
                        boxShadow: selected ? `0 4px 12px ${c.base}44` : 'none',
                      }}
                    >{r}</button>
                  )
                })}
              </div>
              {bonneReponse && (
                <p className="mt-2 mb-0" style={{ fontSize: '.82rem', color: BTN_COLORS[bonneReponse].text, fontWeight: 600 }}>
                  <i className="bi bi-check-circle-fill me-1" />Réponse correcte : {bonneReponse}
                </p>
              )}
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-light fw-semibold" style={{ borderRadius: '.6rem' }}
                onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn fw-bold text-white"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.6rem', border: 'none' }}
                onClick={handleSave} disabled={saving || uploading}
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
        <div className="row g-3">
          {exercices.map((ex, i) => {
            const c = BTN_COLORS[ex.bonneReponse]
            return (
              <div key={ex.id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <img src={ex.imageUrl} alt={`Exercice ${i + 1}`}
                      style={{ width: '100%', height: 180, objectFit: 'contain', padding: '1rem' }} />
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      background: '#1e3a5f', color: '#fff',
                      borderRadius: '.5rem', padding: '.2rem .55rem',
                      fontSize: '.72rem', fontWeight: 700,
                    }}>#{i + 1}</span>
                  </div>
                  <div className="card-body d-flex align-items-center justify-content-between p-3">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 600 }}>Bonne réponse :</span>
                      <span style={{
                        width: 32, height: 32, borderRadius: '.5rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: c.base, color: '#fff', fontWeight: 800, fontSize: '1rem',
                      }}>{ex.bonneReponse}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      style={{
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        borderRadius: '.5rem', padding: '.3rem .65rem', cursor: 'pointer', fontSize: '.8rem',
                      }}
                    ><i className="bi bi-trash3" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
