/* ── Listes « modernes » (élèves, moniteurs) ──────────────────
   Même présentation que l'historique des versements (Paiements.jsx) : en-tête bleu nuit
   souligné d'or, lignes séparées en grille (cartes sur téléphone), avatars et actions ronds. */

export function EnteteListe({ icone, emoji, titre, sousTitre, nombre }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4"
      style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 60%,#2a4f7c 100%)', borderBottom: '3px solid #d4a017' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
          {emoji ? <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{emoji}</span> : <i className={`bi bi-${icone}`} />}
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-white leading-tight">{titre}</div>
          {sousTitre && <div className="text-xs" style={{ color: '#bfdbfe' }}>{sousTitre}</div>}
        </div>
      </div>
      <span className="text-xs font-extrabold px-3 py-1 rounded-full flex-shrink-0" style={{ background: '#f0bb2a', color: '#1e3a5f' }}>
        {nombre}
      </span>
    </div>
  )
}

/* Ligne : 4 zones sur ordinateur (identité, détail, suivi, statut + actions), empilées sur téléphone. */
export function LigneListe({ attenue = false, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 md:gap-5 items-center px-5 py-4 transition-colors hover:bg-slate-50"
      style={{ borderBottom: '1.5px solid #dbe2ec', opacity: attenue ? .65 : 1 }}>
      {children}
    </div>
  )
}

export function AvatarRond({ photoUrl, prenom = '', nom = '', taille = 44 }) {
  const style = { width: taille, height: taille, flexShrink: 0, borderRadius: '999px' }
  if (photoUrl) {
    return <img src={photoUrl} alt="" style={{ ...style, objectFit: 'cover', objectPosition: 'center 25%', border: '2px solid #f0bb2a' }} />
  }
  return (
    <div className="flex items-center justify-center text-sm font-extrabold"
      style={{ ...style, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff' }}>
      {((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?'}
    </div>
  )
}

export function BoutonRond({ title, icon, couleur, fond, onClick }) {
  return (
    <button onClick={onClick} title={title}
      className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer transition-transform hover:scale-110"
      style={{ borderRadius: '999px', background: fond, color: couleur }}>
      <i className={`bi bi-${icon}`} style={{ fontSize: '.8rem' }} />
    </button>
  )
}

export function Pastille({ couleur, fond, children, point = true }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: fond, color: couleur }}>
      {point && <span className="w-1.5 h-1.5 rounded-full" style={{ background: couleur }} />}{children}
    </span>
  )
}

export function ListeVide({ texte, icone = 'inbox' }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <i className={`bi bi-${icone}`} style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
      </div>
      <div className="text-sm font-medium text-slate-400">{texte}</div>
    </div>
  )
}

export function ListeChargement() {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-[#d4a017] rounded-full animate-spin" />
      <span className="text-sm text-slate-400 font-medium">Chargement…</span>
    </div>
  )
}

/* ── Filtres (pastilles) ─────────────────────────────────────
   Pastille blanche arrondie avec icône ; bordure dorée quand le filtre est actif ou en saisie.
   Styles : .filtre… dans index.css. */
export function BarreFiltres({ children }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-2"
      style={{ boxShadow: '0 2px 12px rgba(15,34,64,.06)', border: '1px solid #eef2f7' }}>
      {children}
    </div>
  )
}

export function Recherche({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <label className={`filtre filtre-recherche mb-0${value ? ' actif' : ''}`}>
      <i className="bi bi-search" />
      <input type="text" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      {value && (
        <button type="button" className="filtre-effacer" title="Effacer" onClick={() => onChange('')}>
          <i className="bi bi-x-lg" />
        </button>
      )}
    </label>
  )
}

export function Filtre({ icone, value, onChange, children }) {
  return (
    <label className={`filtre mb-0${value ? ' actif' : ''}`}>
      <i className={`bi bi-${icone}`} />
      <select value={value} onChange={e => onChange(e.target.value)}>{children}</select>
    </label>
  )
}

export function FiltreDate({ libelle, value, onChange }) {
  return (
    <label className={`filtre mb-0${value ? ' actif' : ''}`}>
      <span className="filtre-libelle">{libelle}</span>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

export function FiltreBascule({ actif, onClick, icone, children }) {
  return (
    <button type="button" onClick={onClick} className={`filtre filtre-bouton${actif ? ' actif' : ''}`}>
      <i className={`bi bi-${actif ? 'check-circle-fill' : icone}`} />{children}
    </button>
  )
}

export function Reinitialiser({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="filtre filtre-bouton filtre-reset">
      <i className="bi bi-x-circle" />Réinitialiser
    </button>
  )
}

/* Bouton d'ajout en pilule bleu nuit, placé à droite dans la barre de filtres (« + Élève », « + Cours »…). */
export function BoutonAjout({ onClick, children, icone = 'plus-lg', vert = false }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center justify-center gap-2 text-sm font-bold text-white px-5 border-0 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap"
      style={{ minHeight: 40, borderRadius: 999,
        background: vert ? 'linear-gradient(135deg,#047857,#10b981)' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)',
        boxShadow: vert ? '0 4px 12px rgba(16,185,129,.25)' : '0 4px 12px rgba(30,58,95,.25)' }}>
      <i className={`bi bi-${icone}`} />{children}
    </button>
  )
}
