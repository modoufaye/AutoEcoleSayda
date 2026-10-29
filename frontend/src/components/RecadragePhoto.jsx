import { useEffect, useRef, useState } from 'react'

/* ── Recadrage de la photo de profil avant l'envoi ──────── */
// L'utilisateur déplace (souris ou doigt) et zoome la photo dans un carré ; le cercle
// montre ce que verront les avatars. On renvoie un JPEG carré de SORTIE px.
const SORTIE = 600

export default function RecadragePhoto({ file, onValider, onAnnuler }) {
  const [src, setSrc] = useState(null)
  const [img, setImg] = useState(null)          // { w, h } : taille réelle de l'image
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // coin haut-gauche de l'image dans le cadre
  const imgRef = useRef(null)
  const drag = useRef(null)
  const V = Math.min(300, window.innerWidth - 64) // côté du cadre à l'écran

  useEffect(() => {
    const lecteur = new FileReader()
    lecteur.onload = () => setSrc(lecteur.result)
    lecteur.readAsDataURL(file)
    return () => lecteur.abort()
  }, [file])

  const echelle = (z = zoom) => img ? (V / Math.min(img.w, img.h)) * z : 1

  // L'image doit toujours couvrir tout le cadre.
  const borner = (p, s) => ({
    x: Math.min(0, Math.max(V - img.w * s, p.x)),
    y: Math.min(0, Math.max(V - img.h * s, p.y)),
  })

  const onLoad = (e) => {
    const w = e.target.naturalWidth, h = e.target.naturalHeight
    const s = V / Math.min(w, h)
    // Départ : centré, et calé vers le haut d'une photo en hauteur (le visage y est souvent).
    setImg({ w, h })
    setPos({ x: (V - w * s) / 2, y: h > w ? -(h * s - V) * 0.25 : (V - h * s) / 2 })
  }

  const changerZoom = (z) => {
    const s0 = echelle(), s1 = echelle(z)
    // On garde le centre du cadre au même endroit de la photo.
    const cx = (V / 2 - pos.x) / s0, cy = (V / 2 - pos.y) / s0
    setZoom(z)
    setPos(borner({ x: V / 2 - cx * s1, y: V / 2 - cy * s1 }, s1))
  }

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, pos }
  }
  const move = (e) => {
    if (!drag.current) return
    const d = drag.current
    setPos(borner({ x: d.pos.x + e.clientX - d.x, y: d.pos.y + e.clientY - d.y }, echelle()))
  }
  const up = () => { drag.current = null }

  const valider = () => {
    const s = echelle()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SORTIE
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'               // fond blanc sous les PNG transparents
    ctx.fillRect(0, 0, SORTIE, SORTIE)
    ctx.drawImage(imgRef.current, -pos.x / s, -pos.y / s, V / s, V / s, 0, 0, SORTIE, SORTIE)
    canvas.toBlob(b => onValider(new File([b], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.9)
  }

  const s = echelle()
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 2000, background: 'rgba(15,34,64,.7)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-4" style={{ boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
        <div className="text-center">
          <div className="font-bold text-slate-800">Cadrer la photo</div>
          <div className="text-xs text-slate-500">Faites glisser la photo et zoomez pour placer le visage dans le cercle</div>
        </div>

        <div className="relative overflow-hidden rounded-xl select-none"
          style={{ width: V, height: V, background: '#0f2240', touchAction: 'none', cursor: 'grab' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {src && (
            <img ref={imgRef} src={src} alt="" draggable={false} onLoad={onLoad}
              style={{ position: 'absolute', left: pos.x, top: pos.y, maxWidth: 'none',
                width: img ? img.w * s : 'auto', height: img ? img.h * s : 'auto', visibility: img ? 'visible' : 'hidden' }} />
          )}
          {/* Assombrit les coins hors du cercle */}
          <div className="absolute inset-0 pointer-events-none rounded-full"
            style={{ boxShadow: '0 0 0 9999px rgba(15,34,64,.55)', border: '2px solid #d4a017' }} />
        </div>

        <div className="flex items-center gap-2" style={{ width: V }}>
          <i className="bi bi-zoom-out text-slate-500" />
          <input type="range" className="form-range flex-1" min="1" max="4" step="0.01" value={zoom}
            onChange={e => changerZoom(Number(e.target.value))} disabled={!img} />
          <i className="bi bi-zoom-in text-slate-500" />
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn fw-semibold" onClick={onAnnuler}
            style={{ borderRadius: '.75rem', background: '#f1f5f9', color: '#475569', border: 'none' }}>
            Annuler
          </button>
          <button type="button" className="btn fw-bold text-white" onClick={valider} disabled={!img}
            style={{ borderRadius: '.75rem', background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none' }}>
            <i className="bi bi-check-lg me-1" />Valider
          </button>
        </div>
      </div>
    </div>
  )
}
