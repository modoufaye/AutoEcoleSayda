import { useEffect, useState } from 'react'
import { api } from '../api'
import { useBureaux, EN_LIGNE } from '../bureaux'
import { EnteteListe } from './ListeModerne'
import SelecteurAnnee from './SelecteurAnnee'
import SuiviPedagogique from './SuiviPedagogique'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

const ENCRE = '#1e3a5f'
const pourcent = (n, t) => (t ? Math.round(100 * n / t) : 0)
const eleves = n => `${n} élève${n > 1 ? 's' : ''}`

/* Anneau fin : une part par lieu, séparées par un petit espace, tracées au chargement. Le lieu
   actif (survol, toucher) s'épaissit, les autres s'effacent, et le centre donne son détail. */
function Anneau({ lieux, total, actif, setActif, couleur, libelle, sousTotal }) {
  const [trace, setTrace] = useState(false)
  useEffect(() => { const t = setTimeout(() => setTrace(true), 60); return () => clearTimeout(t) }, [])
  const r = 80, C = 2 * Math.PI * r, ecart = lieux.length > 1 ? 3 : 0
  // Début de chaque part : longueur cumulée des parts précédentes
  const debuts = lieux.map((_, i) => C * lieux.slice(0, i).reduce((t, l) => t + l.nombre, 0) / total)
  const parts = lieux.map(({ lieu, nombre }, i) => {
    const long = C * nombre / total, debut = debuts[i]
    const visible = Math.max(long - ecart, 0.5)
    const estActif = actif === lieu
    return (
      <circle key={lieu} cx="100" cy="100" r={r} fill="none" stroke={couleur(lieu)}
        strokeWidth={estActif ? 26 : 20}
        strokeDasharray={`${trace ? visible : 0} ${C}`} strokeDashoffset={-debut}
        style={{ transition: 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1), stroke-width .2s, opacity .2s', opacity: actif && !estActif ? 0.28 : 1, cursor: 'pointer' }}
        onPointerEnter={e => e.pointerType === 'mouse' && setActif(lieu)}
        onPointerLeave={e => e.pointerType === 'mouse' && setActif(null)}
        onClick={() => setActif(a => (a === lieu ? null : lieu))}>
        <title>{`${libelle(lieu)} : ${eleves(nombre)} (${pourcent(nombre, total)} %)`}</title>
      </circle>
    )
  })
  const choisi = lieux.find(l => l.lieu === actif)
  return (
    <div className="relative flex-shrink-0 w-full select-none max-w-[190px] sm:max-w-[230px]">
      <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label="Élèves par lieu d'inscription">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#eef2f7" strokeWidth="20" />
        <g transform="rotate(-90 100 100)">{parts}</g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-10" aria-live="polite">
        {choisi ? (
          <>
            <div className="font-black leading-none" style={{ fontSize: 34, color: ENCRE }}>{pourcent(choisi.nombre, total)}<span style={{ fontSize: 18 }}> %</span></div>
            <div className="text-xs font-bold text-slate-700 mt-1 leading-tight">{libelle(choisi.lieu)}</div>
            <div className="text-[11px] text-slate-500">{eleves(choisi.nombre)}</div>
          </>
        ) : (
          <>
            <div className="font-black leading-none" style={{ fontSize: 40, color: ENCRE }}>{total}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">{total > 1 ? 'élèves' : 'élève'}</div>
            <div className="text-[11px] text-slate-400">{sousTotal}</div>
          </>
        )}
      </div>
    </div>
  )
}

/* Évolution d'un lieu par rapport à l'année précédente : ▲ +12, ▼ −3, « nouveau », « = ». */
function Evolution({ maintenant, avant, reference }) {
  if (avant == null) return null
  const diff = maintenant - avant
  const [fond, texte, icone, mot] = avant === 0 && maintenant > 0
    ? ['#eef2ff', '#4338ca', 'stars', 'nouveau']
    : diff > 0 ? ['#ecfdf5', '#047857', 'caret-up-fill', `+${diff}`]
    : diff < 0 ? ['#fef2f2', '#b91c1c', 'caret-down-fill', `−${-diff}`]
    : ['#f1f5f9', '#475569', 'dash', '=']
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap"
      style={{ background: fond, color: texte }} title={`${avant} élève(s) ${reference}`}>
      <i className={`bi bi-${icone}`} />{mot}
    </span>
  )
}

/* Tableau de bord (admin, secrétariat) : élèves par lieu d'inscription — phrase-clé, anneau et
   classement des lieux avec leur évolution sur un an — et, à côté, le suivi pédagogique. */
export default function RepartitionLocalites() {
  const bureaux = useBureaux()
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState(String(anneeCourante))
  const [d, setD] = useState(null)
  const [avant, setAvant] = useState(null)   // même données, année précédente (comparaison)
  const [actif, setActif] = useState(null)
  useEffect(() => {
    let vivant = true
    api('GET', `/dashboard/localites${annee ? `?annee=${annee}` : ''}`).then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
    const prec = annee ? api('GET', `/dashboard/localites?annee=${Number(annee) - 1}`) : Promise.resolve(null)
    prec.then(x => { if (vivant) setAvant(x) }).catch(() => { if (vivant) setAvant(null) })
    return () => { vivant = false }
  }, [annee])
  if (!d) return null

  const periode = annee ? `inscrits en ${annee}` : 'inscrits depuis le début'
  const choixAnnee = (
    <SelecteurAnnee annees={[String(anneeCourante), ...d.annees.map(String)]} valeur={annee}
      onChange={a => { setAnnee(a); setActif(null) }} avecToutes />
  )

  // Comparaison avec l'année précédente, seulement si elle a des inscrits
  const comparer = annee && avant && avant.total > 0
  const prec = Number(annee) - 1
  const enCours = Number(annee) === anneeCourante
  const reference = enCours ? `sur toute l'année ${prec}` : `en ${prec}`
  const avantDe = lieu => (comparer ? (avant.lieux.find(l => l.lieu === lieu)?.nombre ?? 0) : null)
  const premier = d.lieux[0]
  const progression = comparer
    ? [...d.lieux].map(l => ({ ...l, diff: l.nombre - avantDe(l.lieu) })).sort((a, b) => b.diff - a.diff)[0]
    : null
  const variation = comparer ? Math.round(100 * (d.total - avant.total) / avant.total) : null
  const max = Math.max(1, ...d.lieux.map(l => l.nombre))

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="geo-alt-fill" titre="Élèves par lieu d'inscription" sousTitre={`${eleves(d.total)} ${periode}`} />
        {/* Choix de l'année sous le bandeau : dans le bandeau, il chevauchait le titre sur téléphone */}
        <div className="flex justify-end px-5 pt-4">{choixAnnee}</div>
        {d.total === 0 ? (
          <div className="text-center text-sm text-slate-400 py-10">Aucun élève {periode}</div>
        ) : (
          <div className="px-5 pb-5 pt-3">
            {/* Phrase-clé : ce qu'il faut retenir en un coup d'œil */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
              style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f0bb2a', color: ENCRE }}>
                  <i className="bi bi-trophy-fill" />
                </span>
                <div className="text-sm text-slate-700 leading-snug">
                  <b style={{ color: ENCRE }}>{bureaux.libelle(premier.lieu)}</b> arrive en tête avec <b style={{ color: ENCRE }}>{eleves(premier.nombre)}</b>,
                  {' '}soit <b style={{ color: ENCRE }}>{pourcent(premier.nombre, d.total)} %</b> des inscrits.
                </div>
              </div>
              {comparer && (
                <div className="flex flex-wrap gap-2 sm:ms-auto">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white" style={{ color: ENCRE, border: '1px solid #fde68a' }}>
                    {enCours
                      ? <><i className="bi bi-calendar-check me-1" />{d.total} depuis janvier · {avant.total} sur toute l'année {prec}</>
                      : <><i className={`bi bi-graph-${variation >= 0 ? 'up' : 'down'}-arrow me-1`} />{variation >= 0 ? '+' : '−'}{Math.abs(variation)} % par rapport à {prec}</>}
                  </span>
                  {progression && progression.diff > 0 && progression.lieu !== premier.lieu && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white" style={{ color: '#047857', border: '1px solid #a7f3d0' }}>
                      <i className="bi bi-rocket-takeoff me-1" />Plus forte hausse : {bureaux.libelle(progression.lieu)} (+{progression.diff})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Anneau lieux={d.lieux} total={d.total} actif={actif} setActif={setActif}
                couleur={bureaux.couleur} libelle={bureaux.libelle} sousTotal={annee ? `en ${annee}` : 'au total'} />
              {/* Classement des lieux : rang, part, nombre et évolution sur un an */}
              <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
                {d.lieux.map(({ lieu, nombre }, i) => {
                  const estActif = actif === lieu
                  return (
                    <button key={lieu} type="button"
                      onPointerEnter={e => e.pointerType === 'mouse' && setActif(lieu)}
                      onPointerLeave={e => e.pointerType === 'mouse' && setActif(null)}
                      onClick={() => setActif(a => (a === lieu ? null : lieu))}
                      className="w-full text-left px-3 py-2.5 border-0 cursor-pointer"
                      style={{ borderRadius: 14, background: estActif ? '#f1f5f9' : '#f8fafc', boxShadow: estActif ? `inset 3px 0 0 ${bureaux.couleur(lieu)}` : 'none',
                        opacity: actif && !estActif ? 0.55 : 1, transition: 'all .2s' }}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                          style={i === 0 ? { background: '#f0bb2a', color: ENCRE } : { background: '#e2e8f0', color: '#475569' }}>{i + 1}</span>
                        <i className={`bi bi-${lieu === EN_LIGNE ? 'globe2' : 'building'} flex-shrink-0`} style={{ color: bureaux.couleur(lieu) }} />
                        <span className="flex-1 min-w-0 font-bold text-sm text-slate-800 leading-tight line-clamp-2" title={bureaux.libelle(lieu)}>{bureaux.libelle(lieu)}</span>
                        <span className="text-base font-black whitespace-nowrap" style={{ color: ENCRE }}>{pourcent(nombre, d.total)} %</span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1.5 ps-[34px]">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                          <div className="h-full rounded-full" style={{ width: `${100 * nombre / max}%`, background: bureaux.couleur(lieu), transition: 'width .8s' }} />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{eleves(nombre)}</span>
                        <Evolution maintenant={nombre} avant={avantDe(lieu)} reference={reference} />
                      </div>
                    </button>
                  )
                })}
                {comparer && <div className="text-[11px] text-slate-400 mt-0.5"><i className="bi bi-info-circle me-1" />Évolution {enCours ? `comparée à toute l'année ${prec}` : `par rapport à ${prec}`}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suivi pédagogique (à la place des quartiers), pleine largeur sous les lieux */}
      <SuiviPedagogique />
    </div>
  )
}
