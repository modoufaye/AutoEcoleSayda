import { useEffect, useState } from 'react'
import { api } from '../api'
import { waLink } from '../utils'
import { EnteteListe } from './ListeModerne'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const SUPPORTS = [
  { cle: 'code', nom: 'Séances de code', icone: 'signpost-2-fill', couleur: '#2563eb' },
  { cle: 'series', nom: "Séries d'examen", icone: 'journal-check', couleur: '#7c3aed' },
  { cle: 'annales', nom: 'Annales', icone: 'journal-bookmark-fill', couleur: '#c2410c' },
]
// Élèves selon leur part assimilée (couleurs d'état, toujours avec icône et libellé)
const CATEGORIES = [
  { cle: 'avances', nom: 'Avancés', aide: '80 % ou plus assimilé', icone: 'rocket-takeoff-fill', couleur: '#10b981', fond: '#ecfdf5' },
  { cle: 'enBonneVoie', nom: 'En bonne voie', aide: '50 à 79 %', icone: 'graph-up-arrow', couleur: '#0ea5e9', fond: '#f0f9ff' },
  { cle: 'aAccompagner', nom: 'À accompagner', aide: 'moins de 50 %', icone: 'life-preserver', couleur: '#f97316', fond: '#fff7ed' },
  { cle: 'pasCommence', nom: 'Pas commencé', aide: 'aucun quiz, série ni annale', icone: 'hourglass', couleur: '#94a3b8', fond: '#f1f5f9' },
]
const pc = (n, t) => (t ? Math.round(100 * n / t) : 0)

/* Tableau de bord (admin, secrétariat) : suivi pédagogique des élèves du permis qui préparent le
   code — part des séances de code, séries et annales assimilées (70 % ou plus au moins une fois),
   élèves par niveau, et ceux à accompagner en premier. */
export default function SuiviPedagogique() {
  const [d, setD] = useState(null)
  const [trace, setTrace] = useState(false)
  useEffect(() => {
    let vivant = true
    api('GET', '/dashboard/pedagogie')
      .then(x => { if (vivant) { setD(x); setTimeout(() => vivant && setTrace(true), 60) } })
      .catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [])
  if (!d) return null

  const cats = CATEGORIES.map(c => ({ ...c, nombre: d.categories[c.cle] || 0 }))

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="mortarboard-fill" titre="Suivi pédagogique" sousTitre={`${d.eleves} élève${d.eleves > 1 ? 's' : ''} du permis en préparation du code`} />
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
        {/* Part assimilée par support */}
        <div className="flex flex-col gap-3">
          {SUPPORTS.map((s, i) => {
            const a = d.assimilation[s.cle], t = pc(a.assimilees, a.faites)
            return (
              <div key={s.cle}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-slate-700 truncate"><i className={`bi bi-${s.icone} me-1.5`} style={{ color: s.couleur }} />{s.nom}</span>
                  {s.cle === 'code' && <b className="text-base font-black whitespace-nowrap" style={{ color: ENCRE }}>{a.faites ? `${t} %` : '—'}</b>}
                </div>
                {s.cle === 'code' ? (
                  <>
                    {/* Reçues → quiz faits (clair) → assimilés (plein) */}
                    <div className="relative h-2 rounded-full mt-1 overflow-hidden" style={{ background: '#eef2f7' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: trace ? `${pc(a.quizFaits, a.faites)}%` : 0, background: '#bfdbfe', transition: 'width .9s cubic-bezier(.2,.8,.2,1)' }} />
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: trace ? `${t}%` : 0, background: s.couleur, transition: 'width .9s cubic-bezier(.2,.8,.2,1) 90ms' }} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                      <span><b className="text-slate-700">{a.faites.toLocaleString('fr-FR')}</b> reçues</span>
                      <span><span className="inline-block w-2 h-2 rounded-sm me-1 align-middle" style={{ background: '#bfdbfe' }} /><b className="text-slate-700">{a.quizFaits.toLocaleString('fr-FR')}</b> quiz faits ({pc(a.quizFaits, a.faites)} %)</span>
                      <span><span className="inline-block w-2 h-2 rounded-sm me-1 align-middle" style={{ background: s.couleur }} /><b className="text-slate-700">{a.assimilees.toLocaleString('fr-FR')}</b> assimilés</span>
                    </div>
                  </>
                ) : (
                  /* Séries et annales : entraînement et examen blanc séparés */
                  <div className="flex flex-col gap-1.5 mt-1 ps-5">
                    {[['entrainement', 'Entraînement', 0.45], ['blanc', 'Examen blanc', 1]].map(([mode, nom, opacite], k) => {
                      const m = a[mode] || { faites: 0, assimilees: 0 }, tm = pc(m.assimilees, m.faites)
                      return (
                        <div key={mode}>
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="text-slate-600">{nom}</span>
                            <span className="whitespace-nowrap">
                              <b className="text-sm font-black" style={{ color: ENCRE }}>{m.faites ? `${tm} %` : '—'}</b>
                              <span className="text-[11px] text-slate-500 ms-1.5">{m.assimilees}/{m.faites}</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full mt-0.5 overflow-hidden" style={{ background: '#eef2f7' }}>
                            <div className="h-full rounded-full" style={{ width: trace ? `${tm}%` : 0, background: s.couleur, opacity: opacite, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${(i * 2 + k) * 80}ms` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          <div className="text-[11px] text-slate-400"><i className="bi bi-info-circle me-1" />Assimilé : réussi au moins une fois à 70 % ou plus. Séances : seulement celles qui ont un quiz, sur celles reçues ; séries et annales : sur celles faites.</div>
        </div>

        {/* Colonne de droite : élèves par niveau, puis à accompagner */}
        <div>
        {/* Élèves par niveau */}
        {d.eleves > 0 && (
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">Élèves par niveau</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-[2px]" role="img" aria-label="Élèves par niveau d'assimilation">
              {cats.filter(c => c.nombre > 0).map(c => (
                <div key={c.cle} style={{ width: `${100 * c.nombre / d.eleves}%`, background: c.couleur, transition: 'width .8s' }} title={`${c.nom} : ${c.nombre}`} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {cats.map(c => (
                <div key={c.cle} className="rounded-xl px-3 py-2" style={{ background: c.fond }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><i className={`bi bi-${c.icone}`} style={{ color: c.couleur }} />{c.nom}</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black" style={{ color: ENCRE }}>{c.nombre}</span>
                    <span className="text-xs text-slate-500">{pc(c.nombre, d.eleves)} %</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{c.aide}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* À accompagner en priorité : taux le plus faible, au moins 3 éléments */}
        {d.aAccompagner.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2"><i className="bi bi-life-preserver me-1" style={{ color: '#f97316' }} />À accompagner en priorité</div>
            <div className="flex flex-col gap-1.5">
              {d.aAccompagner.map(e => {
                const lien = waLink(e.telephone)
                return (
                  <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#f8fafc' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate" title={e.nom}>{e.nom}</div>
                      <div className="text-[11px] text-slate-500"><b style={{ color: '#c2410c' }}>{e.assimilees}/{e.faites}</b> assimilé{e.assimilees > 1 ? 's' : ''} ({pc(e.assimilees, e.faites)} %)</div>
                    </div>
                    {lien && (
                      <a href={lien} target="_blank" rel="noreferrer" title="Écrire sur WhatsApp" aria-label={`WhatsApp à ${e.nom}`}
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0 no-underline" style={{ borderRadius: 999, background: '#25d366', color: '#fff' }}>
                        <i className="bi bi-whatsapp" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
