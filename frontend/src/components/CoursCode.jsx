import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import MarquageSol from './MarquageSol'
import SchemaPriorite from './SchemaPriorite'
import { Picto, Voyant } from './Pictos'
import { SEUIL_REUSSITE, questionsChapitre, questionsRevision } from '../contenu/signalisation'
import { THEMES_CODE } from '../contenu/themes'
import { ouverturesCode } from '../contenu/programme'
import { genre, estScene, lire } from './coursOutils'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

/* Visuel d'un panneau (dessin officiel), d'un marquage au sol, d'un schéma de priorité, d'un
   voyant ou d'un pictogramme (dessinés). */
export function Visuel({ item, taille = 72 }) {
  if (item.marquage) return <MarquageSol type={item.marquage} taille={taille} />
  if (item.voyant) return <Voyant type={item.voyant} taille={taille} />
  if (item.picto) return <Picto {...item.picto} taille={taille} />
  if (item.dessin) return <SchemaPriorite type={item.dessin} taille={taille} />
  return <img src={item.image} alt={item.nom} width={taille} height={taille} style={{ objectFit: 'contain', flexShrink: 0 }} loading="lazy" />
}
/* Icône d'un chapitre ou élément de décor : chemin d'image, « marquage:… », « dessin:… »,
   « voyant:… », code de panneau, ou pictogramme { icone, couleur }. */
function Decor({ v, taille }) {
  if (typeof v === 'object') return <Picto {...v} taille={taille} />
  if (v.startsWith('voyant')) return <Voyant type={v.replace(/^voyant[:-]/, '')} taille={taille} />
  return <img src={v.startsWith('/') ? v : `/panneaux/${v}.svg`} alt="" width={taille} height={taille} style={{ objectFit: 'contain' }} />
}
export function IconeChapitre({ ch, taille = 46 }) {
  if (typeof ch.icone === 'object' || ch.icone.startsWith('voyant:')) return <Decor v={ch.icone} taille={taille} />
  if (ch.icone.startsWith('marquage:')) return <MarquageSol type={ch.icone.slice(9)} taille={taille} />
  if (ch.icone.startsWith('dessin:')) return <SchemaPriorite type={ch.icone.slice(7)} taille={taille} />
  return <img src={ch.icone} alt="" width={taille} height={taille} style={{ objectFit: 'contain' }} />
}

const majuscule = t => t[0].toUpperCase() + t.slice(1)


/* ── Quiz d'un chapitre, de la révision ou d'une séance ──
   onFini(score, total, erreurs) : erreurs = « question → bonne réponse (répondu : …) ». */
export function Quiz({ questions, onFini, onSuivant, suivantLibelle, texteValide = 'Chapitre validé, bravo !' }) {
  const [i, setI] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)
  const [erreurs, setErreurs] = useState([])
  const [fini, setFini] = useState(false)
  const q = questions[i]
  const repondre = (r) => {
    if (choix) return
    setChoix(r)
    if (r === q.bonne) setScore(s => s + 1)
    // Pour le moniteur : panneau confondu, ou question de règle avec la bonne réponse
    else setErreurs(e => [...e, /:q\d+$/.test(q.id) ? `${q.q} → ${q.bonne} (répondu : ${r})` : `« ${q.bonne} » confondu avec « ${r} »`])
  }
  const suivante = () => {
    if (i + 1 < questions.length) { setI(i + 1); setChoix(null) }
    else { setFini(true); onFini?.(score, questions.length, erreurs) }
  }
  const recommencer = () => { setI(0); setChoix(null); setScore(0); setErreurs([]); setFini(false) }

  if (fini) {
    const reussi = score >= Math.ceil(SEUIL_REUSSITE * questions.length)
    return (
      <div className="rounded-2xl p-6 text-center text-white" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '5px solid #d4a017' }}>
        <div style={{ fontSize: 52 }}>{reussi ? '🏆' : '💪'}</div>
        <div className="text-3xl font-black mt-1">{score} / {questions.length}</div>
        <div className="mt-1 font-bold" style={{ color: reussi ? '#86efac' : '#fcd34d' }}>
          {reussi ? texteValide : `Il faut ${Math.ceil(SEUIL_REUSSITE * questions.length)} bonnes réponses pour valider : réessayez !`}
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
        {q.visuel && <div className="bg-white rounded-2xl p-3 flex-shrink-0"><Visuel item={q.visuel} taille={estScene(q.visuel) ? 230 : 110} /></div>}
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
function Chapitre({ ch, total, retourLibelle = 'Chapitres', onRetour, onResultat, onSuivant, suivantLibelle }) {
  const [onglet, setOnglet] = useState('lecon')
  const [sel, setSel] = useState(ch.panneaux[0])
  const questions = useMemo(() => questionsChapitre(ch), [ch])
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl px-4 sm:px-5 py-4 flex flex-wrap items-center gap-3" style={carte}>
        <button type="button" onClick={onRetour} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>{retourLibelle}</button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <IconeChapitre ch={ch} taille={40} />
          <div className="min-w-0">
            <div className="font-extrabold text-lg leading-tight" style={{ color: '#1e3a5f' }}>{ch.titre}</div>
            <div className="text-xs text-slate-500">Chapitre {ch.numero} sur {total} · {ch.panneaux.length} {genre(ch)}{ch.partiel ? ' ouverts par votre moniteur' : ''}</div>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-full w-full sm:w-auto" style={{ background: '#f1f5f9' }}>
          {[['lecon', 'Leçon'], ['panneaux', majuscule(genre(ch))], ['quiz', 'Quiz']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setOnglet(k)} className="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-sm font-extrabold border-0 cursor-pointer"
              style={{ borderRadius: 999, ...(onglet === k ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>{l}</button>
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
              Voir les {genre(ch)} <i className="bi bi-arrow-right ms-1" />
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
              <div className="flex justify-center rounded-2xl py-4" style={{ background: '#f8fafc' }}><Visuel item={sel} taille={estScene(sel) ? 230 : 140} /></div>
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
              {ch.partiel ? 'Quiz' : `Passer le quiz (${questions.length} questions)`} <i className="bi bi-arrow-right ms-1" />
            </button>
          </div>
        </div>
      )}

      {onglet === 'quiz' && ch.partiel && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3 text-sm" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#1e3a8a' }}>
          <i className="bi bi-info-circle-fill" style={{ fontSize: '1.2rem' }} />
          <span>Votre moniteur n'a ouvert qu'une partie de ce chapitre : le quiz du chapitre s'ouvrira avec la suite. En attendant, passez le quiz de votre séance dans « Mes séances ».</span>
        </div>
      )}
      {onglet === 'quiz' && !ch.partiel && <Quiz key={ch.id} questions={questions} onFini={(s, t) => onResultat(ch.id, s, t)} onSuivant={onSuivant} suivantLibelle={suivantLibelle} />}
    </div>
  )
}


/* Auteurs des dessins de panneaux : la licence CC BY-SA demande de les citer. Discret : un mot
   « Crédits » qui les affiche au clic. */
function Credits() {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div className="text-center">
      <button type="button" onClick={() => setOuvert(o => !o)} className="bg-transparent border-0 p-0 cursor-pointer text-[11px] text-slate-400 hover:text-slate-500">
        <i className="bi bi-info-circle me-1" />Crédits
      </button>
      {ouvert && (
        <p className="text-[11px] text-slate-400 m-0 mt-1">
          Dessins des panneaux : Wikimedia Commons, licences <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener noreferrer" className="text-slate-400">CC BY-SA</a> (Roulex 45, Gigillo83, Jcrovetti, Grondin et contributeurs).
        </p>
      )}
    </div>
  )
}

const btnRetour = (onClick, libelle) => (
  <button type="button" onClick={onClick} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>{libelle}</button>
)

/* Bandeau bleu nuit souligné d'or, panneaux en décor à droite. */
function Bandeau({ surtitre, titre, texte, decor, children }) {
  return (
    <div className="rounded-2xl overflow-hidden relative text-white px-6 py-6" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 55%,#2a4f7c)', boxShadow: '0 8px 28px rgba(15,34,64,.25)' }}>
      <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
      <div className="absolute hidden sm:flex gap-3 right-6 top-5" style={{ transform: 'rotate(-8deg)' }} aria-hidden="true">
        {decor.map((c, i) => <Decor key={i} v={c} taille={58} />)}
      </div>
      <div className="text-[11px] font-extrabold tracking-widest" style={{ color: '#f0bb2a' }}>{surtitre}</div>
      <h2 className="text-3xl font-black m-0 mt-1">{titre}</h2>
      <p className="text-sm m-0 mt-1 max-w-lg" style={{ color: '#bfdbfe' }}>{texte}</p>
      {children}
    </div>
  )
}
function Progres({ valides, total }) {
  return (
    <div className="flex items-center gap-3 mt-4 max-w-xl">
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
        <div className="h-full rounded-full" style={{ width: `${100 * valides / total}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)', transition: 'width .5s' }} />
      </div>
      <b className="text-sm whitespace-nowrap">{valides} / {total} chapitres</b>
    </div>
  )
}

/* ── Parcours d'un thème : ses chapitres puis la révision finale ──
   Élève : chapitres débloqués dans l'ordre (70 % pour valider), ou, pour les cours de code,
   ouverts par les séances de son moniteur (ouvertures) ; un chapitre déjà validé reste ouvert.
   Admin et moniteurs : tout ouvert. */
function Parcours({ theme, eleve, progression, ouvertures, onOuvrir, onRetour }) {
  const tous = [...theme.chapitres, theme.revision]
  const reussi = id => !!progression[id]?.reussi
  const debloque = i => !eleve || (ouvertures ? !!ouvertures[tous[i].id] || reussi(tous[i].id)
    : i === 0 || (i < theme.chapitres.length ? reussi(theme.chapitres[i - 1].id) : theme.chapitres.every(c => reussi(c.id))))
  const o = ch => ouvertures?.[ch.id]
  const partiel = ch => !!o(ch) && !o(ch).complet && !reussi(ch.id)
  return (
    <div className="space-y-4">
      <div>{btnRetour(onRetour, 'Thèmes')}</div>
      <Bandeau surtitre={`COURS DE CODE · THÈME ${theme.numero}`} titre={theme.titre} texte={theme.description} decor={theme.decor}>
        {eleve && <Progres valides={tous.filter(c => reussi(c.id)).length} total={tous.length} />}
        {eleve && ouvertures && <div className="text-xs mt-3" style={{ color: '#bfdbfe' }}><i className="bi bi-unlock-fill me-1" />Votre moniteur ouvre les chapitres au fil des séances.</div>}
      </Bandeau>
      <div className="flex flex-col gap-3">
        {tous.map((ch, i) => {
          const ouvertOk = debloque(i), fait = reussi(ch.id), p = progression[ch.id]
          const enCours = eleve && ouvertOk && !fait
          const sous = ch === theme.revision ? ch.resume
            : partiel(ch) ? `${o(ch).numeros.size} ${genre(ch)} sur ${ch.panneaux.length} ouverts · ${ch.resume}`
            : `${ch.panneaux.length} ${genre(ch)} · ${ch.resume}`
          return (
            <button key={ch.id} type="button" disabled={!ouvertOk} onClick={() => onOuvrir(ch.id)}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-4 text-left w-full border-0 cursor-pointer transition-all"
              style={{ borderRadius: 16, ...carte, border: enCours ? '2px solid #d4a017' : fait ? '1px solid #bbf7d0' : '1px solid #eef2f7', boxShadow: enCours ? '0 8px 24px rgba(212,160,23,.22)' : carte.boxShadow, opacity: ouvertOk ? 1 : .6, cursor: ouvertOk ? 'pointer' : 'not-allowed' }}>
              <div className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center" style={{ background: '#f8fafc' }}><IconeChapitre ch={ch} taille={44} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{ch === theme.revision ? ch.numero : `${theme.numero}.${ch.numero}`} · {ch.titre}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{sous}{p ? ` · meilleure note ${p.meilleurScore}/${p.total}` : ''}</div>
              </div>
              {fait ? <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: '#dcfce7', color: '#15803d' }}>✓ Validé</span>
                : !ouvertOk ? <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: '#f1f5f9', color: '#94a3b8' }} title={ouvertures ? 'Pas encore publié par votre moniteur' : 'Validez le chapitre précédent'}><i className="bi bi-lock-fill" />{ouvertures && <span className="hidden sm:inline ms-1">Bientôt</span>}</span>
                : <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{p ? 'Reprendre' : 'Commencer'} →</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Cours de code : choix du thème, puis son parcours, puis un chapitre ──
   `chapitre` (adresse …/cours/<clé>) est la clé d'un thème ou l'identifiant d'un chapitre,
   unique entre thèmes. Sans onOuvrirChapitre, la navigation reste interne au composant. */
const ENTETE_CODE = { titre: 'Cours de code', decor: ['A14', 'AB4', 'B14'],
  texte: 'Choisissez un thème : chaque chapitre a une leçon, des exemples et un quiz pour valider.' }

/* themes / entete : par défaut les cours de code ; l'onglet Cours Conduite passe ses propres thèmes. */
export default function CoursCode({ eleve = false, onRetour, chapitre, onOuvrirChapitre, onFermerChapitre, themes = THEMES_CODE, entete = ENTETE_CODE }) {
  const [progression, setProgression] = useState({})
  const [ouvertures, setOuvertures] = useState(null)   // élève, cours de code : ce que ses séances ouvrent
  const [ouvertLocal, setOuvertLocal] = useState(null)
  const parSeances = eleve && themes === THEMES_CODE
  const cle = onOuvrirChapitre ? chapitre : ouvertLocal
  const aller = id => {
    window.scrollTo?.({ top: 0 })
    if (!onOuvrirChapitre) return setOuvertLocal(id)
    if (id) onOuvrirChapitre(id); else onFermerChapitre?.()
  }
  useEffect(() => {
    if (!eleve) return
    api('GET', '/eleve/code/progression').then(l => setProgression(Object.fromEntries((l || []).map(x => [x.chapitre, x])))).catch(() => {})
  }, [eleve])
  useEffect(() => {
    if (!parSeances) return
    api('GET', '/eleve/seances').then(l => setOuvertures(ouverturesCode(l))).catch(() => setOuvertures({}))
  }, [parSeances])
  const resultat = async (id, score, total) => {
    if (!eleve) return
    try { const p = await api('POST', '/eleve/code/progression', { chapitre: id, score, total }); setProgression(pr => ({ ...pr, [id]: p })) }
    catch { toast('Résultat non enregistré : vérifiez votre connexion', 'warning') }
  }

  const theme = themes.find(t => t.key === cle || t.revision.id === cle || t.chapitres.some(c => c.id === cle))
  const tous = theme ? [...theme.chapitres, theme.revision] : []
  const idx = tous.findIndex(c => c.id === cle)
  const questionsRev = useMemo(() => theme && cle === theme.revision.id ? questionsRevision(theme.chapitres, theme.revision.nombre) : [], [cle])   // eslint-disable-line react-hooks/exhaustive-deps -- nouveau tirage à chaque ouverture
  const police = { fontFamily: 'Inter, system-ui, sans-serif' }

  if (parSeances && !ouvertures) return null   // séances en chargement
  // Chapitre fermé (adresse tapée ou ancien lien) : retour au thème
  const ferme = c => parSeances && !ouvertures[c.id] && !progression[c.id]?.reussi

  if (theme && cle === theme.revision.id && !ferme(theme.revision)) return (
    <div className="space-y-4" style={police}>
      <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3" style={carte}>
        {btnRetour(() => aller(theme.key), theme.titre)}
        <div><div className="font-extrabold text-lg" style={{ color: '#1e3a5f' }}>{theme.revision.titre} · {theme.titre}</div><div className="text-xs text-slate-500">{theme.revision.nombre} questions mélangées sur tous les chapitres</div></div>
      </div>
      <Quiz key={questionsRev[0]?.id} questions={questionsRev} onFini={(s, t) => resultat(theme.revision.id, s, t)} />
    </div>
  )
  if (theme && idx >= 0 && ferme(tous[idx])) return <div style={police}><Parcours theme={theme} eleve={eleve} progression={progression} ouvertures={ouvertures} onOuvrir={aller} onRetour={() => aller(null)} /></div>
  if (theme && idx >= 0) {
    const brut = tous[idx], o = parSeances && ouvertures[brut.id]
    // Une partie seulement du chapitre est ouverte : ses panneaux, sans le quiz du chapitre
    const ch = o && !o.complet && !progression[brut.id]?.reussi && brut !== theme.revision
      ? { ...brut, partiel: true, panneaux: brut.panneaux.filter((_, i) => o.numeros.has(i + 1)) } : brut
    const suivant = tous[idx + 1] && !ferme(tous[idx + 1]) ? tous[idx + 1] : null
    return (
      <div style={police}>
        <Chapitre key={ch.id} ch={ch} total={tous.length} retourLibelle={theme.titre} onRetour={() => aller(theme.key)} onResultat={resultat}
          onSuivant={suivant ? () => aller(suivant.id) : null} suivantLibelle={suivant ? `Chapitre ${suivant.numero} : ${suivant.titre}` : ''} />
      </div>
    )
  }
  if (theme) return <div style={police}><Parcours theme={theme} eleve={eleve} progression={progression} ouvertures={parSeances ? ouvertures : null} onOuvrir={aller} onRetour={() => aller(null)} /></div>

  return (
    <div className="space-y-4" style={police}>
      {onRetour && <div>{btnRetour(onRetour, 'Retour')}</div>}
      <Bandeau surtitre="AUTO-ÉCOLE KHADIJA" titre={entete.titre} decor={entete.decor} texte={entete.texte} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {themes.map(t => {
          const liste = [...t.chapitres, t.revision], valides = liste.filter(c => progression[c.id]?.reussi).length
          return (
            <button key={t.key} type="button" onClick={() => aller(t.key)}
              className="bg-white text-left w-full cursor-pointer overflow-hidden transition-all p-0"
              style={{ borderRadius: 20, ...carte }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,34,64,.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = carte.boxShadow }}>
              <div className="flex items-center justify-center gap-3" style={{ height: 120, background: 'linear-gradient(135deg,#f8fafc,#eef2f7)' }}>
                {t.decor.map((c, i) => <Decor key={i} v={c} taille={i === 1 ? 74 : 56} />)}
              </div>
              <div className="px-5 py-4">
                <div className="text-[11px] font-extrabold tracking-widest" style={{ color: '#a16207' }}>THÈME {t.numero}</div>
                <div className="text-xl font-black" style={{ color: '#1e3a5f' }}>{t.titre}</div>
                <div className="text-sm text-slate-500 mt-1">{t.description}</div>
                <div className="flex items-center gap-3 mt-4">
                  {eleve
                    ? <><div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}><div className="h-full rounded-full" style={{ width: `${100 * valides / liste.length}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)' }} /></div>
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{valides} / {liste.length}</span></>
                    : <span className="flex-1 text-xs font-bold text-slate-500">{liste.length} chapitres</span>}
                  <span className="text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>Ouvrir →</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <Credits />
    </div>
  )
}
