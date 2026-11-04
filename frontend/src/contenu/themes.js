/* Thèmes des cours de code : chaque thème a ses chapitres, débloqués dans l'ordre pour un élève,
   et une révision finale. Les identifiants de chapitre sont uniques entre thèmes (ils servent
   d'adresse …/cours/<id> et de clé de progression côté serveur, ProgressionCodeController). */
import { CHAPITRES, REVISION } from './signalisation'
import { CHAPITRES_PRIORITE, REVISION_PRIORITE } from './priorite'

export const THEMES_CODE = [
  {
    key: 'signalisation', titre: 'Signalisation', numero: 1,
    description: 'Lire et comprendre chaque panneau et chaque marquage au sol, chapitre par chapitre, avec un quiz pour valider.',
    decor: ['A14', 'B14', 'B21-1'], chapitres: CHAPITRES, revision: REVISION,
  },
  {
    key: 'priorite', titre: 'Priorité', numero: 2,
    description: 'Savoir qui passe en premier : carrefours, STOP, giratoires, feux, agents et véhicules d\'urgence.',
    decor: ['AB1', 'AB4', 'AB25'], chapitres: CHAPITRES_PRIORITE, revision: REVISION_PRIORITE,
  },
]
