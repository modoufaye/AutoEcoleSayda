import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { EnteteListe } from './ListeModerne'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const COURT = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
const SERIES = [
  { cle: 'total', nom: 'Total', couleur: '#1e3a5f', ep: 3 },
  { cle: 'permis', nom: 'Permis', couleur: '#2a78d6', ep: 2 },
  { cle: 'perfectionnement', nom: 'Perfectionnement', couleur: '#eb6834', ep: 2 },
]
const maj = s => s[0].toUpperCase() + s.slice(1)

/* Tableau de bord (admin, secrétariat) : courbe des nouveaux élèves par mois d'une année,
   total, permis et perfectionnement (date d'inscription, archivés compris). L'année en cours
   s'arrête au mois actuel, tracé en pointillé tant qu'il n'est pas fini. */
export default function InscriptionsParMois() {
  const [annee, setAnnee] = useState(String(new Date().getFullYear()))
  const [d, setD] = useState(null)
  const [survol, setSurvol] = useState(null)
  const [W, setW] = useState(800)
  const boite = useRef(null)
  useEffect(() => {
    api('GET', `/dashboard/inscriptions?annee=${annee}`).then(setD).catch(() => setD(null))
  }, [annee])
  useEffect(() => {
    const el = boite.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [d])
  if (!d) return null

  const maintenant = new Date()
  const enCours = Number(annee) === maintenant.getFullYear()
  const nbMois = enCours ? maintenant.getMonth() + 1 : 12          // l'année en cours s'arrête à ce mois
  const points = d.mois.slice(0, nbMois).map(m => ({ ...m, total: m.permis + m.perfectionnement }))
  const partiel = enCours ? nbMois - 1 : -1                          // mois pas encore terminé
  const total = points.reduce((s, p) => s + p.total, 0)
  const perf = points.reduce((s, p) => s + p.perfectionnement, 0)
  const complets = points.filter((_, i) => i !== partiel)
  const moyenne = complets.length ? Math.round(complets.reduce((s, p) => s + p.total, 0) / complets.length) : 0
  const iMax = points.reduce((b, p, i) => (p.total > points[b].total ? i : b), 0)

  const etroit = W < 560, H = etroit ? 260 : 320
  const M = { t: 24, r: etroit ? 12 : 20, b: 28, l: 34 }
  const brut = Math.max(10, ...points.map(p => p.total))
  const pas = brut <= 20 ? 5 : brut <= 50 ? 10 : brut <= 120 ? 20 : 50
  const yMax = Math.ceil(brut / pas) * pas
  const x = i => M.l + (points.length > 1 ? (i * (W - M.l - M.r)) / (points.length - 1) : (W - M.l - M.r) / 2)
  const y = v => M.t + (1 - v / yMax) * (H - M.t - M.b)
  const trace = (cle, de, a) => points.slice(de, a).map((p, k) => `${k ? 'L' : 'M'}${x(de + k).toFixed(1)},${y(p[cle]).toFixed(1)}`).join('')
  const graduations = Array.from({ length: yMax / pas + 1 }, (_, k) => k * pas)

  const choisir = ev => {
    const r = ev.currentTarget.ownerSVGElement.getBoundingClientRect()
    const px = (ev.clientX - r.left) * (W / r.width)
    const i = points.length > 1 ? Math.round(((px - M.l) / (W - M.l - M.r)) * (points.length - 1)) : 0
    setSurvol(Math.max(0, Math.min(points.length - 1, i)))
  }
  const s = survol != null ? points[survol] : null
  const tipGauche = s ? (x(survol) > W * 0.6 ? x(survol) - 172 : x(survol) + 12) : 0

  return (
    <div className="mt-3 bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="graph-up" titre="Nouveaux élèves par mois" sousTitre={`${total} élève${total > 1 ? 's' : ''} inscrit${total > 1 ? 's' : ''} en ${annee}`} />
      <div className="px-5 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          {SERIES.map(sr => (
            <span key={sr.cle} className="inline-flex items-center gap-1.5">
              <span className="inline-block rounded-full" style={{ width: 18, height: sr.ep + 1, background: sr.couleur }} />{sr.nom}
            </span>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0">
          <i className="bi bi-calendar3" />Année
          <select value={annee} onChange={e => { setAnnee(e.target.value); setSurvol(null) }} aria-label="Année d'inscription"
            className="text-xs font-bold rounded-full px-3 py-1.5 outline-none cursor-pointer"
            style={{ width: 'auto', background: '#f8fafc', color: '#1e3a5f', border: '1.5px solid #e2e8f0' }}>
            {[...new Set([String(maintenant.getFullYear()), ...d.annees.map(String)])].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      {total === 0 ? (
        <div className="text-center text-sm text-slate-400 py-12">Aucun élève inscrit en {annee}</div>
      ) : <>
        <div ref={boite} className="relative px-3 sm:px-5 pt-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label={`Nouveaux élèves par mois en ${annee}`}
            onPointerLeave={() => setSurvol(null)}>
            {graduations.map(v => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? '#e2e8f0' : '#f1f5f9'} />
                <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{v}</text>
              </g>
            ))}
            {points.map((p, i) => (etroit && i % 2 && i !== points.length - 1) ? null : (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">{COURT[p.mois - 1]}</text>
            ))}
            {s && <line x1={x(survol)} x2={x(survol)} y1={M.t} y2={H - M.b} stroke="#94a3b8" strokeDasharray="3 3" />}
            {[...SERIES].reverse().map(sr => (
              <g key={sr.cle}>
                <path d={trace(sr.cle, 0, partiel >= 0 ? partiel : points.length)} fill="none" stroke={sr.couleur} strokeWidth={sr.ep} strokeLinejoin="round" strokeLinecap="round" />
                {partiel > 0 && <path d={trace(sr.cle, partiel - 1, partiel + 1)} fill="none" stroke={sr.couleur} strokeWidth={sr.ep} strokeDasharray="4 4" strokeLinecap="round" />}
                {points.length === 1 && <circle cx={x(0)} cy={y(points[0][sr.cle])} r="4" fill={sr.couleur} />}
              </g>
            ))}
            {points.length > 1 && <>
              <circle cx={x(iMax)} cy={y(points[iMax].total)} r="5" fill="#1e3a5f" stroke="#fff" strokeWidth="2" />
              <text x={Math.min(Math.max(x(iMax), M.l + 40), W - M.r - 40)} y={y(points[iMax].total) - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e3a5f">
                {points[iMax].total} en {MOIS[points[iMax].mois - 1]}
              </text>
            </>}
            {s && SERIES.map(sr => <circle key={sr.cle} cx={x(survol)} cy={y(s[sr.cle])} r="5" fill={sr.couleur} stroke="#fff" strokeWidth="2" />)}
            <rect x={M.l - 10} y={M.t} width={W - M.l - M.r + 20} height={H - M.t - M.b} fill="transparent"
              onPointerMove={choisir} onPointerDown={choisir} />
          </svg>
          {s && (
            <div className="absolute pointer-events-none bg-white rounded-xl px-3 py-2 text-xs"
              style={{ top: 8, left: `calc(${(100 * tipGauche) / W}% + 12px)`, width: 160, border: '1px solid #e2e8f0', boxShadow: '0 6px 20px rgba(15,34,64,.12)' }}>
              <div className="font-extrabold text-[#1e3a5f] mb-1">{maj(MOIS[s.mois - 1])} {annee}{survol === partiel ? ' (en cours)' : ''}</div>
              {SERIES.map(sr => (
                <div key={sr.cle} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: sr.couleur }} />{sr.nom}</span>
                  <b className="text-slate-800">{s[sr.cle]}</b>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            [total, `inscrit${total > 1 ? 's' : ''} en ${annee}`],
            [moyenne, `par mois en moyenne${partiel >= 0 ? ' (mois finis)' : ''}`],
            [points[iMax].total, `en ${MOIS[points[iMax].mois - 1]}, meilleur mois`],
            [perf, 'en perfectionnement'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl px-3 py-2.5" style={{ background: '#f8fafc' }}>
              <div className="text-xl font-black text-[#1e3a5f]">{v}</div>
              <div className="text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </div>
        {partiel >= 0 && <div className="px-5 pb-4 -mt-2 text-xs text-slate-400">{maj(MOIS[partiel])} est en pointillé : le mois n'est pas terminé.</div>}
      </>}
    </div>
  )
}
