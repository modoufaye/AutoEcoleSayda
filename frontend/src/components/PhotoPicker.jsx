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

  // Carte blanche bordée : reste visible sur le fond gris clair des formulaires.
  return (
    <div className="flex items-center gap-4 flex-wrap p-3 rounded-2xl"
      style={{ background: '#fff', border: '1.5px solid #e2e8f0' }}>
      <label className="mb-0" style={{ cursor: uploading ? 'wait' : 'pointer' }} title="Choisir une photo">
        {value ? (
          <img src={value} alt="Photo de profil"
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #d4a017', display: 'block' }} />
        ) : (
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: '2px dashed #94a3b8', background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-camera-fill" style={{ fontSize: '1.8rem', color: '#64748b' }} />
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={handleFile} />
      </label>
      <div className="flex flex-col gap-2">
        <label className="btn fw-bold text-white mb-0" style={{ borderRadius: '.75rem', fontSize: '.85rem',
          background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none' }}>
          {uploading
            ? <><span className="spinner-border spinner-border-sm me-1" />Envoi…</>
            : <><i className="bi bi-camera-fill me-1" />{value ? 'Changer la photo' : 'Ajouter une photo'}</>}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={handleFile} />
        </label>
        {value && !uploading && (
          <button type="button" className="btn fw-semibold" style={{ borderRadius: '.75rem', fontSize: '.82rem',
            background: '#fee2e2', color: '#b91c1c', border: 'none' }}
            onClick={() => onChange('')}>
            <i className="bi bi-trash me-1" />Retirer
          </button>
        )}
        <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>JPEG, PNG ou WebP</span>
      </div>
    </div>
  )
}
