import { useEffect, useState } from 'react'
import { api } from '../api'
import { EnteteListe } from './ListeModerne'

/* Tableau de bord : questions de code les plus ratées et séances les plus difficiles, d'après les
   quiz de séance (erreurs du dernier essai de chaque élève). Pour savoir quoi reprendre en salle. */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const pc = (n, t) => (t ? Math.round(100 * n / t) : 0)

export default function QuestionsRatees() {
  const [d, setD] = useState(null)
  const [seance, setSeance] = useState('')
  const [tout, setTout] = useState(false)
  useEffect(() => {
    let vivant = true
    api('GET', '/dashboard/questions-ratees').then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [])
  if (!d || d.questions.length === 0) return null

  const filtrees = seance ? d.questions.filter(q => q.seances.some(s => String(s.id) === seance)) : d.questions
  const visibles = tout ? filtrees : filtrees.slice(0, 8)
  const difficiles = d.seances.filter(s => s.eleves >= 2).slice(0, 6)

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="question-octagon-fill" titre="Questions les plus ratées"
        sousTitre={`Quiz des séances de code · ${d.eleves} élève${d.eleves > 1 ? 's' : ''} · dernier essai de chacun`} nombre={d.questions.length} />
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
    </div>
  )
}
