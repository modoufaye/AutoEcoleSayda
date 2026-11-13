import { useEffect, useRef, useState } from 'react'
import { toast } from './Toast'

/* Audios privés (messages vocaux, audios des annonces) : enregistrement au micro et lecture.
   Les fichiers n'ont pas d'adresse publique : ils sont lus avec le jeton de connexion. */

export const minSec = s => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`
export const VOCAL_MAX = 300   // 5 minutes au plus

/* Format d'enregistrement accepté par le navigateur : opus/webm (Chrome, Android), mp4 (iPhone). */
const formatVocal = () => typeof MediaRecorder === 'undefined' ? null
  : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t)) || ''

/* Enregistreur : demarrer(), finir(garder) ; onFini(fichier, duree) reçoit l'enregistrement gardé.
   secondes : null hors enregistrement. */
export function useEnregistreur(onFini) {
  const [secondes, setSecondes] = useState(null)
  const rec = useRef(null)   // { recorder, flux, morceaux, debut, minuterie, garder }
  const fini = useRef(onFini)
  useEffect(() => { fini.current = onFini })
  const arreterFlux = r => { clearInterval(r.minuterie); r.flux.getTracks().forEach(t => t.stop()) }
  useEffect(() => () => {
    const r = rec.current
    if (r) { r.garder = false; try { r.recorder.stop() } catch { /* déjà arrêté */ } arreterFlux(r) }
  }, [])
  const demarrer = async () => {
    const type = formatVocal()
    if (type === null || !navigator.mediaDevices?.getUserMedia) return toast("Votre navigateur ne permet pas d'enregistrer un audio", 'warning')
    let flux
    try { flux = await navigator.mediaDevices.getUserMedia({ audio: true }) }
    catch { return toast('Micro refusé : autorisez le micro pour ce site dans les réglages du navigateur', 'warning') }
    const recorder = new MediaRecorder(flux, type ? { mimeType: type } : undefined)
    const r = { recorder, flux, morceaux: [], debut: Date.now(), garder: false }
    recorder.ondataavailable = e => { if (e.data.size) r.morceaux.push(e.data) }
    recorder.onstop = () => {
      arreterFlux(r)
      const duree = Math.max(1, Math.round((Date.now() - r.debut) / 1000))
      rec.current = null; setSecondes(null)
      if (!r.garder) return
      const mime = (recorder.mimeType || type || 'audio/webm').split(';')[0]
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      fini.current(new File(r.morceaux, `vocal.${ext}`, { type: mime }), duree)
    }
    r.minuterie = setInterval(() => {
      const s = Math.round((Date.now() - r.debut) / 1000)
      setSecondes(s)
      if (s >= VOCAL_MAX) { r.garder = true; recorder.stop() }
    }, 250)
    rec.current = r
    recorder.start(1000)
    setSecondes(0)
  }
  const finir = garder => { const r = rec.current; if (!r) return; r.garder = garder; r.recorder.stop() }
  return { secondes, enCours: secondes !== null, demarrer, finir }
}

const rond = 'w-11 h-11 rounded-full border-0 flex items-center justify-center cursor-pointer flex-shrink-0'

/* Barre pendant l'enregistrement : 🗑️ annuler, compteur, ➤ garder (envoyer ou joindre). */
export function BarreEnregistrement({ enreg, libelleGarder = 'Envoyer le message vocal', iconeGarder = 'send-fill' }) {
  return (
    <div className="flex gap-2 items-center">
      <button type="button" onClick={() => enreg.finir(false)} aria-label="Annuler l'enregistrement" className={rond} style={{ background: '#fee2e2', color: '#b91c1c' }}><i className="bi bi-trash3-fill" /></button>
      <div className="flex-1 flex items-center gap-2 px-3 h-11 rounded-full" style={{ background: '#fef2f2', color: '#b91c1c' }}>
        <span className="rounded-full animate-pulse" style={{ width: 10, height: 10, background: '#dc2626' }} />
        <span className="font-bold text-sm">Enregistrement… {minSec(enreg.secondes)}</span>
        <span className="ms-auto text-xs" style={{ opacity: .7 }}>max {minSec(VOCAL_MAX)}</span>
      </div>
      <button type="button" onClick={() => enreg.finir(true)} aria-label={libelleGarder} title={libelleGarder} className={rond} style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}><i className={`bi bi-${iconeGarder}`} /></button>
    </div>
  )
}

/* Audios privés lus avec le jeton, gardés en mémoire le temps de la page (pas de nouveau
   téléchargement à chaque rafraîchissement de la liste). */
const caches = new Map()
function urlPrivee(chemin) {
  if (!caches.has(chemin)) caches.set(chemin, (async () => {
    const res = await fetch('/api' + chemin, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    if (!res.ok) { caches.delete(chemin); throw new Error('Audio indisponible') }
    return URL.createObjectURL(await res.blob())
  })())
  return caches.get(chemin)
}

/* Enregistrement de Chrome (webm) sans durée dans l'en-tête : le lecteur afficherait une barre
   inutilisable. Un saut tout au bout force le calcul de la durée, puis on revient au début. */
export const dureeConnue = e => {
  const a = e.currentTarget
  if (a.duration !== Infinity) return
  a.ontimeupdate = () => { a.ontimeupdate = null; a.currentTime = 0 }
  a.currentTime = 1e101
}

/* Lecteur d'un audio privé (chemin d'API, ex. /annonces/12/audio) ou local (src : aperçu avant envoi). */
export function LecteurVocal({ chemin, src, duree, libelle = 'Message vocal' }) {
  const [url, setUrl] = useState(src || null)
  const [erreur, setErreur] = useState(false)
  useEffect(() => { if (chemin) urlPrivee(chemin).then(setUrl).catch(() => setErreur(true)); else setUrl(src || null) }, [chemin, src])
  return (
    <div className="flex flex-col gap-1" style={{ minWidth: 210 }}>
      <div className="text-[11px] font-bold" style={{ opacity: .75 }}><i className="bi bi-mic-fill me-1" />{libelle}{duree != null && ` · ${minSec(duree)}`}</div>
      {erreur ? <div className="text-xs" style={{ opacity: .7 }}>Indisponible</div>
        : url ? <audio controls preload="metadata" src={url} style={{ width: '100%', maxWidth: 300, height: 36 }} onLoadedMetadata={dureeConnue} />
        : <span className="spinner-border spinner-border-sm" style={{ opacity: .6 }} />}
    </div>
  )
}
