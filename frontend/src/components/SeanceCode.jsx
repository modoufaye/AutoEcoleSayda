import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { EnteteListe, AvatarRond, Pastille, ListeVide, ListeChargement } from './ListeModerne'
import { Visuel, IconeChapitre, Quiz } from './CoursCode'
import { genre, estScene } from './coursOutils'
import { afficherTelephone } from '../telephones'
import BoutonEcouter, { BoutonWolof } from './BoutonEcouter'
import { useAudiosWolof, clePanneau } from './audiosWolof'
import { chargerQuiz } from './sauvegardeQuiz'
import { SEUIL_REUSSITE } from '../contenu/signalisation'
import { COURS, trouverChapitre, numeroChapitre, complete, panneauxPartie, libellePartie, questionsPartie, questionsSeance, QUESTIONS_MAX } from '../contenu/programme'

/* Cours (code ou conduite) publiés dans une séance : le moniteur choisit thème, chapitre et numéros de
   panneaux (ChoixProgramme) ; l'élève les étudie et passe le quiz de la séance (ProgrammeEleve) ;
   le moniteur suit les résultats (ResultatsQuiz). */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const champ = { minHeight: 42, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '0 12px', fontSize: '.9rem', width: '100%', color: '#1e293b' }
const libelle = { display: 'block', fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: 4 }
const dateCourte = d => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/* Petits visuels des panneaux d'une partie (aperçu). */
function Apercu({ partie, max = 10 }) {
  const t = trouverChapitre(partie.chapitre)
  if (!t || t.revision) return null
  const liste = panneauxPartie(t.ch, partie)
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {liste.slice(0, max).map(pa => (
        <span key={pa.id} title={`n° ${pa.numero} · ${pa.nom}`} className="relative inline-flex items-center justify-center rounded-lg bg-white" style={{ width: 38, height: 38, border: '1px solid #e2e8f0' }}>
          <Visuel item={pa} taille={30} />
          <span className="absolute font-black" style={{ top: -6, right: -6, fontSize: '.6rem', background: '#1e3a5f', color: '#fff', borderRadius: 999, padding: '0 4px', lineHeight: '14px' }}>{pa.numero}</span>
        </span>
      ))}
      {liste.length > max && <span className="text-xs font-bold text-slate-400">+{liste.length - max}</span>}
    </div>
  )
}

/* ── Moniteur : choisir les parties de cours (code ou conduite) à publier dans la séance ── */
export function ChoixProgramme({ programme, onChange, dateHeure, onDateHeure, onCours }) {
  const [coursKey, setCoursKey] = useState('code')
  const themes = COURS.find(c => c.key === coursKey).themes
  const [themeKey, setThemeKey] = useState(themes[0].key)
  const theme = themes.find(t => t.key === themeKey) || themes[0]
  const [chapitre, setChapitre] = useState(theme.chapitres[0].id)
  const t = trouverChapitre(chapitre)
  const nb = t && !t.revision ? t.ch.panneaux.length : 0
  const [etendue, setEtendue] = useState('tout')   // 'tout' ou 'partie'
  const [de, setDe] = useState(1)
  const [a, setA] = useState(nb)

  const choisirCours = k => {
    const th = COURS.find(c => c.key === k).themes[0]
    setCoursKey(k); setThemeKey(th.key); choisirChapitre(th.chapitres[0].id)
    onCours?.(k)   // la séance sait si l'on prépare du code ou de la conduite (élèves proposés)
  }
  const choisirTheme = k => {
    const th = themes.find(x => x.key === k)
    setThemeKey(k); choisirChapitre(th.chapitres[0].id)
  }
  const choisirChapitre = id => {
    const x = trouverChapitre(id)
    setChapitre(id); setEtendue('tout'); setDe(1); setA(x && !x.revision ? x.ch.panneaux.length : 0)
  }
  const partie = etendue === 'tout' || t?.revision ? { chapitre, de: null, a: null } : { chapitre, de: Math.min(de, a), a: Math.max(de, a) }
  const nbQuestions = questionsPartie(partie).length
  const deja = programme.some(p => p.chapitre === partie.chapitre && p.de === partie.de && p.a === partie.a)
  const ajouter = () => { if (!deja) onChange([...programme, partie]) }
  const retirer = i => onChange(programme.filter((_, j) => j !== i))
  const totalQuestions = Math.min(QUESTIONS_MAX, programme.reduce((n, p) => n + questionsPartie(p).length, 0))
  const liste = t && !t.revision ? panneauxPartie(t.ch, { de: null, a: null }) : []

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="signpost-split-fill" titre="Cours à publier" sousTitre="Date, cours, thème, chapitre et numéros · quiz à la fin" nombre={programme.length} />
      <div className="p-5 space-y-4">
        {onDateHeure && (
          <div>
            <label style={libelle}>Date et heure</label>
            <input type="datetime-local" style={champ} value={dateHeure || ''} onChange={e => onDateHeure(e.target.value)} />
          </div>
        )}
        <div>
          <label style={libelle}>Cours</label>
          <div className="grid grid-cols-2 gap-2">
            {COURS.map(c => (
              <button key={c.key} type="button" onClick={() => choisirCours(c.key)} className="flex items-center justify-center gap-2 text-sm font-extrabold cursor-pointer"
                style={{ minHeight: 42, borderRadius: 12, border: `1.5px solid ${coursKey === c.key ? '#d4a017' : '#e2e8f0'}`, background: coursKey === c.key ? '#fffbeb' : '#fff', color: '#1e3a5f' }}>
                <i className={`bi bi-${c.key === 'code' ? 'sign-turn-right-fill' : 'car-front-fill'}`} style={{ color: '#d4a017' }} />{c.titre}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label style={libelle}>Thème</label>
            <select style={champ} value={themeKey} onChange={e => choisirTheme(e.target.value)}>
              {themes.map(x => <option key={x.key} value={x.key}>Thème {x.numero} · {x.titre}</option>)}
            </select>
          </div>
          <div>
            <label style={libelle}>Chapitre</label>
            <select style={champ} value={chapitre} onChange={e => choisirChapitre(e.target.value)}>
              {theme.chapitres.map(c => <option key={c.id} value={c.id}>{numeroChapitre(theme, c)} · {c.titre} ({c.panneaux.length})</option>)}
              <option value={theme.revision.id}>{theme.revision.titre} du thème ({theme.revision.nombre} questions)</option>
            </select>
          </div>
        </div>

        {t && !t.revision && (
          <div className="rounded-xl p-3 space-y-3" style={{ background: '#f8fafc', border: '1px solid #eef2f7' }}>
            <div className="flex flex-wrap gap-2">
              {[['tout', `Tout le chapitre (${nb} ${genre(t.ch)})`], ['partie', 'Seulement les n°…']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setEtendue(k)} className="px-4 text-sm font-bold cursor-pointer"
                  style={{ minHeight: 36, borderRadius: 999, border: `1.5px solid ${etendue === k ? '#1e3a5f' : '#e2e8f0'}`, background: etendue === k ? '#1e3a5f' : '#fff', color: etendue === k ? '#fff' : '#475569' }}>
                  {l}
                </button>
              ))}
            </div>
            {etendue === 'partie' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={libelle}>Du n°</label>
                  <select style={champ} value={de} onChange={e => setDe(+e.target.value)}>
                    {liste.map(pa => <option key={pa.id} value={pa.numero}>{pa.numero} · {pa.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={libelle}>Au n°</label>
                  <select style={champ} value={a} onChange={e => setA(+e.target.value)}>
                    {liste.map(pa => <option key={pa.id} value={pa.numero}>{pa.numero} · {pa.nom}</option>)}
                  </select>
                </div>
              </div>
            )}
            <Apercu partie={partie} max={20} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={ajouter} disabled={deja}
            className="flex items-center gap-2 px-5 text-sm font-extrabold border-0 cursor-pointer"
            style={{ minHeight: 42, borderRadius: 999, background: deja ? '#e2e8f0' : 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: deja ? '#94a3b8' : '#fff' }}>
            <i className="bi bi-plus-lg" />{deja ? 'Déjà dans la séance' : 'Ajouter à la séance'}
          </button>
          <span className="text-xs text-slate-500">{nbQuestions} question{nbQuestions > 1 ? 's' : ''} au quiz pour cette partie</span>
        </div>

        <div style={{ borderTop: '1px solid #eef2f7' }} className="pt-3">
          {programme.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-3">Aucun cours dans cette séance · ajoutez une partie ci-dessus</div>
          ) : (
            <div className="space-y-2">
              {programme.map((p, i) => (
                <div key={`${p.chapitre}-${p.de}-${p.a}`} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ border: '1.5px solid #fde68a', background: '#fffbeb' }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{libellePartie(p)}</div>
                    <Apercu partie={p} />
                  </div>
                  <button type="button" onClick={() => retirer(i)} title="Retirer" className="w-8 h-8 rounded-full flex items-center justify-center border-0 cursor-pointer flex-shrink-0" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                    <i className="bi bi-x-lg" style={{ fontSize: '.75rem' }} />
                  </button>
                </div>
              ))}
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 pt-1">
                <i className="bi bi-patch-question-fill" style={{ color: '#d4a017' }} />
                Quiz de la séance : {totalQuestions} questions · validé à {Math.round(SEUIL_REUSSITE * 100)} %
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Moniteur : résultats du quiz, élève par élève ── */
/* mesEleves : séance de l'administration vue par un moniteur, qui n'y voit que ses élèves. */
export function ResultatsQuiz({ seanceId, mesEleves = false }) {
  const [liste, setListe] = useState(null)
  const [ouvert, setOuvert] = useState(null)
  useEffect(() => {
    api('GET', `/moniteur/seances/${seanceId}/resultats`).then(setListe).catch(e => { toast(e.message, 'danger'); setListe([]) })
  }, [seanceId])
  const faits = (liste || []).filter(x => x.resultat)
  const valides = faits.filter(x => x.resultat.reussi)

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="clipboard2-check-fill" titre={mesEleves ? 'Résultats du quiz · vos élèves' : 'Résultats du quiz'} sousTitre={liste ? `${faits.length} sur ${liste.length} ont passé le quiz · ${valides.length} validé${valides.length > 1 ? 's' : ''}` : 'Chargement…'} nombre={liste ? `${faits.length}/${liste.length}` : ''} />
      {!liste ? <ListeChargement /> : liste.length === 0 ? <ListeVide texte={mesEleves ? 'Aucun de vos élèves dans cette séance : cochez-les à gauche' : 'Aucun élève dans cette séance'} icone="people" /> : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {[...faits.sort((u, v) => v.resultat.derniereTentative.localeCompare(u.resultat.derniereTentative)), ...liste.filter(x => !x.resultat)].map(x => {
            const r = x.resultat, mots = (x.nom || '').split(' '), nom = mots.pop(), prenom = mots.join(' ')   // « Prénom Nom »
            const pct = r ? Math.round(100 * r.score / r.total) : 0
            const erreurs = r?.erreurs ? r.erreurs.split('\n') : []
            const deplie = ouvert === x.eleveId
            return (
              <div key={x.eleveId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => r && setOuvert(deplie ? null : x.eleveId)} disabled={!r}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-0 bg-white" style={{ cursor: r ? 'pointer' : 'default' }}>
                  <AvatarRond prenom={prenom} nom={nom} taille={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: '#1e3a5f' }}>{x.nom}</div>
                    {/* Numéro : distingue les homonymes (même prénom et nom) */}
                    {x.telephone && <div className="text-xs font-semibold text-slate-500"><i className="bi bi-telephone me-1" />{afficherTelephone(x.telephone)}</div>}
                    <div className="text-xs text-slate-400">
                      {r ? <>Dernier essai {r.score}/{r.total} ({pct} %) · meilleure note {r.meilleurScore}/{r.meilleurTotal} · {r.tentatives} essai{r.tentatives > 1 ? 's' : ''} · {dateCourte(r.derniereTentative)}</> : 'Pas encore passé'}
                    </div>
                  </div>
                  {!r ? <Pastille couleur="#64748b" fond="#f1f5f9">À faire</Pastille>
                    : r.reussi ? <Pastille couleur="#15803d" fond="#dcfce7">Assimilé</Pastille>
                    : <Pastille couleur="#b45309" fond="#fef3c7">À revoir</Pastille>}
                  {r && <i className={`bi bi-chevron-${deplie ? 'up' : 'down'} text-slate-400`} />}
                </button>
                {deplie && (
                  <div className="px-4 pb-3">
                    {erreurs.length === 0 ? (
                      <div className="text-sm rounded-xl px-3 py-2" style={{ background: '#f0fdf4', color: '#166534' }}><i className="bi bi-check-circle-fill me-1" />Aucune erreur au dernier essai.</div>
                    ) : (
                      <div className="rounded-xl px-3 py-2" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <div className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: '#9a3412' }}>Erreurs du dernier essai ({erreurs.length})</div>
                        <ul className="m-0 ps-3 space-y-1 text-sm" style={{ color: '#7c2d12' }}>
                          {erreurs.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Élève : une partie du cours (leçon, panneaux numérotés) ── */
function PartieEleve({ partie, rang }) {
  const t = trouverChapitre(partie.chapitre)
  const liste = useMemo(() => t && !t.revision ? panneauxPartie(t.ch, partie) : [], [partie]) // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState(null)
  const wolof = useAudiosWolof()
  if (!t) return null
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg,#f8fafc,#eef2f7)', borderBottom: '1px solid #eef2f7' }}>
        <span className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{rang}</span>
        <span className="hidden sm:inline-flex"><IconeChapitre ch={t.ch} taille={40} /></span>
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold tracking-widest" style={{ color: '#a16207' }}>{t.conduite ? 'CONDUITE · ' : ''}THÈME {t.theme.numero} · {t.theme.titre.toUpperCase()}</div>
          <div className="font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{libellePartie(partie)}</div>
          {!t.revision && !complete(partie) && <div className="text-xs text-slate-500">{liste.length} {genre(t.ch)} sur {t.ch.panneaux.length} dans ce chapitre</div>}
        </div>
      </div>
      {t.revision ? (
        <div className="px-5 py-4 text-sm text-slate-600"><i className="bi bi-arrow-repeat me-1" style={{ color: '#d4a017' }} />Révision : des questions mélangées sur tout le thème « {t.theme.titre} » vous attendent dans le quiz de la séance.</div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', border: '1.5px solid #fde68a' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-extrabold whitespace-nowrap" style={{ color: '#92400e' }}>À retenir</div>
              <div className="flex flex-wrap gap-1.5">
                <BoutonEcouter texte={t.ch.aRetenir.join(' ')} className="px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer" />
                {wolof[t.ch.id] && <BoutonWolof url={wolof[t.ch.id]} className="px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer" />}
              </div>
            </div>
            <ul className="mt-2 mb-0 ps-0 space-y-2" style={{ listStyle: 'none' }}>
              {t.ch.aRetenir.map(x => (
                <li key={x} className="flex gap-2 text-sm" style={{ color: '#78350f' }}><i className="bi bi-check-circle-fill flex-shrink-0 mt-0.5" style={{ color: '#d4a017' }} />{x}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {liste.map(pa => (
              <button key={pa.id} type="button" onClick={() => setSel(sel?.id === pa.id ? null : pa)}
                className="relative bg-white rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer text-center"
                style={{ borderRadius: 16, border: sel?.id === pa.id ? '2px solid #1e3a5f' : '1px solid #e8edf4', boxShadow: '0 2px 8px rgba(15,34,64,.05)' }}>
                <span className="absolute font-black" style={{ top: 8, left: 8, fontSize: '.68rem', background: '#1e3a5f', color: '#fff', borderRadius: 999, padding: '1px 7px' }}>{pa.numero}</span>
                {wolof[clePanneau(t.ch.id, pa.id)] && <span className="absolute w-6 h-6 rounded-full flex items-center justify-center text-[11px]" title="Explication en wolof" style={{ top: 6, right: 6, background: '#d1fae5', color: '#047857' }}><i className="bi bi-headphones" /></span>}
                <Visuel item={pa} taille={estScene(pa) ? 120 : 70} />
                <span className="text-xs font-extrabold leading-tight" style={{ color: '#1e3a5f' }}>{pa.nom}</span>
              </button>
            ))}
          </div>
          {sel && (
            <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-4" style={{ background: '#f8fafc', border: '1.5px solid #dbe2ec' }}>
              <div className="flex justify-center flex-shrink-0"><Visuel item={sel} taille={estScene(sel) ? 200 : 110} /></div>
              <div className="min-w-0">
                <div className="font-extrabold text-lg" style={{ color: '#1e3a5f' }}>n° {sel.numero} · {sel.nom}</div>
                {sel.sens && <div className="text-sm text-slate-600 mt-1">{sel.sens}</div>}
                {sel.action && <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: '#f0fdf4', color: '#166534' }}><b><i className="bi bi-hand-index-thumb-fill me-1" />Ce qu'il faut faire :</b> {sel.action}</div>}
                {sel.piege && <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: '#fef9c3', color: '#854d0e' }}><b>⚠ Piège :</b> {sel.piege}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <BoutonEcouter texte={`${sel.nom}. ${sel.sens || ''} ${sel.action || ''}`} className="px-3 py-1.5 rounded-full text-xs font-bold border-0 cursor-pointer" />
                  {wolof[clePanneau(t.ch.id, sel.id)] && <BoutonWolof url={wolof[clePanneau(t.ch.id, sel.id)]} />}
                </div>
              </div>
            </div>
          )}
          {t.ch.piege && complete(partie) && (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b' }}>
              <i className="bi bi-exclamation-triangle-fill" /><span><b>Piège d'examen :</b> {t.ch.piege}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Élève : cours de la séance puis son quiz (résultat envoyé au moniteur) ── */
export function ProgrammeEleve({ seance }) {
  const [resultat, setResultat] = useState(null)
  const sauvegarde = `seance:${seance.id}`
  const [quiz, setQuiz] = useState(0)   // 0 : fermé ; sinon numéro du tirage
  // Quiz commencé puis quitté (ici ou sur un autre appareil) : il se rouvre à la même question
  useEffect(() => { chargerQuiz(sauvegarde).then(x => { if (x) setQuiz(q => q || 1) }) }, [sauvegarde])
  const questions = useMemo(() => quiz ? questionsSeance(seance.programme) : [], [quiz, seance])
  useEffect(() => {
    api('GET', '/eleve/seances/resultats').then(l => setResultat((l || []).find(r => r.seanceId === seance.id) || null)).catch(() => {})
  }, [seance.id])
  const fini = async (score, total, erreurs) => {
    try { setResultat(await api('POST', `/eleve/seances/${seance.id}/quiz`, { score, total, erreurs })) }
    catch { toast('Résultat non enregistré : vérifiez votre connexion', 'warning') }
  }
  const nb = Math.min(QUESTIONS_MAX, seance.programme.reduce((n, p) => n + questionsPartie(p).length, 0))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: '#1e3a5f' }}>
        <i className="bi bi-signpost-split-fill" style={{ color: '#d4a017' }} />Cours de la séance
      </div>
      {seance.programme.map((p, i) => <PartieEleve key={`${p.chapitre}-${p.de}-${p.a}`} partie={p} rang={i + 1} />)}

      {quiz ? (
        <Quiz key={quiz} sauvegarde={sauvegarde} questions={questions} nouveauTirage={() => questionsSeance(seance.programme)} onFini={fini} texteValide="Bravo, séance validée ! 🎉 Vous progressez bien. Retrouvez vos prochaines séances dans l’onglet « Mes Séances »." />
      ) : (
        <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '5px solid #d4a017' }}>
          <div style={{ fontSize: 40 }}>{resultat?.reussi ? '🏆' : '📝'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black">Quiz de la séance</div>
            <div className="text-sm" style={{ color: '#bfdbfe' }}>
              {nb} questions sur ce que vous venez d'étudier · {Math.round(SEUIL_REUSSITE * 100)} % pour valider. Votre moniteur verra votre résultat.
            </div>
            {resultat && (
              <div className="text-sm font-bold mt-1" style={{ color: resultat.reussi ? '#86efac' : '#fcd34d' }}>
                Dernier essai : {resultat.score}/{resultat.total} · meilleure note {resultat.meilleurScore}/{resultat.meilleurTotal} · {resultat.reussi ? 'validé ✓' : 'à revoir'}
              </div>
            )}
          </div>
          <button type="button" onClick={() => setQuiz(q => q + 1)} className="px-5 py-2.5 rounded-full font-extrabold border-0 cursor-pointer whitespace-nowrap" style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
            {resultat ? 'Refaire le quiz' : 'Commencer le quiz'} <i className="bi bi-arrow-right ms-1" />
          </button>
        </div>
      )}
      {quiz > 0 && (
        <div className="text-center">
          <button type="button" onClick={() => setQuiz(0)} className="bg-transparent border-0 text-sm font-bold text-slate-500 cursor-pointer"><i className="bi bi-x-circle me-1" />Fermer le quiz</button>
        </div>
      )}
    </div>
  )
}

/* ── Fiche de l'élève (administration, moniteur) : cours déjà publiés pour lui, avec son quiz ── */
export function CoursPublies({ seances }) {
  if (!seances.length) return (
    <div className="px-4 py-4 text-sm text-slate-400 flex items-center gap-2"><i className="bi bi-signpost-split" />Aucun cours publié pour cet élève dans les séances</div>
  )
  return (
    <div>
      {seances.map(s => {
        const r = s.resultat
        return (
          <div key={s.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                <span><i className="bi bi-calendar3 me-1" />{new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {s.moniteurNom && <span>· {s.moniteurNom}</span>}
              </div>
              <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{s.titre}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {s.programme.filter(p => s.programme.length > 1 || libellePartie(p) !== s.titre).map(p => (
                  <span key={`${p.chapitre}-${p.de}-${p.a}`} className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={p.chapitre.startsWith('conduite-') ? { background: '#ecfdf5', color: '#047857' } : { background: '#eff6ff', color: '#1d4ed8' }}>
                    {libellePartie(p)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 sm:text-right">
              {!s.programme.length ? null
                : !r ? <Pastille couleur="#64748b" fond="#f1f5f9">Quiz à faire</Pastille>
                : <>
                    {r.reussi ? <Pastille couleur="#15803d" fond="#dcfce7">Assimilé</Pastille> : <Pastille couleur="#b45309" fond="#fef3c7">À revoir</Pastille>}
                    <div className="text-xs text-slate-400 mt-1">{r.meilleurScore}/{r.meilleurTotal} · {r.tentatives} essai{r.tentatives > 1 ? 's' : ''}</div>
                  </>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
