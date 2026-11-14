import { useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { FenetreModerne, Etape } from './FenetreModerne'
import ChoixPuces from './ChoixPuces'
import BoutonsClasses from './BoutonsClasses'
import { afficherTelephone } from '../telephones'

const AUCUN = 'aucun'   // « retirer le moniteur »

/* Même moniteur pour plusieurs élèves d'un coup (PATCH /eleves/moniteur). Les élèves proposés sont
   ceux de la liste affichée (filtres compris : « Code admis », bureau, classe…). L'élève réserve
   ensuite ses créneaux de conduite avec ce moniteur et son véhicule attitré. */
export default function AttribuerMoniteur({ eleves, moniteurs, admisCode, onClose, onFait }) {
  const [moniteurId, setMoniteurId] = useState('')
  const [eleveIds, setEleveIds] = useState([])
  const [envoi, setEnvoi] = useState(false)

  const actifs = moniteurs.filter(m => m.actif)
  const itemsMoniteurs = [
    ...actifs.map(m => ({ id: m.id, titre: `${m.prenom} ${m.nom}`, mots: [m.prenom, m.nom, m.telephone],
      sous: [m.vehicule ? `${[m.vehicule.marque, m.vehicule.modele].filter(Boolean).join(' ')} · ${m.vehicule.immatriculation}` : 'Pas de véhicule attitré',
        `${eleves.filter(e => e.moniteur?.id === m.id).length} élève(s) ici`].join(' · ') })),
    { id: AUCUN, titre: 'Aucun moniteur', sous: 'Retirer le moniteur des élèves cochés', mots: ['aucun', 'retirer'] },
  ]
  const itemsEleves = eleves.map(e => ({ id: e.id, titre: `${e.prenom} ${e.nom}`, mots: [e.prenom, e.nom, e.telephone],
    sous: [e.telephone && afficherTelephone(e.telephone),
      e.typeFormation === 'PERFECTIONNEMENT' ? 'Perfectionnement' : admisCode.has(e.id) ? 'Code admis' : 'Code à passer',
      e.moniteur ? `Moniteur : ${e.moniteur.prenom} ${e.moniteur.nom}` : 'Sans moniteur'].filter(Boolean).join(' · ') }))
  const sansMoniteur = eleves.filter(e => !e.moniteur).map(e => String(e.id))
  const cocher = ids => setEleveIds(x => [...new Set([...x, ...ids.map(String)])])

  const choisi = moniteurId === AUCUN ? null : actifs.find(m => String(m.id) === String(moniteurId))
  const valider = async () => {
    if (!moniteurId) return toast('Choisissez un moniteur', 'warning')
    if (!eleveIds.length) return toast('Cochez au moins un élève', 'warning')
    if (envoi) return
    setEnvoi(true)
    try {
      const r = await api('PATCH', '/eleves/moniteur', { eleveIds: eleveIds.map(Number), moniteurId: choisi ? choisi.id : null })
      const n = r?.modifies ?? eleveIds.length
      toast(choisi ? `${n} élève${n > 1 ? 's' : ''} attribué${n > 1 ? 's' : ''} à ${choisi.prenom} ${choisi.nom}` : `Moniteur retiré pour ${n} élève${n > 1 ? 's' : ''}`)
      onFait()
    } catch (e) { toast(e.message || 'Attribution impossible', 'danger') }
    finally { setEnvoi(false) }
  }

  return (
    <FenetreModerne surTitre="Élèves" titre="Attribuer un moniteur" icone="person-badge-fill"
      details={[['person-badge', choisi ? `${choisi.prenom} ${choisi.nom}` : moniteurId === AUCUN ? 'Aucun moniteur' : 'Moniteur à choisir'], ['people', `${eleveIds.length} élève(s)`]]}
      onClose={onClose} onSave={valider}
      libelleSave={envoi ? 'Enregistrement…' : choisi ? `Attribuer à ${choisi.prenom}` : moniteurId === AUCUN ? 'Retirer le moniteur' : 'Attribuer'}
      piedGauche="L'élève réserve ses leçons de conduite avec ce moniteur et son véhicule.">
      <Etape n={1} icon="person-badge" titre="Moniteur">
        <ChoixPuces items={itemsMoniteurs} valeur={moniteurId} onChoisir={setMoniteurId} unite="moniteur" placeholder="Nom du moniteur…" hauteur={200} />
      </Etape>
      <Etape n={2} icon="people" titre="Élèves">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <BoutonsClasses proposes={eleves.map(e => e.id)} onCocher={cocher} />
          {sansMoniteur.length > 0 && (
            <button type="button" onClick={() => cocher(sansMoniteur)} className="filtre filtre-bouton"
              style={{ minHeight: 30, fontSize: '.78rem', background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' }}>
              <i className="bi bi-plus-circle" />Sans moniteur · {sansMoniteur.length}
            </button>
          )}
        </div>
        <ChoixPuces items={itemsEleves} valeur={eleveIds} onChoisir={setEleveIds} multiple cochesEnTete placeholder="Nom, prénom ou téléphone…" hauteur={260} />
      </Etape>
    </FenetreModerne>
  )
}
