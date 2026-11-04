import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import MarquageSol from './MarquageSol'
import { CHAPITRES, REVISION, SEUIL_REUSSITE, questionsChapitre, questionsRevision } from '../contenu/signalisation'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

/* Visuel d'un panneau (dessin officiel) ou d'un marquage au sol (dessiné). */
function Visuel({ item, taille = 72 }) {
  if (item.marquage) return <MarquageSol type={item.marquage} taille={taille} />
  return <img src={item.image} alt={item.nom} width={taille} height={taille} style={{ objectFit: 'contain', flexShrink: 0 }} loading="lazy" />
}
function IconeChapitre({ ch, taille = 46 }) {
  return ch.icone.startsWith('marquage:')
    ? <MarquageSol type={ch.icone.slice(9)} taille={taille} />
    : <img src={ch.icone} alt="" width={taille} height={taille} style={{ objectFit: 'contain' }} />
}

/* Lecture à voix haute (synthèse du navigateur, voix française si disponible). */
function lire(texte) {
  try {
    const s = window.speechSynthesis; if (!s) return toast('Lecture à voix haute indisponible sur cet appareil', 'warning')
    s.cancel(); const u = new SpeechSynthesisUtterance(texte); u.lang = 'fr-FR'; u.rate = 0.95
    const voix = s.getVoices().find(v => v.lang?.startsWith('fr')); if (voix) u.voice = voix
    s.speak(u)
  } catch { toast('Lecture à voix haute indisponible', 'warning') }
}

/* ── Quiz d'un chapitre (ou de la révision) ── */
function Quiz({ questions, onFini, onSuivant, suivantLibelle }) {
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [fini, setFini] = useState(false)
  const q = questions[i]
  const repondre = (r) => { if (choix) return; setChoix(r); if (r === q.bonne) setScore(s => s + 1) }
  const suivante = () => {
    if (i + 1 < questions.length) { setI(i + 1); setChoix(null) }
    else { setFini(true); onFini?.(score, questions.length) }
  }
  const recommencer = () => { setI(0); setChoix(null); setScore(0); setFini(false) }

  if (fini) {
    const reussi = score >= Math.ceil(SEUIL_REUSSITE * questions.length)
    return (
      <div className="rounded-2xl p-6 text-center text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '5px solid #d4a017' }}>
        <div style={{ fontSize: 52 }}>{reussi ? '🏆' : '💪'}</div>
        <div className="text-3xl font-black mt-1">{score} / {questions.length}</div>
        <div className="mt-1 font-bold" style={{ color: reussi ? '#86efac' : '#fcd34d' }}>
          {reussi ? 'Chapitre validé, bravo !' : `Il faut ${Math.ceil(SEUIL_REUSSITE * questions.length)} bonnes réponses pour valider : réessayez !`}
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <button type="button" onClick={recommencer} className="px-5 py-2.5 rounded-full font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: 'rgba(255,255,255,.15)', color: '#fff' }}>
            <i className="bi bi-arrow-repeat me-1" />Recommencer
          </button>
          {reussi && onSuivant && (
            <button type="button" onClick={onSuivant} className="px-5 py-2.5 rounded-full font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
              {suivantLibelle} <i className="bi bi-arrow-right ms-1" />
            </button>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '5px solid #d4a017' }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold tracking-widest" style={{ color: '#f0bb2a' }}>QUESTION {i + 1} SUR {questions.length}</span>
        <span className="text-xs font-bold" style={{ color: '#86efac' }}>{score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}</span>
      </div>
      <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
        <div className="h-full rounded-full" style={{ width: `${100 * i / questions.length}%`, background: 'linear-gradient(90deg,#d4a017,#f0bb2a)', transition: 'width .3s' }} />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        {q.visuel && <div className="bg-white rounded-2xl p-3 flex-shrink-0"><Visuel item={q.visuel} taille={110} /></div>}
        <div className="text-lg font-extrabold text-center sm:text-left">{q.q}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
        {q.reponses.map(r => {
          const bonne = choix && r === q.bonne, fausse = choix === r && r !== q.bonne
          return (
            <button key={r} type="button" onClick={() => repondre(r)} disabled={!!choix}
              className="px-3 py-3 rounded-xl text-sm font-bold text-white cursor-pointer text-center"
              style={{ borderRadius: 12, border: `1.5px solid ${bonne ? '#22c55e' : fausse ? '#ef4444' : 'rgba(255,255,255,.25)'}`,
                background: bonne ? '#16a34a' : fausse ? '#b91c1c' : 'rgba(255,255,255,.08)', opacity: choix && !bonne && !fausse ? .6 : 1 }}>
              {bonne && '✓ '}{fausse && '✗ '}{r}
            </button>
          )
        })}
      </div>
      {choix && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          <div className="flex-1 text-sm" style={{ color: '#bfdbfe' }}>
            {choix === q.bonne ? '👍 Bonne réponse.' : <>La bonne réponse : <b className="text-white">{q.bonne}</b>.</>} {q.explication}
          </div>
          <button type="button" onClick={suivante} className="px-5 py-2.5 rounded-full font-bold border-0 cursor-pointer flex-shrink-0" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
            {i + 1 < questions.length ? 'Question suivante' : 'Voir mon résultat'} <i className="bi bi-arrow-right ms-1" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Un chapitre : Leçon · Panneaux · Quiz ── */
function Chapitre({ ch, total, onRetour, onResultat, onSuivant, suivantLibelle }) {
  const [onglet, setOnglet] = useState('lecon')
  const [sel, setSel] = useState(ch.panneaux[0])
  const questions = useMemo(() => questionsChapitre(ch), [ch])
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl px-4 sm:px-5 py-4 flex flex-wrap items-center gap-3" style={carte}>
        <button type="button" onClick={onRetour} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Chapitres</button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <IconeChapitre ch={ch} taille={40} />
          <div className="min-w-0">
            <div className="font-extrabold text-lg leading-tight" style={{ color: '#1e3a5f' }}>{ch.titre}</div>
            <div className="text-xs text-slate-500">Chapitre {ch.numero} sur {total} · {ch.panneaux.length} {ch.panneaux[0]?.marquage ? 'marquages' : 'panneaux'}</div>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-full w-full sm:w-auto" style={{ background: '#f1f5f9' }}>
          {[['lecon', 'Leçon'], ['panneaux', ch.panneaux[0]?.marquage ? 'Marquages' : 'Panneaux'], ['quiz', 'Quiz']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setOnglet(k)} className="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-extrabold border-0 cursor-pointer" style={{ borderRadius: 999 }}
              style={onglet === k ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }}>{l}</button>
          ))}
        </div>
      </div>

      {onglet === 'lecon' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4" style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', border: '1.5px solid #fde68a' }}>
            <div className="flex-shrink-0 self-center"><IconeChapitre ch={ch} taille={84} /></div>
            <div className="min-w-0">
              <div className="font-extrabold" style={{ color: '#92400e' }}>À retenir</div>
              <ul className="mt-2 mb-0 ps-0 space-y-2" style={{ listStyle: 'none' }}>
                {ch.aRetenir.map(t => (
                  <li key={t} className="flex gap-2 text-sm" style={{ color: '#78350f' }}>
                    <i className="bi bi-check-circle-fill flex-shrink-0 mt-0.5" style={{ color: '#d4a017' }} />{t}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => lire(ch.aRetenir.join(' '))} className="mt-3 px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: '#e0f2fe', color: '#0369a1' }}>
                <i className="bi bi-volume-up-fill me-1" />Écouter
              </button>
            </div>
          </div>
          {ch.piege && (
            <div className="rounded-2xl px-5 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.2rem' }} /><span><b>Piège d'examen :</b> {ch.piege}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            <button type="button" onClick={() => setOnglet('panneaux')} className="px-5 py-2.5 rounded-full font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff' }}>
              Voir les {ch.panneaux[0]?.marquage ? 'marquages' : 'panneaux'} <i className="bi bi-arrow-right ms-1" />
            </button>
          </div>
        </div>
      )}

      {onglet === 'panneaux' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {ch.panneaux.map(pa => (
              <button key={pa.id} type="button" onClick={() => setSel(pa)}
                className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer text-center transition-all"
                style={{ borderRadius: 16, border: sel?.id === pa.id ? '2px solid #1e3a5f' : '1px solid #e8edf4', boxShadow: sel?.id === pa.id ? '0 8px 22px rgba(30,58,95,.18)' : '0 2px 8px rgba(15,34,64,.05)' }}>
                <Visuel item={pa} taille={74} />
                <span className="text-xs font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{pa.nom}</span>
              </button>
            ))}
          </div>
          {sel && (
            <div className="bg-white rounded-2xl p-5 lg:sticky lg:top-4" style={carte}>
              <div className="flex justify-center rounded-2xl py-4" style={{ background: '#f8fafc' }}><Visuel item={sel} taille={140} /></div>
              <div className="font-extrabold text-lg mt-4" style={{ color: '#1e3a5f' }}>{sel.nom}</div>
              <div className="text-sm text-slate-600 mt-1">{sel.sens}</div>
              <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: '#f0fdf4', color: '#166534' }}>
                <b><i className="bi bi-hand-index-thumb-fill me-1" />Ce qu'il faut faire :</b> {sel.action}
              </div>
              {sel.piege && <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: '#fef9c3', color: '#854d0e' }}><b>⚠ Piège :</b> {sel.piege}</div>}
              <button type="button" onClick={() => lire(`${sel.nom}. ${sel.sens} ${sel.action}`)} className="mt-3 px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: '#e0f2fe', color: '#0369a1' }}>
                <i className="bi bi-volume-up-fill me-1" />Écouter
              </button>
            </div>
          )}
          <div className="lg:col-span-2 flex justify-end">
            <button type="button" onClick={() => setOnglet('quiz')} className="px-5 py-2.5 rounded-full font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
              Passer le quiz ({questions.length} questions) <i className="bi bi-arrow-right ms-1" />
            </button>
          </div>
        </div>
      )}

      {onglet === 'quiz' && <Quiz key={ch.id} questions={questions} onFini={(s, t) => onResultat(ch.id, s, t)} onSuivant={onSuivant} suivantLibelle={suivantLibelle} />}
    </div>
  )
}

/* ── Parcours : les 7 chapitres de la Signalisation ──
   Élève : progression enregistrée (meilleure note), chapitres débloqués dans l'ordre (70 % pour
   valider). Admin et moniteurs : tout est ouvert, rien n'est enregistré. */
export default function SignalisationCours({ eleve = false, onRetour, chapitre, onOuvrirChapitre, onFermerChapitre }) {
  const [progression, setProgression] = useState({})
  const [ouvertLocal, setOuvertLocal] = useState(null)   // id de chapitre, quand l'URL ne le porte pas
  const tous = [...CHAPITRES, REVISION]
  const demande = onOuvrirChapitre ? chapitre : ouvertLocal
  const ouvert = tous.some(c => c.id === demande) ? demande : null
  const setOuvert = id => {
    window.scrollTo?.({ top: 0 })
    if (!onOuvrirChapitre) return setOuvertLocal(id)
    if (id) onOuvrirChapitre(id); else onFermerChapitre?.()
  }
  useEffect(() => {
    if (!eleve) return
    api('GET', '/eleve/code/progression').then(l => setProgression(Object.fromEntries((l || []).map(x => [x.chapitre, x])))).catch(() => {})
  }, [eleve])
  const reussi = id => !!progression[id]?.reussi
  const debloque = idx => !eleve || idx === 0 || (idx < CHAPITRES.length ? reussi(CHAPITRES[idx - 1].id) : CHAPITRES.every(c => reussi(c.id)))
  const valides = tous.filter(c => reussi(c.id)).length
  const questionsRev = useMemo(() => questionsRevision(), [ouvert])   // eslint-disable-line react-hooks/exhaustive-deps -- nouveau tirage à chaque ouverture

  const resultat = async (chapitre, score, total) => {
    if (!eleve) return
    try { const p = await api('POST', '/eleve/code/progression', { chapitre, score, total }); setProgression(pr => ({ ...pr, [chapitre]: p })) }
    catch { toast('Résultat non enregistré : vérifiez votre connexion', 'warning') }
  }

  const idx = tous.findIndex(c => c.id === ouvert)
  const suivant = idx >= 0 && idx + 1 < tous.length ? tous[idx + 1] : null
  if (ouvert === REVISION.id) return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3" style={carte}>
        <button type="button" onClick={() => setOuvert(null)} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Chapitres</button>
        <div><div className="font-extrabold text-lg" style={{ color: '#1e3a5f' }}>{REVISION.titre}</div><div className="text-xs text-slate-500">{REVISION.nombre} questions mélangées sur tous les chapitres</div></div>
      </div>
      <Quiz key={questionsRev[0]?.id} questions={questionsRev} onFini={(s, t) => resultat(REVISION.id, s, t)} />
    </div>
  )
  if (ouvert) {
    const ch = CHAPITRES.find(c => c.id === ouvert)
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <Chapitre key={ch.id} ch={ch} total={tous.length} onRetour={() => setOuvert(null)} onResultat={resultat}
          onSuivant={suivant ? () => setOuvert(suivant.id) : null} suivantLibelle={suivant ? `Chapitre ${suivant.numero} : ${suivant.titre}` : ''} />
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {onRetour && <div><button type="button" onClick={onRetour} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Retour</button></div>}
      <div className="rounded-2xl overflow-hidden relative text-white px-6 py-6" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 55%,#2a4f7c)', boxShadow: '0 8px 28px rgba(15,34,64,.25)' }}>
        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
        <div className="absolute hidden sm:flex gap-3 right-6 top-5" style={{ transform: 'rotate(-8deg)' }} aria-hidden="true">
          {['A14', 'B14', 'B21-1'].map(c => <img key={c} src={`/panneaux/${c}.svg`} alt="" width="58" height="58" />)}
        </div>
        <div className="text-[11px] font-extrabold tracking-widest" style={{ color: '#f0bb2a' }}>COURS DE CODE · SIGNALISATION</div>
        <h2 className="text-3xl font-black m-0 mt-1">Signalisation</h2>
        <p className="text-sm m-0 mt-1 max-w-lg" style={{ color: '#bfdbfe' }}>Lire et comprendre chaque panneau et chaque marquage au sol, chapitre par chapitre, avec un quiz pour valider.</p>
        {eleve && (
          <div className="flex items-center gap-3 mt-4 max-w-xl">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
              <div className="h-full rounded-full" style={{ width: `${100 * valides / tous.length}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)', transition: 'width .5s' }} />
            </div>
            <b className="text-sm whitespace-nowrap">{valides} / {tous.length} chapitres</b>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {tous.map((ch, i) => {
          const ouvertOk = debloque(i), fait = reussi(ch.id), p = progression[ch.id]
          const enCours = eleve && ouvertOk && !fait && (i === 0 || debloque(i))
          const sous = ch.id === REVISION.id ? ch.resume : `${ch.panneaux.length} ${ch.panneaux[0]?.marquage ? 'marquages' : 'panneaux'} · ${ch.resume}`
          return (
            <button key={ch.id} type="button" disabled={!ouvertOk} onClick={() => setOuvert(ch.id)}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-4 text-left w-full border-0 cursor-pointer transition-all"
              style={{ borderRadius: 16, ...carte, border: enCours ? '2px solid #d4a017' : fait ? '1px solid #bbf7d0' : '1px solid #eef2f7', boxShadow: enCours ? '0 8px 24px rgba(212,160,23,.22)' : carte.boxShadow, opacity: ouvertOk ? 1 : .6, cursor: ouvertOk ? 'pointer' : 'not-allowed' }}>
              <div className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{ background: '#f8fafc' }}><IconeChapitre ch={ch} taille={44} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{ch.numero} · {ch.titre}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{sous}{p ? ` · meilleure note ${p.meilleurScore}/${p.total}` : ''}</div>
              </div>
              {fait ? <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: '#dcfce7', color: '#15803d' }}>✓ Validé</span>
                : !ouvertOk ? <span className="text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: '#f1f5f9', color: '#94a3b8' }}><i className="bi bi-lock-fill" /></span>
                : <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{p ? 'Reprendre' : 'Commencer'} →</span>}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-slate-400 text-center m-0">
        Dessins des panneaux : Wikimedia Commons, licences <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener noreferrer" className="text-slate-400">CC BY-SA</a> (auteurs : Roulex 45, Gigillo83, Jcrovetti et contributeurs).
      </p>
    </div>
  )
}
