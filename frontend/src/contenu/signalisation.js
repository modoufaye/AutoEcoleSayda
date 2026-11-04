/* Contenu du thème « Signalisation » (cours de code). Textes rédigés pour l'Auto-École Khadija ;
   dessins des panneaux : Wikimedia Commons (CC BY-SA, voir /panneaux/credits.json), servis depuis
   /panneaux/<code>.svg. Les marquages au sol (chapitres 4 à 6) sont dessinés par MarquageSol. */

/* p(code, nom, sens, action, piege) : un panneau officiel ; m(...) : un marquage au sol dessiné */
const p = (code, nom, sens, action, piege) => ({ id: code, image: `/panneaux/${code}.svg`, nom, sens, action, piege })
const m = (id, nom, sens, action, piege) => ({ id, marquage: id, nom, sens, action, piege })

export const CHAPITRES = [
  {
    id: 'danger', numero: 1, titre: 'Panneaux de danger', icone: '/panneaux/A1a.svg',
    resume: 'Triangle à bord rouge : un danger approche',
    aRetenir: [
      'Forme triangulaire, fond blanc et bord rouge : le panneau annonce un danger, il ne vous oblige pas à vous arrêter.',
      'Réflexe : regarder, ralentir, anticiper, rester attentif jusqu\'au danger.',
      'Le danger se trouve à environ 50 m du panneau en ville, et à 150 à 200 m sur route.',
      'Un panonceau rectangulaire sous le triangle peut préciser la distance ou la nature du danger.',
    ],
    piege: 'Le triangle annonce un danger ; c\'est le cercle à bord rouge qui interdit.',
    panneaux: [
      p('A1a', 'Virage à droite', 'Un virage serré vers la droite arrive.', 'Ralentissez avant le virage et gardez bien votre droite ; ne freinez pas en plein virage.'),
      p('A1b', 'Virage à gauche', 'Un virage serré vers la gauche arrive.', 'Réduisez votre vitesse avant d\'entrer dans le virage et restez dans votre voie.'),
      p('A1c', 'Succession de virages', 'Plusieurs virages s\'enchaînent, le premier vers la droite.', 'Gardez une vitesse modérée tout le long, sans réaccélérer entre deux virages.'),
      p('A2a', 'Cassis ou dos-d\'âne', 'La chaussée présente un creux ou une bosse.', 'Passez très lentement pour ne perdre ni le contrôle ni votre suspension.'),
      p('A2b', 'Ralentisseur (dos-d\'âne)', 'Un ralentisseur surélevé est installé sur la route.', 'Abordez-le au pas, surtout près des écoles et des marchés.'),
      p('A3', 'Chaussée rétrécie', 'La route devient plus étroite.', 'Serrez à droite et soyez prêt à laisser passer le véhicule d\'en face.'),
      p('A4', 'Chaussée glissante', 'La route peut glisser : pluie, sable, huile ou gravillons.', 'Ralentissez et évitez tout freinage ou coup de volant brusque.'),
      p('A16', 'Descente dangereuse', 'Une forte pente descend devant vous.', 'Rétrogradez pour utiliser le frein moteur et ne laissez pas la vitesse s\'emballer.'),
      p('A13b', 'Passage pour piétons', 'Un passage piéton est proche.', 'Ralentissez, regardez les trottoirs et soyez prêt à vous arrêter.'),
      p('A13a', 'Enfants', 'Une école ou un lieu fréquenté par des enfants est proche.', 'Ralentissez fortement : un enfant peut traverser sans regarder.'),
      p('A15a1', 'Animaux domestiques', 'Des moutons, chèvres ou vaches peuvent traverser.', 'Ralentissez dès le panneau, très fréquent au Sénégal, et ne klaxonnez pas pour les effrayer.'),
      p('A7', 'Passage à niveau avec barrières', 'Une voie ferrée croise la route, protégée par des barrières.', 'Arrêtez-vous si les feux clignotent ou si les barrières bougent : le train est toujours prioritaire.'),
      p('A8', 'Passage à niveau sans barrière', 'Une voie ferrée croise la route sans aucune barrière.', 'Ralentissez fortement, regardez des deux côtés et ne traversez que si aucun train n\'arrive.', 'Sans barrière, c\'est à vous seul de vérifier qu\'aucun train n\'approche.'),
      p('A17', 'Feux tricolores', 'Un carrefour réglé par des feux arrive.', 'Préparez-vous à vous arrêter au feu orange ou rouge.'),
      p('A24', 'Vent latéral', 'Un fort vent de côté peut souffler.', 'Tenez fermement le volant : le véhicule peut être déporté.'),
      p('AB1', 'Intersection avec priorité à droite', 'Un carrefour arrive où les véhicules venant de droite passent en premier.', 'Ralentissez et cédez le passage à ceux qui arrivent de votre droite.'),
      p('AB2', 'Intersection où vous êtes prioritaire', 'Au prochain carrefour, vous êtes prioritaire sur les routes qui débouchent.', 'Gardez une vitesse prudente : un conducteur peut ne pas respecter votre priorité.'),
      p('A14', 'Autres dangers', 'Un danger que ne décrit aucun autre panneau.', 'Ralentissez et lisez le panonceau qui précise le danger.'),
    ],
    questions: [
      { q: 'Que vous demande un panneau de danger ?', ok: 'Ralentir et anticiper', non: ['Vous arrêter', 'Klaxonner'] },
      { q: 'En ville, à quelle distance environ se trouve le danger annoncé ?', ok: 'À 50 m', non: ['À 500 m', 'Juste sous le panneau'] },
      { q: 'Quelle est la forme d\'un panneau de danger ?', ok: 'Un triangle à bord rouge', non: ['Un cercle à bord rouge', 'Un carré bleu'] },
    ],
  },
  {
    id: 'obligation-interdiction', numero: 2, titre: 'Obligation et interdiction', icone: '/panneaux/B1.svg',
    resume: 'Cercles rouges qui interdisent, cercles bleus qui obligent',
    aRetenir: [
      'Cercle à bord rouge : c\'est une interdiction. Elle commence au panneau.',
      'Cercle bleu : c\'est une obligation, comme une direction à suivre.',
      'STOP (octogone rouge) : arrêt complet à la ligne, puis vous cédez le passage.',
      'Triangle pointe en bas : vous cédez le passage, sans obligation de vous arrêter si la voie est libre.',
    ],
    piege: 'Au STOP, l\'arrêt est obligatoire même si personne ne vient.',
    panneaux: [
      p('AB4', 'STOP', 'Arrêt obligatoire à l\'intersection.', 'Arrêtez-vous complètement à la ligne, regardez, puis repartez en laissant passer tout le monde.', 'Ralentir ne suffit pas : les roues doivent s\'arrêter.'),
      p('AB3a', 'Cédez le passage', 'Vous devez laisser passer les véhicules de la route que vous abordez.', 'Ralentissez et arrêtez-vous seulement si un véhicule arrive.'),
      p('B1', 'Sens interdit', 'Entrer dans cette rue est interdit à tous les véhicules.', 'Ne vous engagez pas : la rue est en sens unique dans l\'autre direction.'),
      p('B0', 'Circulation interdite', 'Aucun véhicule ne peut circuler sur cette route, dans les deux sens.', 'Faites demi-tour ou prenez un autre chemin.'),
      p('B7b', 'Accès interdit aux véhicules à moteur', 'Les véhicules à moteur ne peuvent pas entrer.', 'Passez par une autre route ; piétons et vélos peuvent y aller.'),
      p('B2a', 'Interdiction de tourner à gauche', 'Tourner à gauche est interdit à la prochaine intersection.', 'Continuez tout droit ou à droite.'),
      p('B2b', 'Interdiction de tourner à droite', 'Tourner à droite est interdit à la prochaine intersection.', 'Continuez tout droit ou à gauche.'),
      p('B3', 'Interdiction de dépasser', 'Il est interdit de dépasser les véhicules à moteur, sauf les deux-roues.', 'Restez derrière le véhicule qui vous précède jusqu\'à la fin de l\'interdiction.'),
      p('B14', 'Limitation de vitesse (50)', 'Vous ne devez pas dépasser 50 km/h.', 'Respectez la vitesse indiquée jusqu\'au panneau de fin ou à la prochaine intersection.'),
      p('B6a1', 'Stationnement interdit', 'Vous ne pouvez pas vous garer ici ; un arrêt bref reste permis.', 'Déposez un passager si besoin, mais ne laissez pas le véhicule.'),
      p('B6d', 'Arrêt et stationnement interdits', 'Vous ne pouvez ni vous garer ni même vous arrêter.', 'Continuez votre route sans vous arrêter.', 'Une croix rouge = ni arrêt ni stationnement ; une seule barre = stationnement interdit.'),
      p('B21-1', 'Obligation de tourner à droite', 'Vous devez tourner à droite.', 'Placez-vous à droite et tournez dans la direction indiquée.'),
      p('B21-2', 'Obligation de tourner à gauche', 'Vous devez tourner à gauche.', 'Placez-vous à gauche à temps et tournez.'),
      p('B21a1', 'Contournement par la droite', 'Vous devez passer à droite de l\'obstacle.', 'Contournez par la droite le terre-plein ou les travaux.'),
      p('B21e', 'Directions obligatoires', 'Seules les directions indiquées sont permises au prochain carrefour.', 'Choisissez l\'une des directions montrées par les flèches.'),
      p('B22a', 'Piste cyclable obligatoire', 'Cette piste est réservée aux vélos, qui doivent l\'emprunter.', 'Ne roulez pas et ne vous garez pas sur cette piste avec une voiture.'),
    ],
    questions: [
      { q: 'Au panneau STOP, que devez-vous faire ?', ok: 'M\'arrêter complètement, puis céder le passage', non: ['Ralentir seulement', 'Klaxonner et passer'] },
      { q: 'Un cercle à bord rouge signifie…', ok: 'Une interdiction', non: ['Une obligation', 'Un danger'] },
      { q: 'Un cercle bleu signifie…', ok: 'Une obligation', non: ['Une interdiction', 'Une simple information'] },
    ],
  },
  {
    id: 'indication', numero: 3, titre: 'Indication et direction', icone: '/panneaux/C1a.svg',
    resume: 'Carrés bleus et losanges : pour vous informer',
    aRetenir: [
      'Panneaux carrés ou rectangulaires, souvent bleus : ils informent, ils n\'obligent à rien.',
      'Losange jaune : vous êtes sur une route prioritaire, jusqu\'au losange barré.',
      'Sur autoroute, la signalisation est verte ou bleue selon les pays : suivez les panneaux de sortie à l\'avance.',
    ],
    piege: 'Le panneau « sens unique » est carré bleu ; le « sens interdit » est rond et rouge.',
    panneaux: [
      p('AB6', 'Route prioritaire', 'Vous êtes prioritaire aux prochaines intersections de cette route.', 'Gardez votre vitesse, mais restez attentif aux conducteurs qui ne respectent pas la priorité.'),
      p('AB7', 'Fin de route prioritaire', 'Votre priorité s\'arrête ici.', 'Aux prochains carrefours, appliquez de nouveau la priorité à droite ou les panneaux.'),
      p('C12', 'Sens unique', 'La rue est à sens unique, dans le sens de la flèche.', 'Vous pouvez utiliser toute la largeur ; attention aux véhicules garés des deux côtés.'),
      p('C18', 'Priorité sur le sens inverse', 'Sur ce passage étroit, vous passez avant les véhicules d\'en face.', 'Passez prudemment ; l\'autre conducteur doit vous attendre.'),
      p('C1a', 'Parking', 'Une zone de stationnement est proche.', 'Garez-vous sur les places prévues.'),
      p('C20a', 'Passage pour piétons', 'Vous êtes au niveau d\'un passage piéton.', 'Laissez traverser les piétons engagés ou qui attendent.'),
      p('C27', 'Surélévation de chaussée', 'La chaussée est surélevée (plateau ou ralentisseur).', 'Passez lentement, souvent près d\'une école ou d\'un passage piéton.'),
      p('C107', 'Autoroute', 'Vous entrez sur une autoroute.', 'Piétons, charrettes et cyclomoteurs y sont interdits ; respectez les vitesses de l\'autoroute.'),
      p('C108', 'Fin d\'autoroute', 'L\'autoroute se termine.', 'Réduisez votre vitesse : les règles de la route normale reprennent.'),
      p('CE15a', 'Poste de carburant', 'Une station-service est proche.', 'Prévoyez votre arrêt et signalez-le tôt avec le clignotant.'),
    ],
    questions: [
      { q: 'Que signifie le losange jaune ?', ok: 'Route prioritaire', non: ['Danger', 'Stationnement interdit'] },
      { q: 'Un panneau carré bleu sert surtout à…', ok: 'Vous informer', non: ['Vous interdire', 'Vous obliger à vous arrêter'] },
    ],
  },
  {
    id: 'lignes', numero: 4, titre: 'Lignes longitudinales', icone: 'marquage:continue',
    resume: 'Les lignes au milieu de la route',
    aRetenir: [
      'Ligne continue : ne la franchissez jamais, ni pour dépasser ni pour tourner.',
      'Ligne discontinue : vous pouvez la franchir si la voie est libre et la manœuvre sans danger.',
      'Ligne mixte : seul le côté discontinu autorise à la franchir.',
      'Ligne d\'annonce (traits longs) : une ligne continue approche, terminez votre dépassement.',
    ],
    piege: 'Chevaucher une ligne continue est déjà interdit, même pour un court instant.',
    panneaux: [
      m('continue', 'Ligne continue', 'Elle sépare les sens de circulation sans possibilité de passage.', 'Ne la franchissez pas et ne la chevauchez pas.'),
      m('discontinue', 'Ligne discontinue', 'Traits courts : on peut la franchir.', 'Franchissez-la seulement si la voie d\'en face est libre, pour dépasser ou tourner.'),
      m('annonce', 'Ligne d\'annonce', 'Traits longs et rapprochés : une ligne continue arrive.', 'Ne commencez pas de dépassement et rabattez-vous.'),
      m('mixte', 'Ligne mixte', 'Une ligne continue doublée d\'une ligne discontinue.', 'Vous ne pouvez la franchir que si la partie discontinue est de votre côté.', 'Regardez de quel côté se trouve le trait discontinu.'),
      m('double', 'Double ligne continue', 'Deux lignes continues : interdiction renforcée de franchir.', 'Restez dans votre voie sur toute la longueur.'),
      m('rabattement', 'Flèches de rabattement', 'Des flèches obliques au sol annoncent une ligne continue.', 'Revenez dans votre voie sans attendre.'),
    ],
    questions: [
      { q: 'Peut-on chevaucher une ligne continue pour dépasser un vélo ?', ok: 'Non, jamais', non: ['Oui, si c\'est rapide', 'Oui, la nuit'] },
      { q: 'Une ligne mixte peut être franchie…', ok: 'Du côté de la ligne discontinue', non: ['Des deux côtés', 'Jamais'] },
    ],
  },
  {
    id: 'rive', numero: 5, titre: 'Lignes de rive et voies spéciales', icone: 'marquage:rive',
    resume: 'Bords de chaussée et voies réservées',
    aRetenir: [
      'La ligne de rive marque le bord de la chaussée.',
      'Rive continue : ne roulez pas sur l\'accotement. Rive discontinue : on peut s\'y arrêter ou y entrer.',
      'Voie de bus ou piste cyclable : réservée, n\'y roulez pas et ne vous y garez pas.',
      'Bande d\'arrêt d\'urgence : seulement pour une panne ou une urgence.',
    ],
    panneaux: [
      m('rive', 'Ligne de rive continue', 'Elle marque le bord de la chaussée.', 'Ne roulez pas au-delà, sauf pour vous arrêter en cas d\'urgence.'),
      m('rive-discontinue', 'Ligne de rive discontinue', 'Le bord peut être franchi : entrée de chemin, arrêt, stationnement.', 'Franchissez-la pour vous arrêter ou entrer, en signalant votre manœuvre.'),
      m('bau', 'Bande d\'arrêt d\'urgence', 'Voie à droite, séparée par une ligne, pour les pannes et urgences.', 'N\'y roulez jamais pour dépasser ; en panne, allumez vos feux de détresse.'),
      m('bus', 'Voie réservée aux bus', 'Le mot BUS est peint et la voie est séparée par une large ligne.', 'Ne l\'empruntez pas avec une voiture et ne vous y arrêtez pas.'),
      m('velo', 'Bande cyclable', 'Une bande peinte avec un vélo est réservée aux cyclistes.', 'Laissez-la libre et regardez avant de tourner à droite.'),
      m('insertion', 'Voie d\'insertion', 'Traits courts et rapprochés le long de la voie d\'accélération.', 'Prenez de la vitesse sur cette voie et insérez-vous sans gêner.'),
    ],
    questions: [
      { q: 'Peut-on rouler sur la bande d\'arrêt d\'urgence pour dépasser ?', ok: 'Non, elle est réservée aux urgences', non: ['Oui, si la voie est libre', 'Oui, en cas d\'embouteillage'] },
    ],
  },
  {
    id: 'zones', numero: 6, titre: 'Zones et stationnement', icone: 'marquage:pieton',
    resume: 'Passages piétons, arrêts et places',
    aRetenir: [
      'Au passage piéton (bandes blanches), le piéton engagé est prioritaire.',
      'Ligne d\'arrêt continue au sol : on s\'y arrête au STOP ou au feu rouge.',
      'Ligne en pointillés avec triangles : on y cède le passage.',
      'Zone hachurée : elle ne se traverse pas et on ne s\'y arrête pas.',
    ],
    piege: 'Ne vous arrêtez jamais sur un passage piéton, même pour un instant.',
    panneaux: [
      m('pieton', 'Passage pour piétons', 'Larges bandes blanches parallèles à la route.', 'Ralentissez et laissez passer le piéton engagé ; ne stationnez pas dessus.'),
      m('arret', 'Ligne d\'arrêt', 'Ligne blanche continue en travers de la voie.', 'Arrêtez-vous avant cette ligne au STOP ou au feu rouge.'),
      m('cedez', 'Ligne « cédez le passage »', 'Ligne en traits, souvent avec des triangles au sol.', 'Ralentissez et cédez le passage avant la ligne.'),
      m('hachures', 'Zone hachurée', 'Bandes obliques qui neutralisent une partie de la chaussée.', 'Ne la traversez pas et ne vous y arrêtez pas.'),
      m('zigzag', 'Ligne jaune en zigzag', 'Elle signale un arrêt de bus.', 'Ne vous y arrêtez pas et ne vous y garez pas.'),
      m('places', 'Places de stationnement', 'Cases délimitées au sol.', 'Garez-vous dans une case, sans déborder.'),
      m('fleches', 'Flèches de sélection', 'Flèches peintes avant un carrefour.', 'Placez-vous dans la voie de la direction que vous allez prendre.'),
    ],
    questions: [
      { q: 'Peut-on s\'arrêter un instant sur un passage piéton ?', ok: 'Non, jamais', non: ['Oui, pour déposer un passager', 'Oui, si personne ne traverse'] },
      { q: 'La ligne jaune en zigzag signale…', ok: 'Un arrêt de bus', non: ['Un parking gratuit', 'Une route prioritaire'] },
    ],
  },
]

/* Révision finale : 30 questions tirées de tous les chapitres, débloquée après les 6 autres. */
export const REVISION = { id: 'revision', numero: 7, titre: 'Révision finale', resume: '30 questions sur tous les panneaux', icone: '/panneaux/A14.svg', nombre: 30 }

export const SEUIL_REUSSITE = 0.7   // 70 % de bonnes réponses pour valider un chapitre

/* Tirage stable (graine) : les mêmes réponses dans le même ordre pour une question donnée. */
function melanger(liste, graine) {
  const a = [...liste]; let s = graine
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const graineDe = txt => [...txt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7)

/* Questions d'un chapitre : « Que signifie ce panneau ? » pour chaque panneau (deux autres
   panneaux du chapitre comme mauvaises réponses), plus les questions de règles. */
export function questionsChapitre(ch) {
  const panneaux = ch.panneaux.map(pa => {
    const autres = melanger(ch.panneaux.filter(x => x.id !== pa.id), graineDe(pa.id)).slice(0, 2).map(x => x.nom)
    return { id: `${ch.id}:${pa.id}`, visuel: pa, q: 'Que signifie ce panneau ?', reponses: melanger([pa.nom, ...autres], graineDe(pa.id + 'r')), bonne: pa.nom, explication: pa.action }
  })
  const regles = ch.questions.map((x, i) => ({ id: `${ch.id}:q${i}`, q: x.q, reponses: melanger([x.ok, ...x.non], graineDe(x.q)), bonne: x.ok }))
  return [...panneaux, ...regles]
}

export function questionsRevision() {
  const toutes = CHAPITRES.flatMap(questionsChapitre)
  return melanger(toutes, Date.now() % 100000).slice(0, REVISION.nombre)
}

export const IDS_CHAPITRES = [...CHAPITRES.map(c => c.id), REVISION.id]
