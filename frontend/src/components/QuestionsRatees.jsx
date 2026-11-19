import { useEffect, useState } from 'react'
import { api } from '../api'
import { EnteteListe } from './ListeModerne'
import { SERIES } from '../contenu/seriesExamen'
import { ANNALES } from '../contenu/annales'
import { Question } from './SeriesExamen'

const PAR_ID = Object.fromEntries([...SERIES, ...ANNALES].map(s => [s.id, s]))
/* Lettres cochées → texte des réponses (« Je repars après avoir laissé passer B », « Je peux stationner : non ») */
function enClair(q, lettres) {
  if (!lettres || lettres === '—') return ['Pas de réponse']
  return lettres.split(' ').map(l => {
    for (const b of q.blocs) {
      const c = b.choix.find(([x]) => x === l)
      if (!c) continue
      const t = c[1], ouiNon = t === 'OUI' || t === 'NON'
      if (ouiNon) return `${b.intro || q.enonce} : ${t.toLowerCase()}`
      return `${b.intro ? `${b.intro} ` : ''}${t}`
    }
    return l
  }).map((t, k) => `${lettres.split(' ')[k]} · ${t}`)
}

/* Une question de série ou d'annale ratée : énoncé, bonne réponse et réponses données, en clair */
function QuestionSerie({ x, rang, ouverte, onBasculer }) {
  const serie = PAR_ID[x.serie], q = serie?.questions[x.numero - 1]
  if (!q) return null
  const taux = pc(x.rates, x.base)
  return (
    <li className="rounded-xl px-3 py-2.5" style={{ background: '#f8fafc' }}>
      <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5" style={{ background: '#fee2e2', color: '#b91c1c' }}>{rang}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{serie.titre} · question {x.numero}</div>
        <div className="text-sm font-bold" style={{ color: ENCRE }}>{q.enonce}</div>
        <div className="text-xs mt-1 flex flex-col gap-0.5">
          <span style={{ color: '#15803d' }}><i className="bi bi-check-circle-fill me-1" />{enClair(q, q.bonnes.join(' ')).join(' ; ')}</span>
          {x.mauvaises.map(m => (
            <span key={m.reponse} style={{ color: '#b91c1c' }}>
              <i className="bi bi-x-circle-fill me-1" />{enClair(q, m.reponse).join(' ; ')}<span className="text-slate-400"> · {m.fois} fois</span>
            </span>
          ))}
        </div>
        <button type="button" onClick={onBasculer} className="mt-1 text-[11px] font-bold bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#2563eb' }}>
          <i className={`bi bi-${ouverte ? 'eye-slash' : 'eye'} me-1`} />{ouverte ? 'Masquer la question' : 'Voir la question'}
        </button>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-black leading-none" style={{ color: '#b91c1c' }}>{x.rates}</div>
        <div className="text-[10px] text-slate-500 leading-tight">élève{x.rates > 1 ? 's' : ''}<br />sur {x.base} ({taux} %)</div>
      </div>
      </div>
      {/* Question dépliée : toute la largeur de la carte (lisible sur téléphone) */}
      {ouverte && <div className="mt-2 mx-auto" style={{ maxWidth: 420 }}><Question q={q} choix={q.bonnes} setChoix={() => {}} corrige /></div>}
    </li>
  )
}

/* Tableau de bord : questions de code les plus ratées et séances les plus difficiles, d'après les
   quiz de séance (erreurs du dernier essai de chaque élève). Pour savoir quoi reprendre en salle. */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const pc = (n, t) => (t ? Math.round(100 * n / t) : 0)

export default function QuestionsRatees() {
  const [d, setD] = useState(null)
  const [seance, setSeance] = useState('')
  const [tout, setTout] = useState(false)
  const [onglet, setOnglet] = useState(null)      // 'seances' | 'series' (par défaut : celui qui a des erreurs)
  const [serieFiltre, setSerieFiltre] = useState('')
  const [ouverte, setOuverte] = useState(null)
  useEffect(() => {
    let vivant = true
    api('GET', '/dashboard/questions-ratees').then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [])
  const series = (d?.questionsSeries || []).filter(x => PAR_ID[x.serie]?.questions[x.numero - 1])
  if (!d || (d.questions.length === 0 && series.length === 0)) return null
  const vue = onglet || (d.questions.length ? 'seances' : 'series')
  const seriesFiltrees = serieFiltre ? series.filter(x => x.serie === serieFiltre) : series
  const seriesVisibles = tout ? seriesFiltrees : seriesFiltrees.slice(0, 8)

  const filtrees = seance ? d.questions.filter(q => q.seances.some(s => String(s.id) === seance)) : d.questions
  const visibles = tout ? filtrees : filtrees.slice(0, 8)
  const difficiles = d.seances.filter(s => s.eleves >= 2).slice(0, 6)

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="question-octagon-fill" titre="Questions les plus ratées"
        sousTitre="Séances, séries et annales · dernier essai de chaque élève" nombre={d.questions.length + series.length} />
      <div className="px-5 pt-4 flex gap-2 flex-wrap">
        {[['seances', 'Séances de code', 'collection-play', d.questions.length, d.eleves], ['series', 'Séries et annales', 'journal-check', series.length, d.elevesSeries || 0]].map(([cle, nom, icone, n, el]) => (
          <button key={cle} type="button" onClick={() => { setOnglet(cle); setTout(false); setOuverte(null) }}
            className="px-3 py-2 text-sm font-bold cursor-pointer flex items-center gap-2"
            style={{ borderRadius: 999, border: `2px solid ${vue === cle ? ENCRE : '#e2e8f0'}`, background: vue === cle ? '#eff6ff' : '#fff', color: vue === cle ? ENCRE : '#64748b' }}>
            <i className={`bi bi-${icone}`} />{nom} · {n}<span className="text-[11px] font-semibold text-slate-400">({el} élève{el > 1 ? 's' : ''})</span>
          </button>
        ))}
      </div>
      {vue === 'series' ? (
        <div className="p-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400"><i className="bi bi-x-octagon me-1" style={{ color: '#dc2626' }} />À reprendre en salle</div>
            <label className="filtre mb-0" style={{ maxWidth: '100%' }}>
              <i className="bi bi-journal-check" />
              <select value={serieFiltre} onChange={e => { setSerieFiltre(e.target.value); setTout(false) }}>
                <option value="">Toutes les séries et annales</option>
                {[...SERIES, ...ANNALES].filter(s => series.some(x => x.serie === s.id)).map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
              </select>
            </label>
          </div>
          {seriesFiltrees.length === 0 ? <div className="text-sm text-slate-500">Aucune erreur enregistrée pour l'instant : elles s'ajoutent à chaque série ou annale terminée.</div> : (
            <ol className="m-0 p-0 list-none grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
              {seriesVisibles.map((x, i) => (
                <QuestionSerie key={x.serie + x.numero} x={x} rang={i + 1} ouverte={ouverte === x.serie + x.numero}
                  onBasculer={() => setOuverte(o => o === x.serie + x.numero ? null : x.serie + x.numero)} />
              ))}
            </ol>
          )}
          {seriesFiltrees.length > 8 && (
            <button type="button" onClick={() => setTout(t => !t)} className="mt-2 text-xs font-bold bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#2563eb' }}>
              {tout ? 'Voir moins' : `Voir les ${seriesFiltrees.length}`}
            </button>
          )}
          <div className="text-[11px] text-slate-400 mt-3"><i className="bi bi-info-circle me-1" />Entraînement et examen blanc confondus ; chaque élève compte une fois par question (erreurs de son dernier essai).</div>
        </div>
      ) : (
      <div className="p-5 flex flex-col gap-6">
        {/* Questions : deux colonnes sur ordinateur */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400"><i className="bi bi-x-octagon me-1" style={{ color: '#dc2626' }} />À reprendre en salle</div>
            <label className="filtre mb-0" style={{ maxWidth: '100%' }}>
              <i className="bi bi-collection-play" />
              <select value={seance} onChange={e => { setSeance(e.target.value); setTout(false) }}>
                <option value="">Toutes les séances</option>
                {[...d.seances].sort((a, b) => a.titre.localeCompare(b.titre, 'fr', { numeric: true })).map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
              </select>
            </label>
          </div>
          {filtrees.length === 0 ? <div className="text-sm text-slate-500">Aucune erreur enregistrée pour cette séance.</div> : (
            <ol className="m-0 p-0 list-none grid grid-cols-1 lg:grid-cols-2 gap-2">
              {visibles.map((q, i) => {
                const taux = pc(q.rates, q.base)
                return (
                  <li key={q.question + q.bonne} className="rounded-xl px-3 py-2.5 flex gap-3" style={{ background: '#f8fafc' }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5" style={{ background: '#fee2e2', color: '#b91c1c' }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: ENCRE }}>
                        {q.type === 'CONFUSION' && <i className="bi bi-arrow-left-right me-1" style={{ color: '#dc2626' }} title="Confusion" />}{q.question}
                      </div>
                      <div className="text-xs mt-1 flex flex-col gap-0.5">
                        {q.type === 'QUESTION' && <span style={{ color: '#15803d' }}><i className="bi bi-check-circle-fill me-1" />{q.bonne}</span>}
                        {q.mauvaises.map(m => (
                          <span key={m.reponse} style={{ color: '#b91c1c' }}>
                            <i className="bi bi-x-circle-fill me-1" />{q.type === 'CONFUSION' ? `Confondu avec « ${m.reponse} »` : m.reponse}
                            <span className="text-slate-400"> · {m.fois} fois</span>
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 truncate">{[...new Set(q.seances.map(s => s.titre))].join(' · ')}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black leading-none" style={{ color: '#b91c1c' }}>{q.rates}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">élève{q.rates > 1 ? 's' : ''}<br />sur {q.base} ({taux} %)</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
          {filtrees.length > 8 && (
            <button type="button" onClick={() => setTout(x => !x)} className="mt-2 text-xs font-bold bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#2563eb' }}>
              {tout ? 'Voir moins' : `Voir les ${filtrees.length}`}
            </button>
          )}
        </div>

        {/* Séances les plus difficiles : en dessous, sur toute la largeur */}
        <div className="min-w-0 pt-5" style={{ borderTop: '1px solid #eef2f7' }}>
          <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-3"><i className="bi bi-bar-chart-line me-1" style={{ color: '#f97316' }} />Séances les plus difficiles</div>
          {difficiles.length === 0 ? <div className="text-sm text-slate-500">Pas encore assez de quiz faits.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              {difficiles.map(s => {
                const t = pc(s.reussis, s.eleves)
                return (
                  <button key={s.id} type="button" onClick={() => { setSeance(String(s.id)); setTout(false) }} title="Voir ses questions ratées"
                    className="text-left bg-transparent border-0 p-0 cursor-pointer">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: ENCRE }}>{s.titre}</span>
                      <b className="text-sm font-black whitespace-nowrap" style={{ color: t < 50 ? '#b91c1c' : t < 80 ? '#b45309' : '#15803d' }}>{t} %</b>
                    </div>
                    <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: '#eef2f7' }}>
                      <div className="h-full rounded-full" style={{ width: `${t}%`, background: t < 50 ? '#ef4444' : t < 80 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.reussis}/{s.eleves} ont réussi · {String(s.tentativesMoyennes).replace('.', ',')} essai{s.tentativesMoyennes >= 2 ? 's' : ''} en moyenne</div>
                  </button>
                )
              })}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-3"><i className="bi bi-info-circle me-1" />Réussi : 70 % ou plus au quiz au moins une fois. Seules les erreurs du dernier essai de chaque élève sont gardées.</div>
        </div>
      </div>
      )}
    </div>
  )
}
