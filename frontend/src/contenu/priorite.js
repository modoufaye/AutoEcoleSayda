/* Contenu du thème « Priorité » (cours de code). Textes rédigés pour l'Auto-École Khadija ;
   panneaux : Wikimedia Commons (voir /panneaux/credits.json) ; feux, agent et carrefours :
   dessins de SchemaPriorite. Même format que contenu/signalisation.js. */

const p = (code, nom, sens, action, piege) => ({ id: code, image: `/panneaux/${code}.svg`, nom, sens, action, piege })
const d = (dessin, nom, sens, action, piege) => ({ id: dessin, dessin, nom, sens, action, piege })

export const CHAPITRES_PRIORITE = [
  {
    id: 'priorite-regles', numero: 1, titre: 'Règles de priorité', icone: '/panneaux/AB4.svg',
    resume: 'Priorité à droite, STOP, cédez le passage, giratoires',
    aRetenir: [
      'Sans panneau ni feu, on laisse passer le véhicule qui arrive de sa droite. Une route plus large ou une vitesse plus forte ne donne aucune priorité.',
      'STOP : arrêt complet à la ligne, roues immobiles, puis on cède le passage dans les deux sens.',
      'Cédez le passage : on ralentit et on ne s\'arrête que si quelqu\'un arrive.',
      'Giratoire : ceux qui tournent déjà dans l\'anneau passent avant ceux qui veulent entrer.',
      'Ambulance, police, gendarmerie ou pompiers avec gyrophare et sirène : on leur libère le passage.',
      'Celui qui sort d\'une place de stationnement ou change de voie laisse passer ceux qui roulent déjà.',
    ],
    piege: 'Être prioritaire ne permet jamais de forcer le passage : on vérifie toujours que la voie est libre.',
    question: 'Que signifie ce panneau ?',
    panneaux: [
      p('AB1', 'Carrefour à priorité à droite', 'Le prochain carrefour n\'a aucune autre signalisation.', 'Ralentissez et laissez passer les véhicules qui arrivent de votre droite.'),
      p('AB2', 'Carrefour où vous êtes prioritaire', 'Au prochain carrefour, les routes qui débouchent doivent vous céder le passage.', 'Gardez une allure prudente : un conducteur peut ne pas vous voir.'),
      p('AB6', 'Route prioritaire', 'Vous êtes prioritaire à toutes les intersections de cette route.', 'Restez attentif aux sorties de chemins et de maisons.'),
      p('AB7', 'Fin de route prioritaire', 'Votre priorité s\'arrête.', 'Aux carrefours suivants, la priorité à droite s\'applique de nouveau, sauf autre panneau.'),
      p('AB3a', 'Cédez le passage', 'Vous devez laisser passer les usagers de la route que vous abordez.', 'Ralentissez ; arrêtez-vous seulement si un véhicule arrive.'),
      p('AB5', 'Annonce de STOP', 'Un STOP se trouve plus loin, à la distance indiquée.', 'Préparez-vous à vous arrêter complètement.'),
      p('AB4', 'STOP', 'Arrêt obligatoire à la ligne, puis vous cédez le passage.', 'Arrêtez-vous, regardez à gauche puis à droite, et repartez quand c\'est libre.', 'Même si la route est vide, l\'arrêt reste obligatoire.'),
      p('AB25', 'Carrefour giratoire', 'Un rond-point arrive.', 'Ralentissez et laissez passer les véhicules déjà engagés dans l\'anneau.'),
      p('B15', 'Cédez le passage au sens inverse', 'Le passage est étroit : ceux d\'en face passent en premier.', 'Attendez que la voie soit libre avant de vous engager.'),
      p('C18', 'Priorité sur le sens inverse', 'Sur ce passage étroit, vous passez avant les véhicules d\'en face.', 'Passez prudemment : l\'autre conducteur doit vous attendre.', 'Ne confondez pas : cercle à bord rouge (B15) = vous cédez ; carré bleu (C18) = vous passez.'),
    ],
    questions: [
      { q: 'Sans aucune signalisation au carrefour, qui passe en premier ?', ok: 'Le véhicule qui vient de droite', non: ['Celui qui roule sur la route la plus large', 'Celui qui roule le plus vite'] },
      { q: 'Au STOP, la route est totalement vide. Que faites-vous ?', ok: 'Je m\'arrête quand même complètement', non: ['Je ralentis et je passe', 'Je klaxonne et je passe'] },
      { q: 'Dans un giratoire, qui est prioritaire ?', ok: 'Les véhicules déjà dans l\'anneau', non: ['Les véhicules qui entrent', 'Les véhicules les plus gros'] },
      { q: 'Vous sortez d\'une place de stationnement. Êtes-vous prioritaire ?', ok: 'Non, je laisse passer ceux qui roulent', non: ['Oui, si je mets mon clignotant', 'Oui, toujours'] },
      { q: 'Une ambulance arrive avec sirène et gyrophare. Que faites-vous ?', ok: 'Je lui libère le passage', non: ['Je garde ma voie, j\'étais là avant', 'J\'accélère pour rester devant'] },
    ],
  },
  {
    id: 'priorite-feux', numero: 2, titre: 'Feux et agents de circulation', icone: 'dessin:feu-rouge',
    resume: 'Vert, orange, rouge, clignotants et gestes de l\'agent',
    aRetenir: [
      'Ordre à respecter : l\'agent passe avant les feux, les feux avant les panneaux, les panneaux avant les marquages, puis la règle générale.',
      'Vert : on peut passer, après avoir vérifié que le carrefour est dégagé et qu\'aucun piéton ne traverse.',
      'Orange fixe : on s\'arrête, sauf si un arrêt brutal serait dangereux.',
      'Rouge : arrêt complet avant la ligne, même si personne ne vient.',
      'Feux en panne ou orange clignotant : on suit les panneaux, sinon la priorité à droite.',
      'Ne vous engagez pas dans un carrefour encombré, même au vert : vous risquez de le bloquer.',
    ],
    piege: 'L\'orange n\'est pas un « dernier vert » : il demande de s\'arrêter, pas d\'accélérer.',
    question: 'Que signifie ce signal ?',
    panneaux: [
      d('feu-vert', 'Feu vert', 'Le passage est autorisé.', 'Passez seulement si le carrefour est libre et qu\'aucun piéton n\'est engagé.'),
      d('feu-orange', 'Feu orange fixe', 'Le feu va passer au rouge.', 'Arrêtez-vous, sauf si vous êtes trop près pour freiner sans danger.', 'Accélérer à l\'orange est une faute.'),
      d('feu-rouge', 'Feu rouge', 'Le passage est interdit.', 'Arrêtez-vous avant la ligne et attendez le vert.'),
      d('feu-orange-clignotant', 'Orange clignotant', 'Le feu ne règle pas le carrefour (panne ou nuit).', 'Redoublez de prudence et appliquez les panneaux, sinon la priorité à droite.'),
      d('feu-rouge-clignotant', 'Rouge clignotant', 'Danger immédiat, par exemple un train au passage à niveau.', 'Arrêtez-vous et ne repartez que lorsque le feu s\'éteint.'),
      d('feu-fleche', 'Flèche verte', 'Le passage est autorisé seulement dans la direction de la flèche.', 'Suivez la flèche en cédant le passage aux piétons.'),
      d('agent-leve', 'Agent, bras levé', 'Attention : tout le monde s\'arrête, sauf ceux déjà engagés dans le carrefour.', 'Arrêtez-vous ; si vous êtes déjà engagé, dégagez le carrefour.'),
      d('agent-face', 'Agent de face ou de dos, bras tendus', 'Arrêt pour les conducteurs qui le voient de face ou de dos.', 'Arrêtez-vous et attendez son signal.'),
      d('agent-profil', 'Agent de profil', 'Passage autorisé pour les conducteurs qui le voient de profil.', 'Passez prudemment dans la direction permise.', 'Le geste de l\'agent l\'emporte sur le feu : même au vert, s\'il vous arrête, vous vous arrêtez.'),
    ],
    questions: [
      { q: 'Le feu est vert, mais l\'agent vous fait signe de vous arrêter. Que faites-vous ?', ok: 'Je m\'arrête : l\'agent passe avant le feu', non: ['Je passe : le feu est vert', 'Je klaxonne pour qu\'il se pousse'] },
      { q: 'Le feu passe à l\'orange alors que vous êtes encore loin. Que faites-vous ?', ok: 'Je m\'arrête', non: ['J\'accélère pour passer', 'Je mets mes feux de détresse'] },
      { q: 'Le feu est vert mais le carrefour est encombré. Que faites-vous ?', ok: 'J\'attends avant la ligne que ça se libère', non: ['Je m\'engage, j\'ai le vert', 'Je klaxonne'] },
      { q: 'Les feux sont en panne. Quelle règle appliquez-vous ?', ok: 'Les panneaux, sinon la priorité à droite', non: ['Le plus rapide passe', 'Je passe comme au vert'] },
    ],
  },
  {
    id: 'priorite-situations', numero: 3, titre: 'Situations au carrefour', icone: 'dessin:scene-droite',
    resume: 'Qui passe en premier ? Des cas concrets à résoudre',
    aRetenir: [
      'Mettez-vous à la place de chaque conducteur et regardez qui arrive à sa droite.',
      'Les panneaux et les feux changent la règle : lisez-les avant de décider.',
      'Celui qui n\'a personne à sa droite passe en premier, puis les autres un à un.',
      'Un piéton engagé sur le passage passe toujours avant vous, même quand vous tournez.',
    ],
    piege: 'Dans le doute, cédez le passage : il vaut mieux attendre que provoquer un accident.',
    situations: true,
    panneaux: [
      { ...d('scene-droite', 'B arrive de votre droite', 'Carrefour sans aucune signalisation. Vous êtes A, B vient de droite.', 'B passe en premier : il est à votre droite.'), quiz: false },
      { ...d('scene-gauche', 'B arrive de votre gauche', 'Carrefour sans signalisation. Vous êtes A, B vient de gauche.', 'Vous passez : B vous a à sa droite et doit vous céder le passage.'), quiz: false },
      { ...d('scene-stop', 'Vous êtes au STOP', 'Vous êtes A, arrêté au STOP. B arrive sur la route principale.', 'B passe ; vous repartez quand la voie est libre.'), quiz: false },
      { ...d('scene-prioritaire', 'Vous êtes sur route prioritaire', 'Vous êtes A sur une route prioritaire ; B a un « cédez le passage ».', 'Vous passez, en restant prudent.'), quiz: false },
      { ...d('scene-trois', 'Trois voitures au carrefour', 'Sans signalisation : A monte, B vient de droite, C de gauche.', 'B passe (personne à sa droite), puis A, puis C.'), quiz: false },
      { ...d('scene-giratoire', 'Entrée dans un giratoire', 'Vous êtes A et voulez entrer ; B tourne déjà dans l\'anneau.', 'B passe : il est déjà engagé.'), quiz: false },
      { ...d('scene-urgence', 'Ambulance derrière vous', 'Une ambulance avec sirène et gyrophare arrive derrière vous.', 'Serrez à droite et laissez-la passer.'), quiz: false },
      { ...d('scene-pieton', 'Piéton sur le passage', 'Vous tournez à droite, un piéton traverse la rue où vous allez.', 'Arrêtez-vous : le piéton passe d\'abord.'), quiz: false },
      { ...d('scene-stationnement', 'Sortie de stationnement', 'Vous êtes A et sortez d\'une place ; B roule sur la voie.', 'B passe : celui qui quitte une place n\'est pas prioritaire.'), quiz: false },
    ],
    questions: [
      { visuel: d('scene-droite'), q: 'Vous êtes A. Qui passe en premier ?', ok: 'B', non: ['A', 'Le plus rapide des deux'], explication: 'Sans signalisation, B est à votre droite : il passe.' },
      { visuel: d('scene-gauche'), q: 'Vous êtes A. Qui passe en premier ?', ok: 'A', non: ['B', 'Celui qui klaxonne'], explication: 'B vous a à sa droite : c\'est à lui de céder.' },
      { visuel: d('scene-stop'), q: 'Vous êtes A, au STOP. Qui passe en premier ?', ok: 'B', non: ['A', 'Celui qui est arrivé le premier'], explication: 'Au STOP, vous cédez le passage à tous.' },
      { visuel: d('scene-prioritaire'), q: 'Vous êtes A, sur route prioritaire. Qui passe ?', ok: 'A', non: ['B', 'Aucun des deux'], explication: 'B a un « cédez le passage » : il vous laisse passer.' },
      { visuel: d('scene-trois'), q: 'Dans quel ordre passent les voitures ?', ok: 'B, puis A, puis C', non: ['A, puis B, puis C', 'C, puis A, puis B'], explication: 'B n\'a personne à sa droite ; ensuite A, qui a C à sa gauche.' },
      { visuel: d('scene-giratoire'), q: 'Vous êtes A. Qui passe en premier ?', ok: 'B', non: ['A', 'Celui qui va le plus loin'], explication: 'Dans un giratoire, celui déjà engagé est prioritaire.' },
      { visuel: d('scene-urgence'), q: 'Que faites-vous ?', ok: 'Je serre à droite et je la laisse passer', non: ['Je freine brusquement au milieu', 'Je garde ma vitesse et ma place'], explication: 'Les véhicules d\'urgence en intervention passent avant tous.' },
      { visuel: d('scene-pieton'), q: 'Vous tournez à droite. Qui passe en premier ?', ok: 'Le piéton', non: ['Moi, A', 'Celui qui va le plus vite'], explication: 'Un piéton engagé sur le passage est toujours prioritaire.' },
      { visuel: d('scene-stationnement'), q: 'Vous êtes A. Qui passe en premier ?', ok: 'B', non: ['A, avec le clignotant', 'A, car il est devant'], explication: 'Celui qui quitte une place laisse passer ceux qui roulent.' },
    ],
  },
]

export const REVISION_PRIORITE = { id: 'priorite-revision', numero: 4, titre: 'Révision finale', resume: '15 questions sur toutes les priorités', icone: '/panneaux/AB1.svg', nombre: 15 }
