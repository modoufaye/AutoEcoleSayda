/* Explications en wolof des chapitres : { idDuChapitre: url }, chargées une fois et partagées
   par les écrans ; rechargées après un dépôt ou une suppression. */
import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'

let cache = null           // promesse de la carte chapitre → url
const abonnes = new Set()

function charger(forcer = false) {
  if (!cache || forcer) cache = api('GET', '/audios-wolof')
    .then(l => Object.fromEntries((l || []).map(x => [x.chapitre, x.url])))
    .catch(() => { cache = null; return {} })
  return cache
}

export function useAudiosWolof() {
  const [audios, setAudios] = useState({})
  useEffect(() => {
    let actif = true
    const maj = a => { if (actif) setAudios(a) }
    charger().then(maj); abonnes.add(maj)
    return () => { actif = false; abonnes.delete(maj) }
  }, [])
  return audios
}

async function rafraichir() {
  const a = await charger(true); abonnes.forEach(f => f(a))
}

/* Envoie l'enregistrement (mémo vocal, mp3…) puis l'attache au chapitre. */
export async function deposerAudioWolof(chapitre, titre, fichier) {
  const { url } = await uploadFile('/moniteur/upload/audio', fichier)
  await api('PUT', '/audios-wolof', { chapitre, url, titre })
  await rafraichir()
}

export async function supprimerAudioWolof(chapitre, titre) {
  await api('DELETE', `/audios-wolof?${new URLSearchParams({ chapitre, titre })}`)
  await rafraichir()
}
