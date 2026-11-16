import { useEffect, useState } from 'react'
import { api } from '../api'
import { EnteteListe } from './ListeModerne'
import SelecteurAnnee from './SelecteurAnnee'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
// Étapes du permis, une seule teinte du clair au foncé : plus on avance, plus c'est foncé
const ETAPES = {
  inscrits:      { nom: 'Inscrits',              icone: 'person-plus-fill',    couleur: '#9ab8db' },
  coursCode:     { nom: 'Cours de code reçus',   icone: 'journal-bookmark-fill', couleur: '#7a9fcb' },
  presentesCode: { nom: 'Présentés au code',     icone: 'pencil-square',       couleur: '#5a86bb' },
  codeObtenu:    { nom: 'Code obtenu',           icone: 'patch-check-fill',    couleur: '#3d6ca5' },
  conduite:      { nom: 'Leçons de conduite',    icone: 'car-front-fill',      couleur: '#2a5288' },
  permis:        { nom: 'Permis obtenu',         icone: 'trophy-fill',         couleur: '#1e3a5f' },
}
const pc = (n, t) => (t ? Math.round(100 * n / t) : 0)

/* Tableau de bord (admin, secrétariat) : parcours des élèves du permis inscrits une année,
   de l'inscription au permis — combien atteignent chaque étape, où on en perd le plus, et
   combien sont sortis (abandon, suspension, archivés sans permis) à chaque étape. */
export default function ParcoursEleves() {
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState(String(anneeCourante))
  const [d, setD] = useState(null)
  const [trace, setTrace] = useState(false)
  useEffect(() => {
    let vivant = true
    api('GET', `/dashboard/parcours${annee ? `?annee=${annee}` : ''}`)
      .then(x => { if (vivant) { setD(x); setTimeout(() => vivant && setTrace(true), 60) } })
      .catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [annee])
  if (!d) return null

  const etapes = d.etapes.map(e => ({ ...e, ...ETAPES[e.cle] }))
  const inscrits = etapes[0].nombre
  const quand = annee ? `en ${annee}` : 'depuis le début'
  // Plus gros écart entre deux étapes qui se suivent (élèves pas encore arrivés, ou sortis)
  const pertes = etapes.slice(1).map((e, i) => ({ i: i + 1, perte: etapes[i].nombre - e.nombre }))
  const pire = pertes.reduce((b, p) => (p.perte > (b?.perte ?? 0) ? p : b), null)
  const code = etapes.find(e => e.cle === 'codeObtenu').nombre, permis = etapes.find(e => e.cle === 'permis').nombre
  const recent = Number(annee) === anneeCourante

  return (
    <div className="mt-3 bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="signpost-2-fill" titre="Parcours des élèves" sousTitre={`Élèves du permis inscrits ${quand}, de l'inscription au permis`} />
      <div className="flex justify-end px-5 pt-4">
        <SelecteurAnnee annees={[String(anneeCourante), ...d.annees.map(String)]} valeur={annee} onChange={a => { setTrace(false); setAnnee(a) }} avecToutes />
      </div>

      {inscrits === 0 ? (
        <div className="text-center text-sm text-slate-400 py-10">Aucun élève du permis inscrit {quand}</div>
      ) : (
        <div className="px-5 pb-5 pt-3">
          {/* Ce qu'il faut retenir */}
          <div className="rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
            style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f0bb2a', color: ENCRE }}>
                <i className="bi bi-signpost-split-fill" />
              </span>
              <div className="text-sm text-slate-700 leading-snug">
                Sur <b style={{ color: ENCRE }}>{inscrits} inscrits</b> {quand}, <b style={{ color: ENCRE }}>{code}</b> ont le code ({pc(code, inscrits)} %)
                {' '}et <b style={{ color: ENCRE }}>{permis}</b> le permis ({pc(permis, inscrits)} %).
                {d.enFormation > 0 && <> <b style={{ color: ENCRE }}>{d.enFormation}</b> sont encore en formation.</>}
              </div>
            </div>
            {pire && pire.perte > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white" style={{ color: '#c2410c', border: '1px solid #fed7aa' }}>
                <i className="bi bi-exclamation-triangle-fill me-1" />Plus gros écart : avant « {etapes[pire.i].nom} » (−{pire.perte})
              </span>
            )}
          </div>

          {/* Entonnoir : une barre par étape, largeur = part des inscrits */}
          <div className="flex flex-col">
            {etapes.map((e, i) => {
              const perte = i > 0 ? etapes[i - 1].nombre - e.nombre : 0
              const estPire = pire && pire.i === i && perte > 0
              return (
                <div key={e.cle}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 ps-[42px]">
                      <i className="bi bi-arrow-down-short text-slate-300" />
                      {perte > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={estPire ? { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' } : { color: '#94a3b8' }}>
                          −{perte} élève{perte > 1 ? 's' : ''} ({pc(perte, etapes[i - 1].nombre)} %){estPire ? ' · plus gros écart' : ''}
                        </span>
                      ) : <span className="text-[11px] text-slate-300">aucun écart</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: e.couleur, color: '#fff' }}>
                      <i className={`bi bi-${e.icone}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate">{e.nom}</span>
                        <span className="whitespace-nowrap">
                          <b className="text-base font-black" style={{ color: ENCRE }}>{e.nombre}</b>
                          <span className="text-xs text-slate-500 ms-1.5">{pc(e.nombre, inscrits)} %</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full mt-1 overflow-hidden" style={{ background: '#eef2f7' }}>
                        <div className="h-full rounded-full" style={{ width: trace ? `${Math.max(e.nombre ? 1.5 : 0, pc(e.nombre, inscrits))}%` : 0, background: e.couleur, transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 80}ms` }} />
                      </div>
                      {e.sortis > 0 && (
                        <div className="text-[11px] mt-0.5" style={{ color: '#b91c1c' }}>
                          <i className="bi bi-box-arrow-right me-1" />{e.sortis} sorti{e.sortis > 1 ? 's' : ''} à cette étape (abandon, suspension ou archivé)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            <i className="bi bi-info-circle me-1" />Un élève qui a atteint une étape compte aussi pour les précédentes. Un écart compte les élèves pas encore arrivés à l'étape suivante ; les vrais départs sont indiqués en rouge.
            {recent && ' Les inscrits récents n\'ont pas encore eu le temps d\'avancer : comparez plutôt une année terminée.'}
          </div>
        </div>
      )}
    </div>
  )
}
