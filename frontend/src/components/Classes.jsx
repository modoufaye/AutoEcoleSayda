import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { fmtDate } from '../utils'
import { afficherTelephone } from '../telephones'
import { useClasses, rechargerClasses } from '../classes'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import ChoixPuces from './ChoixPuces'
import { FenetreModerne, Etape, Etiquette } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import { EnteteListe, ListeVide, BoutonAjout, BoutonRond } from './ListeModerne'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

/* Classes d'élèves : groupes arrivés ensemble (« Groupe de novembre »). Un élève est dans une seule
   classe ; le mettre dans une autre l'y déplace. Le bureau gère toutes les classes ; un moniteur crée
   les siennes avec ses élèves. Ensuite, Séances, Travaux Dirigés, Examens et Annonces proposent un
   bouton par classe qui coche tous ses élèves d'un coup. */
export default function Classes() {
  const { user } = useAuth()
  const moniteur = user?.role === 'MONITEUR'
  const classes = useClasses()
  const [eleves, setEleves] = useState([])
  const [edition, setEdition] = useState(null)   // { id?, nom, eleveIds: [string] }
  const [periode, setPeriode] = useState({ du: '', au: '' })
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api('GET', moniteur ? '/moniteur/mes-eleves' : '/eleves').then(l => setEleves(l || [])).catch(() => {})
    rechargerClasses()
  }, [moniteur])

  const nomClasse = Object.fromEntries(classes.map(c => [c.id, c.nom]))
  const items = [...eleves].sort((a, b) => b.id - a.id).map(e => ({
    id: e.id, titre: `${e.prenom} ${e.nom}`,
    sous: [e.telephone && afficherTelephone(e.telephone), e.dateInscription && `inscrit le ${fmtDate(e.dateInscription)}`].filter(Boolean).join(' · '),
    mots: [e.prenom, e.nom, e.telephone],
    // Déjà dans une autre classe : le cocher l'y déplace
    badge: e.classeId && e.classeId !== edition?.id ? `Classe « ${nomClasse[e.classeId] || '?'} »` : (e.typeFormation === 'PERFECTIONNEMENT' ? 'Perfectionnement' : null),
  }))

  const ouvrir = c => { setPeriode({ du: '', au: '' }); setEdition(c ? { id: c.id, nom: c.nom, eleveIds: c.eleveIds.map(String) } : { nom: '', eleveIds: [] }) }

  const ajouterPeriode = () => {
    if (!periode.du || !periode.au) return toast('Choisissez les deux dates', 'warning')
    const ids = eleves.filter(e => e.dateInscription && e.dateInscription >= periode.du && e.dateInscription <= periode.au).map(e => String(e.id))
    if (!ids.length) return toast('Aucun élève inscrit sur cette période', 'warning')
    setEdition(x => ({ ...x, eleveIds: [...new Set([...x.eleveIds, ...ids])] }))
    toast(`${ids.length} élève(s) inscrit(s) du ${fmtDate(periode.du)} au ${fmtDate(periode.au)} ajouté(s)`)
  }

  const enregistrer = async () => {
    if (!edition.nom.trim()) return toast('Donnez un nom à la classe', 'warning')
    setEnvoi(true)
    try {
      const corps = { nom: edition.nom, eleveIds: edition.eleveIds.map(Number) }
      if (edition.id) await api('PUT', `/classes/${edition.id}`, corps)
      else await api('POST', '/classes', corps)
      await rechargerClasses()
      api('GET', moniteur ? '/moniteur/mes-eleves' : '/eleves').then(l => setEleves(l || [])).catch(() => {})
      toast(edition.id ? 'Classe enregistrée' : 'Classe créée')
      setEdition(null)
    } catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(false) }
  }

  const supprimer = async c => {
    if (!(await confirmer({ titre: `Supprimer la classe « ${c.nom} » ?`, ton: 'danger', icone: 'trash3-fill', libelle: 'Supprimer',
      message: `Ses ${c.nombre} élève(s) restent inscrits, simplement sans classe. Les séances et publications déjà envoyées ne changent pas.` }))) return
    try { await api('DELETE', `/classes/${c.id}`); await rechargerClasses(); toast('Classe supprimée') }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3" style={carte}>
        <div className="flex-1 min-w-[220px] text-sm text-slate-600">
          <i className="bi bi-info-circle me-1" />Regroupez les élèves arrivés ensemble : ensuite, dans les <b>Séances</b>, les <b>Travaux Dirigés</b>,
          les <b>Examens</b> et les <b>Annonces</b>, un bouton par classe coche tous ses élèves d'un coup.
        </div>
        <BoutonAjout icone="plus-lg" onClick={() => ouvrir(null)}>Classe</BoutonAjout>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="collection-fill" titre="Classes" sousTitre="Groupes d'élèves" nombre={classes.length} />
        {classes.length === 0 ? <ListeVide texte="Aucune classe : créez-en une avec « + Classe »" icone="collection" /> : classes.map(c => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <span className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '.8rem', background: '#f5f3ff', color: '#6d28d9' }}>
              <i className="bi bi-collection-fill" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[#1e3a5f] truncate">{c.nom}</div>
              <div className="text-xs text-slate-500">
                {c.nombre} élève{c.nombre > 1 ? 's' : ''}{moniteur && ' (les vôtres)'}{c.auteur && ` · créée par ${c.auteur}`}{c.creeLe && ` · le ${fmtDate(c.creeLe.slice(0, 10))}`}
              </div>
            </div>
            {c.modifiable ? (
              <div className="flex gap-2">
                <BoutonRond title="Modifier" icon="pencil-fill" couleur="#1d4ed8" fond="#eff6ff" onClick={() => ouvrir(c)} />
                <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimer(c)} />
              </div>
            ) : <span className="text-xs text-slate-400">Lecture seule</span>}
          </div>
        ))}
      </div>

      {edition && (
        <FenetreModerne surTitre={edition.id ? 'Modifier la classe' : 'Nouvelle classe'} titre={edition.nom || 'Classe sans nom'} icone="collection-fill"
          details={[['people', `${edition.eleveIds.length} élève${edition.eleveIds.length > 1 ? 's' : ''}`]]}
          onClose={() => setEdition(null)} onSave={enregistrer} libelleSave={envoi ? 'Enregistrement…' : 'Enregistrer la classe'}
          piedGauche="Un élève n'est que dans une classe : le cocher ici le retire de l'autre.">
          <Etape n={1} icon="tag" titre="Nom">
            <Etiquette requis>Nom de la classe</Etiquette>
            <input className={champCls} value={edition.nom} maxLength={80} placeholder="Ex : Groupe de novembre"
              onChange={e => setEdition(x => ({ ...x, nom: e.target.value }))} />
          </Etape>
          <Etape n={2} icon="people" titre="Élèves">
            {/* Raccourci : tous les élèves inscrits sur une période */}
            <div className="rounded-xl p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="text-xs font-bold text-slate-500 mb-2"><i className="bi bi-calendar-range me-1" />Ajouter les élèves inscrits sur une période</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">du</span>
                <input type="date" className={champCls} style={{ maxWidth: 170 }} value={periode.du} onChange={e => setPeriode(p => ({ ...p, du: e.target.value }))} />
                <span className="text-xs text-slate-500">au</span>
                <input type="date" className={champCls} style={{ maxWidth: 170 }} value={periode.au} onChange={e => setPeriode(p => ({ ...p, au: e.target.value }))} />
                <button type="button" className="filtre filtre-bouton" style={{ minHeight: 36, fontSize: '.8rem' }} onClick={ajouterPeriode}>
                  <i className="bi bi-plus-lg" />Ajouter
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <button type="button" className="filtre filtre-bouton" style={{ minHeight: 32, fontSize: '.78rem' }} onClick={() => setEdition(x => ({ ...x, eleveIds: [] }))}>
                <i className="bi bi-x-lg" />Tout décocher
              </button>
            </div>
            <ChoixPuces items={items} valeur={edition.eleveIds} onChoisir={ids => setEdition(x => ({ ...x, eleveIds: ids }))}
              multiple cochesEnTete placeholder="Nom, prénom ou téléphone…" hauteur={320} />
          </Etape>
        </FenetreModerne>
      )}
    </div>
  )
}
