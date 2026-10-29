// Grande photo de profil des fiches : la photo est montrée en entier (jamais recadrée,
// pour ne pas couper le visage), sur un fond flouté de la même image qui remplit les côtés.
export default function GrandePhoto({ src, alt, height = 260 }) {
  return (
    <div className="w-full relative overflow-hidden" style={{ height, background: '#1e3a5f' }}>
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', filter: 'blur(18px) brightness(.75)', transform: 'scale(1.15)' }} />
      <img src={src} alt={alt} className="relative w-full h-full block" style={{ objectFit: 'contain' }} />
    </div>
  )
}
