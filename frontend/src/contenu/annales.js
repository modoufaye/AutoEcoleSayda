/* Annales (onglet Travaux Dirigés) : les catalogues de questions qui tombent souvent à l'examen du
   code. Même format que les séries d'examen (contenu/seriesExamen.js), mais l'illustration est une
   photo du catalogue (public/annales/<série>/<n>.jpg, recadrée au-dessus du texte imprimé) ; les
   questions sans photo n'ont que l'énoncé. L'id sert aussi de chapitre pour la note de l'élève. */

const OUI_NON = (a, b) => [[a, 'OUI'], [b, 'NON']]
const oui = (enonce, bonne) => ({ enonce, blocs: [{ choix: OUI_NON('A', 'B') }], bonnes: [bonne] })
const deux = (enonce, i1, i2, bonnes) => ({ enonce, blocs: [{ intro: i1, choix: OUI_NON('A', 'B') }, { intro: i2, choix: OUI_NON('C', 'D') }], bonnes })
const ouBien = (enonce, choix, bonnes) => ({ enonce, blocs: [{ choix: choix.map((t, k) => ['ABCD'[k], t]) }], bonnes })

const B1 = [
  { enonce: 'Pour aller tout droit,', blocs: [{ intro: "je m'arrête :", choix: [['A', 'au niveau du signal'], ['B', 'au niveau de la bande blanche']] }, { intro: 'je passerai avant les voitures venant de gauche', choix: OUI_NON('C', 'D') }], bonnes: ['B', 'D'] },
  deux('Je peux rouler :', 'à 50 km/h', 'à 70 km/h', ['A', 'D']),
  oui('Je ralentis', 'A'),
  deux('Derrière la voiture bleue,', 'je peux stationner', "je peux m'arrêter", ['B', 'C']),
  ouBien('À 150 mètres, si le feu clignote,', ['je passerai au ralenti', "je m'arrêterai"], ['B']),
  oui('Je dépasse', 'A'),
  oui('Je peux rouler derrière le cyclomotoriste', 'B'),
  ouBien('Le premier virage sera :', ['à droite', 'à gauche'], ['B']),
  deux('Les signaux indiquent :', 'une déviation de la circulation', 'un virage dangereux à gauche', ['A', 'D']),
  oui('Je dépasse', 'B'),
  ouBien("Pour dépasser ce cycliste, je m'écarte au minimum de :", ['0,50 mètre', '1,00 mètre', '1,50 mètre'], ['C']),
  deux('Ce signal annonce :', "une entrée d'autoroute", 'un carrefour routier', ['B', 'C']),
  deux('Je peux rouler :', 'en feux de croisement', 'en feux de route', ['A', 'D']),
  deux('À la prochaine intersection :', 'je passerai avant les voitures venant de droite', 'je passerai avant les voitures venant de gauche', ['A', 'C']),
  oui('Je ralentis', 'B'),
  oui('Je dépasse', 'B'),
  oui("Je peux m'arrêter ici", 'B'),
  ouBien('Ce signal indique :', ["l'entrée d'une autoroute", "la sortie d'une autoroute"], ['A']),
  ouBien('Je vais rencontrer des feux de signalisation :', ['à 150 mètres', 'à 50 mètres'], ['B']),
  oui('En marche normale, je suis bien placé', 'B'),
  oui('Lorsque je roule hors agglomération, ma ceinture de sécurité doit être bouclée de jour comme de nuit', 'A'),
  ouBien("Lorsqu'il y a un blessé sur la route, je dois prévenir en premier :", ['une pharmacie', 'la police ou la gendarmerie'], ['B']),
  oui('Entre ces lignes bleues, le disque de stationnement est obligatoire', 'A'),
  oui('Dans cette rue à double sens, je suis bien placé pour tourner à gauche', 'B'),
  oui('Je passe avant la voiture blanche', 'B'),
].map((q, k) => ({ ...q, photo: [21, 22].includes(k + 1) ? null : `/annales/b1/${k + 1}.jpg` }))

export const ANNALES = [
  { id: 'annale-b1', titre: 'Catalogue B1', sousTitre: 'Signalisation, dépassement, priorités, stationnement', duree: 40, questions: B1 },
]
