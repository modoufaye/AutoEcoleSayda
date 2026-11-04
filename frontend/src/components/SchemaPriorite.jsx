/* Schémas du thème « Priorité » : feux tricolores, gestes de l'agent et carrefours vus du dessus
   (voitures A, B, C). type : un identifiant de dessin de contenu/priorite.js. On roule à droite :
   une voiture qui monte occupe la moitié droite de la route verticale. */
const ROUTE = '#475569', LIGNE = '#e2e8f0'
const COULEURS = { A: '#1d4ed8', B: '#dc2626', C: '#16a34a', U: '#f8fafc' }

/* Voiture vue du dessus, angle 0 = vers le haut. */
function Voiture({ x, y, angle = 0, lettre = 'A', urgence = false }) {
  const c = COULEURS[urgence ? 'U' : lettre]
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-5.5" y="-9" width="11" height="18" rx="3" fill={c} stroke="#0f172a" strokeWidth=".8" />
      <rect x="-4" y="-6" width="8" height="4" rx="1" fill="#bfdbfe" />
      {urgence
        ? <><rect x="-4" y="0" width="8" height="2.2" fill="#dc2626" /><rect x="-1.1" y="-1.1" width="2.2" height="4.4" fill="#dc2626" />
            <circle cx="-2.5" cy="-8" r="1.6" fill="#3b82f6"><animate attributeName="opacity" values="1;.2;1" dur=".8s" repeatCount="indefinite" /></circle>
            <circle cx="2.5" cy="-8" r="1.6" fill="#ef4444"><animate attributeName="opacity" values=".2;1;.2" dur=".8s" repeatCount="indefinite" /></circle></>
        : <text x="0" y="6" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff" transform={`rotate(${-angle} 0 3.5)`}>{lettre}</text>}
    </g>
  )
}

/* Flèche de trajet en pointillés (liste de points). */
function Trajet({ d, couleur }) {
  return <path d={d} stroke={couleur} strokeWidth="2.2" fill="none" strokeDasharray="3 2.5" strokeLinecap="round" markerEnd={`url(#fl-${couleur.slice(1)})`} />
}
function Fleches() {
  return (
    <defs>
      {Object.values(COULEURS).map(c => (
        <marker key={c} id={`fl-${c.slice(1)}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={c} />
        </marker>
      ))}
    </defs>
  )
}

function Croix({ axeLigne = true }) {
  return (
    <>
      <rect width="100" height="100" fill="#86efac" opacity=".35" />
      <rect x="36" y="0" width="28" height="100" fill={ROUTE} />
      <rect x="0" y="36" width="100" height="28" fill={ROUTE} />
      {axeLigne && [[50, 2, 50, 32], [50, 68, 50, 98], [2, 50, 32, 50], [68, 50, 98, 50]].map(([x1, y1, x2, y2]) =>
        <line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LIGNE} strokeWidth="1.2" strokeDasharray="4 4" />)}
    </>
  )
}
const Panneau = ({ code, x, y, t = 14 }) => <image href={`/panneaux/${code}.svg`} x={x} y={y} width={t} height={t} />

const SCENES = {
  /* Carrefour sans signalisation : B arrive de la droite de A. */
  'scene-droite': () => <><Croix /><Voiture x={57} y={82} /><Voiture x={82} y={43} angle={-90} lettre="B" /><Trajet d="M57 72 V20" couleur={COULEURS.A} /><Trajet d="M72 43 H18" couleur={COULEURS.B} /></>,
  /* B arrive de la gauche de A : A a B à sa gauche, c'est A qui passe. */
  'scene-gauche': () => <><Croix /><Voiture x={57} y={82} /><Voiture x={18} y={57} angle={90} lettre="B" /><Trajet d="M57 72 V20" couleur={COULEURS.A} /><Trajet d="M28 57 H82" couleur={COULEURS.B} /></>,
  /* A au STOP, B sur la route principale venant de gauche. */
  'scene-stop': () => <><Croix axeLigne={false} /><line x1="2" y1="50" x2="98" y2="50" stroke={LIGNE} strokeWidth="1.2" strokeDasharray="4 4" /><rect x="50" y="66" width="14" height="2.5" fill="#fff" /><Panneau code="AB4" x={66} y={70} /><Voiture x={57} y={82} /><Voiture x={18} y={57} angle={90} lettre="B" /><Trajet d="M57 72 V20" couleur={COULEURS.A} /><Trajet d="M28 57 H82" couleur={COULEURS.B} /></>,
  /* A sur route prioritaire, B au « cédez le passage » à droite. */
  'scene-prioritaire': () => <><Croix /><Panneau code="AB6" x={66} y={70} /><Panneau code="AB3a" x={70} y={22} /><Voiture x={57} y={82} /><Voiture x={82} y={43} angle={-90} lettre="B" /><Trajet d="M57 72 V20" couleur={COULEURS.A} /><Trajet d="M72 43 H18" couleur={COULEURS.B} /></>,
  /* Trois voitures sans signalisation : B (droite de A) passe, puis A, puis C. */
  'scene-trois': () => <><Croix /><Voiture x={57} y={82} /><Voiture x={82} y={43} angle={-90} lettre="B" /><Voiture x={18} y={57} angle={90} lettre="C" /><Trajet d="M57 72 V20" couleur={COULEURS.A} /><Trajet d="M72 43 H18" couleur={COULEURS.B} /><Trajet d="M28 57 H82" couleur={COULEURS.C} /></>,
  /* Giratoire : B déjà engagé dans l'anneau, A veut entrer. */
  'scene-giratoire': () => (
    <>
      <rect width="100" height="100" fill="#86efac" opacity=".35" />
      <rect x="40" y="0" width="20" height="100" fill={ROUTE} /><rect x="0" y="40" width="100" height="20" fill={ROUTE} />
      <circle cx="50" cy="50" r="30" fill={ROUTE} /><circle cx="50" cy="50" r="14" fill="#4ade80" stroke="#fff" strokeWidth="1.5" />
      <Panneau code="AB25" x={66} y={78} t={13} />
      <Voiture x={55} y={90} /><Voiture x={30} y={62} angle={140} lettre="B" />
      <Trajet d="M55 80 V72" couleur={COULEURS.A} /><path d="M34 70 Q50 80 66 70" stroke={COULEURS.B} strokeWidth="2.2" fill="none" strokeDasharray="3 2.5" markerEnd={`url(#fl-${COULEURS.B.slice(1)})`} />
    </>
  ),
  /* Ambulance avec gyrophare qui arrive derrière A. */
  'scene-urgence': () => <><Croix /><Voiture x={57} y={46} /><Voiture x={57} y={86} urgence lettre="U" /><Trajet d="M60 38 Q64 30 66 20" couleur={COULEURS.A} /></>,
  /* Piéton engagé sur le passage, A veut tourner à droite. */
  'scene-pieton': () => (
    <>
      <Croix />{[68, 73, 78, 83, 88].map(x => <rect key={x} x={x} y="37" width="3" height="26" fill="#fff" />)}
      <g transform="translate(79 48)"><circle r="3" fill="#f59e0b" /><circle cy="-4.5" r="2" fill="#7c2d12" /></g>
      <Voiture x={57} y={82} /><path d="M57 72 Q57 57 72 57" stroke={COULEURS.A} strokeWidth="2.2" fill="none" strokeDasharray="3 2.5" markerEnd={`url(#fl-${COULEURS.A.slice(1)})`} />
    </>
  ),
  /* A sort d'une place de stationnement, B roule sur la voie. */
  'scene-stationnement': () => (
    <>
      <rect width="100" height="100" fill="#86efac" opacity=".35" /><rect x="0" y="30" width="100" height="40" fill={ROUTE} />
      <line x1="2" y1="50" x2="98" y2="50" stroke={LIGNE} strokeWidth="1.2" strokeDasharray="4 4" />
      {[30, 50, 70].map(x => <rect key={x} x={x} y="70" width="18" height="22" fill="none" stroke="#fff" strokeWidth="1" />)}
      <Voiture x={59} y={80} angle={-20} /><Voiture x={20} y={60} angle={90} lettre="B" />
      <Trajet d="M30 60 H86" couleur={COULEURS.B} /><path d="M57 72 Q60 62 72 60" stroke={COULEURS.A} strokeWidth="2.2" fill="none" strokeDasharray="3 2.5" markerEnd={`url(#fl-${COULEURS.A.slice(1)})`} />
    </>
  ),
}

/* Feu tricolore : etat = vert | orange | rouge | orange-clignotant | rouge-clignotant | fleche | eteint. */
function Feu({ etat }) {
  const allume = { rouge: etat.startsWith('rouge'), orange: etat.startsWith('orange'), vert: etat === 'vert' || etat === 'fleche' }
  const clignote = etat.endsWith('clignotant')
  const lampe = (cy, couleur, on) => (
    <circle cx="50" cy={cy} r="11" fill={on ? couleur : '#334155'} style={on ? { filter: `drop-shadow(0 0 5px ${couleur})` } : undefined}>
      {on && clignote && <animate attributeName="opacity" values="1;.15;1" dur="1.1s" repeatCount="indefinite" />}
    </circle>
  )
  return (
    <>
      <rect x="44" y="84" width="12" height="16" fill="#64748b" />
      <rect x="32" y="6" width="36" height="80" rx="9" fill="#0f172a" />
      {lampe(22, '#ef4444', allume.rouge)}{lampe(46, '#f59e0b', allume.orange)}
      {etat === 'fleche'
        ? <><circle cx="50" cy="70" r="11" fill="#052e16" /><path d="M43 70 H55 M50 64 L56 70 L50 76" stroke="#22c55e" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} /></>
        : lampe(70, '#22c55e', allume.vert)}
    </>
  )
}

/* Agent de circulation : geste = leve | face | profil. */
function Agent({ geste }) {
  const bras = {
    leve: <path d="M50 40 L50 14 M50 40 L40 58" />,
    face: <path d="M50 40 L26 40 M50 40 L74 40" />,
    profil: <path d="M50 40 L72 40 M50 40 L46 60" />,
  }[geste]
  return (
    <>
      <rect width="100" height="100" fill="#e0f2fe" />
      <g stroke="#1e3a5f" strokeWidth="6" strokeLinecap="round" fill="none">{bras}<path d="M50 38 V66 M50 66 L42 90 M50 66 L58 90" /></g>
      <rect x="42" y="36" width="16" height="26" rx="4" fill="#facc15" opacity=".9" />
      <circle cx="50" cy="27" r="7" fill="#7c2d12" />
      <rect x="41" y="17" width="18" height="5" rx="2" fill="#1e3a5f" /><rect x="44" y="12" width="12" height="7" rx="2" fill="#1e3a5f" />
      {geste === 'profil' && <circle cx="56" cy="26" r="1.3" fill="#fff" />}
    </>
  )
}

export default function SchemaPriorite({ type, taille = 72 }) {
  let contenu = null
  if (type.startsWith('feu-')) contenu = <><rect width="100" height="100" fill="#e2e8f0" /><Feu etat={type.slice(4)} /></>
  else if (type.startsWith('agent-')) contenu = <Agent geste={type.slice(6)} />
  else if (SCENES[type]) contenu = <><Fleches />{SCENES[type]()}</>
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" role="img" aria-label={`Schéma : ${type}`}
      style={{ borderRadius: 12, display: 'block', flexShrink: 0, overflow: 'hidden' }}>
      {contenu}
    </svg>
  )
}
