import { useEffect, useRef, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { EnteteListe, AvatarRond, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, BoutonAjout } from './ListeModerne'
import { Etiquette } from './FenetreModerne'
import { champCls } from './fenetreStyles'
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

export default function SeancesMoniteur({ isAdmin = false, onBack, seanceId, onOuvrir, onFermer }) {
  const [seances, setSeances]         = useState([])
  const [recherche, setRecherche]     = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [rechercheEleve, setRechercheEleve] = useState('')
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
    onOuvrir?.('nouvelle')
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
    onOuvrir?.(s.id)
  }
  // Éditeur dans l'URL (…/seances-moniteur/12 ou /nouvelle) : Retour du navigateur ou
  // d'Android revient à la liste ; arrivé directement sur l'URL sans formulaire, on montre la liste.
  const fermerEditeur = () => onFermer ? onFermer() : setView('list')
  const enEditeur = view === 'editor' && (!onOuvrir || !!seanceId)

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
      fermerEditeur()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer cette séance ?', ton: 'danger', libelle: 'Supprimer', message: 'Cette action est définitive.' }))) return
    await api('DELETE', `/moniteur/seances/${id}`)
    load()
  }


  if (loading) return (
    <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}><ListeChargement /></div>
  )

  /* ── ÉDITEUR ── */
  /* Élèves assignables filtrés par la recherche (nom ou téléphone) */
  const qEleve = rechercheEleve.trim().toLowerCase()
  const elevesVisibles = qEleve
    ? eleves.filter(e => `${e.nom} ${e.telephone || ''}`.toLowerCase().includes(qEleve))
    : eleves
  const toutCocher = coche => setForm(f => {
    const ids = new Set(f.eleveIds)
    elevesVisibles.forEach(e => coche ? ids.add(e.id) : ids.delete(e.id))
    return { ...f, eleveIds: [...ids] }
  })
  const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
  const BLOCS = [
    { type: 'TEXTE', label: 'Texte', icon: 'pencil-fill',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { type: 'IMAGE', label: 'Image', icon: 'image-fill',        color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { type: 'VIDEO', label: 'Vidéo', icon: 'camera-video-fill', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { type: 'AUDIO', label: 'Audio', icon: 'music-note-beamed', color: '#9333ea', bg: '#fdf4ff', border: '#e9d5ff' },
  ]

  /* ── ÉDITEUR : même style que les fenêtres modernes (en-tête bleu nuit souligné d'or, cartes à bandeau) ── */
  if (enEditeur) return (
    <div data-saisie style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={fermerEditeur} className="btn-retour">
          <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
          Retour
        </button>
      </div>

      {/* En-tête : titre de la séance et actions Brouillon / Publier */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 60%,#2a4f7c 100%)', borderBottom: '3px solid #d4a017', boxShadow: '0 8px 28px rgba(15,34,64,.22)' }}>
        <div className="px-5 sm:px-6 py-5 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
            <i className="bi bi-camera-video-fill" style={{ fontSize: '1.25rem' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>
              {editId ? 'Modifier la séance' : 'Nouvelle séance'}
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
              {form.titre.trim() || 'Séance sans titre'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#bfdbfe' }}>
              {form.eleveIds.length} élève{form.eleveIds.length > 1 ? 's' : ''} · {form.blocs.length} bloc{form.blocs.length > 1 ? 's' : ''} de contenu
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <button
              className="flex items-center justify-center gap-2 text-sm font-bold px-5 border-0 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ minHeight: 42, borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#fff', border: '1.5px solid rgba(255,255,255,.25)' }}
              disabled={saving}
              onClick={() => handleSave('BROUILLON')}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <i className="bi bi-save" />}
              Brouillon
            </button>
            <button
              className="flex items-center justify-center gap-2 text-sm font-extrabold px-5 border-0 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ minHeight: 42, borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}
              disabled={saving}
              onClick={() => handleSave('PUBLIE')}
            >
              <i className="bi bi-send-fill" />
              Publier
            </button>
          </div>
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
        <div className="space-y-5">
          {/* Informations */}
          <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
            <EnteteListe icone="info-circle-fill" titre="Informations" sousTitre="Titre, date et thème" />
            <div className="p-5 space-y-4">
              <div>
                <Etiquette requis>Titre</Etiquette>
                <input className={champCls} value={form.titre}
                  onChange={e => setField('titre', e.target.value)}
                  placeholder="Ex : Comprendre les panneaux d'interdiction" />
              </div>
              <div>
                <Etiquette>Date et heure</Etiquette>
                <input type="datetime-local" className={champCls}
                  value={form.dateHeure} onChange={e => setField('dateHeure', e.target.value)} />
              </div>
              <div>
                <Etiquette>Thème</Etiquette>
                <select className={champCls} value={form.theme} onChange={e => setField('theme', e.target.value)}>
                  <option value="">— Choisir un thème —</option>
                  {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Élèves assignés */}
          <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
            <EnteteListe icone="people-fill" titre="Élèves" sousTitre="Qui verra la séance" nombre={`${form.eleveIds.length}/${eleves.length}`} />
            {eleves.length > 0 && (
              <div className="px-4 pt-4 pb-2 space-y-2" style={{ borderBottom: '1px solid #eef2f7' }}>
                <div className="flex"><Recherche value={rechercheEleve} onChange={setRechercheEleve} placeholder="Nom ou téléphone…" /></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toutCocher(true)} className="filtre filtre-bouton" style={{ minHeight: 34, fontSize: '.8rem' }}>
                    <i className="bi bi-check2-all" />Tous
                  </button>
                  <button type="button" onClick={() => toutCocher(false)} className="filtre filtre-bouton" style={{ minHeight: 34, fontSize: '.8rem' }}>
                    <i className="bi bi-x-lg" />Aucun
                  </button>
                </div>
              </div>
            )}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {eleves.length === 0 ? (
                <ListeVide texte="Aucun élève enregistré" icone="people" />
              ) : elevesVisibles.length === 0 ? (
                <ListeVide texte="Aucun élève trouvé" icone="search" />
              ) : (
                elevesVisibles.map(e => {
                  const checked = form.eleveIds.includes(e.id)
                  const [nom, ...prenoms] = (e.nom || '').split(' ')
                  return (
                    <div key={e.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-slate-50"
                      style={{ background: checked ? '#fffbeb' : '#fff', borderBottom: '1px solid #f1f5f9' }}
                      onClick={() => toggleEleve(e.id)}
                    >
                      <AvatarRond prenom={prenoms.join(' ')} nom={nom} taille={34} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: '#1e3a5f' }}>{e.nom}</div>
                        {(e.telephone || e.email) && <div className="text-xs text-slate-400 truncate">{e.telephone || e.email}</div>}
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ border: `2px solid ${checked ? '#d4a017' : '#cbd5e1'}`, background: checked ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#fff' }}>
                        {checked && <i className="bi bi-check-lg" style={{ color: '#1e3a5f', fontSize: '.75rem' }} />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Contenu pédagogique */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
            <EnteteListe icone="layout-text-window-reverse" titre="Contenu pédagogique" sousTitre="Texte, image, vidéo, audio" nombre={form.blocs.length} />

            <div className="p-5">
              {form.blocs.length === 0 && (
                <ListeVide texte="Ajoutez des blocs de contenu avec les boutons ci-dessous" icone="plus-square" />
              )}

              {form.blocs.map((bloc, i) => (
                <BlocEditor key={i} bloc={bloc} index={i} total={form.blocs.length}
                  onUpdate={updateBloc} onRemove={removeBloc}
                  onMove={moveBloc} onUpload={handleUpload} />
              ))}

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-2 pt-4 border-t border-slate-100">
                {BLOCS.map(b => (
                  <button key={b.type} type="button" onClick={() => addBloc(b.type)}
                    className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 cursor-pointer transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    style={{ minHeight: 40, borderRadius: 999, background: b.bg, color: b.color, border: `1.5px solid ${b.border}` }}>
                    <i className={`bi bi-${b.icon}`} />+ {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── LISTE ── */
  const q = recherche.trim().toLowerCase()
  const visibles = seances.filter(s =>
    (!statutFiltre || s.statut === statutFiltre)
    && (!q || `${s.titre || ''} ${THEME_MAP[s.theme] || s.theme || ''}`.toLowerCase().includes(q)))

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="space-y-5">

      {/* En-tête : comme « Mes élèves », Retour puis directement la recherche avec le bouton d'ajout */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
            Retour
          </button>
        </div>
      )}
      <BarreFiltres>
        <Recherche value={recherche} onChange={setRecherche} placeholder="Titre ou thème de la séance…" />
        <Filtre icone="flag" value={statutFiltre} onChange={setStatutFiltre}>
          <option value="">Tous les statuts</option>
          <option value="PUBLIE">Publié</option>
          <option value="BROUILLON">Brouillon</option>
        </Filtre>
        <BoutonAjout onClick={openCreate}>Séance</BoutonAjout>
      </BarreFiltres>

      {/* Liste : bandeau bleu nuit souligné d'or, comme « Véhicules · Flotte de l'auto-école » */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="camera-video-fill" titre="Séances de cours" sousTitre="Contenu partagé avec vos élèves" nombre={visibles.length} />

        {visibles.length === 0 ? (
          <ListeVide texte={q || statutFiltre ? 'Aucune séance trouvée' : 'Aucune séance créée · cliquez sur « + Séance » pour commencer'} icone="camera-video" />
        ) : (
          <div>
            {visibles.map(s => {
              const isPub = s.statut === 'PUBLIE'
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                  style={{ borderBottom: '1.5px solid #dbe2ec' }}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">

                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#f0bb2a' }}>
                    <i className="bi bi-camera-video-fill" style={{ fontSize: '1rem' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: '#1e3a5f' }}>{s.titre}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1" style={{ fontSize: '.75rem', color: '#64748b' }}>
                      {s.theme && <span>{THEME_MAP[s.theme] || s.theme}</span>}
                      {s.dateHeure && (
                        <span className="flex items-center gap-1">
                          <i className="bi bi-calendar3" />
                          {new Date(s.dateHeure).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="bi bi-people" />
                        {s.eleves.length} élève{s.eleves.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="bi bi-layers" />
                        {s.blocs.length} bloc{s.blocs.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  </div>

                  {/* Statut et actions : sous le titre sur téléphone, à droite sur ordinateur */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                    <Pastille couleur={isPub ? '#15803d' : '#a16207'} fond={isPub ? '#dcfce7' : '#fef9c3'}>{isPub ? 'Publié' : 'Brouillon'}</Pastille>
                    <div className="flex items-center gap-2">
                      <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => openEdit(s)} />
                      <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => handleDelete(s.id)} />
                    </div>
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
