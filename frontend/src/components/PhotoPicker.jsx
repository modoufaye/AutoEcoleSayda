import { useState } from 'react'
import { uploadFile } from '../api'
import { toast } from './Toast'

/* ── Choix de la photo de profil (formulaires moniteur et élève) ── */
// /moniteur/upload/image : ouvert à l'admin et aux moniteurs, qui gèrent aussi les élèves.
export default function PhotoPicker({ value, onChange }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile('/moniteur/upload/image', file)
      onChange(res.url)
    } catch (err) {
      toast(err.message || 'Erreur upload', 'danger')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {value ? (
        <img src={value} alt="Photo de profil"
          style={{ width: 72, height: 72, borderRadius: '1rem', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: '1rem', border: '2px dashed #cbd5e1', background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-person-fill text-slate-300" style={{ fontSize: '1.8rem' }} />
        </div>
      )}
      <div className="flex gap-2">
        <label className="btn btn-light fw-semibold mb-0" style={{ borderRadius: '.75rem', fontSize: '.82rem' }}>
          {uploading
            ? <><span className="spinner-border spinner-border-sm me-1" />Envoi…</>
            : <><i className="bi bi-camera-fill me-1" />{value ? 'Changer' : 'Ajouter une photo'}</>}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={handleFile} />
        </label>
        {value && !uploading && (
          <button type="button" className="btn btn-light fw-semibold" style={{ borderRadius: '.75rem', fontSize: '.82rem', color: '#b91c1c' }}
            onClick={() => onChange('')}>
            <i className="bi bi-trash me-1" />Retirer
          </button>
        )}
      </div>
    </div>
  )
}
