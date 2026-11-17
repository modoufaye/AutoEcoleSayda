import { useEffect, useRef, useState } from 'react'

/* Annonce « 🏆 Les champions de la semaine » (PalmaresService) en carte mentale, à la manière
   d'une carte colorée : au centre la semaine, autour une séance par branche (un cercle de couleur
   avec son titre en gras, puis ses 3 meilleurs élèves et leur score). Le texte publié
   sert de source : « • « Titre » : Awa Diop (10/10), Moussa Ba (9/10) » (un score par champion) ;
   les anciennes annonces « • « Titre » : Awa Diop, Moussa Ba (9/10) » (un score commun) restent lues. */
export const TITRE_CHAMPIONS = '🏆 Les champions de la semaine'

// Couleurs vives et claires (une par séance), avec leur anneau plus foncé
const COULEURS = [
  ['#f0628a', '#d24a72'], ['#ffc43d', '#e0a51f'], ['#3fc9a8', '#2aa98b'], ['#44a3e3', '#2d86c4'],
  ['#fb9a3c', '#de7d22'], ['#9c7a8f', '#7e5f72'], ['#3fd3e0', '#25b2bf'], ['#4a7fd4', '#3263b3'],
  ['#8bc34a', '#6fa232'], ['#e57373', '#c85a5a'], ['#ba68c8', '#9a4fa8'], ['#26a69a', '#1b8a7f'],
]

/** Lit le texte de l'annonce : période, séances (titre, score, champions), phrases d'avant et d'après. */
function lireChampions(contenu) {
  if (!contenu) return null
  const lignes = contenu.split('\n')
  const seances = []
  for (const l of lignes) {
    const m = l.match(/^•\s*«\s*(.+?)\s*»\s*:\s*(.+)$/)
    if (!m) continue
    const partie = m[2].trim()
    const avecScores = [...partie.matchAll(/([^,()]+?)\s*\((\d+)\/(\d+)\)/g)]
    let champions
    if (avecScores.length > 1 || (avecScores.length === 1 && !partie.slice(0, partie.indexOf('(')).includes(','))) {
      champions = avecScores.map(x => ({ nom: x[1].trim(), score: +x[2], total: +x[3] }))   // un score par champion
    } else if (avecScores.length === 1) {
      const commun = avecScores[0]                                                         // ancien format : score commun
      champions = partie.slice(0, partie.indexOf('(')).split(',').map(n => n.trim()).filter(Boolean).map(nom => ({ nom, score: +commun[2], total: +commun[3] }))
    } else continue
    if (champions.length) seances.push({ titre: m[1], champions, score: champions[0].score, total: champions[0].total, noms: champions.map(c => c.nom) })
  }
  if (!seances.length) return null
  const periode = contenu.match(/du (\d{2}\/\d{2}) au (\d{2}\/\d{2})/)
  const fin = lignes.map(l => l.trim()).filter(l => l && !l.startsWith('•') && l !== '…').slice(-1)[0]
  return { seances, series: /séries d'examen|annales/.test(lignes[0] || ''), periode: periode ? `du ${periode[1]} au ${periode[2]}` : '', fin: fin && !fin.startsWith('Bravo') ? fin : '', tronque: contenu.includes('\n…') }
}

/* Coupe un texte en lignes d'au plus n caractères (mots entiers), au plus max lignes. */
function couper(texte, n, max) {
  const mots = texte.split(/\s+/), lignes = []
  let cur = ''
  for (const m of mots) {
    if ((cur + ' ' + m).trim().length > n && cur) { lignes.push(cur); cur = m } else cur = (cur + ' ' + m).trim()
  }
  if (cur) lignes.push(cur)
  if (lignes.length > max) { lignes.length = max; lignes[max - 1] = lignes[max - 1].replace(/.{0,2}$/, '…') }
  return lignes
}

const MEDAILLES = ['🥇', '🥈', '🥉']
/* Nom raccourci pour tenir dans le cercle : « Ndeye Coumba Traoré » → « Ndeye C. Traoré » si trop long */
const nomCourt = (nom, n) => {
  if (nom.length <= n) return nom
  const m = nom.split(/\s+/)
  const court = m.length > 2 ? `${m[0]} ${m.slice(1, -1).map(x => x[0] + '.').join(' ')} ${m[m.length - 1]}` : nom
  return court.length <= n ? court : court.slice(0, n - 1) + '…'
}

/* Grand écran : carte en étoile (SVG). Une séance = un cercle : titre en gras, puis ses 3 meilleurs. */
function CarteEtoile({ data }) {
  const n = data.seances.length
  const R = 122, RC = 112, ECART = 22                      // rayons : séance, centre ; écart minimal entre deux séances
  const [survol, setSurvol] = useState(null)
  // Séances sur un cercle autour du centre : même distance entre deux voisines. Le rayon grandit
  // avec leur nombre pour garder au moins ECART entre deux cercles, et une branche visible.
  const base = Math.max(RC + R + 56, n > 1 ? (2 * R + ECART) / (2 * Math.sin(Math.PI / n)) : 0)
  const pos = data.seances.map((_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [base * Math.cos(a), base * Math.sin(a)]
  })
  const xs = pos.flatMap(([x]) => [x - R, x + R]).concat([-RC, RC]), ys = pos.flatMap(([, y]) => [y - R, y + R]).concat([-RC, RC])
  const m = 30, x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m   // marge : place pour l'agrandissement au survol
  const W = Math.max(...xs) + m - x0, H = Math.max(...ys) + m - y0
  // Le cercle survolé est dessiné en dernier : il passe devant ses voisins
  const ordre = data.seances.map((_, i) => i).sort((a, b) => (a === survol) - (b === survol))
  return (
    <svg viewBox={`${x0} ${y0} ${W} ${H}`} className="block w-full h-auto mx-auto" style={{ maxWidth: W }} role="img"
      aria-label={`Champions de la semaine ${data.periode} : ${data.seances.map(s => `${s.titre}, ${s.champions.map(c => `${c.nom} ${c.score}/${c.total}`).join(', ')}`).join(' ; ')}`}>
      {/* branches pointillées : centre → séance */}
      {pos.map(([x, y], i) => (
        <line key={i} x1={0} y1={0} x2={x} y2={y} stroke={COULEURS[i % COULEURS.length][0]} strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round" />
      ))}
      {/* centre */}
      <circle cx={0} cy={0} r={RC} fill="#fff" stroke="#1f2937" strokeWidth="6" />
      <text x={0} y={-30} textAnchor="middle" fontSize="30">🏆</text>
      <text x={0} y={8} textAnchor="middle" fontSize="19" fontWeight="800" fill="#1f2937" style={{ letterSpacing: '.06em' }}>CHAMPIONS</text>
      <text x={0} y={31} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937" style={{ letterSpacing: '.06em' }}>DE LA SEMAINE</text>
      {data.periode && <text x={0} y={56} textAnchor="middle" fontSize="13" fill="#64748b">{data.periode}</text>}
      {ordre.map(i => {
        const s = data.seances[i]
        const [c, f] = COULEURS[i % COULEURS.length]
        const [x, y] = pos[i]
        const titre = couper(s.titre, 18, 2)
        const champions = s.champions.slice(0, 3)
        // Bloc centré verticalement : titre (2 lignes max), trait, puis un champion par ligne
        const hauteur = titre.length * 17 + 12 + champions.length * 19
        const haut = y - hauteur / 2
        // Survol : le cercle glisse vers le centre (sans le recouvrir) et grossit
        const d = Math.hypot(x, y) || 1, recul = Math.min(40, Math.max(0, d - (RC + R * 1.15) - 6))
        const actif = survol === i
        return (
          <g key={i} onMouseEnter={() => setSurvol(i)} onMouseLeave={() => setSurvol(v => (v === i ? null : v))}
            style={{ cursor: 'default', transformBox: 'view-box', transformOrigin: `${x}px ${y}px`,
              transform: actif ? `translate(${(-x / d) * recul}px, ${(-y / d) * recul}px) scale(1.15)` : 'none',
              transition: 'transform .35s cubic-bezier(.2,.8,.2,1)', filter: actif ? 'drop-shadow(0 10px 18px rgba(15,34,64,.28))' : 'none' }}>
            <circle cx={x} cy={y} r={R} fill={c} stroke={f} strokeWidth="5" />
            {titre.map((l, j) => (
              <text key={j} x={x} y={haut + 13 + j * 17} textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff"
                style={{ letterSpacing: '.03em', textTransform: 'uppercase' }}>{l}</text>
            ))}
            <line x1={x - 50} x2={x + 50} y1={haut + titre.length * 17 + 3} y2={haut + titre.length * 17 + 3} stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
            {champions.map((ch, k) => (
              <text key={k} x={x} y={haut + titre.length * 17 + 12 + 14 + k * 19} textAnchor="middle" fontSize="12.5" fill="#fff">
                <tspan>{MEDAILLES[k]} </tspan>
                <tspan fontWeight="700">{nomCourt(ch.nom, 24)}</tspan>
                <tspan fontWeight="800" opacity=".9"> {ch.score}/{ch.total}</tspan>
              </text>
            ))}
            <title>{`${s.titre} : ${s.champions.map(ch => `${ch.nom} (${ch.score}/${ch.total})`).join(', ')}`}</title>
          </g>
        )
      })}
    </svg>
  )
}

/* Téléphone : la même carte en colonne ; une séance = une pastille ronde, titre en gras puis ses 3 meilleurs */
function CarteColonne({ data }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center text-center bg-white" style={{ border: '5px solid #1f2937' }}>
        <div className="text-2xl leading-none">🏆</div>
        <div className="text-sm font-extrabold tracking-wider mt-1" style={{ color: '#1f2937' }}>CHAMPIONS</div>
        <div className="text-[11px] font-bold tracking-wider" style={{ color: '#1f2937' }}>DE LA SEMAINE</div>
        {data.periode && <div className="text-[10px] text-slate-500 mt-0.5">{data.periode}</div>}
      </div>
      {data.seances.map((s, i) => {
        const [c, f] = COULEURS[i % COULEURS.length]
        return (
          <div key={i} className="flex flex-col items-center w-full">
            <div className="h-6" style={{ borderLeft: `3px dotted ${c}` }} />
            <div className="w-full px-3 py-3 text-center text-white" style={{ background: c, borderRadius: 24, boxShadow: `inset 0 0 0 4px ${f}` }}>
              <div className="text-sm font-black uppercase tracking-wide leading-tight">{s.titre}</div>
              <div className="mx-auto my-2 w-16" style={{ borderTop: '1.5px solid rgba(255,255,255,.55)' }} />
              <div className="flex flex-col gap-0.5">
                {s.champions.slice(0, 3).map((ch, k) => (
                  <div key={k} className="flex items-baseline gap-1.5 text-[13px] leading-snug text-left">
                    <span className="flex-shrink-0">{MEDAILLES[k]}</span>
                    <b className="flex-1 min-w-0 break-words">{ch.nom}</b>
                    <span className="font-extrabold opacity-90 whitespace-nowrap">{ch.score}/{ch.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CarteChampions({ contenu }) {
  const data = lireChampions(contenu)
  const boite = useRef(null)
  const [large, setLarge] = useState(true)
  useEffect(() => {
    const el = boite.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLarge(e.contentRect.width >= 560))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  if (!data) return <div className="text-sm text-slate-700 mt-1" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{contenu}</div>
  return (
    <div ref={boite} className="mt-2">
      <div className="text-sm text-slate-700">Bravo aux meilleurs scores aux quiz des séances{data.series ? ", aux séries d'examen et aux annales" : ''}{data.periode ? `, ${data.periode}` : ''} !</div>
      {/* Téléphone : la carte s'étend sous l'icône de l'annonce (3 rem) pour laisser la place aux noms */}
      <div className={`mt-2 rounded-2xl ${large ? 'p-4' : 'p-1.5 -ms-12'}`} style={{ background: '#fbfcfe', border: '1px solid #eef2f7' }}>
        {large ? <CarteEtoile data={data} /> : <CarteColonne data={data} />}
      </div>
      {data.tronque && <div className="text-[11px] text-slate-400 mt-1">D'autres séances ont aussi leurs champions.</div>}
      {data.fin && <div className="text-sm text-slate-700 mt-2">{data.fin}</div>}
    </div>
  )
}
