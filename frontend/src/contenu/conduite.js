/* Parcours « Apprendre à conduire » (onglet Cours Conduite) : 6 thèmes, du volant à l'autoroute.
   Textes rédigés pour l'Auto-École Khadija ; même format que contenu/reglesConduite.js.
   Identifiants « conduite-… » : ouverts aussi aux élèves en perfectionnement (ProgressionCodeController). */

const p = (code, nom, sens, action, piege) => ({ id: code, image: `/panneaux/${code}.svg`, nom, sens, action, piege })
const i = (id, icone, couleur, texte, nom, sens, action, piege) => ({ id, picto: { icone, couleur, texte }, nom, sens, action, piege, quiz: false })

const BLEU = '#1d4ed8', ROUGE = '#dc2626', VERT = '#16a34a', OR = '#d97706', VIOLET = '#7c3aed', GRIS = '#475569'
const rev = (cle, numero, sur, icone) => ({ id: `conduite-${cle}-revision`, numero, titre: 'Révision finale', resume: `10 questions sur ${sur}`, icone, nombre: 10 })

export const THEMES_CONDUITE = [
  /* ── 1 · Manœuvres de base ── */
  {
    key: 'conduite-manoeuvres', titre: 'Manœuvres de base', numero: 1,
    description: 'Prendre en main la voiture, démarrer en boîte manuelle, se garer et faire demi-tour.',
    decor: [{ icone: 'person-badge', couleur: BLEU }, { icone: 'gear-wide-connected', couleur: '#1e3a5f' }, { icone: 'p-circle-fill', couleur: BLEU }],
    chapitres: [
      {
        id: 'conduite-prise-en-main', numero: 1, titre: 'Prise en main du véhicule', icone: { icone: 'person-badge', couleur: BLEU },
        resume: 'Réglages et commandes avant de partir',
        aRetenir: [
          'Avant de démarrer, toujours dans cet ordre : siège, ceinture, rétroviseurs, puis la clé.',
          'Siège bien réglé : vous enfoncez la pédale de gauche jusqu\'au fond sans décoller le dos du dossier, bras légèrement pliés sur le volant.',
          'Rétroviseurs : l\'intérieur montre toute la lunette arrière ; les extérieurs montrent à peine le flanc de la voiture.',
          'Même bien réglés, les rétroviseurs laissent des angles morts : tournez la tête avant de changer de direction.',
          'Boîte manuelle : 3 pédales (embrayage, frein, accélérateur), levier de vitesses et frein à main. Boîte automatique : 2 pédales et un sélecteur P, R, N, D.',
        ],
        piege: 'En boîte automatique, on conduit avec le seul pied droit : jamais les deux pieds sur les pédales.',
        panneaux: [
          i('siege', 'person-fill-gear', BLEU, '1', 'Le siège', 'Bien assis, vous gardez le contrôle et freinez fort.', 'Réglez la distance et le dossier : pédale de gauche enfoncée à fond, dos collé au siège.'),
          i('ceinture', 'person-check-fill', VERT, '2', 'La ceinture', 'Elle vous retient en cas de choc.', 'Bouclez-la avant de démarrer, sangle à plat sur l\'épaule et le bassin.'),
          i('retros', 'car-front-fill', GRIS, '3', 'Les rétroviseurs', 'Ils montrent l\'arrière et les côtés.', 'Réglez l\'intérieur puis les deux extérieurs avant de partir.'),
          i('angle-mort', 'eye-slash-fill', OR, null, 'L\'angle mort', 'Une zone que les rétroviseurs ne montrent pas.', 'Tournez la tête avant de déboîter ou de changer de voie.'),
          i('pedales', 'three-dots', '#1e3a5f', '3', 'Boîte manuelle : 3 pédales', 'De gauche à droite : embrayage, frein, accélérateur.', 'Pied gauche pour l\'embrayage seulement, pied droit pour frein et accélérateur.'),
          i('auto', 'record-circle', VIOLET, 'P R N D', 'Boîte automatique', 'Parking, marche arrière, neutre, marche avant.', 'Pied sur le frein pour changer de position ; jamais les deux pieds.'),
          i('frein-main', 'p-square-fill', ROUGE, null, 'Le frein à main', 'Il immobilise la voiture à l\'arrêt.', 'Serrez-le à chaque stationnement, surtout en pente.'),
        ],
        questions: [
          { q: 'Dans quel ordre se préparer avant de démarrer ?', ok: 'Siège, ceinture, rétroviseurs, clé', non: ['Clé, ceinture, siège', 'Rétroviseurs, clé, ceinture'] },
          { q: 'Comment savoir que le siège est bien réglé ?', ok: 'La pédale de gauche s\'enfonce à fond sans décoller le dos', non: ['Les bras sont tendus au maximum', 'Le volant touche la poitrine'] },
          { q: 'Les rétroviseurs suffisent-ils pour changer de voie ?', ok: 'Non, il faut aussi tourner la tête pour l\'angle mort', non: ['Oui, s\'ils sont bien réglés', 'Oui, de jour'] },
          { q: 'Combien de pédales en boîte manuelle ?', ok: 'Trois', non: ['Deux', 'Quatre'] },
          { q: 'En boîte automatique, avec quel pied conduit-on ?', ok: 'Le pied droit seulement', non: ['Les deux pieds', 'Le pied gauche pour le frein'] },
        ],
      },
      {
        id: 'conduite-boite-manuelle', numero: 2, titre: 'Boîte manuelle et démarrage', icone: { icone: 'gear-wide-connected', couleur: '#1e3a5f' },
        resume: 'Embrayage, point de patinage, démarrage en côte',
        aRetenir: [
          'Pédale d\'embrayage enfoncée : le moteur ne fait plus tourner les roues. C\'est ce qui permet de changer de vitesse.',
          'Point de patinage : en relâchant doucement l\'embrayage, le moteur commence à entraîner les roues ; on sent la voiture vouloir avancer et le régime baisser un peu.',
          'Démarrer à plat : point mort, embrayage enfoncé, contact, 1re vitesse, embrayage jusqu\'au point de patinage, un peu d\'accélérateur, puis relâcher complètement.',
          'Démarrer en côte : frein à main serré, 1re vitesse, point de patinage, un peu d\'accélérateur, puis desserrer le frein à main en relâchant l\'embrayage.',
          'Monter les vitesses : accélérer, débrayer, passer la vitesse supérieure, rembrayer. Rétrograder pour ralentir ou retrouver de la force.',
        ],
        piege: 'Relâcher l\'embrayage d\'un coup fait caler : on le remonte doucement jusqu\'au point de patinage.',
        panneaux: [
          i('embrayage', 'arrow-left-right', BLEU, null, 'L\'embrayage', 'Il relie ou sépare le moteur et les roues.', 'Enfoncez-le à fond pour démarrer et pour changer de vitesse.'),
          i('patinage', 'bullseye', OR, null, 'Le point de patinage', 'Le moment où le moteur commence à entraîner la voiture.', 'Arrêtez-vous dessus, le temps de donner un peu d\'accélérateur.'),
          i('plat', 'arrow-right-circle-fill', VERT, '1re', 'Démarrer à plat', 'Point mort, contact, 1re, point de patinage.', 'Accélérez un peu et relâchez l\'embrayage en douceur.'),
          i('cote', 'graph-up-arrow', OR, null, 'Démarrer en côte', 'La voiture risque de reculer.', 'Gardez le frein à main jusqu\'au point de patinage, puis desserrez-le en accélérant.'),
          i('monter', 'arrow-up-circle-fill', BLEU, null, 'Monter les vitesses', 'Pour rouler plus vite sans faire hurler le moteur.', 'Accélérer, débrayer, vitesse supérieure, rembrayer.'),
          i('retrograder', 'arrow-down-circle-fill', VIOLET, null, 'Rétrograder', 'Pour ralentir avec le frein moteur ou retrouver de la force.', 'Passez la vitesse inférieure avant une descente ou un virage serré.'),
          i('caler', 'exclamation-circle-fill', ROUGE, null, 'Caler', 'Le moteur s\'arrête parce que l\'embrayage a été lâché trop vite.', 'Débrayez, point mort, redémarrez sans vous énerver.'),
        ],
        questions: [
          { q: 'À quoi sert la pédale d\'embrayage ?', ok: 'À séparer le moteur des roues pour changer de vitesse', non: ['À freiner', 'À accélérer'] },
          { q: 'Qu\'est-ce que le point de patinage ?', ok: 'Le moment où le moteur commence à entraîner les roues', non: ['Le frein à fond', 'Le moteur qui cale'] },
          { q: 'Pour démarrer en côte, quand desserrer le frein à main ?', ok: 'Au point de patinage, en accélérant un peu', non: ['Avant de démarrer le moteur', 'Après avoir lâché tout l\'embrayage'] },
          { q: 'Pourquoi le moteur cale-t-il ?', ok: 'L\'embrayage a été relâché trop vite', non: ['On a trop accéléré', 'Le frein à main est desserré'] },
          { q: 'Pourquoi rétrograder avant une descente ?', ok: 'Pour être retenu par le frein moteur', non: ['Pour aller plus vite', 'Pour économiser les pneus'] },
        ],
      },
      {
        id: 'conduite-manoeuvres-parking', numero: 3, titre: 'Manœuvres et stationnement', icone: { icone: 'p-circle-fill', couleur: BLEU },
        resume: 'Créneau, demi-tour, marche arrière, pente',
        aRetenir: [
          'Avant toute manœuvre : regarder, contrôler les rétroviseurs, vérifier l\'angle mort, signaler, puis agir.',
          'Créneau : on recule au pas, on braque vers le trottoir, puis on contre-braque pour aligner la voiture.',
          'Marche arrière : très lentement, en regardant par la lunette arrière ou en se retournant.',
          'En pente qui monte, roues tournées vers la chaussée ; en pente qui descend, roues vers le trottoir ; toujours le frein à main.',
          'Demi-tour interdit dans un virage, en haut d\'une côte, sur un passage à niveau et sur autoroute.',
          'En quittant une place, vous laissez passer tous ceux qui circulent.',
        ],
        piege: 'Sortir d\'une place ne donne aucune priorité : clignotant, rétroviseur, angle mort, et on attend que ce soit libre.',
        panneaux: [
          i('methode', 'list-check', BLEU, '5', 'La méthode avant de manœuvrer', 'Regarder, rétroviseurs, angle mort, clignotant, agir.', 'Appliquez-la à chaque manœuvre, même courte.'),
          i('creneau', 'arrow-return-left', VERT, null, 'Le créneau', 'Se garer entre deux voitures en marche arrière.', 'Reculez au pas, braquez vers le trottoir, puis contre-braquez pour vous aligner.'),
          i('marche-arriere', 'arrow-down', GRIS, null, 'La marche arrière', 'On voit mal ce qui est derrière.', 'Roulez au pas en vous retournant ; arrêtez-vous au moindre doute.'),
          i('pente', 'triangle-half', OR, null, 'Se garer en pente', 'La voiture pourrait partir seule.', 'Frein à main serré, roues tournées pour que la voiture bute contre le trottoir.'),
          i('demi-tour', 'arrow-counterclockwise', ROUGE, null, 'Le demi-tour', 'Une manœuvre qui coupe la route.', 'Jamais dans un virage, en haut d\'une côte, sur un passage à niveau ou sur autoroute.'),
          i('sortir', 'box-arrow-right', OR, null, 'Quitter une place', 'Vous n\'êtes pas prioritaire.', 'Clignotant, rétroviseur, angle mort, puis partez quand la voie est libre.'),
        ],
        questions: [
          { q: 'Que fait-on avant toute manœuvre ?', ok: 'Regarder, rétroviseurs, angle mort, clignotant', non: ['On klaxonne et on y va', 'Rien, si on va vite'] },
          { q: 'À quelle vitesse fait-on un créneau ?', ok: 'Au pas', non: ['À 20 km/h', 'Le plus vite possible'] },
          { q: 'Où le demi-tour est-il interdit ?', ok: 'Dans un virage, en haut d\'une côte, sur autoroute', non: ['Dans une rue large', 'Sur un parking'] },
          { q: 'Vous sortez d\'une place. Qui passe en premier ?', ok: 'Ceux qui circulent déjà', non: ['Moi, avec mon clignotant', 'Le plus rapide'] },
          { q: 'Que faire en se garant en pente ?', ok: 'Serrer le frein à main et tourner les roues', non: ['Laisser au point mort', 'Garder le moteur allumé'] },
        ],
      },
    ],
    revision: rev('manoeuvres', 4, 'les manœuvres', { icone: 'gear-wide-connected', couleur: '#1e3a5f' }),
  },

  /* ── 2 · Conduite en ville ── */
  {
    key: 'conduite-ville', titre: 'Conduite en ville', numero: 2,
    description: 'Circuler en agglomération : trafic dense, piétons, deux-roues, cars rapides et carrefours.',
    decor: ['A13b', 'B14', 'AB25'],
    chapitres: [
      {
        id: 'conduite-circulation-urbaine', numero: 1, titre: 'Circulation urbaine', icone: { icone: 'buildings-fill', couleur: BLEU },
        resume: 'Vitesse, piétons, deux-roues, transports',
        aRetenir: [
          'En ville, 50 km/h au plus, souvent moins : écoles, marchés, rues étroites.',
          'Piétons, cyclistes et deux-roues sont les plus fragiles : laissez-leur de la place et regardez souvent les rétroviseurs.',
          'Attendez-vous à l\'imprévu : enfant qui traverse, marchand ambulant, animal, porte qui s\'ouvre.',
          'Cars rapides, taxis et bus s\'arrêtent n\'importe où : gardez vos distances et ne collez pas.',
          'Pas de double file : elle bloque la rue et cache les piétons.',
          'Aux heures de pointe, restez patient : pas de manœuvre risquée pour gagner une minute.',
        ],
        piege: 'Un bus arrêté peut cacher un piéton qui traverse devant lui : passez au pas.',
        panneaux: [
          p('B14', 'Limitation à 50 km/h', 'La vitesse maximale en ville.', 'Roulez souvent en dessous : la ville est pleine d\'imprévus.'),
          i('pietons', 'person-walking', VERT, null, 'Les piétons', 'Ils traversent souvent hors des passages.', 'Ralentissez et soyez prêt à freiner.'),
          i('deux-roues', 'scooter', ROUGE, null, 'Les deux-roues', 'Ils se faufilent entre les voitures.', 'Regardez rétroviseurs et angle mort avant de tourner.'),
          i('transports', 'bus-front-fill', OR, null, 'Cars rapides, taxis, bus', 'Arrêts fréquents et soudains.', 'Gardez vos distances et méfiez-vous des piétons qui en descendent.'),
          i('imprevus', 'exclamation-diamond-fill', OR, null, 'Les imprévus', 'Enfants, marchands, animaux, portières.', 'Regardez loin devant et sur les côtés.'),
          i('patience', 'hourglass-split', GRIS, null, 'Heures de pointe', 'Bouchons et impatience.', 'Restez calme et ne forcez jamais le passage.'),
        ],
        questions: [
          { q: 'Quelle est la vitesse maximale en ville ?', ok: '50 km/h', non: ['70 km/h', '90 km/h'] },
          { q: 'Un car rapide s\'arrête devant vous. Que faites-vous ?', ok: 'Je ralentis et je surveille les piétons', non: ['Je le dépasse vite', 'Je klaxonne'] },
          { q: 'Peut-on s\'arrêter en double file un instant ?', ok: 'Non', non: ['Oui, avec les feux de détresse', 'Oui, aux heures creuses'] },
          { q: 'Qui sont les usagers les plus fragiles en ville ?', ok: 'Piétons, cyclistes, deux-roues', non: ['Les camions', 'Les taxis'] },
          { q: 'Embouteillage aux heures de pointe : que faites-vous ?', ok: 'Je reste patient et sans manœuvre risquée', non: ['Je roule sur le trottoir', 'Je force le passage'] },
          { q: "Une portière s'ouvre devant vous. Comment l'éviter à l'avance ?", ok: 'En laissant de la place le long des voitures garées', non: ['En klaxonnant', 'En roulant au ras des voitures'] },
        ],
      },
      {
        id: 'conduite-carrefours-ville', numero: 2, titre: 'Carrefours et giratoires', icone: '/panneaux/AB25.svg',
        resume: 'Se placer, tourner, entrer et sortir d\'un giratoire',
        aRetenir: [
          'Approchez d\'un carrefour en ralentissant, en lisant les panneaux et les feux.',
          'Pour tourner à droite : serrez à droite, clignotant tôt, et attention au deux-roues qui longe la voiture.',
          'Pour tourner à gauche : placez-vous près du milieu, laissez passer ceux d\'en face et les piétons.',
          'Giratoire : on cède le passage à ceux qui tournent déjà, on circule dans le sens inverse des aiguilles d\'une montre.',
          'Pour sortir d\'un giratoire : clignotant droit avant la sortie.',
          'Ne vous engagez pas si vous ne pouvez pas dégager le carrefour.',
        ],
        piege: 'Dans un giratoire, celui qui est déjà engagé passe : on n\'entre jamais en force.',
        panneaux: [
          p('AB25', 'Carrefour giratoire', 'Un rond-point arrive.', 'Ralentissez et laissez passer ceux qui tournent déjà.'),
          i('droite', 'arrow-90deg-right', BLEU, null, 'Tourner à droite', 'Un deux-roues peut se glisser à votre droite.', 'Serrez à droite, clignotant, rétroviseur et angle mort.'),
          i('gauche', 'arrow-90deg-left', BLEU, null, 'Tourner à gauche', 'Il faut couper la voie d\'en face.', 'Placez-vous au milieu et laissez passer ceux d\'en face et les piétons.'),
          i('giratoire-sortie', 'signpost-2-fill', OR, null, 'Sortir du giratoire', 'Les autres doivent savoir où vous allez.', 'Clignotant droit juste avant votre sortie.'),
          i('degager', 'sign-stop-fill', ROUGE, null, 'Carrefour encombré', 'Vous risquez de rester au milieu.', 'Attendez avant la ligne que la sortie soit libre.'),
        ],
        questions: [
          { q: 'Dans un giratoire, qui est prioritaire ?', ok: 'Ceux qui tournent déjà', non: ['Ceux qui entrent', 'Les plus gros véhicules'] },
          { q: 'Pour sortir d\'un giratoire, quel clignotant ?', ok: 'Le clignotant droit', non: ['Le clignotant gauche', 'Aucun'] },
          { q: 'Vous tournez à droite. Quel danger surveiller ?', ok: 'Un deux-roues qui longe la voiture', non: ['Les voitures d\'en face', 'Rien de particulier'] },
          { q: 'Le carrefour est encombré au vert. Que faites-vous ?', ok: 'J\'attends avant la ligne', non: ['Je m\'engage quand même', 'Je klaxonne'] },
          { q: 'Pour tourner à gauche, où se placer ?', ok: 'Près du milieu de la chaussée', non: ['Tout à droite', 'Sur le trottoir'] },
          { q: 'Avant de tourner, que faites-vous pour les piétons ?', ok: 'Je les laisse traverser la rue où je vais', non: ['Je passe avant eux', 'Je klaxonne'] },
        ],
      },
    ],
    revision: rev('ville', 3, 'la conduite en ville', '/panneaux/A13b.svg'),
  },

  /* ── 3 · Conduite sur route ── */
  {
    key: 'conduite-route', titre: 'Conduite sur route', numero: 3,
    description: 'Routes nationales et voies express : vitesse, distances, dépassements et croisements.',
    decor: ['B14-90', 'B3', 'B14-110'],
    chapitres: [
      {
        id: 'conduite-route-nationale', numero: 1, titre: 'Route nationale et voie express', icone: '/panneaux/B14-90.svg',
        resume: 'Vitesses, distances, insertion',
        aRetenir: [
          'Hors agglomération : 90 km/h sur route ordinaire, 110 km/h sur voie express, moins s\'il pleut ou si la route est mauvaise.',
          'Gardez au moins 2 secondes d\'écart avec le véhicule de devant, plus derrière un camion.',
          'Sur une voie express, entrez en accélérant sur la voie d\'insertion pour rouler à la vitesse des autres.',
          'La nuit, ne roulez pas plus vite que la portée de vos phares.',
          'Traversée de village : ralentissez dès le panneau, enfants et animaux au bord de la route.',
        ],
        piege: 'Sur une longue ligne droite, la vitesse monte sans qu\'on s\'en rende compte : surveillez le compteur.',
        panneaux: [
          p('B14-90', 'Limitation à 90 km/h', 'Vitesse maximale sur route ordinaire.', 'Roulez plus doucement sous la pluie ou sur route abîmée.'),
          p('B14-110', 'Limitation à 110 km/h', 'Vitesse maximale sur voie express.', 'Gardez de grandes distances.'),
          i('distance', 'clock-history', VERT, '2 s', 'Distance de sécurité', 'Le temps de réagir et de freiner.', 'Au moins 2 secondes, plus derrière un camion ou sous la pluie.'),
          i('insertion', 'sign-merge-right-fill', BLEU, null, 'S\'insérer', 'Entrer sur une voie rapide.', 'Accélérez sur la voie d\'insertion, clignotant, rétroviseur, angle mort.'),
          i('village', 'house-fill', OR, null, 'Traversée de village', 'Piétons, enfants et animaux près de la route.', 'Ralentissez dès l\'entrée du village.'),
          i('nuit', 'moon-stars-fill', VIOLET, null, 'La nuit', 'On ne voit que jusqu\'où éclairent les phares.', 'Adaptez la vitesse à la portée des feux.'),
        ],
        questions: [
          { q: 'Vitesse maximale sur route ordinaire ?', ok: '90 km/h', non: ['110 km/h', '70 km/h'] },
          { q: 'Vitesse maximale sur voie express ?', ok: '110 km/h', non: ['130 km/h', '90 km/h'] },
          { q: 'Quel écart minimum avec le véhicule de devant ?', ok: '2 secondes', non: ['Une demi-seconde', '10 mètres'] },
          { q: 'Comment entrer sur une voie express ?', ok: 'En accélérant sur la voie d\'insertion', non: ['En s\'arrêtant au bout de la voie', 'Au pas'] },
          { q: 'Vous entrez dans un village. Que faites-vous ?', ok: "Je ralentis dès le panneau d'entrée", non: ['Je garde 90 km/h', "J'accélère pour le traverser vite"] },
          { q: 'Derrière un camion, la distance de sécurité…', ok: 'Doit être plus grande', non: ['Peut être plus courte', 'Ne compte pas'] },
        ],
      },
      {
        id: 'conduite-route-depasser', numero: 2, titre: 'Dépasser et croiser', icone: '/panneaux/B3.svg',
        resume: 'Dépasser un camion, croiser sur route étroite',
        aRetenir: [
          'Avant de dépasser : visibilité, ligne discontinue, place pour revenir, personne qui vous dépasse.',
          'Un camion est long : il faut beaucoup de place et de temps pour le dépasser.',
          'Si le conducteur dépassé accélère ou si un véhicule arrive en face, renoncez et revenez derrière.',
          'Route étroite : serrez à droite et ralentissez pour croiser ; en côte, celui qui descend s\'arrête si besoin.',
          'Charrette ou troupeau sur la route : ralentissez fortement et laissez une large distance.',
        ],
        piege: 'Dépasser n\'est jamais obligatoire : dans le doute, on reste derrière.',
        panneaux: [
          p('B3', 'Interdiction de dépasser', 'Dépassement interdit jusqu\'au panneau de fin.', 'Restez derrière, même un véhicule lent.'),
          i('camion', 'truck', GRIS, null, 'Dépasser un camion', 'Long, il cache la route et crée un appel d\'air.', 'Attendez une longue ligne droite et dépassez franchement.'),
          i('renoncer', 'x-octagon-fill', ROUGE, null, 'Renoncer', 'Un véhicule arrive ou l\'autre accélère.', 'Freinez doucement et revenez derrière lui.'),
          i('croiser', 'arrows-collapse', BLEU, null, 'Croiser sur route étroite', 'Peu de place pour deux véhicules.', 'Ralentissez et serrez à droite.'),
          i('charrette', 'cart-fill', OR, null, 'Charrettes et troupeaux', 'Lents et imprévisibles.', 'Ralentissez, laissez de la place, ne klaxonnez pas fort.'),
        ],
        questions: [
          { q: 'Un véhicule arrive en face pendant votre dépassement. Que faites-vous ?', ok: 'Je renonce et je reviens derrière', non: ['J\'accélère encore', 'Je klaxonne'] },
          { q: 'Dépasser est-il obligatoire derrière un véhicule lent ?', ok: 'Non, dans le doute on reste derrière', non: ['Oui', 'Oui, sur route droite'] },
          { q: 'Sur route étroite, pour croiser :', ok: 'Je ralentis et je serre à droite', non: ['Je roule au milieu', 'J\'accélère'] },
          { q: 'Un troupeau occupe la route. Que faites-vous ?', ok: 'Je ralentis fortement et laisse de la place', non: ['Je klaxonne fort et je passe', 'Je garde ma vitesse'] },
          { q: 'Que faut-il vérifier avant de dépasser ?', ok: 'Visibilité, ligne discontinue, place pour revenir', non: ['Seulement la vitesse', 'Rien si la route est droite'] },
          { q: 'Pourquoi un camion est-il long à dépasser ?', ok: 'Il est long et il faut beaucoup de place', non: ['Il roule toujours vite', "Ce n'est pas plus long qu'une voiture"] },
        ],
      },
    ],
    revision: rev('route', 3, 'la conduite sur route', '/panneaux/B14-90.svg'),
  },

  /* ── 4 · Situations d'urgence ── */
  {
    key: 'conduite-urgence', titre: 'Situations d\'urgence', numero: 4,
    description: 'Freinage d\'urgence, crevaison, dérapage, panne, fumée : les bons réflexes.',
    decor: [{ icone: 'exclamation-octagon-fill', couleur: ROUGE }, { icone: 'exclamation-triangle-fill', couleur: OR }, { icone: 'fire', couleur: ROUGE }],
    chapitres: [
      {
        id: 'conduite-urgence-controle', numero: 1, titre: 'Garder le contrôle', icone: { icone: 'exclamation-octagon-fill', couleur: ROUGE },
        resume: 'Freinage d\'urgence, crevaison, dérapage',
        aRetenir: [
          'Freinage d\'urgence avec ABS : appuyez fort et maintenez ; vous pouvez encore tourner pour éviter l\'obstacle.',
          'Pneu qui éclate : tenez fermement le volant, levez le pied doucement, ne freinez pas brutalement, puis garez-vous.',
          'Arrière qui glisse (survirage) : contre-braquez du côté où part l\'arrière, sans freiner fort.',
          'Avant qui ne tourne plus (sous-virage) : relâchez doucement l\'accélérateur pour que les roues accrochent de nouveau.',
          'Regardez là où vous voulez aller, pas l\'obstacle : les mains suivent les yeux.',
        ],
        piege: 'Avec l\'ABS, on ne pompe pas sur la pédale : on appuie fort et on garde.',
        panneaux: [
          i('abs', 'exclamation-octagon-fill', ROUGE, 'ABS', 'Freinage d\'urgence', 'L\'ABS empêche les roues de se bloquer.', 'Appuyez fort et maintenez, en dirigeant la voiture.'),
          i('crevaison', 'circle', GRIS, null, 'Pneu qui éclate', 'La voiture tire d\'un côté.', 'Volant fermement tenu, pied levé doucement, puis arrêt prudent.'),
          i('survirage', 'arrow-repeat', OR, null, 'L\'arrière glisse', 'La voiture tend à tourner sur elle-même.', 'Contre-braquez du côté où part l\'arrière.'),
          i('sous-virage', 'arrow-up-right', OR, null, 'L\'avant ne tourne plus', 'La voiture va tout droit malgré le volant.', 'Relâchez doucement l\'accélérateur, sans braquer plus.'),
          i('regard', 'eye-fill', VERT, null, 'Le regard', 'Les mains suivent les yeux.', 'Regardez l\'issue, pas l\'obstacle.'),
        ],
        questions: [
          { q: 'Freinage d\'urgence avec ABS : que faites-vous ?', ok: 'J\'appuie fort et je maintiens', non: ['Je pompe sur la pédale', 'Je freine doucement'] },
          { q: 'Un pneu éclate. Quel est le bon réflexe ?', ok: 'Tenir le volant et lever le pied doucement', non: ['Freiner à fond', 'Donner un coup de volant'] },
          { q: 'L\'arrière de la voiture glisse. Que faites-vous ?', ok: 'Je contre-braque du côté du dérapage', non: ['Je freine à fond', 'Je braque dans l\'autre sens'] },
          { q: 'Où regarder pour éviter un obstacle ?', ok: 'Vers l\'issue', non: ['L\'obstacle', 'Le tableau de bord'] },
          { q: "L'avant de la voiture ne tourne plus dans un virage. Que faites-vous ?", ok: "Je relâche doucement l'accélérateur", non: ["J'accélère", 'Je braque encore plus'] },
          { q: "Avec l'ABS, peut-on tourner en freinant fort ?", ok: 'Oui, on garde la direction', non: ['Non, les roues se bloquent', 'Seulement à basse vitesse'] },
        ],
      },
      {
        id: 'conduite-urgence-panne', numero: 2, titre: 'Panne, fumée et malaise', icone: { icone: 'exclamation-triangle-fill', couleur: OR },
        resume: 'Signaler, se mettre à l\'abri, alerter',
        aRetenir: [
          'Panne : feux de détresse, garez-vous le plus à droite possible, gilet, puis triangle bien en amont.',
          'Faites sortir les passagers côté accotement et mettez-les à l\'abri, loin de la chaussée.',
          'Fumée sous le capot : arrêtez-vous, coupez le moteur, faites sortir tout le monde et éloignez-vous ; n\'ouvrez pas le capot.',
          'Conducteur pris d\'un malaise : le passager tient le volant, met les feux de détresse et aide à arrêter la voiture.',
          'Appelez les secours : SAMU 1515, police 17, sapeurs-pompiers 18.',
        ],
        piege: 'Rester assis dans une voiture en panne sur la chaussée est dangereux : sortez et mettez-vous à l\'abri.',
        panneaux: [
          i('detresse', 'exclamation-triangle-fill', ROUGE, null, 'Feux de détresse', 'Ils préviennent que vous êtes arrêté.', 'Allumez-les dès que la voiture ralentit en panne.'),
          i('gilet', 'person-bounding-box', OR, null, 'Gilet et triangle', 'Pour être vu de loin.', 'Gilet avant de sortir, triangle loin derrière la voiture.'),
          i('abri', 'shield-fill-check', VERT, null, 'Se mettre à l\'abri', 'Un autre véhicule peut heurter la voiture.', 'Tout le monde sort côté accotement et s\'éloigne de la route.'),
          i('fumee', 'fire', ROUGE, '18', 'Fumée ou feu', 'Le feu peut s\'étendre vite.', 'Moteur coupé, tout le monde dehors, capot fermé, appelez le 18.'),
          i('malaise', 'heart-pulse-fill', ROUGE, null, 'Malaise du conducteur', 'La voiture n\'est plus dirigée.', 'Le passager tient le volant, met les feux de détresse et aide à s\'arrêter.'),
        ],
        questions: [
          { q: 'En panne sur la route, que faites-vous d\'abord ?', ok: 'Feux de détresse et garer la voiture le plus à droite', non: ['Ouvrir le capot', 'Rester assis au volant'] },
          { q: 'De la fumée sort du capot. Que faites-vous ?', ok: 'Je coupe le moteur et tout le monde s\'éloigne', non: ['J\'ouvre le capot', 'Je continue jusqu\'au garage'] },
          { q: 'Où mettre les passagers pendant une panne ?', ok: 'À l\'abri, loin de la chaussée', non: ['Dans la voiture', 'Derrière la voiture sur la route'] },
          { q: 'Le conducteur fait un malaise. Que fait le passager ?', ok: 'Il tient le volant et met les feux de détresse', non: ['Il coupe le moteur en roulant', 'Il attend'] },
          { q: 'Où placer le triangle de présignalisation ?', ok: 'Assez loin derrière la voiture pour prévenir', non: ['Contre le pare-chocs', 'Devant la voiture'] },
          { q: 'Quel numéro pour les sapeurs-pompiers ?', ok: '18', non: ['17', '1515'] },
        ],
      },
    ],
    revision: rev('urgence', 3, 'les situations d\'urgence', { icone: 'exclamation-octagon-fill', couleur: ROUGE }),
  },

  /* ── 5 · Autoroute ── */
  {
    key: 'conduite-autoroute', titre: 'Autoroute', numero: 5,
    description: 'Entrer, circuler, dépasser et sortir sur autoroute ; bande d\'arrêt d\'urgence et péage.',
    decor: ['C107', 'B14-110', 'C108'],
    chapitres: [
      {
        id: 'conduite-autoroute-circuler', numero: 1, titre: 'Entrer et circuler', icone: '/panneaux/C107.svg',
        resume: 'Insertion, voies, dépassement',
        aRetenir: [
          'Sur la voie d\'insertion, accélérez pour rouler à la vitesse du trafic avant de vous glisser dans la voie de droite.',
          'Roulez sur la voie de droite ; la voie de gauche sert à dépasser, puis on revient à droite.',
          'On dépasse toujours par la gauche ; jamais par la droite ni par la bande d\'arrêt d\'urgence.',
          'Interdits : piétons, charrettes, cyclomoteurs, demi-tour, marche arrière et arrêt sans nécessité.',
          'Gardez de grandes distances : à 110 km/h, il faut plus de 100 m pour s\'arrêter.',
        ],
        piege: 'Rester sur la voie de gauche sans dépasser gêne tout le monde et pousse aux dépassements par la droite.',
        panneaux: [
          p('C107', 'Entrée d\'autoroute', 'Les règles de l\'autoroute commencent.', 'Pas de piétons, de charrettes ni de demi-tour.'),
          i('insertion', 'sign-merge-right-fill', BLEU, null, 'La voie d\'insertion', 'Pour rejoindre le trafic.', 'Accélérez à la vitesse du trafic et glissez-vous dans la voie de droite.'),
          i('voie-droite', 'arrow-up', VERT, null, 'La voie de droite', 'C\'est la voie normale.', 'Revenez-y dès que vous avez dépassé.'),
          i('voie-gauche', 'arrow-up-left', OR, null, 'La voie de gauche', 'Réservée au dépassement.', 'Dépassez, puis revenez à droite.'),
          i('interdits', 'slash-circle-fill', ROUGE, null, 'Interdits sur autoroute', 'Demi-tour, marche arrière, arrêt sans raison.', 'Si vous ratez une sortie, prenez la suivante.'),
        ],
        questions: [
          { q: 'Comment entrer sur l\'autoroute ?', ok: 'En accélérant à la vitesse du trafic sur la voie d\'insertion', non: ['En s\'arrêtant au bout de la voie', 'Au pas'] },
          { q: 'À quoi sert la voie de gauche ?', ok: 'À dépasser', non: ['À rouler en permanence', 'À s\'arrêter'] },
          { q: 'Vous avez raté votre sortie. Que faites-vous ?', ok: 'Je prends la sortie suivante', non: ['Je fais marche arrière', 'Je fais demi-tour'] },
          { q: 'Peut-on dépasser par la droite sur autoroute ?', ok: 'Non', non: ['Oui, si la voie est libre', 'Oui, par la bande d\'arrêt d\'urgence'] },
          { q: 'Qui est interdit sur autoroute ?', ok: 'Piétons, charrettes, cyclomoteurs', non: ['Les camions', 'Les bus'] },
          { q: 'Après un dépassement sur autoroute, que faites-vous ?', ok: 'Je reviens sur la voie de droite', non: ['Je reste à gauche', "Je m'arrête sur la bande d'arrêt"] },
        ],
      },
      {
        id: 'conduite-autoroute-sortir', numero: 2, titre: 'Sortie, péage et bande d\'arrêt', icone: '/panneaux/C108.svg',
        resume: 'Sortir, payer, s\'arrêter en urgence',
        aRetenir: [
          'Préparez la sortie à l\'avance : placez-vous à droite, clignotant, et ralentissez sur la voie de sortie, pas sur l\'autoroute.',
          'Au péage, ralentissez tôt, choisissez votre couloir et gardez vos distances.',
          'Bande d\'arrêt d\'urgence : seulement pour une panne, un accident ou un malaise.',
          'En panne : feux de détresse, rejoindre la bande d\'arrêt, gilet, sortir côté glissière et se mettre derrière elle.',
          'En sortant de l\'autoroute, réduisez votre vitesse : les routes normales reprennent.',
        ],
        piege: 'Après l\'autoroute, 90 km/h paraît lent : regardez le compteur.',
        panneaux: [
          p('C108', 'Fin d\'autoroute', 'Les règles normales reprennent.', 'Réduisez votre vitesse.'),
          i('sortie', 'box-arrow-up-right', BLEU, null, 'Préparer la sortie', 'Ralentir sur l\'autoroute est dangereux.', 'Placez-vous à droite, clignotant, et ralentissez sur la voie de sortie.'),
          i('peage', 'cash-coin', OR, null, 'Le péage', 'Les véhicules ralentissent et changent de couloir.', 'Ralentissez tôt et choisissez votre couloir sans zigzaguer.'),
          i('bau', 'exclamation-triangle-fill', ROUGE, null, 'Bande d\'arrêt d\'urgence', 'Réservée aux pannes et aux urgences.', 'Arrêtez-vous le plus à droite et sortez côté glissière.'),
          i('glissiere', 'shield-fill', VERT, null, 'Derrière la glissière', 'Le seul endroit sûr en cas de panne.', 'Faites passer tout le monde derrière la glissière.'),
        ],
        questions: [
          { q: 'Où ralentir pour sortir de l\'autoroute ?', ok: 'Sur la voie de sortie', non: ['Sur la voie de gauche', 'Sur la bande d\'arrêt d\'urgence'] },
          { q: 'Quand utiliser la bande d\'arrêt d\'urgence ?', ok: 'Seulement en cas de panne ou d\'urgence', non: ['Pour téléphoner', 'Pour dépasser'] },
          { q: 'En panne sur autoroute, où attendre ?', ok: 'Derrière la glissière', non: ['Dans la voiture', 'Sur la bande d\'arrêt, près de la voiture'] },
          { q: 'Après la sortie d\'autoroute, que faire ?', ok: 'Réduire sa vitesse', non: ['Garder 110 km/h', 'Accélérer'] },
          { q: 'Au péage, que faites-vous ?', ok: 'Je ralentis tôt et je garde mes distances', non: ["J'accélère pour passer le premier", 'Je zigzague entre les couloirs'] },
          { q: 'En panne sur autoroute, par quel côté sortir ?', ok: 'Côté glissière, à droite', non: ['Côté circulation', 'Par le coffre'] },
        ],
      },
    ],
    revision: rev('autoroute', 3, 'l\'autoroute', '/panneaux/C107.svg'),
  },

  /* ── 6 · Conditions difficiles ── */
  {
    key: 'conduite-conditions', titre: 'Conditions difficiles', numero: 6,
    description: 'Nuit, pluie, brouillard, vent de sable et chaussée glissante.',
    decor: ['voyant-croisement', 'A4', 'voyant-brouillard-avant'],
    chapitres: [
      {
        id: 'conduite-nuit', numero: 1, titre: 'Conduite de nuit', icone: { icone: 'moon-stars-fill', couleur: VIOLET },
        resume: 'Feux, éblouissement, fatigue',
        aRetenir: [
          'Feux de croisement en ville et dès qu\'un véhicule arrive ou vous précède ; feux de route seulement sur route vide.',
          'Ébloui : regardez le bord droit de la route et ralentissez un peu.',
          'Ne roulez pas plus vite que la distance éclairée par vos phares.',
          'La fatigue arrive plus vite la nuit : une pause au moins toutes les 2 heures.',
          'Piétons, vélos sans lumière et animaux se voient très tard : redoublez d\'attention hors des villes.',
        ],
        piege: 'Si vous voyez à peine plus loin que vos phares, c\'est que vous allez trop vite.',
        panneaux: [
          { id: 'voyant-croisement', voyant: 'croisement', nom: 'Feux de croisement', sens: 'Éclairent environ 30 m sans éblouir.', action: 'En ville et dès qu\'un véhicule approche.' },
          { id: 'voyant-route', voyant: 'route', nom: 'Feux de route', sens: 'Éclairent environ 100 m.', action: 'Sur route vide uniquement ; repassez en codes dès qu\'un véhicule arrive.' },
          i('eblouissement', 'brightness-high-fill', OR, null, 'Ébloui', 'Quelques secondes sans voir la route.', 'Regardez le bord droit et ralentissez.'),
          i('fatigue', 'emoji-dizzy-fill', ROUGE, '2 h', 'Fatigue', 'Les yeux se ferment plus vite la nuit.', 'Pause toutes les 2 heures, et dès les premiers bâillements.'),
          i('invisibles', 'person-walking', GRIS, null, 'Usagers invisibles', 'Piétons et vélos sans lumière.', 'Ralentissez près des villages et des bas-côtés.'),
        ],
        questions: [
          { q: 'Quels feux en ville la nuit ?', ok: 'Les feux de croisement', non: ['Les feux de route', 'Les feux de position seuls'] },
          { q: 'Vous êtes ébloui. Que faites-vous ?', ok: 'Je regarde le bord droit et je ralentis', non: ['Je fais des appels de phares', 'J\'accélère'] },
          { q: 'Tous les combien faire une pause la nuit ?', ok: 'Au moins toutes les 2 heures', non: ['Toutes les 5 heures', 'Jamais si je connais la route'] },
          { q: 'À quelle vitesse rouler la nuit ?', ok: 'Pas plus vite que la portée des phares', non: ['Comme le jour', 'Plus vite, il y a moins de monde'] },
          { q: 'Un véhicule vous précède la nuit. Quels feux ?', ok: 'Les feux de croisement', non: ['Les feux de route', 'Aucun'] },
          { q: 'Hors des villes la nuit, quels usagers voit-on tard ?', ok: 'Piétons, vélos sans lumière, animaux', non: ['Les camions', 'Les bus éclairés'] },
        ],
      },
      {
        id: 'conduite-pluie', numero: 2, titre: 'Pluie, brouillard, poussière', icone: '/panneaux/A4.svg',
        resume: 'Visibilité réduite, route glissante',
        aRetenir: [
          'Pluie : vitesse réduite, distance de sécurité doublée, feux de croisement.',
          'La première pluie après la saison sèche est la plus glissante : eau, poussière et huile se mélangent sur la route.',
          'Aquaplanage : levez le pied doucement, tenez le volant droit, ne freinez pas brutalement.',
          'Brouillard épais : feux de brouillard avant et arrière, vitesse très réduite, distance au moins triplée ; jamais les feux de route.',
          'Vent de sable ou forte poussière (harmattan) : mêmes réflexes que dans le brouillard.',
        ],
        piege: 'La première pluie après des mois de sécheresse rend la route plus glissante qu\'une grosse averse.',
        panneaux: [
          p('A4', 'Chaussée glissante', 'La route peut glisser.', 'Ralentissez et freinez en douceur.'),
          i('premiere-pluie', 'cloud-drizzle-fill', OR, '1re', 'Première pluie', 'Eau, poussière et huile forment un film glissant.', 'Ralentissez fortement et allongez les distances.'),
          i('aquaplanage', 'water', BLEU, null, 'Aquaplanage', 'Les pneus ne touchent plus la route.', 'Levez le pied doucement, volant droit, pas de freinage brutal.'),
          { id: 'voyant-brouillard-avant', voyant: 'brouillard-avant', nom: 'Feux de brouillard avant', sens: 'Éclairent bas et large.', action: 'Par brouillard épais, forte pluie ou vent de sable.' },
          i('distance', 'arrows-expand', GRIS, '× 3', 'Distance dans le brouillard', 'On voit à quelques mètres.', 'Triplez au moins la distance de sécurité.'),
          i('sable', 'wind', OR, null, 'Vent de sable', 'La poussière cache la route.', 'Feux allumés, vitesse très réduite.'),
        ],
        questions: [
          { q: 'Sous la pluie, la distance de sécurité…', ok: 'Se double', non: ['Reste la même', 'Se réduit'] },
          { q: 'Quelle pluie est la plus dangereuse ?', ok: 'La première après la saison sèche', non: ['La plus forte', 'Celle de la nuit'] },
          { q: 'La voiture fait de l\'aquaplanage. Que faites-vous ?', ok: 'Je lève le pied sans freiner brutalement', non: ['Je freine à fond', 'Je donne un coup de volant'] },
          { q: 'Dans le brouillard, quels feux ne jamais utiliser ?', ok: 'Les feux de route', non: ['Les feux de croisement', 'Les feux de brouillard'] },
          { q: 'Par vent de sable, que faites-vous ?', ok: 'Comme dans le brouillard : feux et vitesse réduite', non: ['Je roule normalement', 'J\'allume les feux de route'] },
          { q: 'Dans le brouillard épais, la distance de sécurité…', ok: 'Se triple au moins', non: ['Reste la même', 'Se réduit'] },
        ],
      },
    ],
    revision: rev('conditions', 3, 'les conditions difficiles', 'voyant:croisement'),
  },
]

export const IDS_CONDUITE = THEMES_CONDUITE.flatMap(t => [...t.chapitres.map(c => c.id), t.revision.id])
