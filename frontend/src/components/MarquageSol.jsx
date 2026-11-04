/* Marquages au sol vus du dessus (chapitres 4 à 6 de la Signalisation) : chaussée grise,
   lignes blanches ou jaunes. type : un identifiant de marquage de contenu/signalisation.js. */
const B = '#ffffff', J = '#facc15'

function tirets(x, longueur, vide, largeur = 4, couleur = B) {
  const t = []
  for (let y = -vide / 2; y < 100; y += longueur + vide) t.push(<rect key={y} x={x - largeur / 2} y={y} width={largeur} height={longueur} fill={couleur} rx="1" />)
  return t
}

const DESSINS = {
  continue:  () => <rect x="58" y="0" width="4" height="100" fill={B} />,
  discontinue: () => tirets(60, 12, 18),
  annonce:   () => tirets(60, 26, 6),
  mixte:     () => <><rect x="54" y="0" width="4" height="100" fill={B} />{tirets(64, 12, 14)}</>,
  double:    () => <><rect x="54" y="0" width="4" height="100" fill={B} /><rect x="62" y="0" width="4" height="100" fill={B} /></>,
  rabattement: () => <>{tirets(60, 12, 18)}{[22, 58].map(y => <path key={y} d={`M84 ${y + 14} L72 ${y} M72 ${y} l2 9 M72 ${y} l9 2`} stroke={B} strokeWidth="3.5" fill="none" strokeLinecap="round" />)}</>,
  rive:      () => <><rect x="10" y="0" width="4" height="100" fill={B} /><rect x="106" y="0" width="4" height="100" fill={B} />{tirets(60, 12, 18)}</>,
  'rive-discontinue': () => <>{tirets(12, 6, 8)}{tirets(108, 6, 8)}{tirets(60, 12, 18)}</>,
  bau:       () => <><rect x="84" y="0" width="5" height="100" fill={B} /><rect x="89" y="0" width="31" height="100" fill="#64748b" />{tirets(46, 12, 18)}</>,
  bus:       () => <><rect x="76" y="0" width="7" height="100" fill={B} /><text x="100" y="58" textAnchor="middle" fontSize="15" fontWeight="900" fill={B} transform="rotate(-90 100 52)">BUS</text>{tirets(38, 12, 18)}</>,
  velo:      () => <><rect x="84" y="0" width="3" height="100" fill={B} /><g stroke={B} strokeWidth="3" fill="none"><circle cx="96" cy="58" r="6" /><circle cx="112" cy="58" r="6" /><path d="M96 58 L103 47 L112 58 M103 47 h6" /></g>{tirets(42, 12, 18)}</>,
  insertion: () => <>{tirets(76, 6, 5, 5)}{tirets(36, 12, 18)}</>,
  pieton:    () => [10, 26, 42, 58, 74, 90].map(x => <rect key={x} x={x} y="28" width="10" height="44" fill={B} rx="1" />),
  arret:     () => <><rect x="10" y="62" width="100" height="8" fill={B} /><text x="60" y="48" textAnchor="middle" fontSize="20" fontWeight="900" fill={B}>STOP</text></>,
  cedez:     () => <>{[12, 30, 48, 66, 84, 102].map(x => <rect key={x} x={x - 6} y="64" width="12" height="6" fill={B} />)}{[36, 84].map(x => <path key={x} d={`M${x - 11} 26 L${x + 11} 26 L${x} 50 Z`} fill="none" stroke={B} strokeWidth="3.5" strokeLinejoin="round" />)}</>,
  hachures:  () => <><path d="M30 0 L60 50 L90 0" stroke={B} strokeWidth="3" fill="none" /><path d="M30 100 L60 50 L90 100" stroke={B} strokeWidth="3" fill="none" />{[10, 26, 42].map(y => <path key={y} d={`M${42 + y * .25} ${y + 2} L${78 - y * .25} ${y + 14}`} stroke={B} strokeWidth="3.5" />)}{[58, 74, 90].map(y => <path key={y} d={`M${42 + (100 - y) * .25} ${y - 14} L${78 - (100 - y) * .25} ${y - 2}`} stroke={B} strokeWidth="3.5" />)}</>,
  zigzag:    () => <><path d="M96 2 L110 14 L96 26 L110 38 L96 50 L110 62 L96 74 L110 86 L96 98" stroke={J} strokeWidth="4" fill="none" strokeLinejoin="round" />{tirets(46, 12, 18)}</>,
  places:    () => <>{[14, 46, 78].map(x => <path key={x} d={`M${x} 92 V20 H${x + 28} V92`} stroke={B} strokeWidth="3.5" fill="none" />)}<text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="900" fill={B} opacity=".9">P</text></>,
  fleches:   () => <>{tirets(40, 12, 18)}{tirets(80, 12, 18)}<g stroke={B} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 82 V44 L12 52 M20 44 L28 52" /><path d="M60 82 V56 Q60 40 44 40 M44 40 l8 -7 M44 40 l8 7" /><path d="M100 82 V56 Q100 40 116 40 M116 40 l-8 -7 M116 40 l-8 7" /></g></>,
}

export default function MarquageSol({ type, taille = 72 }) {
  const dessin = DESSINS[type]
  return (
    <svg width={taille} height={taille} viewBox="0 0 120 100" role="img" aria-label={`Marquage au sol : ${type}`}
      style={{ borderRadius: 12, display: 'block', flexShrink: 0 }}>
      <rect width="120" height="100" fill="#475569" />
      {dessin ? dessin() : null}
    </svg>
  )
}
