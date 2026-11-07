import { useRef, useState } from 'react'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { BoutonWolof } from './BoutonEcouter'
import { deposerAudioWolof, supprimerAudioWolof } from './audiosWolof'

/* Personnel (super admin, administrateurs, moniteurs), dans un chapitre ou sur un de ses panneaux :
   l'explication en wolof enregistrée sur téléphone (mémo vocal, mp3…) est envoyée ici ; les élèves
   l'écoutent avec le bouton « Wolof » à côté de « Écouter ». cle : « danger » ou « danger:A1a ».
   compact : boutons sous le texte (colonne étroite du détail d'un panneau). */
export default function GestionWolof({ cle, titre, url, panneau = false, compact = false }) {
  const [envoi, setEnvoi] = useState(false)
  const champ = useRef()

  const choisir = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setEnvoi(true)
    try { await deposerAudioWolof(cle, titre, f); toast(url ? 'Explication en wolof remplacée' : 'Explication en wolof ajoutée') }
    catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }
  const supprimer = async () => {
    if (!(await confirmer({ titre: "Supprimer l'explication en wolof ?", ton: 'danger', icone: 'trash3-fill', libelle: 'Supprimer',
      message: `Les élèves n'auront plus le bouton « Wolof » pour « ${titre} ». Vous pourrez en envoyer une nouvelle.` }))) return
    setEnvoi(true)
    try { await supprimerAudioWolof(cle, titre); toast('Explication en wolof supprimée') }
    catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }

  const bouton = 'px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer'
  return (
    <div className={`rounded-2xl px-4 py-3 flex flex-col gap-3 ${compact ? '' : 'sm:flex-row sm:items-center'}`} style={{ background: '#ecfdf5', border: '1.5px dashed #6ee7b7' }}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <i className="bi bi-headphones mt-0.5" style={{ color: '#047857', fontSize: '1.2rem' }} />
        <div className="min-w-0">
          <div className="font-extrabold text-sm" style={{ color: '#065f46' }}>Explication en wolof {url ? '· enregistrée' : '· à enregistrer'}</div>
          <div className="text-xs" style={{ color: '#047857' }}>
            {url ? 'Les élèves l\'écoutent avec le bouton « Wolof ».'
              : panneau ? 'Expliquez ce panneau en wolof (ce qu\'il veut dire, ce qu\'il faut faire) avec le dictaphone du téléphone, puis envoyez le fichier ici.'
              : 'Expliquez « À retenir » en wolof avec le dictaphone de votre téléphone, puis envoyez le fichier ici.'}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {url && <BoutonWolof url={url} className={bouton} />}
        <button type="button" disabled={envoi} onClick={() => champ.current?.click()} className={bouton}
          style={{ borderRadius: 999, background: '#047857', color: '#fff', opacity: envoi ? .6 : 1 }}>
          {envoi ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: '.75rem', height: '.75rem' }} />Envoi…</>
            : <><i className={`bi bi-${url ? 'arrow-repeat' : 'upload'} me-1`} />{url ? 'Remplacer' : "Envoyer l'enregistrement"}</>}
        </button>
        {url && (
          <button type="button" disabled={envoi} onClick={supprimer} className={bouton} style={{ borderRadius: 999, background: '#fee2e2', color: '#b91c1c' }}>
            <i className="bi bi-trash3 me-1" />Supprimer
          </button>
        )}
        <input ref={champ} type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.oga,.opus,.aac,.webm,.flac" hidden onChange={choisir} />
      </div>
    </div>
  )
}
