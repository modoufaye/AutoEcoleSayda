import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { correspond } from '../utils'
import { EnteteListe, BarreFiltres, Recherche, ListeVide, ListeChargement, Pastille, BoutonRond, BoutonAjout } from './ListeModerne'
import { THEMES_CODE } from '../contenu/themes'
import { THEMES_CONDUITE } from '../contenu/conduite'

/* Médiathèque (super admin, administrateurs, moniteurs) : vidéos et audios en français ou en
   wolof, rangés par thème, ajoutés un ou plusieurs à la fois, rangés ici pour être publiés ensuite dans les séances de cours (blocs Vidéo et Audio).
   Les élèves ne voient pas cette rubrique : ils retrouvent les médias dans leurs séances. */

const TYPES = [
  { v: 'VIDEO', libelle: 'Vidéos', un: 'une vidéo', icone: 'camera-video-fill', accept: 'video/mp4,video/webm,video/ogg,video/quicktime,.mov,.mp4' },
  { v: 'AUDIO', libelle: 'Audios', un: 'un audio', icone: 'music-note-beamed', accept: 'audio/*,.m4a,.mp3,.wav,.ogg,.oga,.opus,.aac,.webm,.flac' },
]
const LANGUES = {
  FRANCAIS: { libelle: 'Français', couleur: '#1d4ed8', fond: '#dbeafe' },
  WOLOF: { libelle: 'Wolof', couleur: '#047857', fond: '#d1fae5' },
}
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const pilule = actif => ({ borderRadius: 999, minHeight: 38, border: `1.5px solid ${actif ? '#1e3a5f' : '#e2e8f0'}`, background: actif ? '#1e3a5f' : '#fff', color: actif ? '#fff' : '#475569' })
const etiquette = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'
// Thèmes proposés : ceux des cours de code et de conduite de l'application
const THEMES_PROPOSES = [...THEMES_CODE, ...THEMES_CONDUITE].map(t => t.titre)
// « le_demarrage-en-cote.mp4 » → « Le demarrage en cote » : titre proposé pour chaque fichier
const titreDuFichier = nom => {
  const t = nom.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 150)
}
const taille = o => o >= 1048576 ? `${(o / 1048576).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(o / 1024))} Ko`

/* Ajout : un thème, une langue, puis un ou plusieurs fichiers (un titre chacun, proposé d'après le
   nom du fichier) ; chaque fichier devient un média. Modification : titre, thème, langue, description. */
function Formulaire({ type, media, themesConnus, onFini, onAnnuler }) {
  const [f, setF] = useState(media
    ? { titre: media.titre, theme: media.theme || '', langue: media.langue, description: media.description || '' }
    : { titre: '', theme: '', langue: '', description: '' })
  const [fichiers, setFichiers] = useState([])     // ajout : [{ cle, fichier, titre }]
  const [envoi, setEnvoi] = useState(null)         // null, ou { fait, total, nom }
  const t = TYPES.find(x => x.v === type)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  // Thèmes déjà utilisés dans la médiathèque d'abord, puis ceux des cours
  const proposes = [...new Set([...themesConnus, ...THEMES_PROPOSES])]
  // Copie immédiate : la liste du champ est vidée juste après (pour pouvoir rechoisir les mêmes fichiers)
  const ajouterFichiers = liste => {
    const nouveaux = Array.from(liste || []).map((fichier, k) => ({ cle: `${Date.now()}-${k}-${fichier.name}`, fichier, titre: titreDuFichier(fichier.name) }))
    setFichiers(fs => [...fs, ...nouveaux])
  }

  const valider = async e => {
    e.preventDefault()
    if (!f.theme.trim()) return toast('Indiquez le thème', 'warning')
    if (!f.langue) return toast('Choisissez la langue : français ou wolof', 'warning')
    if (media) {
      if (!f.titre.trim()) return toast('Donnez un titre', 'warning')
      setEnvoi({ fait: 0, total: 1 })
      try { await api('PUT', `/medias/${media.id}`, { langue: f.langue, theme: f.theme, titre: f.titre, description: f.description }); toast('Média modifié'); onFini() }
      catch (err) { toast(err.message, 'danger') }
      finally { setEnvoi(null) }
      return
    }
    if (!fichiers.length) return toast(`Choisissez au moins un fichier`, 'warning')
    if (fichiers.some(x => !x.titre.trim())) return toast('Donnez un titre à chaque fichier', 'warning')
    // Un fichier après l'autre ; ceux qui échouent restent dans la liste pour réessayer
    const restants = [], erreurs = []
    let faits = 0
    for (const [k, x] of fichiers.entries()) {
      setEnvoi({ fait: k, total: fichiers.length, nom: x.titre })
      try {
        const { url } = await uploadFile(`/moniteur/upload/${type === 'VIDEO' ? 'video' : 'audio'}`, x.fichier)
        await api('POST', '/medias', { type, url, langue: f.langue, theme: f.theme, titre: x.titre, description: f.description })
        faits++
      } catch (err) { restants.push(x); erreurs.push(`${x.titre} : ${err.message}`) }
    }
    setEnvoi(null)
    const nom = type === 'VIDEO' ? 'vidéo' : 'audio'
    if (faits) toast(`${faits} ${nom}${faits > 1 ? 's' : ''} ajouté${type === 'VIDEO' ? 'e' : ''}${faits > 1 ? 's' : ''} au thème « ${f.theme.trim()} »`)
    if (erreurs.length) { toast(erreurs.slice(0, 3).join(' · '), 'danger'); setFichiers(restants) }
    else onFini()
  }

  return (
    <form onSubmit={valider} className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone={t.icone} titre={media ? 'Modifier le média' : `Ajouter des ${t.libelle.toLowerCase()}`}
        sousTitre={media ? 'Titre, thème et langue' : 'Un thème, une langue, puis un ou plusieurs fichiers'} />
      <div className="p-5 grid gap-4 sm:grid-cols-2 grid-cols-1">
        {/* Thème : à écrire, ou à choisir parmi les propositions */}
        <div className="sm:col-span-2 min-w-0">
          <label className={etiquette}>Thème *</label>
          <input className="form-control" list="themes-medias" value={f.theme} maxLength={100} onChange={e => set('theme', e.target.value)}
            placeholder="Ex. Signalisation, Priorité, Manœuvres de base…" />
          <datalist id="themes-medias">{proposes.map(x => <option key={x} value={x} />)}</datalist>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {proposes.slice(0, 14).map(x => (
              <button key={x} type="button" onClick={() => set('theme', x)} className="px-2.5 py-1 font-semibold cursor-pointer"
                style={{ fontSize: 12, borderRadius: 999, border: `1px solid ${f.theme === x ? '#1e3a5f' : '#e2e8f0'}`, background: f.theme === x ? '#1e3a5f' : '#f8fafc', color: f.theme === x ? '#fff' : '#475569' }}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={etiquette}>Langue *</label>
          <div className="flex gap-2">
            {Object.entries(LANGUES).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set('langue', v)} className="flex-1 text-sm font-bold px-4 cursor-pointer" style={pilule(f.langue === v)}>{l.libelle}</button>
            ))}
          </div>
        </div>
        {media && (
          <div className="sm:col-span-2">
            <label className={etiquette}>Titre *</label>
            <input className="form-control" value={f.titre} maxLength={150} onChange={e => set('titre', e.target.value)} />
          </div>
        )}
        {!media && (
          <div className="sm:col-span-2 min-w-0">
            <label className={etiquette}>Fichiers *</label>
            <label className="flex flex-col items-center justify-center gap-1 px-4 py-5 cursor-pointer text-center"
              style={{ display: 'flex', borderRadius: 14, border: '2px dashed #cbd5e1', background: '#f8fafc', color: '#475569' }}>
              <i className={`bi bi-${t.icone}`} style={{ fontSize: 26, color: '#1e3a5f' }} />
              <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>Choisir un ou plusieurs fichiers</span>
              <span className="text-xs text-slate-400">{type === 'VIDEO' ? 'MP4 ou vidéos du téléphone, 200 Mo au plus chacune' : 'Mémos vocaux du téléphone, MP3, M4A…'}</span>
              <input type="file" multiple accept={t.accept} className="hidden" onChange={e => { ajouterFichiers(e.target.files); e.target.value = '' }} />
            </label>
            {fichiers.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-bold text-slate-500">{fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} · un titre pour chacun</div>
                {fichiers.map((x, k) => (
                  <div key={x.cle} className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold" style={{ borderRadius: 999, background: '#eff6ff', color: '#1d4ed8' }}>{k + 1}</span>
                    <div className="flex-1 min-w-0">
                      <input className="form-control form-control-sm" value={x.titre} maxLength={150} aria-label={`Titre du fichier ${x.fichier.name}`}
                        onChange={e => setFichiers(fs => fs.map(y => y.cle === x.cle ? { ...y, titre: e.target.value } : y))} />
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{x.fichier.name} · {taille(x.fichier.size)}</div>
                    </div>
                    <button type="button" onClick={() => setFichiers(fs => fs.filter(y => y.cle !== x.cle))} disabled={!!envoi} aria-label={`Retirer ${x.fichier.name}`}
                      className="w-8 h-8 flex-shrink-0 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: '#fee2e2', color: '#b91c1c' }}>
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={etiquette}>Description</label>
          <textarea className="form-control" rows={2} maxLength={500} value={f.description} onChange={e => set('description', e.target.value)}
            placeholder={media ? 'Facultatif : de quoi parle ce média' : 'Facultatif : la même pour tous les fichiers'} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2">
          {envoi && envoi.total > 1 && <span className="text-xs font-bold text-slate-500 me-auto truncate">Envoi {envoi.fait + 1}/{envoi.total} · {envoi.nom}</span>}
          <button type="button" onClick={onAnnuler} disabled={!!envoi} className="px-5 text-sm font-bold cursor-pointer" style={{ ...pilule(false), minHeight: 42 }}>Annuler</button>
          <button type="submit" disabled={!!envoi} className="px-5 text-sm font-extrabold border-0 cursor-pointer flex items-center gap-2"
            style={{ borderRadius: 999, minHeight: 42, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', opacity: envoi ? .7 : 1 }}>
            {envoi ? <><span className="spinner-border spinner-border-sm" />{media ? 'Enregistrement…' : 'Envoi…'}</>
              : <><i className="bi bi-check2" />{media ? 'Enregistrer' : fichiers.length > 1 ? `Ajouter les ${fichiers.length} fichiers` : 'Ajouter'}</>}
          </button>
        </div>
      </div>
    </form>
  )
}

function CarteMedia({ m, onModifier, onChanger }) {
  const l = LANGUES[m.langue] || LANGUES.FRANCAIS
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
          {m.theme && <Pastille couleur="#b45309" fond="#fef3c7">{m.theme}</Pastille>}
          {m.seances > 0
            ? <Pastille couleur="#7c3aed" fond="#ede9fe">Dans {m.seances} séance{m.seances > 1 ? 's' : ''}</Pastille>
            : <Pastille couleur="#64748b" fond="#f1f5f9">Pas encore publié</Pastille>}
        </div>
        <div className="font-extrabold leading-snug" style={{ color: '#1e3a5f' }}>{m.titre}</div>
        {m.description && <div className="text-sm text-slate-600">{m.description}</div>}
        <div className="text-xs text-slate-400 mt-auto">
          {m.auteurNom && <>Par {m.auteurNom} · </>}{new Date(m.creeLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {m.modifiable && (
          <div className="flex gap-2 pt-1">
            <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => onModifier(m)} />
            <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={supprimer} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Mediatheque() {
  const [medias, setMedias] = useState(null)
  const [type, setType] = useState('VIDEO')
  const [langue, setLangue] = useState('')
  const [theme, setTheme] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)   // null, 'ajout' ou le média à modifier

  const charger = () => api('GET', '/medias').then(setMedias).catch(e => { toast(e.message, 'danger'); setMedias([]) })
  useEffect(() => { charger() }, [])

  const t = TYPES.find(x => x.v === type)
  const duType = (medias || []).filter(m => m.type === type)
  // Thèmes de la médiathèque (tous types) : proposés au formulaire ; ceux de ce type : filtre
  const themesConnus = [...new Set((medias || []).map(m => m.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const themesDuType = [...new Set(duType.map(m => m.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const visibles = duType.filter(m => (!langue || m.langue === langue) && (!theme || (m.theme || '') === theme)
    && correspond([m.titre, m.theme, m.description, m.auteurNom], q))
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
        <Recherche value={q} onChange={setQ} placeholder="Titre, thème, description, auteur…" />
        {themesDuType.length > 0 && (
          <select className="form-select" style={{ borderRadius: 999, minHeight: 38, maxWidth: 260 }} value={theme} onChange={e => setTheme(e.target.value)} aria-label="Thème">
            <option value="">Tous les thèmes</option>
            {themesDuType.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          {[['', 'Toutes'], ['FRANCAIS', 'Français'], ['WOLOF', 'Wolof']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setLangue(v)} className="text-sm font-bold px-4 cursor-pointer whitespace-nowrap" style={pilule(langue === v)}>{l}</button>
          ))}
        </div>
        {!form && <BoutonAjout onClick={() => setForm('ajout')}>{type === 'VIDEO' ? 'Vidéos' : 'Audios'}</BoutonAjout>}
      </BarreFiltres>

      {form && <Formulaire key={form === 'ajout' ? 'ajout' : form.id} type={type} media={form === 'ajout' ? null : form} themesConnus={themesConnus} onFini={fini} onAnnuler={() => setForm(null)} />}

      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone={t.icone} titre={`${t.libelle} en français et en wolof`}
          sousTitre="À choisir dans les blocs Vidéo et Audio des séances de cours" nombre={visibles.length} />
        {medias === null ? <ListeChargement />
          : visibles.length === 0 ? <ListeVide texte={duType.length ? 'Aucun média ne correspond à la recherche' : `Aucun${type === 'VIDEO' ? 'e vidéo' : ' audio'} · cliquez sur « + ${type === 'VIDEO' ? 'Vidéos' : 'Audios'} » pour commencer`} icone={t.icone} />
          : <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map(m => <CarteMedia key={m.id} m={m} onModifier={x => setForm(x)} onChanger={charger} />)}
          </div>}
      </div>
    </div>
  )
}
