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
  // Téléphone : le détail reste affiché après le toucher ; il se ferme quand on touche ailleurs
  useEffect(() => {
    if (survol == null) return
    const fermer = ev => { if (!boite.current?.contains(ev.target)) setSurvol(null) }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [survol])
  if (!d) return null

  const maintenant = new Date()
  // Années proposées, de la plus ancienne à la plus récente (l'année en cours toujours présente)
  const annees = [...new Set([String(maintenant.getFullYear()), ...d.annees.map(String)])].sort()
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
        {/* Année : ‹ 2026 › — les flèches passent à l'année précédente ou suivante qui a des inscrits */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full" role="group" aria-label="Année"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
          {[[-1, 'chevron-left', 'Année précédente'], [1, 'chevron-right', 'Année suivante']].map(([sens, icone, libelle], k) => {
            const cible = annees[annees.indexOf(annee) + sens]
            const bouton = (
              <button key={icone} type="button" disabled={!cible} aria-label={libelle} title={cible ? `${libelle} : ${cible}` : libelle}
                onClick={() => { setAnnee(cible); setSurvol(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center border-0 transition-colors"
                style={{ borderRadius: 999, padding: 0, background: cible ? 'rgba(255,255,255,.14)' : 'transparent', color: cible ? '#fff' : 'rgba(255,255,255,.3)', cursor: cible ? 'pointer' : 'default' }}>
                <i className={`bi bi-${icone}`} style={{ fontSize: '.8rem' }} />
              </button>
            )
            return k === 0 ? [bouton, (
              <span key="annee" className="px-3 text-sm font-black tabular-nums" style={{ color: '#f0bb2a', letterSpacing: '.04em' }} aria-live="polite">
                <i className="bi bi-calendar3 me-1.5" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.75rem' }} />{annee}
              </span>
            )] : bouton
          })}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center text-sm text-slate-400 py-12">Aucun élève inscrit en {annee}</div>
      ) : <>
        {/* Pas de sélection de texte ni de menu à l'appui long (téléphone) */}
        <div ref={boite} className="relative px-3 sm:px-5 pt-2 select-none"
          style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
          onContextMenu={e => e.preventDefault()}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label={`Nouveaux élèves par mois en ${annee}`}
            onPointerLeave={e => { if (e.pointerType === 'mouse') setSurvol(null) }}>
            {graduations.map(v => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? '#e2e8f0' : '#f1f5f9'} />
                <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{v}</text>
              </g>
            ))}
            {/* Téléphone : un mois sur deux, en partant du dernier pour qu'il ne chevauche pas son voisin */}
            {points.map((p, i) => (etroit && (points.length - 1 - i) % 2) ? null : (
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
        {/* Chiffres de l'année : total en tête (sur toute la largeur au téléphone), puis moyenne,
            meilleur mois, permis et perfectionnement (avec leur part du total) */}
        <div className="px-5 pb-5 pt-3 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { v: total, l: `Inscrit${total > 1 ? 's' : ''} en ${annee}`, icone: 'people-fill', c: '#1e3a5f', fond: '#e8eef6', tete: true },
            { v: moyenne, l: 'Par mois en moyenne', sous: partiel >= 0 ? 'mois terminés' : null, icone: 'calendar3-range', c: '#0f766e', fond: '#e6f6f3' },
            { v: points[iMax].total, l: 'Meilleur mois', sous: maj(MOIS[points[iMax].mois - 1]), icone: 'trophy-fill', c: '#b7791f', fond: '#fdf3dc' },
            { v: total - perf, l: 'Permis', part: total ? Math.round(100 * (total - perf) / total) : 0, icone: 'card-heading', c: '#2a78d6', fond: '#e8f1fc' },
            { v: perf, l: 'Perfectionnement', part: total ? Math.round(100 * perf / total) : 0, icone: 'speedometer2', c: '#eb6834', fond: '#fdeee7' },
          ].map(t => (
            <div key={t.l} className={`relative overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2.5 ${t.tete ? 'col-span-2 lg:col-span-1' : ''}`}
              style={{ background: '#fff', border: '1px solid #eef2f7', boxShadow: '0 1px 4px rgba(15,34,64,.05)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.fond, color: t.c }}>
                  <i className={`bi bi-${t.icone}`} />
                </span>
                {t.part != null && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: t.fond, color: t.c }}>{t.part} %</span>
                )}
              </div>
              <div>
                <div className="text-2xl font-black leading-none tabular-nums" style={{ color: '#1e3a5f' }}>{t.v}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">{t.l}</div>
                {t.sous && <div className="text-[11px] font-bold mt-0.5" style={{ color: t.c }}>{t.sous}</div>}
              </div>
              {/* Part du total : petite jauge aux couleurs de la courbe */}
              {t.part != null && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eef2f7' }}>
                  <div className="h-full rounded-full" style={{ width: `${t.part}%`, background: t.c }} />
                </div>
              )}
            </div>
          ))}
        </div>
        {partiel >= 0 && <div className="px-5 pb-4 -mt-2 text-xs text-slate-400">{maj(MOIS[partiel])} est en pointillé : le mois n'est pas terminé.</div>}
      </>}
    </div>
  )
}
