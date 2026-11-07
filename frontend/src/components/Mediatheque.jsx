import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { correspond } from '../utils'
import { EnteteListe, BarreFiltres, Recherche, ListeVide, ListeChargement, Pastille, BoutonRond, BoutonAjout } from './ListeModerne'

/* Médiathèque : vidéos et audios en français ou en wolof. Le personnel (super admin,
   administrateurs, moniteurs) dépose, classe et choisit ce que voient les élèves ; l'élève regarde
   et écoute les médias qui lui sont ouverts. */

const TYPES = [
  { v: 'VIDEO', libelle: 'Vidéos', un: 'une vidéo', icone: 'camera-video-fill', accept: 'video/mp4,video/webm,video/ogg,video/quicktime,.mov,.mp4' },
  { v: 'AUDIO', libelle: 'Audios', un: 'un audio', icone: 'music-note-beamed', accept: 'audio/*,.m4a,.mp3,.wav,.ogg,.oga,.opus,.aac,.webm,.flac' },
]
const LANGUES = {
  FRANCAIS: { libelle: 'Français', couleur: '#1d4ed8', fond: '#dbeafe' },
  WOLOF: { libelle: 'Wolof', couleur: '#047857', fond: '#d1fae5' },
}
const vide = { titre: '', langue: '', description: '', visibleEleves: true, fichier: null }
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const pilule = actif => ({ borderRadius: 999, minHeight: 38, border: `1.5px solid ${actif ? '#1e3a5f' : '#e2e8f0'}`, background: actif ? '#1e3a5f' : '#fff', color: actif ? '#fff' : '#475569' })

/* Ajout (avec fichier) ou modification (titre, langue, description, visibilité). */
function Formulaire({ type, media, onFini, onAnnuler }) {
  const [f, setF] = useState(media ? { ...vide, ...media, description: media.description || '' } : vide)
  const [envoi, setEnvoi] = useState(false)
  const t = TYPES.find(x => x.v === type)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const valider = async e => {
    e.preventDefault()
    if (!f.titre.trim()) return toast('Donnez un titre', 'warning')
    if (!f.langue) return toast('Choisissez la langue : français ou wolof', 'warning')
    if (!media && !f.fichier) return toast(`Choisissez le fichier de ${t.un}`, 'warning')
    setEnvoi(true)
    try {
      const corps = { langue: f.langue, titre: f.titre, description: f.description, visibleEleves: f.visibleEleves }
      if (media) await api('PUT', `/medias/${media.id}`, corps)
      else {
        const { url } = await uploadFile(`/moniteur/upload/${type === 'VIDEO' ? 'video' : 'audio'}`, f.fichier)
        await api('POST', '/medias', { ...corps, type, url })
      }
      toast(media ? 'Média modifié' : `${type === 'VIDEO' ? 'Vidéo ajoutée' : 'Audio ajouté'} à la médiathèque`)
      onFini()
    } catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }
  return (
    <form onSubmit={valider} className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone={t.icone} titre={media ? 'Modifier le média' : `Ajouter ${t.un}`} sousTitre="Titre, langue, et qui peut le voir" />
      <div className="p-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Titre *</label>
          <input className="form-control" value={f.titre} maxLength={150} onChange={e => set('titre', e.target.value)}
            placeholder={type === 'VIDEO' ? 'Ex. Le démarrage en côte' : 'Ex. Les panneaux de danger'} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Langue *</label>
          <div className="flex gap-2">
            {Object.entries(LANGUES).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set('langue', v)} className="flex-1 text-sm font-bold px-4 cursor-pointer" style={pilule(f.langue === v)}>{l.libelle}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Élèves</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer" style={{ minHeight: 38 }}>
            <input type="checkbox" checked={f.visibleEleves} onChange={e => set('visibleEleves', e.target.checked)} style={{ width: 18, height: 18 }} />
            Visible par les élèves
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
          <textarea className="form-control" rows={2} maxLength={500} value={f.description} onChange={e => set('description', e.target.value)}
            placeholder="Facultatif : de quoi parle ce média" />
        </div>
        {!media && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fichier *</label>
            <input type="file" className="form-control" accept={t.accept} onChange={e => set('fichier', e.target.files?.[0] || null)} />
            <div className="text-xs text-slate-400 mt-1">{type === 'VIDEO' ? 'MP4 ou vidéo du téléphone, 200 Mo au plus.' : 'Mémo vocal du téléphone, MP3, M4A…'}</div>
          </div>
        )}
        <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onAnnuler} disabled={envoi} className="px-5 text-sm font-bold cursor-pointer" style={{ ...pilule(false), minHeight: 42 }}>Annuler</button>
          <button type="submit" disabled={envoi} className="px-5 text-sm font-extrabold border-0 cursor-pointer flex items-center gap-2"
            style={{ borderRadius: 999, minHeight: 42, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', opacity: envoi ? .7 : 1 }}>
            {envoi ? <><span className="spinner-border spinner-border-sm" />{media ? 'Enregistrement…' : 'Envoi du fichier…'}</> : <><i className="bi bi-check2" />{media ? 'Enregistrer' : 'Ajouter'}</>}
          </button>
        </div>
      </div>
    </form>
  )
}

function CarteMedia({ m, eleve, onModifier, onChanger }) {
  const l = LANGUES[m.langue] || LANGUES.FRANCAIS
  const basculer = async () => {
    try { await api('PUT', `/medias/${m.id}`, { langue: m.langue, titre: m.titre, description: m.description, visibleEleves: !m.visibleEleves }); toast(m.visibleEleves ? 'Masqué aux élèves' : 'Visible par les élèves'); onChanger() }
    catch (e) { toast(e.message, 'danger') }
  }
  const supprimer = async () => {
    if (m.seances > 0) return toast(`Ce média est utilisé dans ${m.seances} séance${m.seances > 1 ? 's' : ''} : retirez-le d'abord de ${m.seances > 1 ? 'ces séances' : 'cette séance'}`, 'warning')
    if (!(await confirmer({ titre: 'Supprimer ce média ?', ton: 'danger', icone: 'trash3-fill', libelle: 'Supprimer',
      message: `« ${m.titre} » sera retiré de la médiathèque et son fichier effacé.` }))) return
    try { await api('DELETE', `/medias/${m.id}`); toast('Média supprimé'); onChanger() }
    catch (e) { toast(e.message, 'danger') }
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col" style={carte}>
      {m.type === 'VIDEO'
        ? <video src={m.url} controls preload="metadata" playsInline className="w-full" style={{ background: '#0f2240', aspectRatio: '16 / 9' }} />
        : <div className="px-4 pt-4"><audio src={m.url} controls preload="none" className="w-full" /></div>}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pastille couleur={l.couleur} fond={l.fond}>{l.libelle}</Pastille>
          {!eleve && (m.visibleEleves
            ? <Pastille couleur="#15803d" fond="#dcfce7">Visible élèves</Pastille>
            : <Pastille couleur="#64748b" fond="#f1f5f9">Équipe seulement</Pastille>)}
          {!eleve && m.seances > 0 && <Pastille couleur="#7c3aed" fond="#ede9fe">Dans {m.seances} séance{m.seances > 1 ? 's' : ''}</Pastille>}
        </div>
        <div className="font-extrabold leading-snug" style={{ color: '#1e3a5f' }}>{m.titre}</div>
        {m.description && <div className="text-sm text-slate-600">{m.description}</div>}
        <div className="text-xs text-slate-400 mt-auto">
          {m.auteurNom && <>Par {m.auteurNom} · </>}{new Date(m.creeLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {m.modifiable && (
          <div className="flex gap-2 pt-1">
            <BoutonRond title={m.visibleEleves ? 'Masquer aux élèves' : 'Rendre visible aux élèves'} icon={m.visibleEleves ? 'eye-slash-fill' : 'eye-fill'} couleur="#047857" fond="#ecfdf5" onClick={basculer} />
            <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => onModifier(m)} />
            <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={supprimer} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Mediatheque({ eleve = false }) {
  const [medias, setMedias] = useState(null)
  const [type, setType] = useState('VIDEO')
  const [langue, setLangue] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)   // null, 'ajout' ou le média à modifier

  const charger = () => api('GET', eleve ? '/eleve/medias' : '/medias').then(setMedias).catch(e => { toast(e.message, 'danger'); setMedias([]) })
  useEffect(() => { charger() }, [eleve]) // eslint-disable-line react-hooks/exhaustive-deps

  const t = TYPES.find(x => x.v === type)
  const duType = (medias || []).filter(m => m.type === type)
  const visibles = duType.filter(m => (!langue || m.langue === langue) && correspond([m.titre, m.description, m.auteurNom], q))
  const fini = () => { setForm(null); charger() }

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex gap-1 p-1 w-full sm:w-auto sm:inline-flex" style={{ background: '#eef2f7', borderRadius: 999 }}>
        {TYPES.map(x => (
          <button key={x.v} type="button" onClick={() => { setType(x.v); setForm(null) }}
            className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-extrabold border-0 cursor-pointer whitespace-nowrap"
            style={{ borderRadius: 999, ...(type === x.v ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>
            <i className={`bi bi-${x.icone}`} />{x.libelle}
            <span className="text-xs font-bold px-2 rounded-full" style={{ background: '#eef2f7', color: '#475569' }}>{(medias || []).filter(m => m.type === x.v).length}</span>
          </button>
        ))}
      </div>

      <BarreFiltres>
        <Recherche value={q} onChange={setQ} placeholder="Titre, description, auteur…" />
        <div className="flex gap-2">
          {[['', 'Toutes'], ['FRANCAIS', 'Français'], ['WOLOF', 'Wolof']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setLangue(v)} className="text-sm font-bold px-4 cursor-pointer whitespace-nowrap" style={pilule(langue === v)}>{l}</button>
          ))}
        </div>
        {!eleve && !form && <BoutonAjout onClick={() => setForm('ajout')}>{type === 'VIDEO' ? 'Vidéo' : 'Audio'}</BoutonAjout>}
      </BarreFiltres>

      {form && <Formulaire key={form === 'ajout' ? 'ajout' : form.id} type={type} media={form === 'ajout' ? null : form} onFini={fini} onAnnuler={() => setForm(null)} />}

      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone={t.icone} titre={`${t.libelle} en français et en wolof`}
          sousTitre={eleve ? 'Mis à disposition par votre auto-école' : 'À choisir dans les blocs vidéo et audio des séances · « Visible élèves » : aussi dans la médiathèque des élèves'} nombre={visibles.length} />
        {medias === null ? <ListeChargement />
          : visibles.length === 0 ? <ListeVide texte={duType.length ? 'Aucun média ne correspond à la recherche' : eleve ? `Aucun${type === 'VIDEO' ? 'e vidéo' : ' audio'} pour le moment` : `Aucun${type === 'VIDEO' ? 'e vidéo' : ' audio'} · cliquez sur « + ${type === 'VIDEO' ? 'Vidéo' : 'Audio'} » pour commencer`} icone={t.icone} />
          : <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map(m => <CarteMedia key={m.id} m={m} eleve={eleve} onModifier={x => setForm(x)} onChanger={charger} />)}
          </div>}
      </div>
    </div>
  )
}
