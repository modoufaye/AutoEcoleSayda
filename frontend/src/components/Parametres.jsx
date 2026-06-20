import { useState, useEffect, useRef } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'

const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const inputCls = 'form-control'

function UploadZone({ label, value, onUploaded, accept = 'image/*' }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile('/admin/upload/image', file)
      onUploaded(res.url)
    } catch (err) {
      toast(err.message || 'Erreur upload', 'danger')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {value ? (
          <img src={value} alt={label}
            style={{ height: 64, maxWidth: 140, objectFit: 'contain', borderRadius: '.6rem',
              border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: 6 }} />
        ) : (
          <div style={{ height: 64, width: 100, borderRadius: '.6rem', border: '1.5px dashed #e2e8f0',
            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-image text-slate-300" style={{ fontSize: '1.4rem' }} />
          </div>
        )}
        <div>
          <button type="button"
            className="btn btn-light btn-sm fw-semibold d-flex align-items-center gap-2"
            style={{ borderRadius: '.6rem' }}
            onClick={() => ref.current?.click()}
            disabled={uploading}>
            {uploading
              ? <><span className="spinner-border spinner-border-sm" />Chargement…</>
              : <><i className="bi bi-upload" />{value ? 'Remplacer' : 'Choisir un fichier'}</>}
          </button>
          {value && (
            <button type="button"
              className="btn btn-sm mt-1 d-flex align-items-center gap-1"
              style={{ color: '#dc2626', background: 'none', border: 'none', padding: '0', fontSize: '.78rem' }}
              onClick={() => onUploaded('')}>
              <i className="bi bi-trash3" />Supprimer
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  )
}

export default function Parametres() {
  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '', email: '',
    logoUrl: '', signatureUrl: '',
    tarifInscription: '', tarifHeureCode: '', tarifHeureConduite: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api('GET', '/admin/config')
      .then(data => setForm({
        nom:               data.nom               || '',
        adresse:           data.adresse           || '',
        telephone:         data.telephone         || '',
        email:             data.email             || '',
        logoUrl:           data.logoUrl           || '',
        signatureUrl:      data.signatureUrl      || '',
        tarifInscription:  data.tarifInscription  ?? '',
        tarifHeureCode:    data.tarifHeureCode    ?? '',
        tarifHeureConduite:data.tarifHeureConduite ?? '',
      }))
      .catch(e => toast(e.message, 'danger'))
      .finally(() => setLoading(false))
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api('PUT', '/admin/config', {
        ...form,
        tarifInscription:   parseFloat(form.tarifInscription)   || 0,
        tarifHeureCode:     parseFloat(form.tarifHeureCode)     || 0,
        tarifHeureConduite: parseFloat(form.tarifHeureConduite) || 0,
      })
      toast('Paramètres enregistrés avec succès')
    } catch (e) {
      toast(e.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Chargement…
    </div>
  )

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 780 }}>

      {/* En-tête */}
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Paramètres</h2>
        <p className="text-sm text-slate-400 mt-0.5">Configuration de votre établissement</p>
      </div>

      {/* Section : Informations */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          {/* Header section */}
          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="w-9 h-9 rounded-xl d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-building" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Détails de votre établissement</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>Informations affichées sur vos documents</div>
            </div>
          </div>

          {/* Champs */}
          <div className="px-5 py-4">
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className={labelCls}>Nom de l'auto-école</label>
                <input className={inputCls} value={form.nom}
                  placeholder="Ex : Auto-École Excellence"
                  onChange={e => set('nom', e.target.value)} />
              </div>
              <div className="col-12">
                <label className={labelCls}>Adresse complète</label>
                <input className={inputCls} value={form.adresse}
                  placeholder="Ex : 12 Rue des Jacarandas, Dakar"
                  onChange={e => set('adresse', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className={labelCls}>Téléphone</label>
                <input className={inputCls} value={form.telephone}
                  placeholder="Ex : 77 123 45 67"
                  onChange={e => set('telephone', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.email}
                  placeholder="contact@autoecole.sn"
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Section : Tarification */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(74,222,128,.15)', color: '#16a34a', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-cash-stack" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Tarification</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>Montants en FCFA</div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="row g-3">
              <div className="col-md-4">
                <label className={labelCls}>Tarif inscription</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifInscription} min="0"
                    placeholder="0"
                    onChange={e => set('tarifInscription', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Tarif heure code</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifHeureCode} min="0"
                    placeholder="0"
                    onChange={e => set('tarifHeureCode', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Tarif heure de conduite</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifHeureConduite} min="0"
                    placeholder="0"
                    onChange={e => set('tarifHeureConduite', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Sauvegarder */}
      <div className="d-flex justify-content-end">
        <button
          className="btn fw-bold text-white px-5 py-2"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none' }}
          onClick={handleSave}
          disabled={saving}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement…</>
            : <><i className="bi bi-check-lg me-2" />Sauvegarder</>}
        </button>
      </div>
    </div>
  )
}
