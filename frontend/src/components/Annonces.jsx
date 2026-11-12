import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import { EnteteListe, ListeVide, ListeChargement, Pastille, BoutonRond, BoutonAjout } from './ListeModerne'
import { useBureaux } from '../bureaux'
import { useClasses } from '../classes'

/* Annonces de l'auto-école. Le personnel (super admin, administrateurs, secrétariat, moniteurs)
   écrit à tout le monde, aux élèves (tous, d'un bureau, d'un moniteur) ou au personnel ; un moniteur
   écrit à ses élèves ou au personnel. Chacun lit les annonces qui lui sont adressées ; ouvrir la page
   les marque lues (pastille du menu). */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const etiquette = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

function Formulaire({ moniteur, onFini, onAnnuler }) {
  const bureaux = useBureaux()
  const [f, setF] = useState({ titre: '', contenu: '', cible: moniteur ? 'MONITEUR' : 'ELEVES', valeur: '' })
  const [moniteurs, setMoniteurs] = useState([])
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { if (!moniteur) api('GET', '/moniteurs/actifs').then(setMoniteurs).catch(() => {}) }, [moniteur])
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  // Classes : toutes pour le bureau ; pour un moniteur, celles qu'il a créées
  const classes = useClasses().filter(c => !moniteur || c.modifiable)
  const cibles = moniteur
    ? [['MONITEUR', 'Mes élèves'], ...(classes.length ? [['CLASSE', "Les élèves d'une de mes classes"]] : []), ['PERSONNEL', 'Le personnel']]
    : [['TOUS', 'Tout le monde'], ['ELEVES', 'Tous les élèves'], ['BUREAU', "Les élèves d'un bureau"], ['MONITEUR', "Les élèves d'un moniteur"],
       ...(classes.length ? [['CLASSE', "Les élèves d'une classe"]] : []), ['PERSONNEL', 'Le personnel']]
  const valider = async e => {
    e.preventDefault()
    if (!f.titre.trim() || !f.contenu.trim()) return toast('Donnez un titre et un message', 'warning')
    if (!moniteur && (f.cible === 'BUREAU' || f.cible === 'MONITEUR') && !f.valeur) return toast(f.cible === 'BUREAU' ? 'Choisissez le bureau' : 'Choisissez le moniteur', 'warning')
    if (f.cible === 'CLASSE' && !f.valeur) return toast('Choisissez la classe', 'warning')
    setEnvoi(true)
    try { await api('POST', '/annonces', f); toast('Annonce publiée'); onFini() }
    catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }
  return (
    <form onSubmit={valider} className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="megaphone-fill" titre="Nouvelle annonce" sousTitre="Visible dès sa publication par ses destinataires" />
      <div className="p-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={etiquette}>Titre *</label>
          <input className="form-control" maxLength={150} value={f.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex. Pas de cours samedi" />
        </div>
        <div className="sm:col-span-2">
          <label className={etiquette}>Message *</label>
          <textarea className="form-control" rows={4} maxLength={2000} value={f.contenu} onChange={e => set('contenu', e.target.value)}
            placeholder="Ex. Les cours de samedi 15 sont reportés à lundi 17, même heure." />
        </div>
        <div>
          <label className={etiquette}>Destinataires *</label>
          <select className="form-select" value={f.cible} onChange={e => setF(x => ({ ...x, cible: e.target.value, valeur: '' }))}>
            {cibles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {!moniteur && f.cible === 'BUREAU' && (
          <div>
            <label className={etiquette}>Bureau *</label>
            <select className="form-select" value={f.valeur} onChange={e => set('valeur', e.target.value)}>
              <option value="">Choisir…</option>
              {bureaux.actifs.map(b => <option key={b.code} value={b.code}>{b.nom}</option>)}
            </select>
          </div>
        )}
        {f.cible === 'CLASSE' && (
          <div>
            <label className={etiquette}>Classe *</label>
            <select className="form-select" value={f.valeur} onChange={e => set('valeur', e.target.value)}>
              <option value="">Choisir…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom} · {c.nombre} élève{c.nombre > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        )}
        {!moniteur && f.cible === 'MONITEUR' && (
          <div>
            <label className={etiquette}>Moniteur *</label>
            <select className="form-select" value={f.valeur} onChange={e => set('valeur', e.target.value)}>
              <option value="">Choisir…</option>
              {moniteurs.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
            </select>
          </div>
        )}
        <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onAnnuler} disabled={envoi} className="px-5 text-sm font-bold cursor-pointer"
            style={{ borderRadius: 999, minHeight: 42, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}>Annuler</button>
          <button type="submit" disabled={envoi} className="px-5 text-sm font-extrabold border-0 cursor-pointer flex items-center gap-2"
            style={{ borderRadius: 999, minHeight: 42, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', opacity: envoi ? .7 : 1 }}>
            {envoi ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}Publier
          </button>
        </div>
      </div>
    </form>
  )
}

export default function Annonces({ onLues }) {
  const { user } = useAuth()
  const eleve = user?.role === 'ELEVE'
  const [annonces, setAnnonces] = useState(null)
  const [ecrire, setEcrire] = useState(false)

  // Chargées puis marquées lues : les « Nouveau » restent visibles le temps de la visite
  const charger = () => api('GET', '/annonces')
    .then(l => { setAnnonces(l); if (l.some(a => !a.lue)) api('POST', '/annonces/lues').then(() => onLues?.()).catch(() => {}) })
    .catch(e => { toast(e.message, 'danger'); setAnnonces([]) })
  useEffect(() => { charger() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const supprimer = async a => {
    if (!(await confirmer({ titre: 'Supprimer cette annonce ?', ton: 'danger', icone: 'trash3-fill', libelle: 'Supprimer',
      message: `« ${a.titre} » ne sera plus visible par ses destinataires.` }))) return
    try { await api('DELETE', `/annonces/${a.id}`); toast('Annonce supprimée'); charger() }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!eleve && !ecrire && <div className="flex justify-end"><BoutonAjout onClick={() => setEcrire(true)}>Annonce</BoutonAjout></div>}
      {ecrire && <Formulaire moniteur={user?.role === 'MONITEUR'} onAnnuler={() => setEcrire(false)} onFini={() => { setEcrire(false); charger() }} />}

      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="megaphone-fill" titre="Annonces" sousTitre={eleve ? "Les informations de votre auto-école" : "Messages de l'auto-école à ses élèves et à l'équipe"} nombre={annonces?.length ?? ''} />
        {annonces === null ? <ListeChargement />
          : annonces.length === 0 ? <ListeVide texte={eleve ? 'Aucune annonce pour le moment' : 'Aucune annonce · cliquez sur « + Annonce » pour écrire'} icone="megaphone" />
          : annonces.map(a => (
            <div key={a.id} className="px-5 py-4" style={{ borderBottom: '1px solid #eef2f7', background: a.lue ? '#fff' : '#fffbeb', borderLeft: `4px solid ${a.lue ? 'transparent' : '#d4a017'}` }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <i className="bi bi-megaphone-fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold" style={{ color: '#1e3a5f' }}>{a.titre}</span>
                    {!a.lue && <Pastille couleur="#b45309" fond="#fef3c7">Nouveau</Pastille>}
                  </div>
                  <div className="text-sm text-slate-700 mt-1" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.contenu}</div>
                  <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span><i className="bi bi-person me-1" />{a.auteur}</span>
                    <span><i className="bi bi-calendar3 me-1" />{new Date(a.date).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    {!eleve && <span><i className="bi bi-people me-1" />{a.destinataires}</span>}
                  </div>
                </div>
                {a.supprimable && <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimer(a)} />}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
