import { useRegisterSW } from 'virtual:pwa-register/react'

const VERIFICATION_MS = 30 * 60 * 1000

/*
 * Bandeau « Nouvelle version disponible ».
 * L'application installée garde une copie du site pour fonctionner hors ligne : sans ce
 * bandeau, une nouvelle version n'apparaissait qu'après avoir fermé tous les onglets.
 * Le service worker attend l'accord de l'utilisateur (registerType « prompt ») pour ne pas
 * recharger la page au milieu d'une saisie.
 */
export default function MiseAJour() {
  const { needRefresh: [besoin, setBesoin], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // Onglet ou application restés ouverts longtemps : on revérifie régulièrement,
      // et à chaque retour sur l'application (téléphone sorti de veille, onglet réaffiché).
      setInterval(() => reg.update(), VERIFICATION_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update()
      })
    },
  })

  if (!besoin) return null
  return (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 flex items-center gap-3 text-white shadow-2xl"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', zIndex: 2000, background: '#1e3a5f',
        borderRadius: '1rem', padding: '.75rem 1rem', width: 'max-content', maxWidth: 'calc(100vw - 2rem)' }}>
      <i className="bi bi-arrow-repeat" style={{ fontSize: '1.25rem', flexShrink: 0 }} />
      <span className="text-sm font-semibold">Nouvelle version disponible</span>
      <button type="button" onClick={() => updateServiceWorker(true)}
        className="btn btn-sm fw-bold" style={{ background: '#fff', color: '#1e3a5f', borderRadius: '.65rem', whiteSpace: 'nowrap' }}>
        Mettre à jour
      </button>
      <button type="button" onClick={() => setBesoin(false)} title="Plus tard"
        className="btn btn-sm btn-link text-white p-1" style={{ opacity: .7 }}>
        <i className="bi bi-x-lg" />
      </button>
    </div>
  )
}
