import { useEffect, useState } from 'react'
import { enregistrerHote } from './confirmer'

const TONS = {
  danger:  { icon: 'trash3-fill',        couleur: '#b91c1c', fond: '#fee2e2', bouton: 'linear-gradient(135deg,#dc2626,#b91c1c)', texte: '#fff' },
  succes:  { icon: 'check-circle-fill',  couleur: '#15803d', fond: '#dcfce7', bouton: 'linear-gradient(135deg,#16a34a,#15803d)', texte: '#fff' },
  alerte:  { icon: 'exclamation-circle-fill', couleur: '#b45309', fond: '#fef3c7', bouton: 'linear-gradient(135deg,#d4a017,#f0bb2a)', texte: '#1e3a5f' },
}

/* Fenêtre de confirmation, montée une seule fois (AppLayout) ; ouverte par confirmer(). */
export default function HoteConfirmation() {
  const [demande, setDemande] = useState(null)

  useEffect(() => { enregistrerHote(setDemande); return () => enregistrerHote(null) }, [])

  useEffect(() => {
    if (!demande) return
    const touche = e => { if (e.key === 'Escape') repondre(false) }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  if (!demande) return null
  const ton = TONS[demande.ton] || TONS.alerte
  function repondre(ok) { demande.resoudre(ok); setDemande(null) }

  return (
    <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(6px)', zIndex: 2100 }}
      onClick={e => { if (e.target === e.currentTarget) repondre(false) }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content border-0" style={{ borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
          <div className="h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl"
              style={{ background: ton.fond, color: ton.couleur }}>
              <i className={`bi bi-${demande.icone || ton.icon}`} />
            </div>
            <div className="text-lg font-extrabold" style={{ color: '#0f2240' }}>{demande.titre}</div>
            {demande.message && <p className="text-sm text-slate-500 mt-2 mb-0" style={{ whiteSpace: 'pre-line' }}>{demande.message}</p>}
            {demande.details?.length > 0 && (
              <div className="mt-4 rounded-xl px-4 py-3 text-left text-sm" style={{ background: '#f4f6fa', border: '1px solid #eef2f7' }}>
                {demande.details.map(([libelle, valeur]) => (
                  <div key={libelle} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-slate-500">{libelle}</span>
                    <span className="font-bold text-slate-800 text-right">{valeur}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 pb-6 grid grid-cols-2 gap-2">
            <button className="btn btn-light fw-semibold py-2.5" style={{ borderRadius: '.9rem' }} onClick={() => repondre(false)}>
              {demande.libelleRetour || 'Annuler'}
            </button>
            <button className="btn fw-bold py-2.5 border-0" autoFocus onClick={() => repondre(true)}
              style={{ borderRadius: '.9rem', background: ton.bouton, color: ton.texte }}>
              {demande.libelle || 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
