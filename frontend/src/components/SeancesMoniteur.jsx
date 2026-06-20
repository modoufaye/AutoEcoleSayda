import { useEffect, useRef, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import '../landing.css'

const THEMES = [
  { value: 'FEUX_SIGNALISATION',    label: '🚦 Feux de signalisation' },
  { value: 'PANNEAUX_SIGNALISATION', label: '🪧 Panneaux de signalisation' },
  { value: 'SIGNALISATION_SOL',      label: '⚠️ Signalisation au sol' },
  { value: 'REGLES_PRIORITE',        label: '🛣️ Règles de priorité' },
  { value: 'CONDUITE_NUIT',          label: '🌙 Conduite de nuit' },
  { value: 'CONDUITE_AUTOROUTE',     label: '🏎️ Conduite sur autoroute' },
  { value: 'STATIONNEMENT',          label: '🅿️ Stationnement' },
  { value: 'SECURITE_ROUTIERE',      label: '🦺 Sécurité routière' },
  { value: 'AUTRE',                  label: '📋 Autre' },
]
const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.value, t.label]))

const defaultForm = () => ({ titre: '', dateHeure: '', theme: '', statut: 'BROUILLON', eleveIds: [], blocs: [] })

function BlocEditor({ bloc, index, total, onUpdate, onRemove, onMove, onUpload }) {
  const BLOC_STYLE = {
    TEXTE:  { bg: '#eff6ff', color: '#2563eb', icon: 'pencil-fill',       label: 'Texte' },
    IMAGE:  { bg: '#f0fdf4', color: '#16a34a', icon: 'image-fill',        label: 'Image' },
    VIDEO:  { bg: '#fef2f2', color: '#dc2626', icon: 'camera-video-fill', label: 'Vidéo' },
    AUDIO:  { bg: '#fdf4ff', color: '#9333ea', icon: 'music-note-beamed', label: 'Audio' },
  }
  const style = BLOC_STYLE[bloc.typeBloc] || BLOC_STYLE.TEXTE
  return (
    <div className="bg-white rounded-xl overflow-hidden mb-3" style={{ border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: style.bg }}>
          <i className={`bi bi-${style.icon}`} style={{ color: style.color, fontSize: '.72rem' }} />
        </div>
        <span className="text-xs font-bold text-slate-500">{style.label}</span>
        <div className="ml-auto flex gap-1">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
            style={{ background: index === 0 ? '#f1f5f9' : '#e2e8f0', color: index === 0 ? '#cbd5e1' : '#475569' }}
            disabled={index === 0} onClick={() => onMove(index, -1)} title="Monter">
            <i className="bi bi-arrow-up" style={{ fontSize: '.7rem' }} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
            style={{ background: index === total - 1 ? '#f1f5f9' : '#e2e8f0', color: index === total - 1 ? '#cbd5e1' : '#475569' }}
            disabled={index === total - 1} onClick={() => onMove(index, 1)} title="Descendre">
            <i className="bi bi-arrow-down" style={{ fontSize: '.7rem' }} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
            style={{ background: '#fee2e2', color: '#dc2626' }}
            onClick={() => onRemove(index)} title="Supprimer">
            <i className="bi bi-x-lg" style={{ fontSize: '.7rem' }} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {bloc.typeBloc === 'TEXTE' && (
          <textarea
            rows={4}
            className="w-full px-3 py-2.5 text-sm text-slate-700 rounded-xl outline-none resize-none"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', fontFamily: 'inherit', lineHeight: 1.8 }}
            value={bloc.contenu || ''}
            onChange={e => onUpdate(index, 'contenu', e.target.value)}
            placeholder="Rédigez votre explication, consigne ou résumé…"
          />
        )}

        {bloc.typeBloc === 'IMAGE' && (
          <div>
            <input type="file" accept="image/*"
              className="w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
              onChange={e => e.target.files[0] && onUpload(index, e.target.files[0], 'image')} />
            {bloc._uploading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                Envoi en cours…
              </div>
            )}
            {bloc.mediaUrl && !bloc._uploading && (
              <img src={bloc.mediaUrl} alt="" className="rounded-xl"
                style={{ maxHeight: 200, objectFit: 'contain', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }} />
            )}
          </div>
        )}

        {bloc.typeBloc === 'VIDEO' && (
          <div>
            <input type="file" accept="video/mp4,video/webm,video/ogg"
              className="w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700"
              onChange={e => e.target.files[0] && onUpload(index, e.target.files[0], 'video')} />
            {bloc._uploading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                Envoi en cours…
              </div>
            )}
            {bloc.mediaUrl && !bloc._uploading && (
              <video controls className="w-full rounded-xl" style={{ maxHeight: 220 }}>
                <source src={bloc.mediaUrl} />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}
          </div>
        )}

        {bloc.typeBloc === 'AUDIO' && (
          <div>
            <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/webm,audio/mp4"
              className="w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700"
              onChange={e => e.target.files[0] && onUpload(index, e.target.files[0], 'audio')} />
            {bloc._uploading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                Envoi en cours…
              </div>
            )}
            {bloc.mediaUrl && !bloc._uploading && (
              <audio controls className="w-full rounded-xl" style={{ accentColor: '#9333ea' }}>
                <source src={bloc.mediaUrl} />
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SeancesMoniteur({ isAdmin = false, onBack }) {
  const [seances, setSeances]         = useState([])
  const [eleves, setEleves]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('list')
  const [editId, setEditId]           = useState(null)
  const [form, setForm]               = useState(defaultForm())
  const [saving, setSaving]           = useState(false)
  const [err, setErr]                 = useState('')
  const [selectedSeance, setSelectedSeance] = useState(null)

  const load = () => {
    setLoading(true)
    const seancesUrl = isAdmin ? '/moniteur/seances?all=true' : '/moniteur/seances'
    Promise.all([
      api('GET', seancesUrl),
      api('GET', '/moniteur/seances/eleves'),
    ]).then(([s, e]) => { setSeances(s); setEleves(e) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...defaultForm(), eleveIds: eleves.map(e => e.id) })
    setErr('')
    setView('editor')
  }

  const openEdit = (s) => {
    setEditId(s.id)
    setForm({
      titre:     s.titre     || '',
      dateHeure: s.dateHeure ? s.dateHeure.substring(0, 16) : '',
      theme:     s.theme     || '',
      statut:    s.statut    || 'BROUILLON',
      eleveIds:  s.eleves.map(e => e.id),
      blocs:     s.blocs.map(b => ({ ...b, _uploading: false })),
    })
    setErr('')
    setView('editor')
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleEleve = (id) => {
    setForm(f => ({
      ...f,
      eleveIds: f.eleveIds.includes(id)
        ? f.eleveIds.filter(x => x !== id)
        : [...f.eleveIds, id],
    }))
  }

  const addBloc = (type) => {
    setForm(f => ({
      ...f,
      blocs: [...f.blocs, { typeBloc: type, contenu: '', mediaUrl: '', ordre: f.blocs.length, _uploading: false }],
    }))
  }

  const updateBloc = (i, key, val) => {
    setForm(f => {
      const blocs = [...f.blocs]
      blocs[i] = { ...blocs[i], [key]: val }
      return { ...f, blocs }
    })
  }

  const removeBloc = (i) => setForm(f => ({ ...f, blocs: f.blocs.filter((_, idx) => idx !== i) }))

  const moveBloc = (i, dir) => {
    setForm(f => {
      const blocs = [...f.blocs]
      const j = i + dir
      if (j < 0 || j >= blocs.length) return f
      ;[blocs[i], blocs[j]] = [blocs[j], blocs[i]]
      return { ...f, blocs }
    })
  }

  const handleUpload = async (i, file, type) => {
    updateBloc(i, '_uploading', true)
    try {
      const res = await uploadFile(`/moniteur/upload/${type}`, file)
      updateBloc(i, 'mediaUrl', res.url)
    } catch (e) {
      setErr('Erreur upload : ' + e.message)
    } finally {
      updateBloc(i, '_uploading', false)
    }
  }

  const handleSave = async (statut) => {
    if (!form.titre.trim()) { setErr('Le titre est obligatoire'); return }
    setSaving(true); setErr('')
    try {
      const payload = { ...form, statut, blocs: form.blocs.map((b, i) => ({ ...b, ordre: i })) }
      if (editId) await api('PUT',  `/moniteur/seances/${editId}`, payload)
      else        await api('POST', '/moniteur/seances', payload)
      load()
      setView('list')
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette séance ?')) return
    await api('DELETE', `/moniteur/seances/${id}`)
    load()
  }

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
  const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement des séances…</span>
      </div>
    </div>
  )

  /* ── ÉDITEUR ── */
  if (view === 'editor') return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* Barre du haut */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          Retour
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">
            {editId ? 'Modifier la séance' : 'Nouvelle séance'}
          </h2>
        </div>
        <div className="ml-auto flex gap-3">
          <button
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border-0 cursor-pointer transition-all"
            style={{ background: '#f1f5f9', color: '#475569' }}
            disabled={saving}
            onClick={() => handleSave('BROUILLON')}
          >
            {saving ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" /> : <i className="bi bi-save" />}
            Brouillon
          </button>
          <button
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border-0 cursor-pointer transition-all text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 12px rgba(5,150,105,.25)' }}
            disabled={saving}
            onClick={() => handleSave('PUBLIE')}
          >
            <i className="bi bi-send-fill" />
            Publier
          </button>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#fee2e2', color: '#b91c1c' }}>
          <i className="bi bi-exclamation-circle-fill" />
          {err}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Métadonnées */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
                <i className="bi bi-info-circle-fill" style={{ color: '#fff', fontSize: '.85rem' }} />
              </div>
              <span className="font-bold text-white text-sm">Informations</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Titre <span className="text-red-400">*</span></label>
                <input className={inputCls} value={form.titre}
                  onChange={e => setField('titre', e.target.value)}
                  placeholder="Ex : Comprendre les panneaux d'interdiction" />
              </div>
              <div>
                <label className={labelCls}>Date et heure</label>
                <input type="datetime-local" className={inputCls}
                  value={form.dateHeure} onChange={e => setField('dateHeure', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Thème</label>
                <select className={inputCls} value={form.theme} onChange={e => setField('theme', e.target.value)}>
                  <option value="">— Choisir un thème —</option>
                  {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Élèves */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', borderBottom: '2px solid #b8860b' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(30,58,95,.2)' }}>
                <i className="bi bi-people-fill" style={{ color: '#1e3a5f', fontSize: '.85rem' }} />
              </div>
              <span className="font-bold text-slate-800 text-sm">Élèves assignés</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(30,58,95,.2)', color: '#1e3a5f' }}>
                {form.eleveIds.length}/{eleves.length}
              </span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {eleves.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">Aucun élève enregistré</div>
              ) : (
                eleves.map(e => {
                  const checked = form.eleveIds.includes(e.id)
                  return (
                    <div key={e.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all border-b border-slate-50"
                      style={{ background: checked ? '#eff6ff' : '#fff' }}
                      onClick={() => toggleEleve(e.id)}
                    >
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                        style={{ borderColor: checked ? '#1e3a5f' : '#cbd5e1', background: checked ? '#1e3a5f' : 'transparent' }}>
                        {checked && <i className="bi bi-check" style={{ color: '#fff', fontSize: '.65rem' }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{e.nom}</div>
                        <div className="text-xs text-slate-400 truncate">{e.email}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Éditeur de blocs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
            <div className="px-5 py-3 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
                <i className="bi bi-layout-text-window-reverse" style={{ color: '#fff', fontSize: '.85rem' }} />
              </div>
              <span className="font-bold text-white text-sm">Contenu pédagogique</span>
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                {form.blocs.length} bloc(s)
              </span>
            </div>

            <div className="p-5">
              {form.blocs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                    <i className="bi bi-plus-square" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
                  </div>
                  <div className="text-sm font-medium text-slate-400">Ajoutez des blocs de contenu ci-dessous</div>
                </div>
              )}

              {form.blocs.map((bloc, i) => (
                <BlocEditor key={i} bloc={bloc} index={i} total={form.blocs.length}
                  onUpdate={updateBloc} onRemove={removeBloc}
                  onMove={moveBloc} onUpload={handleUpload} />
              ))}

              <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                  style={{ background: '#eff6ff', color: '#2563eb' }}
                  onClick={() => addBloc('TEXTE')}>
                  <i className="bi bi-pencil-fill" />+ Texte
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                  style={{ background: '#f0fdf4', color: '#16a34a' }}
                  onClick={() => addBloc('IMAGE')}>
                  <i className="bi bi-image-fill" />+ Image
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                  style={{ background: '#fef2f2', color: '#dc2626' }}
                  onClick={() => addBloc('VIDEO')}>
                  <i className="bi bi-camera-video-fill" />+ Vidéo
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                  style={{ background: '#fdf4ff', color: '#9333ea' }}
                  onClick={() => addBloc('AUDIO')}>
                  <i className="bi bi-music-note-beamed" />+ Audio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── LISTE ── */
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* En-tête page */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          Retour
        </button>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Mes Séances</h2>
          <p className="text-slate-400 text-sm mt-0.5">Cours que vous avez créés pour vos élèves</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border-0 cursor-pointer text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}
        >
          <i className="bi bi-plus-lg" />
          Nouvelle séance
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-6 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderBottom: '2px solid #1e3a5f' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-camera-video-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Séances créées</div>
            <div className="text-blue-200" style={{ fontSize: '.72rem' }}>Contenu partagé avec vos élèves</div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
            {seances.length}
          </span>
        </div>

        {seances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <i className="bi bi-camera-video" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
            </div>
            <div className="text-sm font-medium text-slate-400">Aucune séance créée</div>
            <div className="text-xs text-slate-300">Cliquez sur "Nouvelle séance" pour commencer</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {seances.map((s, idx) => {
              const isPub = s.statut === 'PUBLIE'
              return (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-blue-50/40"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isPub ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg,#fef9c3,#fde68a)' }}>
                    <i className="bi bi-camera-video-fill" style={{ color: isPub ? '#15803d' : '#a16207', fontSize: '1rem' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{s.titre}</div>
                    <div className="flex flex-wrap gap-3 mt-1" style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                      {s.theme && <span>{THEME_MAP[s.theme] || s.theme}</span>}
                      {s.dateHeure && (
                        <span className="flex items-center gap-1">
                          <i className="bi bi-calendar3" />
                          {new Date(s.dateHeure).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="bi bi-people" />
                        {s.eleves.length} élève(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="bi bi-layers" />
                        {s.blocs.length} bloc(s)
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: isPub ? '#dcfce7' : '#fef9c3',
                      color: isPub ? '#15803d' : '#a16207',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isPub ? '#16a34a' : '#ca8a04' }} />
                    {isPub ? 'Publié' : 'Brouillon'}
                  </span>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                      style={{ background: '#f1f5f9', color: '#475569' }}
                      title="Modifier"
                      onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                      style={{ background: '#fef2f2', color: '#dc2626' }}
                      title="Supprimer"
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                    >
                      <i className="bi bi-trash-fill" style={{ fontSize: '.75rem' }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
