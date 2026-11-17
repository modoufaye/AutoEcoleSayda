import { useEffect, useState } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { correspond } from '../utils'
import { Bulles, Saisie } from './Messages'

/* Bulle de messagerie (à la manière de Messenger) : en bas à droite de chaque page, avec le nombre
   de messages non lus. Elle ouvre un panneau avec toutes ses discussions — élèves ↔ auto-école,
   élèves ↔ moniteur, moniteurs ↔ auto-école —, la plus récente en haut ; on y lit, répond (écrit
   ou vocal) et démarre une nouvelle discussion. Sur téléphone, le panneau prend tout l'écran. */

const BLEU = '#1e3a5f'
const heure = d => {
  const x = new Date(d), auj = new Date()
  return x.toDateString() === auj.toDateString()
    ? x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
const initiales = t => t.replace(/^Moniteur · /, '').split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]).join('').toUpperCase()
const BASE = { EQUIPE: '/discussions-equipe' }
const base = type => BASE[type] || '/conversations'

/* Genre de l'interlocuteur selon qui regarde : pastille, couleur et icône de l'avatar */
function genre(c, role) {
  if (role === 'ELEVE') return c.type === 'ECOLE'
    ? { nom: 'Auto-école', couleur: '#1d4ed8', fond: '#dbeafe', icone: 'building' }
    : { nom: 'Moniteur', couleur: '#15803d', fond: '#dcfce7', icone: 'person-badge' }
  if (c.type === 'EQUIPE') return role === 'MONITEUR'
    ? { nom: 'Auto-école', couleur: '#1d4ed8', fond: '#dbeafe', icone: 'building' }
    : { nom: 'Moniteur', couleur: '#7c3aed', fond: '#ede9fe', icone: 'person-badge' }
  return { nom: 'Élève', couleur: '#c2410c', fond: '#ffedd5' }
}

function Avatar({ c, role, taille = 44 }) {
  const g = genre(c, role)
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-extrabold"
      style={{ width: taille, height: taille, background: g.fond, color: g.couleur, fontSize: taille * 0.34 }}>
      {g.icone ? <i className={`bi bi-${g.icone}`} style={{ fontSize: taille * 0.42 }} /> : initiales(c.titre)}
    </div>
  )
}

/* Nouvelle discussion : à qui écrire, selon le rôle */
function Nouvelle({ role, onDemarrer }) {
  const ecole = ['SUPER_ADMIN', 'ADMIN', 'SECRETAIRE'].includes(role)
  const [eleves, setEleves] = useState(role === 'ELEVE' ? [] : null)
  const [moniteurs, setMoniteurs] = useState(ecole ? null : [])
  const [q, setQ] = useState('')
  useEffect(() => {
    if (role !== 'ELEVE') api('GET', '/moniteur/seances/eleves').then(setEleves).catch(() => setEleves([]))
    if (ecole) api('GET', '/discussions-equipe/moniteurs').then(setMoniteurs).catch(() => setMoniteurs([]))
  }, [role, ecole])
  const ligne = (cle, icone, couleur, fond, titre, sous, onClick) => (
    <button key={cle} type="button" onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-0 bg-transparent cursor-pointer rounded-xl hover:bg-slate-100">
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: fond, color: couleur }}><i className={`bi bi-${icone}`} /></div>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: BLEU }}>{titre}</div>
        {sous && <div className="text-[11px] text-slate-500 truncate">{sous}</div>}
      </div>
    </button>
  )
  if (role === 'ELEVE') return (
    <div className="p-2">
      {ligne('ecole', 'building', '#1d4ed8', '#dbeafe', "L'auto-école", 'Administration et secrétariat', () => onDemarrer('/conversations', { type: 'ECOLE' }))}
      {ligne('moniteur', 'person-badge', '#15803d', '#dcfce7', 'Mon moniteur', 'Pour vos séances de conduite', () => onDemarrer('/conversations', { type: 'MONITEUR' }))}
    </div>
  )
  const filtreE = (eleves || []).filter(e => correspond([e.nom, e.telephone], q)).slice(0, 30)
  const filtreM = (moniteurs || []).filter(m => correspond([m.nom, m.telephone], q))
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="p-3 pb-1">
        <input className="form-control form-control-sm" style={{ borderRadius: 999, background: '#f1f5f9', border: 0 }} value={q} onChange={e => setQ(e.target.value)}
          placeholder={ecole ? 'Chercher un élève ou un moniteur…' : 'Chercher un élève…'} aria-label="Chercher à qui écrire" autoFocus />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {role === 'MONITEUR' && ligne('ecole', 'building', '#1d4ed8', '#dbeafe', "L'auto-école", 'Administration et secrétariat', () => onDemarrer('/discussions-equipe', {}))}
        {ecole && filtreM.length > 0 && <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 px-3 pt-2 pb-1">Moniteurs</div>}
        {ecole && filtreM.map(m => ligne(`m${m.id}`, 'person-badge', '#7c3aed', '#ede9fe', m.nom, 'Moniteur', () => onDemarrer('/discussions-equipe', { moniteurId: m.id })))}
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 px-3 pt-2 pb-1">{role === 'MONITEUR' ? 'Mes élèves' : 'Élèves'}</div>
        {eleves === null ? <div className="py-4 text-center"><span className="spinner-border spinner-border-sm text-secondary" /></div>
          : filtreE.length === 0 ? <div className="text-xs text-slate-400 px-3 py-2">Aucun élève trouvé</div>
          : filtreE.map(e => ligne(`e${e.id}`, 'person-fill', '#c2410c', '#ffedd5', e.nom, 'Élève', () => onDemarrer('/conversations', { eleveId: e.id })))}
      </div>
    </div>
  )
}

export default function MessengerBulle({ user, nonLus = 0 }) {
  const role = user?.role
  const equipe = role && role !== 'ELEVE'
  const [ouvert, setOuvert] = useState(false)
  const [vue, setVue] = useState('liste')          // 'liste' | 'nouvelle' | { base, id }
  const [convs, setConvs] = useState(null)
  const [conv, setConv] = useState(null)           // { id, titre, messages }
  const [q, setQ] = useState('')
  const [nonLuesSeules, setNonLuesSeules] = useState(false)

  const signalerLu = () => window.dispatchEvent(new Event('messages-lus'))
  const chargerListe = async () => {
    try {
      const [a, b] = await Promise.all([
        api('GET', '/conversations').catch(() => []),
        equipe ? api('GET', '/discussions-equipe').catch(() => []) : Promise.resolve([]),
      ])
      setConvs([...(a || []), ...(b || [])].sort((x, y) => new Date(y.dernierLe) - new Date(x.dernierLe)))
    } catch { setConvs([]) }
  }
  const chargerConv = (b, id) => api('GET', `${b}/${id}/messages`)
    .then(c => { setConv({ ...c, base: b }); signalerLu() })
    .catch(e => toast(e.message, 'danger'))

  const ouverte = typeof vue === 'object' ? vue : null
  // Liste ou discussion ouverte : relue à l'ouverture, puis toutes les 15 secondes
  useEffect(() => {
    if (!ouvert) return
    const relire = () => { if (ouverte) chargerConv(ouverte.base, ouverte.id); else chargerListe() }
    relire()
    const t = setInterval(relire, 15000)
    return () => clearInterval(t)
  }, [ouvert, ouverte?.base, ouverte?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // Échap ferme le panneau
  useEffect(() => {
    if (!ouvert) return
    const k = e => { if (e.key === 'Escape') setOuvert(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [ouvert])

  const ouvrir = (b, id, type) => { setConv(null); setVue({ base: b, id, type }) }
  const retour = () => { setVue('liste'); setConv(null) }
  const demarrer = async (b, corps) => {
    try {
      const c = await api('POST', b, corps)
      ouvrir(b, c.id, b === '/discussions-equipe' ? 'EQUIPE' : corps.type || 'ECOLE')
    }
    catch (e) { toast(e.message, 'danger') }
  }

  if (!user) return null
  const liste = (convs || []).filter(c => (!nonLuesSeules || c.nonLus > 0) && correspond([c.titre, c.apercu], q))
  const titreOuvert = conv && ouverte && String(conv.id) === String(ouverte.id) ? conv : null
  const enTete = 'flex items-center gap-2 px-3 py-3 flex-shrink-0'

  return (
    <>
      {/* La bulle */}
      {!ouvert && (
        <button type="button" onClick={() => { setVue('liste'); setOuvert(true) }} aria-label={`Discussions${nonLus ? ` (${nonLus} non lu${nonLus > 1 ? 's' : ''})` : ''}`} title="Discussions"
          className="fixed flex items-center justify-center cursor-pointer"
          style={{ borderRadius: 999, right: 20, bottom: 20, width: 58, height: 58, zIndex: 1040, background: 'linear-gradient(135deg,#0f2240,#2a4f7c)', color: '#fff',
            boxShadow: '0 8px 24px rgba(15,34,64,.35)', border: '3px solid #f0bb2a' }}>
          <i className="bi bi-chat-dots-fill" style={{ fontSize: 24 }} />
          {nonLus > 0 && (
            <span className="absolute flex items-center justify-center font-extrabold text-white"
              style={{ top: -4, right: -4, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: '#ef4444', fontSize: 12, border: '2px solid #fff' }}>
              {nonLus > 99 ? '99+' : nonLus}
            </span>
          )}
        </button>
      )}

      {/* Le panneau : plein écran sur téléphone, fenêtre en bas à droite sur ordinateur */}
      {ouvert && (
        <div role="dialog" aria-label="Discussions"
          className="fixed inset-0 sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-2.5rem)] sm:rounded-2xl bg-white flex flex-col overflow-hidden"
          style={{ zIndex: 1060, boxShadow: '0 18px 50px rgba(15,34,64,.3)', fontFamily: 'Inter, system-ui, sans-serif' }}>

          {ouverte ? (
            <>
              <div className={enTete} style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '3px solid #d4a017' }}>
                <button type="button" onClick={retour} aria-label="Retour aux discussions" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                  <i className="bi bi-arrow-left" />
                </button>
                {titreOuvert && <Avatar c={{ ...ouverte, titre: titreOuvert.titre }} role={role} taille={34} />}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-white truncate text-sm">{titreOuvert ? titreOuvert.titre.replace(/^Moniteur · /, '') : '…'}</div>
                  {ouverte.type && <div className="text-[11px] truncate" style={{ color: '#cbd5e1' }}>{genre(ouverte, role).nom}</div>}
                </div>
                <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff' }}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              {titreOuvert ? (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto flex flex-col" style={{ background: '#f8fafc' }}>
                    <Bulles messages={titreOuvert.messages} convId={titreOuvert.id} base={ouverte.base} maxHeight="none" onModifie={() => chargerConv(ouverte.base, ouverte.id)} />
                  </div>
                  <Saisie onEnvoyer={async texte => { await api('POST', `${ouverte.base}/${ouverte.id}/messages`, { texte }); await chargerConv(ouverte.base, ouverte.id) }}
                    onEnvoyerAudio={async (fichier, duree) => { await uploadFile(`${ouverte.base}/${ouverte.id}/audio`, fichier, { duree }); await chargerConv(ouverte.base, ouverte.id) }} />
                </>
              ) : <div className="flex-1 flex items-center justify-center"><span className="spinner-border spinner-border-sm text-secondary" /></div>}
            </>
          ) : (
            <>
              <div className={enTete} style={{ borderBottom: '1px solid #eef2f7' }}>
                {vue === 'nouvelle' && (
                  <button type="button" onClick={() => setVue('liste')} aria-label="Retour aux discussions" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: '#f1f5f9', color: BLEU }}>
                    <i className="bi bi-arrow-left" />
                  </button>
                )}
                <div className="flex-1 min-w-0 text-lg font-black" style={{ color: BLEU }}>{vue === 'nouvelle' ? 'Nouvelle discussion' : 'Discussions'}</div>
                {vue !== 'nouvelle' && (
                  <button type="button" onClick={() => setVue('nouvelle')} aria-label="Nouvelle discussion" title="Nouvelle discussion" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: '#f1f5f9', color: BLEU }}>
                    <i className="bi bi-pencil-square" />
                  </button>
                )}
                <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer" style={{ borderRadius: 999, background: '#f1f5f9', color: BLEU }}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {vue === 'nouvelle' ? <Nouvelle role={role} onDemarrer={demarrer} /> : (
                <>
                  <div className="px-3 pt-3 pb-2 flex flex-col gap-2 flex-shrink-0">
                    <input className="form-control form-control-sm" style={{ borderRadius: 999, background: '#f1f5f9', border: 0 }} value={q} onChange={e => setQ(e.target.value)}
                      placeholder="Rechercher une discussion…" aria-label="Rechercher une discussion" />
                    <div className="flex gap-1.5">
                      {[[false, 'Toutes'], [true, 'Non lues']].map(([v, nom]) => (
                        <button key={nom} type="button" onClick={() => setNonLuesSeules(v)} className="border-0 px-3 py-1 text-xs font-bold cursor-pointer"
                          style={{ background: nonLuesSeules === v ? '#dbeafe' : '#f1f5f9', color: nonLuesSeules === v ? '#1d4ed8' : '#475569' }}>{nom}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto px-1.5 pb-2">
                    {convs === null ? <div className="py-8 text-center"><span className="spinner-border spinner-border-sm text-secondary" /></div>
                      : liste.length === 0 ? (
                        <div className="py-10 px-6 text-center text-sm text-slate-400">
                          <i className="bi bi-chat-dots" style={{ fontSize: '2rem' }} />
                          <div className="mt-2">{convs.length ? 'Aucune discussion trouvée' : 'Aucune discussion pour le moment'}</div>
                          {!convs.length && <button type="button" onClick={() => setVue('nouvelle')} className="mt-3 border-0 px-4 py-1.5 text-xs font-bold cursor-pointer" style={{ borderRadius: 999, background: BLEU, color: '#fff' }}>Écrire un message</button>}
                        </div>
                      ) : liste.map(c => {
                        const g = genre(c, role)
                        return (
                          <button key={`${c.type}-${c.id}`} type="button" onClick={() => ouvrir(base(c.type), c.id, c.type)}
                            className="w-full flex items-center gap-3 px-2.5 py-2 text-left border-0 bg-transparent cursor-pointer rounded-xl hover:bg-slate-100">
                            <Avatar c={c} role={role} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm truncate ${c.nonLus ? 'font-black' : 'font-semibold'}`} style={{ color: BLEU }}>{c.titre.replace(/^Moniteur · /, '')}</span>
                                <span className="text-[10px] font-bold px-1.5 rounded-full flex-shrink-0" style={{ background: g.fond, color: g.couleur }}>{g.nom}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className={`truncate ${c.nonLus ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{c.apercu}</span>
                                <span className="text-slate-400 whitespace-nowrap flex-shrink-0">· {heure(c.dernierLe)}</span>
                              </div>
                            </div>
                            {c.nonLus > 0 && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#2563eb' }} aria-label={`${c.nonLus} non lu${c.nonLus > 1 ? 's' : ''}`} />}
                          </button>
                        )
                      })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
