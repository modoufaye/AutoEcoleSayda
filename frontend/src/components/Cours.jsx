import { useEffect, useRef, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import '../landing.css'

const CAT_STYLE = {
  INTERDICTION: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Interdiction' },
  OBLIGATION:   { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb', label: 'Obligation' },
  DANGER:       { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Danger' },
  INFORMATION:  { bg: '#ecfdf5', color: '#15803d', dot: '#16a34a', label: 'Information' },
  PRIORITE:     { bg: '#f5f3ff', color: '#6d28d9', dot: '#7c3aed', label: 'Priorité' },
}

const THEMES = [
  {
    key: 'signalisation', emoji: '🚦', label: 'Signalisation',
    gradient: 'linear-gradient(135deg,#dc2626,#ef4444)', border: '#b91c1c',
    iconBg: 'rgba(255,255,255,.15)',
    categories: ['DANGER', 'INTERDICTION', 'OBLIGATION', 'INFORMATION', 'PRIORITE'],
    subtopics: [
      'Panneaux de danger', "Panneaux d'interdiction", "Panneaux d'obligation",
      "Panneaux d'indication", 'Panneaux de direction', 'Feux de signalisation',
      'Marquages au sol', 'Signalisation temporaire (travaux)', 'Signaux des agents de la circulation',
    ],
  },
  {
    key: 'regles', emoji: '⚖️', label: 'Règles de circulation',
    gradient: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: '#142a47',
    iconBg: 'rgba(255,255,255,.15)',
    categories: [],
    subtopics: [
      'Priorités et cédez-le-passage', 'Règles aux intersections', 'Sens unique et voies de circulation',
      'Distances de sécurité', 'Vitesses et limitations', 'Dépassement',
      'Changement de direction (tourner à gauche/droite)', 'Marche arrière et demi-tour',
    ],
  },
  {
    key: 'conditions', emoji: '🌍', label: 'Conduite en conditions particulières',
    gradient: 'linear-gradient(135deg,#059669,#10b981)', border: '#047857',
    iconBg: 'rgba(255,255,255,.15)',
    categories: [],
    subtopics: [
      'Conduite de nuit', 'Conduite sous la pluie', 'Conduite en ville',
      'Conduite sur route nationale', 'Conduite sur autoroute', 'Conduite en cas de brouillard',
    ],
  },
  {
    key: 'vehicule', emoji: '🚗', label: 'Véhicule et sécurité',
    gradient: 'linear-gradient(135deg,#d4a017,#f0bb2a)', border: '#b8860b',
    iconBg: 'rgba(30,58,95,.2)',
    categories: [],
    subtopics: [
      'Vérifications avant départ', 'Ceinture de sécurité', 'Airbags et équipements de sécurité',
      'Pneus et freinage', 'Éclairages et signaux lumineux', 'Chargement du véhicule',
    ],
  },
  {
    key: 'secours', emoji: '🚑', label: 'Premiers secours et urgences',
    gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', border: '#0e7490',
    iconBg: 'rgba(255,255,255,.15)',
    categories: [],
    subtopics: [
      "Comportement en cas d'accident", 'Triangle de signalisation et gilet',
      'Gestes de premiers secours', 'Appel des secours',
    ],
  },
]

const EMPTY_FORM = { titre: '', description: '', contenu: '', imageUrl: '', langue: 'FRANCAIS', categorie: '', typeContenu: 'IMAGE' }

/* ── Carte d'un cours écrit ── */
function CoursEcritCard({ c, onSelect, onEdit, onDelete }) {
  const catStyle = CAT_STYLE[c.categorie] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <div className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1.5px solid #f1f5f9' }}
      onClick={() => onSelect(c)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}>
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: catStyle.bg }}>
          <i className="bi bi-file-earmark-text-fill" style={{ color: catStyle.color, fontSize: '.85rem' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm leading-tight">{c.titre}</div>
          {c.contenu && (
            <div className="text-slate-400 text-xs mt-1 leading-relaxed"
              style={{ whiteSpace: 'pre-line' }}>
              {c.contenu.substring(0, 100)}…
            </div>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-slate-50">
          {onEdit && (
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
              style={{ background: '#f1f5f9', color: '#475569' }}
              onClick={e => { e.stopPropagation(); onEdit(c) }}
              title="Modifier">
              <i className="bi bi-pencil-fill" style={{ fontSize: '.72rem' }} />
            </button>
          )}
          {onDelete && (
            <button className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
              style={{ background: '#fef2f2', color: '#dc2626' }}
              onClick={e => { e.stopPropagation(); onDelete(c.id) }}
              title="Supprimer">
              <i className="bi bi-trash-fill" style={{ fontSize: '.72rem' }} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Vue détail d'un thème ── */
function ThemeDetail({ theme, cours, setCours, onBack }) {
  const { user } = useAuth()
  const isMoniteur   = user?.role === 'MONITEUR'
  const isEleve      = user?.role === 'ELEVE'
  const [selected, setSelected]     = useState(null)
  const [typeFilter, setTypeFilter] = useState('TOUS')
  const [showForm, setShowForm]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [preview, setPreview]       = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const fileRef                     = useRef()

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, categorie: theme.categories[0] || '' })
    setPreview(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditId(c.id)
    setForm({
      titre:       c.titre       || '',
      description: c.description || '',
      contenu:     c.contenu     || '',
      imageUrl:    c.imageUrl    || '',
      langue:      c.langue      || 'FRANCAIS',
      categorie:   c.categorie   || '',
      typeContenu: c.typeContenu || 'IMAGE',
    })
    setPreview(c.imageUrl || null)
    setShowForm(true)
  }

  const handleFile = async (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const { url } = await uploadFile('/moniteur/upload/image', file)
      setForm(f => ({ ...f, imageUrl: url }))
    } catch (e) { toast(e.message, 'danger') }
    finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.titre.trim()) { toast('Le titre est obligatoire', 'warning'); return }
    if (!editId && form.typeContenu === 'IMAGE' && !form.imageUrl) { toast('Veuillez uploader une image', 'warning'); return }
    setSaving(true)
    try {
      const body = {
        titre:       form.titre.trim(),
        description: form.description || null,
        contenu:     form.contenu     || null,
        imageUrl:    form.imageUrl    || null,
        typeContenu: form.typeContenu,
        langue:      form.langue,
        categorie:   form.categorie   || null,
      }
      if (editId) {
        const updated = await api('PUT', `/cours/${editId}`, body)
        setCours(prev => prev.map(c => c.id === editId ? updated : c))
        toast('Cours modifié')
      } else {
        const created = await api('POST', '/cours', body)
        setCours(prev => [...prev, created])
        toast('Cours ajouté')
      }
      setShowForm(false)
    } catch (e) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  const delCours = async (id) => {
    if (!confirm('Supprimer ce cours ?')) return
    try {
      await api('DELETE', `/cours/${id}`)
      setCours(prev => prev.filter(c => c.id !== id))
      toast('Cours supprimé')
    } catch (e) { toast(e.message, 'danger') }
  }

  const themeCours = cours.filter(c => theme.categories.includes(c.categorie))
  const filtered = isMoniteur
    ? themeCours
    : themeCours.filter(c => typeFilter === 'TOUS' || c.typeContenu === typeFilter)

  const catOrder = theme.categories.length > 0
    ? theme.categories
    : [...new Set(filtered.map(c => c.categorie).filter(Boolean))]
  const byCategory = catOrder
    .map(cat => ({
      cat,
      images:   filtered.filter(c => c.categorie === cat && c.typeContenu === 'IMAGE'),
      ecritsFr: filtered.filter(c => c.categorie === cat && c.typeContenu === 'ECRITE' && c.langue === 'FRANCAIS'),
      ecritsWo: filtered.filter(c => c.categorie === cat && c.typeContenu === 'ECRITE' && c.langue === 'WOLOF'),
    }))
    .filter(g => g.images.length + g.ecritsFr.length + g.ecritsWo.length > 0)
  const uncategorized = {
    images:   filtered.filter(c => !c.categorie && c.typeContenu === 'IMAGE'),
    ecritsFr: filtered.filter(c => !c.categorie && c.typeContenu === 'ECRITE' && c.langue === 'FRANCAIS'),
    ecritsWo: filtered.filter(c => !c.categorie && c.typeContenu === 'ECRITE' && c.langue === 'WOLOF'),
  }

  const inputCls = "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
  const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* Barre de navigation */}
      {isEleve ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="px-5 py-3.5 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', borderBottom: '2px solid #0f3d21' }}>
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center border-0 cursor-pointer transition-all flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.32)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
              title="Retour aux thèmes"
            >
              <i className="bi bi-arrow-left" style={{ fontSize: '.9rem' }} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.18)' }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{theme.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-white leading-tight" style={{ fontSize: '.95rem' }}>{theme.label}</div>
              <div style={{ fontSize: '.73rem', color: 'rgba(187,247,208,.85)' }}>
                {theme.subtopics.length} sous-thèmes{themeCours.length > 0 ? ` · ${themeCours.length} cours disponibles` : ''}
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
              {themeCours.length > 0 ? `${themeCours.length} cours` : 'Bientôt disponible'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
            style={{ background: '#f1f5f9', color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <i className="bi bi-arrow-left" />
            Retour aux thèmes
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">
              {theme.emoji} {theme.label}
            </h2>
            {themeCours.length > 0 && (
              <p className="text-slate-400 text-sm mt-0.5">{themeCours.length} cours disponibles</p>
            )}
          </div>
          {isMoniteur && (
            <button
              onClick={openAdd}
              className="ml-auto flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border-0 cursor-pointer text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}
            >
              <i className="bi bi-plus-lg" />
              Ajouter un cours
            </button>
          )}
        </div>
      )}

      {/* Sous-thèmes */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-6 py-3 flex items-center gap-3" style={{ background: theme.gradient, borderBottom: `2px solid ${theme.border}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.iconBg }}>
            <i className="bi bi-list-ul" style={{ color: theme.key === 'vehicule' ? '#1e3a5f' : '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: theme.key === 'vehicule' ? '#1e3a5f' : '#fff' }}>Sous-thèmes</div>
            <div style={{ fontSize: '.72rem', color: theme.key === 'vehicule' ? '#3d2a0a' : 'rgba(255,255,255,.7)' }}>
              {theme.subtopics.length} sous-thèmes à maîtriser
            </div>
          </div>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {theme.subtopics.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc' }}>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: theme.gradient, color: theme.key === 'vehicule' ? '#1e3a5f' : '#fff' }}>
                {i + 1}
              </span>
              <span className="text-sm text-slate-700">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cours disponibles */}
      {themeCours.length > 0 && (
        <div className="space-y-5">
          {/* Filtre type (élèves seulement) */}
          {!isMoniteur && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrer :</span>
              {['TOUS', 'IMAGE', 'ECRITE'].map(t => (
                <button key={t}
                  className="text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
                  style={{
                    background: typeFilter === t
                      ? (isEleve ? 'linear-gradient(135deg,#14532d,#15803d)' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)')
                      : '#f1f5f9',
                    color: typeFilter === t ? '#fff' : '#64748b',
                  }}
                  onClick={() => setTypeFilter(t)}>
                  {t === 'TOUS' ? 'Tous' : t === 'IMAGE' ? '🖼 Images' : '📝 Écrits'}
                </button>
              ))}
            </div>
          )}

          {/* Cours par catégorie */}
          {byCategory.map(({ cat, images, ecritsFr, ecritsWo }) => {
            const catStyle = CAT_STYLE[cat] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: cat }
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: catStyle.bg, color: catStyle.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: catStyle.dot }} />
                    {catStyle.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {images.length + ecritsFr.length + ecritsWo.length} cours
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
                    {images.map(c => (
                      <div key={c.id}
                        className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1.5px solid #f1f5f9' }}
                        onClick={() => setSelected(c)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.1)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}>
                        <div className="flex items-center justify-center p-3" style={{ background: '#f8fafc', minHeight: 110 }}>
                          <img src={c.imageUrl} alt={c.titre} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                        </div>
                        <div className="p-2 text-center">
                          <div className="font-semibold text-xs text-slate-700 leading-tight">{c.titre}</div>
                          {isMoniteur && (
                            <div className="flex justify-center gap-1 mt-1.5">
                              <button className="w-6 h-6 rounded-lg flex items-center justify-center border-0 cursor-pointer"
                                style={{ background: '#f1f5f9', color: '#475569' }}
                                onClick={e => { e.stopPropagation(); openEdit(c) }}>
                                <i className="bi bi-pencil-fill" style={{ fontSize: '.6rem' }} />
                              </button>
                              <button className="w-6 h-6 rounded-lg flex items-center justify-center border-0 cursor-pointer"
                                style={{ background: '#fef2f2', color: '#dc2626' }}
                                onClick={e => { e.stopPropagation(); delCours(c.id) }}>
                                <i className="bi bi-trash-fill" style={{ fontSize: '.6rem' }} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {ecritsFr.length > 0 && (
                  <div className={images.length > 0 ? 'mt-3' : ''}>
                    <div className="text-xs font-semibold text-slate-400 mb-2">🇫🇷 Français</div>
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {ecritsFr.map(c => <CoursEcritCard key={c.id} c={c} onSelect={setSelected}
                        onEdit={isMoniteur ? openEdit : null} onDelete={isMoniteur ? delCours : null} />)}
                    </div>
                  </div>
                )}
                {ecritsWo.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">🇸🇳 Wolof</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {ecritsWo.map(c => <CoursEcritCard key={c.id} c={c} onSelect={setSelected}
                        onEdit={isMoniteur ? openEdit : null} onDelete={isMoniteur ? delCours : null} />)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Sans catégorie */}
          {(uncategorized.images.length > 0 || uncategorized.ecritsFr.length > 0 || uncategorized.ecritsWo.length > 0) && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#f1f5f9', color: '#475569' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Général
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              {uncategorized.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
                  {uncategorized.images.map(c => (
                    <div key={c.id}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1.5px solid #f1f5f9' }}
                      onClick={() => setSelected(c)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)' }}>
                      <div className="flex items-center justify-center p-3" style={{ background: '#f8fafc', minHeight: 110 }}>
                        <img src={c.imageUrl} alt={c.titre} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                      </div>
                      <div className="p-2 text-center">
                        <div className="font-semibold text-xs text-slate-700 leading-tight">{c.titre}</div>
                        {isMoniteur && (
                          <div className="flex justify-center gap-1 mt-1.5">
                            <button className="w-6 h-6 rounded-lg flex items-center justify-center border-0 cursor-pointer"
                              style={{ background: '#f1f5f9', color: '#475569' }}
                              onClick={e => { e.stopPropagation(); openEdit(c) }}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: '.6rem' }} />
                            </button>
                            <button className="w-6 h-6 rounded-lg flex items-center justify-center border-0 cursor-pointer"
                              style={{ background: '#fef2f2', color: '#dc2626' }}
                              onClick={e => { e.stopPropagation(); delCours(c.id) }}>
                              <i className="bi bi-trash-fill" style={{ fontSize: '.6rem' }} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {uncategorized.ecritsFr.length > 0 && (
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  {uncategorized.ecritsFr.map(c => <CoursEcritCard key={c.id} c={c} onSelect={setSelected}
                    onEdit={isMoniteur ? openEdit : null} onDelete={isMoniteur ? delCours : null} />)}
                </div>
              )}
              {uncategorized.ecritsWo.length > 0 && (
                <div className="grid md:grid-cols-2 gap-3">
                  {uncategorized.ecritsWo.map(c => <CoursEcritCard key={c.id} c={c} onSelect={setSelected}
                    onEdit={isMoniteur ? openEdit : null} onDelete={isMoniteur ? delCours : null} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {themeCours.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
            <i className="bi bi-journal-x" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
          </div>
          <div className="text-sm font-medium text-slate-400">Aucun cours disponible pour ce thème</div>
          {isMoniteur && <div className="text-xs text-slate-300">Cliquez sur "Ajouter un cours" pour commencer</div>}
        </div>
      )}

      {/* Modal ajout / modification cours */}
      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
                  <i className={`bi bi-${editId ? 'pencil-square' : 'plus-circle-fill'}`} style={{ color: '#fff' }} />
                </div>
                <h5 className="mb-0 font-bold text-white">
                  {editId ? 'Modifier le cours' : `Ajouter un cours — ${theme.label}`}
                </h5>
                <button className="btn-close btn-close-white ms-auto" onClick={() => setShowForm(false)}></button>
              </div>

              <div className="modal-body p-5 space-y-4">
                {form.typeContenu === 'IMAGE' && (
                  <div>
                    <label className={labelCls}>Image <span className="text-red-400">*</span></label>
                    <div
                      className="rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
                      style={{
                        minHeight: 180, border: '2px dashed #e2e8f0', background: '#f8fafc',
                        borderColor: uploading ? '#2563eb' : '#e2e8f0'
                      }}
                      onClick={() => fileRef.current.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}>
                      {uploading && (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <div className="w-5 h-5 border-2 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                          Upload en cours…
                        </div>
                      )}
                      {!uploading && preview && (
                        <img src={preview} alt="preview" style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }} />
                      )}
                      {!uploading && !preview && (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <i className="bi bi-cloud-upload-fill" style={{ fontSize: '2rem' }} />
                          <span className="text-sm font-medium">Cliquer ou glisser-déposer une image</span>
                          <span className="text-xs">JPG, PNG, WebP</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" className="d-none"
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Titre <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="Ex: Panneau de danger — virage à droite"
                    value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Description courte</label>
                  <input className={inputCls} placeholder="Résumé affiché sous l'image dans la liste"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div>
                  <label className={labelCls}>Texte explicatif</label>
                  <textarea className={inputCls} rows={4} style={{ resize: 'vertical' }}
                    placeholder="Explication détaillée : signification, règle associée, conseils..."
                    value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Catégorie</label>
                    <select className={inputCls} value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                      <option value="">— Aucune —</option>
                      <option value="DANGER">Danger</option>
                      <option value="INTERDICTION">Interdiction</option>
                      <option value="OBLIGATION">Obligation</option>
                      <option value="INFORMATION">Information</option>
                      <option value="PRIORITE">Priorité</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Langue</label>
                    <select className={inputCls} value={form.langue} onChange={e => setForm(f => ({ ...f, langue: e.target.value }))}>
                      <option value="FRANCAIS">🇫🇷 Français</option>
                      <option value="WOLOF">🇸🇳 Wolof</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                  onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer"
                  style={{ background: saving || uploading ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}
                  onClick={save} disabled={saving || uploading}>
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</>
                    : <><i className="bi bi-check-lg" />{editId ? 'Modifier' : 'Enregistrer'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail cours */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                <h5 className="mb-0 font-bold text-white flex-1">{selected.titre}</h5>
                <button className="btn-close btn-close-white" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.categorie && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: (CAT_STYLE[selected.categorie] || {}).bg || '#f1f5f9', color: (CAT_STYLE[selected.categorie] || {}).color || '#475569' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: (CAT_STYLE[selected.categorie] || {}).dot || '#94a3b8' }} />
                      {(CAT_STYLE[selected.categorie] || {}).label || selected.categorie}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#f1f5f9', color: '#475569' }}>
                    {selected.langue === 'FRANCAIS' ? '🇫🇷 Français' : '🇸🇳 Wolof'}
                  </span>
                </div>
                {selected.typeContenu === 'IMAGE' && (
                  <div className="text-center mb-4">
                    <img src={selected.imageUrl} alt={selected.titre}
                      style={{ width: 180, height: 180, objectFit: 'contain' }} className="rounded-2xl" />
                  </div>
                )}
                {selected.description && (
                  <p className="text-sm text-slate-500 mb-3">{selected.description}</p>
                )}
                {selected.contenu && (
                  <div className="p-4 rounded-2xl text-sm text-slate-700 leading-relaxed"
                    style={{ background: '#f8fafc', whiteSpace: 'pre-line', lineHeight: 1.9 }}>
                    {selected.contenu}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 flex justify-end border-t border-slate-100">
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 cursor-pointer"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                  onClick={() => setSelected(null)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Vue accueil : grille des thèmes ── */
export default function Cours({ onBack }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'
  const [cours, setCours]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTheme, setActiveTheme] = useState(null)

  useEffect(() => {
    api('GET', '/cours')
      .then(setCours)
      .catch(() => toast('Erreur chargement cours', 'danger'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement des cours…</span>
      </div>
    </div>
  )

  if (activeTheme) return (
    <ThemeDetail
      theme={activeTheme}
      cours={cours}
      setCours={setCours}
      onBack={() => setActiveTheme(null)}
    />
  )

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

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

      {/* En-tête page */}
      {isEleve ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="px-6 py-4 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', borderBottom: '2px solid #0f3d21' }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(4px)' }}>
              <i className="bi bi-sign-turn-right-fill" style={{ color: '#fff', fontSize: '1.2rem' }} />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-white leading-tight" style={{ fontSize: '1.1rem' }}>Cours Code de la Route</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(187,247,208,.85)' }}>
                Maîtrisez la théorie en {THEMES.length} grands thèmes
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
              <i className="bi bi-book-fill me-1" />
              {cours.length > 0 ? `${cours.length} cours` : `${THEMES.length} thèmes`}
            </span>
          </div>
          <div className="px-5 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: '#f0fdf4' }}>
            <i className="bi bi-lightbulb-fill" style={{ color: '#15803d', fontSize: '.85rem' }} />
            <span className="text-xs font-medium" style={{ color: '#14532d' }}>
              Révisez chaque thème avant votre examen théorique
            </span>
            <div className="flex-1 h-px hidden sm:block" style={{ background: '#bbf7d0' }} />
            <span className="text-xs font-semibold" style={{ color: '#15803d' }}>
              {THEMES.length} thèmes · {cours.length} cours disponibles
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Cours Code de la Route</h2>
            <p className="text-slate-400 text-sm mt-0.5">Maîtrisez la théorie en {THEMES.length} grands thèmes</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full"
            style={{ background: '#eff6ff', color: '#1e3a5f' }}>
            <i className="bi bi-sign-turn-right-fill" />
            {THEMES.length} thèmes
          </span>
        </div>
      )}

      {/* Grille des thèmes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map(theme => {
          const count = cours.filter(c => theme.categories.includes(c.categorie)).length
          return (
            <div
              key={theme.key}
              className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}
              onClick={() => setActiveTheme(theme)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.07)' }}
            >
              {/* En-tête */}
              <div className="px-5 pt-5 pb-4 text-center" style={{ background: theme.gradient }}>
                <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>{theme.emoji}</div>
                <h6 className="font-extrabold mt-2 mb-0 text-sm" style={{ color: theme.key === 'vehicule' ? '#1e3a5f' : '#fff' }}>
                  {theme.label}
                </h6>
              </div>

              {/* Liste sous-thèmes */}
              <div className="p-4">
                <ul className="space-y-1.5 mb-0">
                  {theme.subtopics.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex items-center gap-2" style={{ fontSize: '.83rem', color: '#475569' }}>
                      <i className="bi bi-check-circle-fill flex-shrink-0" style={{ color: isEleve ? '#15803d' : '#1e3a5f', fontSize: '.72rem' }} />
                      {s}
                    </li>
                  ))}
                  {theme.subtopics.length > 4 && (
                    <li className="text-xs text-slate-400 mt-1">
                      + {theme.subtopics.length - 4} autres sous-thèmes…
                    </li>
                  )}
                </ul>
              </div>

              {/* Footer */}
              <div className="px-4 pb-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{theme.subtopics.length} sous-thèmes</span>
                {count > 0
                  ? <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: isEleve ? 'linear-gradient(135deg,#14532d,#15803d)' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff' }}>
                      <i className="bi bi-book-fill" style={{ fontSize: '.65rem' }} />
                      {count} cours
                    </span>
                  : <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                      Bientôt disponible
                    </span>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
