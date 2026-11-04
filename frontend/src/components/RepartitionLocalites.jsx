import { useEffect, useState } from 'react'
import { api } from '../api'
import { LABELS } from '../utils'
import { EnteteListe } from './ListeModerne'

const COULEURS = { EN_LIGNE: '#d4a017', MAZALIK_JINAN: '#1e3a5f', GUEDIAWAYE: '#0ea5e9', KEUR_MASSAR: '#10b981' }
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

/* Anneau SVG : une part par lieu, pourcentage écrit dans les parts assez larges. */
function Anneau({ lieux, total }) {
  const R = 150, r0 = 92, c = 180
  // Angle de départ de chaque part : la somme des parts précédentes, depuis midi
  const debuts = lieux.map((_, i) => -Math.PI / 2 + 2 * Math.PI * lieux.slice(0, i).reduce((t, l) => t + l.nombre, 0) / total)
  const parts = lieux.map(({ lieu, nombre }, i) => {
    const ang = 2 * Math.PI * nombre / total, debut = debuts[i], a2 = debut + ang
    const pt = (rad, t) => [c + rad * Math.cos(t), c + rad * Math.sin(t)]
    const m = (debut + a2) / 2, pc = Math.round(100 * nombre / total)
    // Un seul lieu (100 %) : un arc de 360° ne se dessine pas, on trace deux cercles
    const d = nombre === total
      ? `M${c - R},${c} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0 M${c - r0},${c} a${r0},${r0} 0 1,1 ${2 * r0},0 a${r0},${r0} 0 1,1 ${-2 * r0},0`
      : (() => {
          const g = ang > Math.PI ? 1 : 0, [x1, y1] = pt(R, debut), [x2, y2] = pt(R, a2), [x3, y3] = pt(r0, a2), [x4, y4] = pt(r0, debut)
          return `M${x1},${y1} A${R},${R} 0 ${g} 1 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 ${g} 0 ${x4},${y4} Z`
        })()
    const [tx, ty] = pt((R + r0) / 2, m)
    return (
      <g key={lieu}>
        <path d={d} fill={COULEURS[lieu] || '#94a3b8'} fillRule="evenodd" stroke="#fff" strokeWidth="4" />
        {pc >= 5 && <text x={tx} y={ty + 6} textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff">{pc}%</text>}
      </g>
    )
  })
  return (
    <svg viewBox="0 0 360 360" className="w-full flex-shrink-0" style={{ maxWidth: 240 }} role="img" aria-label="Élèves par lieu d'inscription">
      {parts}
      <text x="180" y="176" textAnchor="middle" fontSize="44" fontWeight="900" fill="#1e3a5f">{total}</text>
      <text x="180" y="204" textAnchor="middle" fontSize="16" fill="#64748b">élève{total > 1 ? 's' : ''}</text>
    </svg>
  )
}

/* Tableau de bord (admin, secrétariat) : élèves par lieu d'inscription (anneau) et quartiers
   les plus représentés (barres ; les adresses comptent trop de quartiers pour un camembert). */
export default function RepartitionLocalites() {
  const [annee, setAnnee] = useState(String(new Date().getFullYear()))
  const [d, setD] = useState(null)
  useEffect(() => {
    api('GET', `/dashboard/localites${annee ? `?annee=${annee}` : ''}`).then(setD).catch(() => setD(null))
  }, [annee])
  if (!d) return null

  const periode = annee ? `inscrits en ${annee}` : 'inscrits depuis le début'
  const qmax = Math.max(1, ...d.quartiers.map(q => q.nombre))
  const choixAnnee = (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0">
      <i className="bi bi-calendar3" />Année
      <select value={annee} onChange={e => setAnnee(e.target.value)} aria-label="Année d'inscription"
        className="text-xs font-bold rounded-full px-3 py-1.5 outline-none cursor-pointer"
        style={{ width: 'auto', background: '#f8fafc', color: '#1e3a5f', border: '1.5px solid #e2e8f0' }}>
        {[...new Set([String(new Date().getFullYear()), ...d.annees.map(String)])].map(a => <option key={a} value={a}>{a}</option>)}
        <option value="">Toutes les années</option>
      </select>
    </label>
  )

  return (
    <div className="mt-3 grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="geo-alt-fill" titre="Élèves par lieu d'inscription" sousTitre={`${d.total} élève${d.total > 1 ? 's' : ''} ${periode}`} />
        {/* Choix de l'année sous le bandeau : dans le bandeau, il chevauchait le titre sur téléphone */}
        <div className="flex justify-end px-5 pt-4">{choixAnnee}</div>
        {d.total === 0 ? (
          <div className="text-center text-sm text-slate-400 py-10">Aucun élève {periode}</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-5 px-5 pb-5 pt-2">
            <Anneau lieux={d.lieux} total={d.total} />
            <div className="flex-1 min-w-0 w-full flex flex-col gap-2.5">
              {d.lieux.map(({ lieu, nombre }) => (
                <div key={lieu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc' }}>
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: COULEURS[lieu] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 truncate">{LABELS[lieu] || lieu}</div>
                    <div className="text-xs text-slate-500">{nombre} élève{nombre > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-lg font-black whitespace-nowrap" style={{ color: COULEURS[lieu] || '#64748b' }}>
                    {Math.round(100 * nombre / d.total)} %
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="houses-fill" titre="Quartiers les plus représentés" sousTitre="D'après l'adresse des élèves" />
        <div className="p-5 flex flex-col gap-2.5">
          {d.quartiers.length === 0 && <div className="text-center text-sm text-slate-400 py-6">Aucune adresse renseignée</div>}
          {d.quartiers.map(q => (
            <div key={q.nom} className="flex items-center gap-3">
              <span className="w-32 sm:w-36 text-sm font-bold text-slate-700 truncate" title={q.nom}>{q.nom}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#eef2f7' }}>
                <div className="h-full rounded-full" style={{ width: `${100 * q.nombre / qmax}%`, background: 'linear-gradient(90deg,#1e3a5f,#2a4f7c)', transition: 'width .6s' }} />
              </div>
              <span className="w-8 text-right text-sm font-extrabold" style={{ color: '#1e3a5f' }}>{q.nombre}</span>
            </div>
          ))}
          {(d.autresQuartiers > 0 || d.sansAdresse > 0) && (
            <div className="text-xs text-slate-500 mt-1">
              {d.autresQuartiers > 0 && <>+ {d.autresQuartiers} élève{d.autresQuartiers > 1 ? 's' : ''} dans {d.nbAutresQuartiers} autre{d.nbAutresQuartiers > 1 ? 's' : ''} quartier{d.nbAutresQuartiers > 1 ? 's' : ''}</>}
              {d.autresQuartiers > 0 && d.sansAdresse > 0 && ' · '}
              {d.sansAdresse > 0 && <>{d.sansAdresse} sans adresse</>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
