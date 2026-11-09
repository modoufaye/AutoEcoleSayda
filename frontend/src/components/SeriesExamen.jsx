import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { Visuel } from './CoursCode'
import { chargerQuizs, ecrireQuiz, effacerQuiz } from './sauvegardeQuiz'
import { confirmer } from './confirmer'
import { SERIES } from '../contenu/seriesExamen'

/* Séries d'examen (onglet Travaux Dirigés) : 25 questions au format de l'examen du code.
   Entraînement : correction après chaque question. Examen blanc : chronomètre, correction à la
   fin ; la note d'un élève est enregistrée (même table que les cours, chapitre = id de la série). */

const OBJECTIF = 20   // bonnes réponses visées sur 25, repère d'entraînement
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const btnOr = { borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }
const juste = (q, choix) => choix.length === q.bonnes.length && q.bonnes.every(l => choix.includes(l))
const enonceCourt = q => q.enonce || q.blocs.map(b => b.intro).filter(Boolean).join(' · ')
const estScene = v => !!v?.dessin?.startsWith('scene-')

/* Une question : illustration, énoncé, blocs de réponses à cocher (plusieurs lettres possibles). */
function Question({ q, choix, setChoix, corrige }) {
  const basculer = l => { if (!corrige) setChoix(c => c.includes(l) ? c.filter(x => x !== l) : [...c, l]) }
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0f2240', border: '1px solid #1e3a5f' }}>
      {q.photo ? <img src={q.photo} alt="" className="block w-full" style={{ background: '#e2e8f0' }} />
        : q.visuel && (
        <div className="flex justify-center py-4" style={{ background: 'linear-gradient(180deg,#f8fafc,#e2e8f0)' }}>
          <Visuel item={q.visuel} taille={estScene(q.visuel) ? 240 : 150} />
        </div>
      )}
      <div className="p-4 sm:p-5 text-white">
        {q.enonce && <div className="text-lg font-extrabold">{q.enonce}</div>}
        {q.blocs.map((b, i) => (
          <div key={i} className="mt-3">
            {b.intro && <div className="text-sm font-bold mb-2" style={{ color: '#bfdbfe' }}>{b.intro}</div>}
            <div className="flex flex-col gap-2">
              {b.choix.map(([l, t]) => {
                const coche = choix.includes(l), bonne = q.bonnes.includes(l)
                const etat = !corrige ? (coche ? 'coche' : '') : bonne ? 'bonne' : coche ? 'fausse' : ''
                const st = {
                  coche: { border: '2px solid #f0bb2a', background: 'rgba(240,187,42,.15)' },
                  bonne: { border: '2px solid #22c55e', background: 'rgba(34,197,94,.2)' },
                  fausse: { border: '2px solid #ef4444', background: 'rgba(239,68,68,.2)' },
                  '': { border: '1.5px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.05)' },
                }[etat]
                return (
                  <button key={l} type="button" onClick={() => basculer(l)} disabled={corrige}
                    className="flex items-center gap-3 px-4 py-3 text-left text-white font-bold cursor-pointer w-full" style={{ borderRadius: 14, ...st }}>
                    <span className="w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-black"
                      style={{ borderRadius: 8, background: coche || etat === 'bonne' ? (etat === 'fausse' ? '#ef4444' : etat === 'bonne' ? '#22c55e' : '#f0bb2a') : 'rgba(255,255,255,.12)', color: coche || etat === 'bonne' ? '#0f2240' : '#cbd5e1' }}>{l}</span>
                    <span className="flex-1">{t}</span>
                    {corrige && bonne && <i className="bi bi-check-lg" style={{ color: '#86efac' }} />}
                    {corrige && coche && !bonne && <i className="bi bi-x-lg" style={{ color: '#fca5a5' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {corrige && (
          <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: juste(q, choix) ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', color: '#e2e8f0' }}>
            <b>{juste(q, choix) ? '👍 Bonne réponse.' : `Bonne réponse : ${q.bonnes.join(' et ')}.`}</b>{q.explication && <> {q.explication}</>}
          </div>
        )}
      </div>
    </div>
  )
}

/* Déroulé d'une série. La partie en cours est gardée (serveur et appareil, sauvegardeQuiz) :
   quitter puis revenir, même sur un autre appareil, la reprend à la même question (en examen
   blanc, le chrono de cette question repart). « Redémarrer » l'efface et repart de la question 1. */
const cleSerie = (serie, mode) => `serie:${serie.id}:${mode}`
function Partie({ serie, mode, reprise, onFin, onQuitter, onRedemarrer }) {
  const [enCours] = useState(reprise)
  const [i, setI] = useState(enCours?.i || 0)
  const [choix, setChoix] = useState(enCours?.choix || [])
  const [reponses, setReponses] = useState(enCours?.reponses || [])      // lettres cochées pour chaque question
  const [corrige, setCorrige] = useState(enCours?.corrige || false)     // entraînement : correction affichée
  const [reste, setReste] = useState(serie.duree)
  useEffect(() => {
    if (i === 0 && !reponses.length && !choix.length) return
    ecrireQuiz(cleSerie(serie, mode), { i, choix, reponses, corrige })
  }, [serie, mode, i, choix, reponses, corrige])
  const q = serie.questions[i]
  const valider = () => {
    const r = [...reponses, choix]
    if (mode === 'entrainement' && !corrige) { setReponses(r); setCorrige(true); return }
    const toutes = mode === 'entrainement' ? reponses : r
    if (i + 1 < serie.questions.length) { if (mode !== 'entrainement') setReponses(r); setI(i + 1); setChoix([]); setCorrige(false); setReste(serie.duree) }
    else { effacerQuiz(cleSerie(serie, mode)); onFin(toutes) }
  }
  // Chronomètre (examen blanc) : temps restant calculé sur l'heure de fin de la question ;
  // à zéro, la question est validée avec les cases cochées.
  const validerAuto = useRef(valider)
  useEffect(() => { validerAuto.current = valider })
  useEffect(() => {
    if (mode !== 'examen') return
    const finQuestion = Date.now() + serie.duree * 1000
    const t = setInterval(() => {
      const r = Math.ceil((finQuestion - Date.now()) / 1000)
      setReste(r)
      if (r <= 0) { clearInterval(t); validerAuto.current() }
    }, 250)
    return () => clearInterval(t)
  }, [mode, i, serie.duree])

  const examen = mode === 'examen'
  const bonnes = reponses.filter((r, k) => juste(serie.questions[k], r)).length
  const commence = i > 0 || reponses.length > 0 || choix.length > 0
  const urgent = examen && reste <= 10
  const btnClair = { borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* En-tête : série, mode (entraînement ou examen blanc), chrono et progression */}
      <div className="rounded-2xl overflow-hidden relative text-white" style={{ background: examen ? 'linear-gradient(135deg,#0f2240,#1e3a5f 60%,#3b2f12)' : 'linear-gradient(135deg,#0f2240,#1e3a5f 60%,#0f4c4a)', boxShadow: '0 8px 28px rgba(15,34,64,.25)' }}>
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: examen ? 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' : 'linear-gradient(90deg,#14b8a6,#5eead4,#14b8a6)' }} />
        <div className="px-4 sm:px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onQuitter} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer me-auto" style={btnClair}>
              <i className="bi bi-arrow-left" />Séries
            </button>
            {commence && (
              <button type="button" title="Redémarrer la série depuis la première question" onClick={async () => {
                if (await confirmer({ titre: 'Redémarrer la série ?', ton: 'alerte', icone: 'arrow-counterclockwise', libelle: 'Redémarrer',
                  message: 'Les réponses déjà données seront effacées et la série reprendra à la première question.' })) onRedemarrer()
              }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap" style={btnClair}>
                <i className="bi bi-arrow-counterclockwise" /><span className="hidden sm:inline">Redémarrer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 text-xl font-black" style={{ borderRadius: 18, background: examen ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : 'linear-gradient(135deg,#14b8a6,#5eead4)', color: '#0f2240' }}>{serie.titre.split(' ')[1]}</div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black tracking-widest" style={{ borderRadius: 999, background: examen ? 'rgba(240,187,42,.18)' : 'rgba(94,234,212,.16)', color: examen ? '#fcd34d' : '#5eead4', border: `1px solid ${examen ? 'rgba(240,187,42,.45)' : 'rgba(94,234,212,.4)'}` }}>
                <i className={`bi bi-${examen ? 'stopwatch-fill' : 'mortarboard-fill'}`} />{examen ? 'EXAMEN BLANC' : 'ENTRAÎNEMENT'}{enCours ? ' · REPRISE' : ''}
              </span>
              <div className="text-2xl font-black leading-tight mt-1.5">{serie.titre}</div>
              <div className="text-xs sm:text-sm" style={{ color: '#bfdbfe' }}>
                {examen ? `Chronométré · ${serie.duree} s par question · correction à la fin` : 'Sans chrono · correction après chaque question'}
              </div>
            </div>
            {examen && (
              <div className="flex flex-col items-center justify-center flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px]" style={{ borderRadius: 999, background: urgent ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.08)', border: `3px solid ${urgent ? '#ef4444' : '#f0bb2a'}` }}>
                <span className="text-xl font-black leading-none" style={{ color: urgent ? '#fca5a5' : '#fff' }}>{Math.max(reste, 0)}</span>
                <span className="text-[10px] font-bold" style={{ color: '#bfdbfe' }}>secondes</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-extrabold mb-1.5">
              <span>QUESTION {i + 1} <span style={{ color: '#93c5fd' }}>SUR {serie.questions.length}</span></span>
              {!examen && <span style={{ color: '#86efac' }}><i className="bi bi-check-circle-fill me-1" />{bonnes} bonne{bonnes > 1 ? 's' : ''} réponse{bonnes > 1 ? 's' : ''}</span>}
            </div>
            <div className="flex gap-1">
              {serie.questions.map((x, k) => {
                const fait = k < reponses.length, ok = fait && juste(x, reponses[k])
                return <div key={k} className="h-1.5 flex-1 rounded-full" style={{ background: k === i ? (examen ? '#f0bb2a' : '#5eead4') : fait && !examen ? (ok ? '#22c55e' : '#ef4444') : fait ? '#94a3b8' : 'rgba(255,255,255,.15)' }} />
              })}
            </div>
          </div>
        </div>
      </div>
      <Question key={i} q={q} choix={choix} setChoix={setChoix} corrige={corrige} />
      <button type="button" onClick={valider} disabled={!corrige && choix.length === 0 && mode === 'entrainement'}
        className="w-full py-3.5 font-extrabold border-0 cursor-pointer" style={{ ...btnOr, borderRadius: 16, opacity: !corrige && choix.length === 0 && mode === 'entrainement' ? .5 : 1 }}>
        {corrige || mode === 'examen'
          ? (i + 1 < serie.questions.length ? <>Question suivante <i className="bi bi-arrow-right ms-1" /></> : <>Voir mon résultat <i className="bi bi-flag-fill ms-1" /></>)
          : <><i className="bi bi-check-lg me-1" />Valider ma réponse</>}
      </button>
    </div>
  )
}

/* Résultat et correction complète. */
/* Contenu d'une série (personnel) : ses questions, chacune dépliable avec sa photo et ses bonnes
   réponses, et les boutons pour la lancer. */
function Contenu({ serie, modes, onLancer, onQuitter }) {
  const [voir, setVoir] = useState(null)
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="rounded-2xl overflow-hidden relative text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 60%,#2a4f7c)', boxShadow: '0 8px 28px rgba(15,34,64,.25)' }}>
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
        <div className="px-4 sm:px-5 pt-5 pb-6">
          <button type="button" onClick={onQuitter} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer"
            style={{ borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }}>
            <i className="bi bi-arrow-left" />Séries
          </button>
          <div className="flex items-center gap-4 mt-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 text-xl font-black" style={{ borderRadius: 18, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#0f2240' }}>{serie.titre.split(' ')[1]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black tracking-widest" style={{ color: '#f0bb2a' }}>CONTENU · CORRIGÉ</div>
              <div className="text-2xl font-black leading-tight">{serie.titre}</div>
              <div className="text-xs sm:text-sm" style={{ color: '#bfdbfe' }}>{serie.sousTitre} · {serie.questions.length} questions</div>
            </div>
          </div>
          <div className={`grid ${modes.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-4`}>
            {modes.map(([mode, icone, libelle, style]) => (
              <button key={mode} type="button" onClick={() => onLancer(mode)} className="py-2.5 font-extrabold border-0 cursor-pointer" style={style}>
                <i className={`bi bi-${icone} me-1`} />{libelle}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <div className="px-5 py-3 font-extrabold flex items-center justify-between" style={{ color: '#1e3a5f', borderBottom: '1px solid #eef2f7' }}>
          Questions et bonnes réponses<span className="text-xs font-semibold text-slate-400">Touchez une question pour la voir</span>
        </div>
        {serie.questions.map((q, k) => (
          <div key={k} style={{ borderBottom: '1px solid #eef2f7' }}>
            <button type="button" onClick={() => setVoir(voir === k ? null : k)} aria-expanded={voir === k} className="w-full flex items-center gap-3 px-5 py-3 text-left bg-white border-0 cursor-pointer">
              <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ borderRadius: 999, background: '#eef2f7', color: '#1e3a5f' }}>{k + 1}</span>
              {q.photo ? <img src={q.photo} alt="" className="hidden sm:block flex-shrink-0" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : null}
              <span className="flex-1 min-w-0 text-sm font-semibold text-slate-700">{enonceCourt(q)}</span>
              <span className="text-xs font-black px-2 py-1 whitespace-nowrap" style={{ borderRadius: 8, background: '#dcfce7', color: '#15803d' }}>{q.bonnes.join(' ')}</span>
              <i className={`bi bi-chevron-${voir === k ? 'up' : 'down'} text-slate-400`} />
            </button>
            {voir === k && <div className="px-4 pb-4"><Question q={q} choix={q.bonnes} setChoix={() => {}} corrige /></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Resultat({ serie, reponses, onRejouer, onQuitter }) {
  const score = serie.questions.filter((q, k) => juste(q, reponses[k] || [])).length
  const [voir, setVoir] = useState(null)
  const ok = score >= OBJECTIF
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="rounded-2xl p-6 text-center text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '5px solid #d4a017' }}>
        <div style={{ fontSize: 52 }}>{ok ? '🏆' : '💪'}</div>
        <div className="text-4xl font-black">{score} / {serie.questions.length}</div>
        <div className="mt-1 font-bold" style={{ color: ok ? '#86efac' : '#fcd34d' }}>{ok ? 'Objectif atteint, bravo !' : `Objectif : ${OBJECTIF} bonnes réponses. Revoyez vos erreurs et recommencez !`}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <button type="button" onClick={onRejouer} className="px-5 py-2.5 font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: 'rgba(255,255,255,.15)', color: '#fff' }}><i className="bi bi-arrow-repeat me-1" />Recommencer</button>
          <button type="button" onClick={onQuitter} className="px-5 py-2.5 font-bold border-0 cursor-pointer" style={btnOr}>Autres séries</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <div className="px-5 py-3 font-extrabold" style={{ color: '#1e3a5f', borderBottom: '1px solid #eef2f7' }}>Correction</div>
        {serie.questions.map((q, k) => {
          const r = reponses[k] || [], bon = juste(q, r)
          return (
            <div key={k} style={{ borderBottom: '1px solid #eef2f7' }}>
              <button type="button" onClick={() => setVoir(voir === k ? null : k)} className="w-full flex items-center gap-3 px-5 py-3 text-left bg-white border-0 cursor-pointer">
                <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-black text-sm" style={{ borderRadius: 999, background: bon ? '#dcfce7' : '#fee2e2', color: bon ? '#15803d' : '#b91c1c' }}>{k + 1}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-slate-700">{enonceCourt(q)}</span>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: bon ? '#15803d' : '#b91c1c' }}>{r.length ? r.join(' ') : '—'} {bon ? '✓' : `→ ${q.bonnes.join(' ')}`}</span>
              </button>
              {voir === k && <div className="px-4 pb-4"><Question q={q} choix={r} setChoix={() => {}} corrige /></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ENTETE_SERIES = {
  surTitre: "TRAVAUX DIRIGÉS · SÉRIES D'EXAMEN", titre: "Séries d'examen",
  texte: "25 questions comme le jour de l'examen : une image, une situation, une ou plusieurs bonnes réponses à cocher.",
  vide: 'Aucune série pour le moment.',
}

/* Liste des séries (séries d'examen, ou annales avec leur propre en-tête ; sans en-tête dans une
   séance) et déroulé d'une partie. « ouvertes » (élève) : id → modes publiés pour lui en Travaux
   Dirigés ; seules ces séries, et ces modes, lui sont proposés. « sousEntete » : affiché sous
   l'en-tête de la liste (publications du personnel), caché pendant une partie. */
const TOUS_MODES = new Set(['entrainement', 'examen'])
export default function SeriesExamen({ eleve = false, series: toutes = SERIES, entete = ENTETE_SERIES, ouvertes, sousEntete }) {
  const series = ouvertes ? toutes.filter(s => ouvertes[s.id]?.size) : toutes
  const modesDe = s => ouvertes ? ouvertes[s.id] : TOUS_MODES
  const [partie, setPartie] = useState(null)        // { serie, mode, tour }
  const [fin, setFin] = useState(null)              // réponses de la partie terminée
  const [notes, setNotes] = useState({})
  const [enCours, setEnCours] = useState({})        // parties commencées, par série et par mode
  const [apercu, setApercu] = useState(null)        // série dont le personnel consulte le contenu
  const recharger = () => chargerQuizs(series.flatMap(s => ['entrainement', 'examen'].map(m => cleSerie(s, m)))).then(setEnCours)
  useEffect(() => { recharger() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!eleve) return
    api('GET', '/eleve/code/progression').then(l => setNotes(Object.fromEntries((l || []).map(x => [x.chapitre, x])))).catch(() => {})
  }, [eleve])

  const terminer = async (reponses) => {
    setFin(reponses)
    const { serie, mode } = partie
    if (!eleve || mode !== 'examen') return
    const score = serie.questions.filter((q, k) => juste(q, reponses[k] || [])).length
    try { const p = await api('POST', '/eleve/code/progression', { chapitre: serie.id, score, total: serie.questions.length }); setNotes(n => ({ ...n, [serie.id]: p })) }
    catch { toast('Note non enregistrée : vérifiez votre connexion', 'warning') }
  }
  const quitter = () => { setPartie(null); setFin(null); recharger(); window.scrollTo?.({ top: 0 }) }
  // Reprise : la partie commencée continue ; nouvelle partie (ou redémarrage) : elle est oubliée
  const lancer = (serie, mode, reprise = null) => { if (!reprise) effacerQuiz(cleSerie(serie, mode)); setFin(null); setPartie(x => ({ serie, mode, reprise, tour: (x?.tour || 0) + 1 })); window.scrollTo?.({ top: 0 }) }

  // Boutons des modes proposés pour une série (élève : seulement ceux qui lui sont publiés)
  const boutonsModes = s => [['entrainement', 'mortarboard-fill', 'Entraînement', { borderRadius: 999, background: '#eef2f7', color: '#1e3a5f' }], ['examen', 'stopwatch', 'Examen blanc', btnOr]].filter(([mode]) => modesDe(s).has(mode))
  // Clic sur la carte : le personnel ouvre le contenu corrigé ; l'élève lance la série si un seul mode lui est publié
  const ouvrir = s => {
    if (!eleve) { setApercu(s); window.scrollTo?.({ top: 0 }); return }
    const modes = boutonsModes(s)
    if (modes.length === 1) lancer(s, modes[0][0], enCours[cleSerie(s, modes[0][0])])
  }

  if (partie && fin) return <Resultat serie={partie.serie} reponses={fin} onRejouer={() => lancer(partie.serie, partie.mode)} onQuitter={quitter} />
  if (partie) return <Partie key={partie.tour} serie={partie.serie} mode={partie.mode} reprise={partie.reprise} onFin={terminer} onQuitter={quitter} onRedemarrer={() => lancer(partie.serie, partie.mode)} />
  if (apercu) return <Contenu serie={apercu} modes={boutonsModes(apercu)} onQuitter={() => { setApercu(null); window.scrollTo?.({ top: 0 }) }}
    onLancer={mode => { setApercu(null); lancer(apercu, mode, enCours[cleSerie(apercu, mode)]) }} />

  return (
    <div className="space-y-4">
      {entete && (
      <div className="rounded-2xl overflow-hidden relative text-white px-6 py-6" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 55%,#2a4f7c)', boxShadow: '0 8px 28px rgba(15,34,64,.25)' }}>
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
        <div className="text-[11px] font-extrabold tracking-widest" style={{ color: '#f0bb2a' }}>{entete.surTitre}</div>
        <h2 className="text-3xl font-black m-0 mt-1">{entete.titre}</h2>
        <p className="text-sm m-0 mt-1 max-w-lg" style={{ color: '#bfdbfe' }}>{entete.texte}</p>
      </div>
      )}
      {sousEntete}
      {series.length === 0 && (
        <div className="bg-white p-8 text-center" style={{ borderRadius: 20, ...carte }}>
          <div className="w-14 h-14 mx-auto flex items-center justify-center text-2xl" style={{ borderRadius: 18, background: '#fef3c7', color: '#b45309' }}><i className="bi bi-journal-bookmark-fill" /></div>
          <div className="font-extrabold mt-3" style={{ color: '#1e3a5f' }}>{ouvertes ? 'Rien de publié pour le moment' : 'Bientôt disponible'}</div>
          <div className="text-sm text-slate-500 mt-1">{ouvertes ? 'Votre moniteur ne vous a pas encore publié de série ici. Elles apparaîtront dès qu’il les ajoutera à une séance.' : entete?.vide}</div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {series.map(s => {
          const n = notes[s.id]
          const cliquable = !eleve || boutonsModes(s).length === 1
          return (
            <div key={s.id} className={`bg-white p-5 ${cliquable ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg' : ''}`} style={{ borderRadius: 20, ...carte }}
              {...(cliquable ? { role: 'button', tabIndex: 0, title: eleve ? 'Commencer' : 'Voir les questions et les réponses', onClick: () => ouvrir(s),
                onKeyDown: ev => { if (ev.target === ev.currentTarget && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ouvrir(s) } } } : {})}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 text-xl font-black text-white" style={{ borderRadius: 18, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>{s.titre.split(' ')[1]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-black" style={{ color: '#1e3a5f' }}>{s.titre}</div>
                  <div className="text-sm text-slate-500">{s.sousTitre}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.questions.length} questions · {s.duree} s par question en examen blanc</div>
                  {n && <div className="text-xs font-bold mt-1" style={{ color: n.meilleurScore >= OBJECTIF ? '#15803d' : '#b45309' }}>Meilleure note : {n.meilleurScore}/{n.total}</div>}
                  {!eleve && <div className="text-xs font-bold mt-1.5" style={{ color: '#1d4ed8' }}><i className="bi bi-eye me-1" />Voir les questions et les réponses</div>}
                </div>
              </div>
              <div className={`grid ${modesDe(s).size > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-4`}>
                {boutonsModes(s).map(([mode, icone, libelle, style]) => {
                  const c = enCours[cleSerie(s, mode)]
                  return (
                    <button key={mode} type="button" onClick={ev => { ev.stopPropagation(); lancer(s, mode, c) }} className="py-2.5 font-extrabold border-0 cursor-pointer leading-tight" style={style}>
                      <i className={`bi bi-${icone} me-1`} />{libelle}
                      {c && <span className="block text-[11px] font-bold opacity-80">Reprendre · question {c.i + 1}/{s.questions.length}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
