/* Illustrations des thèmes de code sans panneau : pictogramme (icône Bootstrap ou chiffre clé
   sur fond teinté) et voyants du tableau de bord (feux), dessinés en SVG. */

/* Pictogramme : icone (nom Bootstrap sans « bi- »), couleur, texte (chiffre ou mot court, optionnel). */
export function Picto({ icone, couleur = '#1e3a5f', texte, taille = 72 }) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center justify-center flex-shrink-0"
      style={{ width: taille, height: taille, borderRadius: taille * .2, background: `linear-gradient(135deg, ${couleur}1f, ${couleur}40)`, color: couleur, border: `1.5px solid ${couleur}33` }}>
      {icone && <i className={`bi bi-${icone}`} style={{ fontSize: taille * (texte ? .34 : .5), lineHeight: 1 }} />}
      {texte && <span className="font-black" style={{ fontSize: taille * (icone ? .2 : .3), lineHeight: 1.1, marginTop: icone ? taille * .04 : 0, whiteSpace: 'nowrap' }}>{texte}</span>}
    </div>
  )
}

/* Lampe en forme de D (bord plat à gauche, éclairage vers la gauche), et faisceau de 5 traits. */
const lampe = (c, miroir) => <path d="M56 30 Q82 30 82 50 Q82 70 56 70 Z" fill="none" stroke={c} strokeWidth="5" strokeLinejoin="round" transform={miroir ? 'translate(100 0) scale(-1 1)' : undefined} />
const faisceau = (c, pente, miroir) => (
  <g stroke={c} strokeWidth="5" strokeLinecap="round" transform={miroir ? 'translate(100 0) scale(-1 1)' : undefined}>
    {[34, 42, 50, 58, 66].map(y => <line key={y} x1="46" y1={y} x2="22" y2={y + pente} />)}
  </g>
)
const vague = (c, x) => <path d={`M${x} 26 q5 6 0 12 q-5 6 0 12 q5 6 0 12 q-5 6 0 12`} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />

const VOYANTS = {
  position: () => <g stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round">
    <path d="M40 36 Q26 36 26 50 Q26 64 40 64 Z" strokeLinejoin="round" /><path d="M60 36 Q74 36 74 50 Q74 64 60 64 Z" strokeLinejoin="round" />
    {[[22, 40, 12, 34], [20, 50, 9, 50], [22, 60, 12, 66], [78, 40, 88, 34], [80, 50, 91, 50], [78, 60, 88, 66]].map(([a, b, c, d]) => <line key={`${a}${b}`} x1={a} y1={b} x2={c} y2={d} />)}
  </g>,
  croisement: () => <>{lampe('#22c55e')}{faisceau('#22c55e', 8)}</>,
  route: () => <>{lampe('#3b82f6')}{faisceau('#3b82f6', 0)}</>,
  'brouillard-avant': () => <>{lampe('#22c55e')}{faisceau('#22c55e', 8)}{vague('#22c55e', 34)}</>,
  'brouillard-arriere': () => <>{lampe('#f59e0b', true)}{faisceau('#f59e0b', 0, true)}{vague('#f59e0b', 66)}</>,
  detresse: () => <g fill="none" stroke="#ef4444" strokeLinejoin="round"><path d="M50 14 L88 80 H12 Z" strokeWidth="6" /><path d="M50 36 L70 70 H30 Z" strokeWidth="5" /></g>,
  clignotants: () => <g fill="#22c55e"><path d="M10 50 L34 30 V42 H44 V58 H34 V70 Z" /><path d="M90 50 L66 30 V42 H56 V58 H66 V70 Z" /></g>,
}

/* Voyant du tableau de bord : type = clé de VOYANTS. */
export function Voyant({ type, taille = 72 }) {
  const dessin = VOYANTS[type]
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" role="img" aria-label={`Voyant : ${type}`} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="100" height="100" rx="20" fill="#0f172a" />
      {dessin ? dessin() : null}
    </svg>
  )
}
