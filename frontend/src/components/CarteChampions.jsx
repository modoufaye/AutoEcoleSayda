import { useEffect, useRef, useState } from 'react'

/* Annonce « 🏆 Les champions de la semaine » (PalmaresService) en carte mentale, à la manière
   d'une carte colorée : au centre la semaine, autour une séance par branche (cercle de couleur),
   au bout de chaque branche un cercle par champion, de la couleur de sa séance. Le texte publié
   sert de source : « • « Titre » : Awa Diop, Moussa Ba (9/10) ». */
export const TITRE_CHAMPIONS = '🏆 Les champions de la semaine'

// Couleurs vives et claires (une par séance), avec leur anneau plus foncé
const COULEURS = [
  ['#f0628a', '#d24a72'], ['#ffc43d', '#e0a51f'], ['#3fc9a8', '#2aa98b'], ['#44a3e3', '#2d86c4'],
  ['#fb9a3c', '#de7d22'], ['#9c7a8f', '#7e5f72'], ['#3fd3e0', '#25b2bf'], ['#4a7fd4', '#3263b3'],
]
const MAX_PAR_SEANCE = 3   // au-delà : « +N »

/** Lit le texte de l'annonce : période, séances (titre, score, champions), phrases d'avant et d'après. */
function lireChampions(contenu) {
  if (!contenu) return null
  const lignes = contenu.split('\n')
  const seances = []
  for (const l of lignes) {
    const m = l.match(/^•\s*«\s*(.+?)\s*»\s*:\s*(.+?)\s*\((\d+)\/(\d+)\)\s*$/)
    if (m) seances.push({ titre: m[1], noms: m[2].split(',').map(n => n.trim()).filter(Boolean), score: +m[3], total: +m[4] })
  }
  if (!seances.length) return null
  const periode = contenu.match(/du (\d{2}\/\d{2}) au (\d{2}\/\d{2})/)
  const fin = lignes.map(l => l.trim()).filter(l => l && !l.startsWith('•') && l !== '…').slice(-1)[0]
  return { seances, periode: periode ? `du ${periode[1]} au ${periode[2]}` : '', fin: fin && !fin.startsWith('Bravo') ? fin : '', tronque: contenu.includes('\n…') }
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

const initiales = nom => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]).join('').toUpperCase()

/* Grand écran : carte en étoile (SVG) */
function CarteEtoile({ data }) {
  const cx = 0, cy = 0, n = data.seances.length
  const RS = 68, RE = 46, D = 158                       // rayons séance / élève, distance séance → élève
  const anneau = { rx: 300, ry: 230 }
  // Séances sur une ellipse autour du centre ; leurs champions en éventail autour d'elles, vers l'extérieur
  const branches = data.seances.map((s, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n
    const sx = cx + anneau.rx * Math.cos(a), sy = cy + anneau.ry * Math.sin(a)
    const visibles = s.noms.slice(0, MAX_PAR_SEANCE), reste = s.noms.length - visibles.length
    const enfants = [...visibles.map(nom => ({ nom })), ...(reste > 0 ? [{ plus: reste }] : [])]
    const pas = 0.72                                      // écart angulaire entre deux champions
    return { s, i, sx, sy, enfants: enfants.map((e, k) => {
      const da = (k - (enfants.length - 1) / 2) * pas
      return { ...e, x: sx + D * Math.cos(a + da), y: sy + D * Math.sin(a + da) }
    }) }
  })
  // Cadre ajusté au dessin
  const xs = branches.flatMap(b => [b.sx - RS, b.sx + RS, ...b.enfants.flatMap(e => [e.x - RE, e.x + RE])]).concat([-120, 120])
  const ys = branches.flatMap(b => [b.sy - RS, b.sy + RS, ...b.enfants.flatMap(e => [e.y - RE, e.y + RE])]).concat([-120, 120])
  const m = 12, x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m
  const W = Math.max(...xs) + m - x0, H = Math.max(...ys) + m - y0
  return (
    <svg viewBox={`${x0} ${y0} ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label={`Champions de la semaine ${data.periode} : ${data.seances.map(s => `${s.titre}, ${s.noms.join(', ')}`).join(' ; ')}`}>
      {branches.map(({ s, i, sx, sy, enfants }) => {
        const [c, f] = COULEURS[i % COULEURS.length]
        return (
          <g key={i}>
            {/* tronc : centre → séance */}
            <line x1={cx} y1={cy} x2={sx} y2={sy} stroke={c} strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round" />
            {enfants.map((e, k) => {
              const ex = e.x, ey = e.y
              return (
                <g key={k}>
                  <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={c} strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" />
                  <circle cx={ex} cy={ey} r={RE} fill={c} />
                  {e.plus ? (
                    <text x={ex} y={ey + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">+{e.plus}</text>
                  ) : couper(e.nom, 11, 3).map((l, j, t) => (
                    <text key={j} x={ex} y={ey + 4 + (j - (t.length - 1) / 2) * 14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff"
                      style={{ letterSpacing: '.04em', textTransform: 'uppercase' }}>{l}</text>
                  ))}
                  <title>{e.nom || `${e.plus} autre(s) champion(s)`}</title>
                </g>
              )
            })}
            {/* séance */}
            <circle cx={sx} cy={sy} r={RS} fill={c} stroke={f} strokeWidth="5" />
            {couper(s.titre, 13, 3).map((l, j, t) => (
              <text key={j} x={sx} y={sy - 4 + (j - (t.length - 1) / 2) * 16} textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#fff"
                style={{ letterSpacing: '.04em', textTransform: 'uppercase' }}>{l}</text>
            ))}
            <text x={sx} y={sy + 22 + (couper(s.titre, 13, 3).length - 1) * 8} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" opacity=".95">
              {s.score}/{s.total}
            </text>
          </g>
        )
      })}
      {/* centre */}
      <circle cx={cx} cy={cy} r="112" fill="#fff" stroke="#1f2937" strokeWidth="6" />
      <text x={cx} y={cy - 30} textAnchor="middle" fontSize="30">🏆</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="19" fontWeight="800" fill="#1f2937" style={{ letterSpacing: '.06em' }}>CHAMPIONS</text>
      <text x={cx} y={cy + 31} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937" style={{ letterSpacing: '.06em' }}>DE LA SEMAINE</text>
      {data.periode && <text x={cx} y={cy + 56} textAnchor="middle" fontSize="13" fill="#64748b">{data.periode}</text>}
    </svg>
  )
}

/* Téléphone : la même carte, déroulée en colonne (une branche par séance) */
function CarteColonne({ data }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center text-center bg-white" style={{ border: '5px solid #1f2937' }}>
        <div className="text-2xl leading-none">🏆</div>
        <div className="text-sm font-extrabold tracking-wider mt-1" style={{ color: '#1f2937' }}>CHAMPIONS</div>
        <div className="text-[11px] font-bold tracking-wider" style={{ color: '#1f2937' }}>DE LA SEMAINE</div>
        {data.periode && <div className="text-[10px] text-slate-500 mt-0.5">{data.periode}</div>}
      </div>
      <div className="w-full flex flex-col">
        {data.seances.map((s, i) => {
          const [c, f] = COULEURS[i % COULEURS.length]
          return (
            <div key={i} className="flex flex-col items-center">
              <div className="h-6" style={{ borderLeft: `3px dotted ${c}` }} />
              <div className="w-full flex items-center gap-3 rounded-full ps-1.5 pe-4 py-1.5" style={{ background: c, boxShadow: `inset 0 0 0 3px ${f}` }}>
                <span className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black bg-white" style={{ color: f }}>{s.score}/{s.total}</span>
                <span className="text-xs font-extrabold uppercase tracking-wide text-white leading-tight">{s.titre}</span>
              </div>
              <div className="w-full flex flex-wrap justify-center gap-3 pt-3 ps-2" style={{ borderLeft: `3px dotted ${c}`, marginLeft: 0 }}>
                {s.noms.map(nom => (
                  <div key={nom} className="flex flex-col items-center w-20 text-center">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ background: c }}>{initiales(nom)}</span>
                    <span className="text-[11px] font-bold text-slate-700 mt-1 leading-tight">{nom}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
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
      <div className="text-sm text-slate-700">Bravo aux meilleurs scores aux quiz des séances{data.periode ? `, ${data.periode}` : ''} !</div>
      <div className="mt-2 rounded-2xl p-2 sm:p-4" style={{ background: '#fbfcfe', border: '1px solid #eef2f7' }}>
        {large ? <CarteEtoile data={data} /> : <CarteColonne data={data} />}
      </div>
      {data.tronque && <div className="text-[11px] text-slate-400 mt-1">D'autres séances ont aussi leurs champions.</div>}
      {data.fin && <div className="text-sm text-slate-700 mt-2">{data.fin}</div>}
    </div>
  )
}
