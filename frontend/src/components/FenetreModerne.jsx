/* ── Fenêtres de saisie « modernes » (moniteur, examen, paiement, véhicule) ──
   Même présentation que la fiche élève (ModalModerne dans Eleves.jsx) : en-tête bleu nuit
   souligné d'or, étapes numérotées dans des cartes blanches, choix en boutons, bouton doré.
   Composants définis au niveau du module : un composant redéfini à chaque rendu serait
   remonté à chaque frappe et le champ perdrait le focus. */
import { champCls, stylePastille } from './fenetreStyles'

export function Etiquette({ children, requis }) {
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}{requis && <span className="text-red-500"> *</span>}
    </label>
  )
}

/* avatar : élément affiché à gauche du titre (photo, initiales…) ; à défaut, l'icône. */
export function FenetreModerne({ surTitre, titre, icone, avatar, details = [], onClose, onSave,
  libelleSave = 'Enregistrer', piedGauche, taille = 'lg', libelleAnnuler = 'Annuler', children }) {
  return (
    <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(6px)' }}>
      <div className={`modal-dialog ${taille ? `modal-${taille}` : ''} modal-dialog-centered modal-dialog-scrollable`}>
        <div className="modal-content border-0" style={{ borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
          <div className="px-6 pt-5 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 55%,#2a4f7c 100%)' }}>
            <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
            <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={onClose} />
            <div className="flex items-center gap-4 pe-6">
              {avatar || (
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                  <i className={`bi bi-${icone}`} />
                </div>
              )}
              <div className="min-w-0">
                {surTitre && <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>{surTitre}</div>}
                <div className="text-xl font-extrabold text-white leading-tight truncate">{titre}</div>
                {details.filter(Boolean).length > 0 && (
                  <div className="text-xs mt-1 flex flex-wrap gap-x-3" style={{ color: '#bfdbfe' }}>
                    {details.filter(Boolean).map(([ic, txt]) => <span key={ic + txt}><i className={`bi bi-${ic} me-1`} />{txt}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-body px-4 sm:px-6 py-5 space-y-4" style={{ background: '#f4f6fa' }}>
            {children}
          </div>

          <div className="modal-footer border-0 px-6 py-3 flex items-center justify-between gap-2" style={{ background: '#fff', borderTop: '1px solid #eef2f7' }}>
            <div className="text-xs text-slate-500 hidden sm:block">{piedGauche || 'Les champs * sont obligatoires'}</div>
            <div className="flex gap-2 ms-auto">
              <button className="btn btn-light fw-semibold px-3 sm:px-4" style={{ borderRadius: '.85rem' }} onClick={onClose}>{libelleAnnuler}</button>
              {/* Sans onSave (ex. l'action principale est dans la fenêtre), pas de bouton doré */}
              {onSave && <button className="btn fw-bold px-3 sm:px-4 text-nowrap" onClick={onSave}
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.85rem', border: 'none', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
                <i className="bi bi-check2-circle me-1" />{libelleSave}
              </button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Etape({ n, icon, titre, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ boxShadow: '0 1px 4px rgba(15,34,64,.06)', border: '1px solid #eef2f7' }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{n}</span>
        <i className={`bi bi-${icon}`} style={{ color: '#1e3a5f' }} />
        <span className="font-extrabold text-slate-800">{titre}</span>
      </div>
      {children}
    </div>
  )
}

/* options : [{ v, label, icon?, sous?, color?, bg? }] ; tuiles : icône au-dessus du libellé. */
export function Choix({ options, value, onChange, tuiles = false, cols }) {
  return (
    <div className={cols ? 'grid gap-2' : 'flex flex-wrap gap-2'} style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` } : undefined}>
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={tuiles ? 'flex flex-col items-center py-3 cursor-pointer'
            // En grille, sur téléphone : icône au-dessus du libellé pour qu'il ne soit pas tronqué.
            : cols ? 'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold cursor-pointer'
            : 'flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold cursor-pointer'}
          style={stylePastille(value === o.v, o.color, o.bg)}>
          {o.icon && <i className={`bi bi-${o.icon}`} style={tuiles ? { fontSize: '1.4rem' } : undefined} />}
          <span className={tuiles ? 'text-sm font-extrabold mt-1' : cols ? 'leading-tight text-center' : 'truncate'}>{o.label}</span>
          {tuiles && o.sous && <span className="text-[10px] font-semibold mt-0.5">{o.sous}</span>}
        </button>
      ))}
    </div>
  )
}

export function ChampMontant({ value, onChange, placeholder, suffixe = 'FCFA', min = 0 }) {
  return (
    <div className="relative">
      <input type="number" min={min} className={champCls} style={{ paddingRight: '3.5rem' }} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{suffixe}</span>
    </div>
  )
}
