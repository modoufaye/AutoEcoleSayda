import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import { correspond } from '../utils'
import { afficherTelephone } from '../telephones'
import { EnteteListe, ListeVide, ListeChargement, Recherche, BoutonAjout } from './ListeModerne'

/* Conversations privées : l'élève avec l'auto-école (boîte partagée du super admin, des
   administrateurs et du secrétariat) ou avec son moniteur. La liste et la conversation ouverte se
   rafraîchissent toutes les 20 secondes ; ouvrir une conversation marque ses messages lus. */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const heure = d => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/* Fil de messages en bulles (les siens à droite, en doré). */
function Bulles({ messages, maxHeight = '55vh' }) {
  const bas = useRef(null)
  useEffect(() => { bas.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length])
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background: '#f8fafc', maxHeight }}>
      {messages.length === 0 && <div className="text-sm text-slate-400 text-center py-6">Écrivez le premier message</div>}
      {messages.map(m => (
        <div key={m.id} className={`flex ${m.deMoi ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-[80%] px-3 py-2 text-sm" style={{ borderRadius: m.deMoi ? '1rem 1rem .25rem 1rem' : '1rem 1rem 1rem .25rem',
            background: m.deMoi ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#fff', color: m.deMoi ? '#1e3a5f' : '#334155', border: m.deMoi ? 'none' : '1px solid #e2e8f0' }}>
            {!m.deMoi && <div className="text-[11px] font-bold mb-0.5" style={{ color: '#1d4ed8' }}>{m.auteur}</div>}
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.texte}</div>
            <div className="text-[10px] mt-1 text-right" style={{ opacity: .65 }}>{heure(m.envoyeLe)}</div>
          </div>
        </div>
      ))}
      <div ref={bas} />
    </div>
  )
}

/* Zone de saisie : Entrée envoie, Maj + Entrée passe à la ligne. onEnvoyer(texte) renvoie une promesse. */
function Saisie({ onEnvoyer }) {
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const envoyer = async () => {
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    try { await onEnvoyer(texte); setTexte('') }
    catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(false) }
  }
  return (
    <div className="p-3 flex gap-2 items-end" style={{ borderTop: '1px solid #eef2f7' }}>
      <textarea className="form-control" rows={2} maxLength={2000} value={texte} placeholder="Votre message… (Entrée pour envoyer)"
        onChange={e => setTexte(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }} style={{ resize: 'none' }} />
      <button type="button" onClick={envoyer} disabled={envoi || !texte.trim()} aria-label="Envoyer"
        className="w-11 h-11 rounded-full border-0 flex items-center justify-center cursor-pointer flex-shrink-0"
        style={{ background: texte.trim() ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#e2e8f0', color: '#1e3a5f' }}>
        {envoi ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
      </button>
    </div>
  )
}

/* Fiche élève (personnel) : la conversation privée avec cet élève, ouverte au premier message envoyé.
   Les messages reçus passent lus à l'ouverture de l'onglet. */
export function ConversationEleve({ eleveId, onLu }) {
  const [conv, setConv] = useState(null)
  const charger = () => api('GET', `/conversations/eleve/${eleveId}?lire=true`)
    .then(c => { setConv(c); onLu?.(); window.dispatchEvent(new Event('messages-lus')) })
    .catch(e => { toast(e.message, 'danger'); setConv({ id: null, messages: [] }) })
  useEffect(() => { charger() }, [eleveId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(charger, 20000); return () => clearInterval(t) }, [eleveId]) // eslint-disable-line react-hooks/exhaustive-deps
  const envoyer = async texte => {
    const id = conv?.id || (await api('POST', '/conversations', { eleveId })).id
    await api('POST', `/conversations/${id}/messages`, { texte })
    await charger()
  }
  if (!conv) return <div className="py-10 flex justify-center"><span className="spinner-border spinner-border-sm text-secondary" /></div>
  return (
    <div className="flex flex-col">
      <Bulles messages={conv.messages} maxHeight="380px" />
      <Saisie onEnvoyer={envoyer} />
    </div>
  )
}

/* Personnel : choix de l'élève à qui écrire (tous pour l'auto-école, ses élèves pour un moniteur). */
function ChoixEleve({ onChoisir, onAnnuler }) {
  const [eleves, setEleves] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => { api('GET', '/moniteur/seances/eleves').then(setEleves).catch(() => setEleves([])) }, [])
  const liste = (eleves || []).filter(e => correspond([e.nom, e.telephone], q)).slice(0, 8)
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="person-plus-fill" titre="Nouvelle conversation" sousTitre="À quel élève voulez-vous écrire ?" />
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 flex"><Recherche value={q} onChange={setQ} placeholder="Nom ou téléphone…" /></div>
          <button type="button" onClick={onAnnuler} className="px-4 text-sm font-bold cursor-pointer" style={{ borderRadius: 999, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}>Annuler</button>
        </div>
        {eleves === null ? <ListeChargement /> : liste.length === 0 ? <div className="text-sm text-slate-400 px-1 py-2">Aucun élève trouvé</div>
          : liste.map(e => (
            <button key={e.id} type="button" onClick={() => onChoisir(e.id)} className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left bg-white cursor-pointer"
              style={{ borderRadius: '.75rem', border: '1px solid #eef2f7' }}>
              <span className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{e.nom}</span>
              <span className="text-xs text-slate-400">{e.telephone ? afficherTelephone(e.telephone) : ''}</span>
            </button>
          ))}
      </div>
    </div>
  )
}

export default function Messages({ onLus, conversationId, onOuvrir, onFermer }) {
  const { user } = useAuth()
  const eleve = user?.role === 'ELEVE'
  const [convs, setConvs] = useState(null)
  const [chargee, setChargee] = useState(null)   // { id, titre, messages }
  const [choix, setChoix] = useState(false)
  /* Conversation dans l'adresse (…/messages/12) quand la mise en page la gère : le Retour d'Android
     ou du navigateur revient à la liste au lieu de quitter la page. Sinon, état local. */
  const [idLocal, setIdLocal] = useState(null)
  const ouverteId = onOuvrir ? (conversationId || null) : idLocal
  // Affichée seulement si c'est bien celle de l'adresse (pas l'ancienne pendant le chargement)
  const ouverte = chargee && String(chargee.id) === String(ouverteId) ? chargee : null

  const chargerListe = () => api('GET', '/conversations').then(setConvs).catch(e => { toast(e.message, 'danger'); setConvs([]) })
  const charger = id => api('GET', `/conversations/${id}/messages`)
    .then(c => { setChargee(c); chargerListe(); onLus?.() })
    .catch(e => toast(e.message, 'danger'))
  // Passer d'une conversation à l'autre remplace l'étape : Retour ramène toujours à la liste
  const ouvrir = id => {
    if (String(id) === String(ouverteId)) return
    if (onOuvrir) onOuvrir(id, ouverteId ? { replace: true } : undefined); else setIdLocal(id)
  }
  const fermer = () => onFermer ? onFermer() : setIdLocal(null)

  // Ouverture, fermeture (y compris par le Retour d'Android) : conversation ou liste relue
  useEffect(() => { if (ouverteId) charger(ouverteId); else chargerListe() }, [ouverteId]) // eslint-disable-line react-hooks/exhaustive-deps
  // Nouveaux messages : liste et conversation ouverte relues régulièrement
  useEffect(() => {
    const t = setInterval(() => { if (ouverteId) charger(ouverteId); else chargerListe() }, 20000)
    return () => clearInterval(t)
  }, [ouverteId]) // eslint-disable-line react-hooks/exhaustive-deps

  const demarrer = async corps => {
    try { const c = await api('POST', '/conversations', corps); setChoix(false); ouvrir(c.id) }
    catch (e) { toast(e.message, 'danger') }
  }

  const liste = (
    <div className={`bg-white rounded-2xl overflow-hidden ${ouverte ? 'hidden lg:block' : ''}`} style={carte}>
      <EnteteListe icone="chat-dots-fill" titre="Conversations" sousTitre={eleve ? "Avec l'auto-école et votre moniteur" : 'Messages privés avec les élèves'} nombre={convs?.length ?? ''} />
      {convs === null ? <ListeChargement />
        : convs.length === 0 ? <ListeVide texte={eleve ? 'Aucune conversation : écrivez à l’auto-école ou à votre moniteur' : 'Aucune conversation pour le moment'} icone="chat-dots" />
        : convs.map(c => (
          <button key={c.id} type="button" onClick={() => ouvrir(c.id)} className="w-full flex items-start gap-3 px-4 py-3 text-left border-0 cursor-pointer"
            style={{ borderBottom: '1px solid #eef2f7', background: ouverte?.id === c.id ? '#eff6ff' : c.nonLus ? '#fffbeb' : '#fff' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: c.type === 'ECOLE' ? '#dbeafe' : '#dcfce7', color: c.type === 'ECOLE' ? '#1d4ed8' : '#15803d' }}>
              <i className={`bi bi-${c.type === 'ECOLE' ? 'building' : 'person-badge'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate" style={{ color: '#1e3a5f' }}>{c.titre}</span>
                {!eleve && c.type === 'MONITEUR' && <span className="text-[10px] font-bold px-1.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>votre élève</span>}
                <span className="ms-auto text-[11px] text-slate-400 whitespace-nowrap">{heure(c.dernierLe)}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs truncate ${c.nonLus ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{c.apercu}</span>
                {c.nonLus > 0 && <span className="ms-auto text-[11px] font-extrabold px-1.5 rounded-full" style={{ background: '#f0bb2a', color: '#1e3a5f' }}>{c.nonLus}</span>}
              </div>
            </div>
          </button>
        ))}
    </div>
  )

  const fil = ouverte ? (
    <div className="space-y-3">
    {/* Téléphone : la liste est masquée, retour vers elle au style commun (sur ordinateur, elle est à côté) */}
    <div className="lg:hidden"><button type="button" onClick={fermer} className="btn-retour"><span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Conversations</button></div>
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ ...carte, minHeight: 420 }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '3px solid #d4a017' }}>
        <div className="font-extrabold text-white truncate">{ouverte.titre}</div>
      </div>
      <Bulles messages={ouverte.messages} />
      <Saisie onEnvoyer={async texte => { await api('POST', `/conversations/${ouverte.id}/messages`, { texte }); await charger(ouverte.id) }} />
    </div>
    </div>
  ) : (
    <div className="hidden lg:flex bg-white rounded-2xl items-center justify-center text-slate-400 text-sm" style={{ ...carte, minHeight: 420 }}>
      <div className="text-center"><i className="bi bi-chat-dots" style={{ fontSize: '2rem' }} /><div className="mt-2">Choisissez une conversation</div></div>
    </div>
  )

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!ouverte && (
        <div className="flex flex-wrap justify-end gap-2">
          {eleve ? <>
            <BoutonAjout icone="building" onClick={() => demarrer({ type: 'ECOLE' })}>Écrire à l’auto-école</BoutonAjout>
            <BoutonAjout vert icone="person-badge" onClick={() => demarrer({ type: 'MONITEUR' })}>Écrire à mon moniteur</BoutonAjout>
          </> : !choix && <BoutonAjout onClick={() => setChoix(true)}>Conversation</BoutonAjout>}
        </div>
      )}
      {choix && !ouverte && <ChoixEleve onChoisir={id => demarrer({ eleveId: id })} onAnnuler={() => setChoix(false)} />}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr] items-start">
        {liste}
        {fil}
      </div>
    </div>
  )
}
