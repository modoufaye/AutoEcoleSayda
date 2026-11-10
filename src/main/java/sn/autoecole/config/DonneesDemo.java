package sn.autoecole.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.*;
import sn.autoecole.enums.*;
import sn.autoecole.repository.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/**
 * Données fictives d'une installation de démonstration (présentation à de futures auto-écoles) :
 * réglages et page d'accueil, 2 bureaux, 3 moniteurs, 4 véhicules, 30 élèves à tous les stades,
 * paiements, leçons, examens, séances de code avec quiz, annales et séries publiées, annonces.
 *
 * Ne fait rien sans DEMO_DONNEES=true (seulement sur l'installation de démo), ni si la base a déjà
 * un élève : une vraie auto-école n'est jamais touchée, et un redémarrage ne recrée rien.
 * Comptes de connexion des moniteurs et de trois élèves : mot de passe DEMO_MOT_DE_PASSE (aucun
 * compte utilisable sans lui). Numéros 70 000 xx xx : fictifs.
 */
@Component
@Order(org.springframework.core.Ordered.LOWEST_PRECEDENCE)   // après AdminSeeder (@Order(10)) : le super admin signe publications et annonces
@RequiredArgsConstructor
@Slf4j
public class DonneesDemo implements CommandLineRunner {

    @Value("${DEMO_DONNEES:false}")
    private boolean actif;

    @Value("${DEMO_MOT_DE_PASSE:}")
    private String motDePasseDemo;

    private final AutoEcoleConfigRepository configRepo;
    private final BureauRepository bureauRepo;
    private final MoniteurRepository moniteurRepo;
    private final VehiculeRepository vehiculeRepo;
    private final EleveRepository eleveRepo;
    private final UserRepository userRepo;
    private final PaiementRepository paiementRepo;
    private final LeconRepository leconRepo;
    private final ExamenRepository examenRepo;
    private final SeanceRepository seanceRepo;
    private final ResultatQuizSeanceRepository resultatRepo;
    private final PublicationSerieRepository publicationRepo;
    private final ProgressionCodeRepository progressionRepo;
    private final AnnonceRepository annonceRepo;
    private final PasswordEncoder encoder;

    private final Random hasard = new Random(2026);   // toujours les mêmes données
    private final LocalDate aujourdhui = LocalDate.now();

    @Override
    @Transactional
    public void run(String... args) {
        if (!actif) return;
        if (eleveRepo.count() > 0) { log.info("Démo : des élèves existent déjà, aucune donnée ajoutée"); return; }

        User admin = userRepo.findAllByRole(RoleUser.SUPER_ADMIN).stream().findFirst().orElse(null);
        reglages();
        List<Bureau> bureaux = bureaux();
        List<Moniteur> moniteurs = moniteurs();
        List<Vehicule> vehicules = vehicules();
        List<Eleve> eleves = eleves(bureaux, moniteurs);
        paiements(eleves);
        lecons(eleves, vehicules);
        examens(eleves);
        seances(eleves, moniteurs);
        publications(eleves, admin);
        annonces(admin);
        log.info("Démo : données fictives créées ({} élèves){}", eleves.size(),
                motDePasseDemo.isBlank() ? " ; DEMO_MOT_DE_PASSE absent : pas de compte moniteur ni élève utilisable" : "");
    }

    // ── Réglages et page d'accueil ─────────────────────────────────────────────

    private void reglages() {
        AutoEcoleConfig c = configRepo.findAll().stream().findFirst().orElseGet(AutoEcoleConfig::new);
        if (c.getNom() == null || c.getNom().isBlank()) c.setNom("Auto-École Démo");
        c.setAdresse("Avenue Léopold Sédar Senghor, Thiès");
        c.setTelephone("70 000 10 00");
        c.setEmail("contact@demo.auto-ecole.sn");
        c.setVille("Thiès");
        c.setAnneeCreation(2018);
        c.setElevesFormes("3 500+");
        c.setTauxReussite("91 %");
        c.setNombreMoniteurs("8");
        c.setHoraires("Lun – Sam : 8h00 – 19h00");
        c.setSlogan("Votre permis en toute sérénité, la route en toute confiance");
        c.setAffiches(List.of());
        c.setFormules(FormulePermis.parDefaut());
        c.setFormulesPoidsLourd(FormulePermis.parDefautPoidsLourd());
        c.setFormulesMoto(FormulePermis.parDefautMoto());
        c.setFormulesPerfectionnement(FormulePerfectionnement.parDefaut());
        if (c.getTarifInscription() == null) c.setTarifInscription(BigDecimal.ZERO);
        if (c.getTarifHeureCode() == null) c.setTarifHeureCode(BigDecimal.ZERO);
        if (c.getTarifHeureConduite() == null) c.setTarifHeureConduite(BigDecimal.ZERO);
        configRepo.save(c);
    }

    private List<Bureau> bureaux() {
        return bureauRepo.saveAll(List.of(
                Bureau.builder().code("THIES_CENTRE").nom("Thiès Centre").adresse("Avenue Léopold Sédar Senghor, face à la gare")
                        .telephone("70 000 10 00").actif(true).principal(true).ordre(1).build(),
                Bureau.builder().code("THIES_NORD").nom("Thiès Nord").adresse("Cité Lamy, près du marché central")
                        .telephone("70 000 20 00").actif(true).principal(false).ordre(2).build()));
    }

    // ── Équipe et véhicules ────────────────────────────────────────────────────

    private List<Moniteur> moniteurs() {
        Object[][] m = {
            {"Sarr", "Ibrahima", "700003001", EnumSet.of(CategoriePermis.B, CategoriePermis.C), 2019},
            {"Ndiaye", "Aïssatou", "700003002", EnumSet.of(CategoriePermis.B), 2021},
            {"Fall", "Ousmane", "700003003", EnumSet.of(CategoriePermis.A, CategoriePermis.B), 2020},
        };
        List<Moniteur> l = new ArrayList<>();
        for (Object[] x : m) {
            @SuppressWarnings("unchecked") Set<CategoriePermis> cats = new HashSet<>((Set<CategoriePermis>) x[3]);
            l.add(moniteurRepo.save(Moniteur.builder().nom((String) x[0]).prenom((String) x[1]).telephone((String) x[2])
                    .numeroPermis("SN-" + x[2]).dateEmbauche(LocalDate.of((int) x[4], 3, 1))
                    .categoriesAutorisees(cats).actif(true).accesCoursCode(true).build()));
            compte(x[1] + " " + x[0], (String) x[2], RoleUser.MONITEUR);
        }
        return l;
    }

    private List<Vehicule> vehicules() {
        return vehiculeRepo.saveAll(List.of(
                vehicule("TH-1024-AB", "Renault", "Clio V", 2022, CategoriePermis.B, 48_300, StatutVehicule.DISPONIBLE, "Boîte manuelle"),
                vehicule("TH-2087-AC", "Toyota", "Yaris Hybride", 2023, CategoriePermis.B, 21_700, StatutVehicule.DISPONIBLE, "Boîte automatique"),
                vehicule("TH-3150-AD", "Peugeot", "208", 2021, CategoriePermis.B, 76_900, StatutVehicule.EN_MAINTENANCE, "Vidange et plaquettes"),
                vehicule("TH-4412-AE", "Yamaha", "YBR 125", 2022, CategoriePermis.A, 12_400, StatutVehicule.DISPONIBLE, "Moto-école")));
    }

    private Vehicule vehicule(String immat, String marque, String modele, int annee, CategoriePermis cat, int km, StatutVehicule st, String obs) {
        return Vehicule.builder().immatriculation(immat).marque(marque).modele(modele).annee(annee).categorie(cat)
                .kilometrage(km).statut(st).observations(obs).prochainEntretien(aujourdhui.plusDays(20 + km % 40))
                .dateAssurance(aujourdhui.minusMonths(4)).dureeAssurance(12).montantAssurance(185_000)
                .dateVisiteTechnique(aujourdhui.minusMonths(7)).build();
    }

    /** Compte de connexion (identifiant = téléphone) ; inutilisable sans DEMO_MOT_DE_PASSE. */
    private User compte(String nom, String telephone, RoleUser role) {
        String mdp = motDePasseDemo.isBlank() ? UUID.randomUUID().toString() : motDePasseDemo;
        return userRepo.findByEmailIgnoreCase(telephone).orElseGet(() ->
                userRepo.save(User.builder().nom(nom).email(telephone).motDePasse(encoder.encode(mdp)).role(role).build()));
    }

    // ── Élèves ─────────────────────────────────────────────────────────────────

    /** prénom, nom, formation (B, A, C, CP-M, CP-A), statut, jours depuis l'inscription, formule */
    private static final Object[][] ELEVES = {
        {"Awa", "Diop", "B", "EN_COURS", 45, "Premium"},
        {"Moussa", "Ba", "B", "EN_COURS", 60, "Standard"},
        {"Fatou", "Sow", "B", "EN_COURS", 32, "Prestige"},
        {"Cheikh", "Mbaye", "B", "EN_COURS", 90, "Standard"},
        {"Aminata", "Gueye", "B", "EN_COURS", 21, "Excellence"},
        {"Mamadou", "Faye", "B", "EN_COURS", 120, "Premium"},
        {"Khady", "Diallo", "B", "EN_COURS", 14, "Standard"},
        {"Ousseynou", "Ndour", "B", "EN_COURS", 75, "Prestige"},
        {"Mariama", "Cissé", "B", "EN_COURS", 2, "Standard"},
        {"Pape", "Thiam", "B", "EN_COURS", 4, "Premium"},
        {"Bineta", "Sarr", "B", "EN_COURS", 6, "Standard"},
        {"Abdoulaye", "Kane", "B", "EN_COURS", 150, "Standard"},
        {"Ndeye", "Seck", "B", "EN_COURS", 38, "Premium"},
        {"Lamine", "Wade", "B", "SUSPENDU", 200, "Standard"},
        {"Rokhaya", "Faye", "B", "DIPLOME", 240, "Prestige"},
        {"Serigne", "Diouf", "B", "DIPLOME", 210, "Standard"},
        {"Adja", "Ndiaye", "B", "DIPLOME", 180, "Premium"},
        {"Modou", "Sy", "B", "DIPLOME", 260, "Excellence"},
        {"Coumba", "Fall", "B", "DIPLOME", 230, "Standard"},
        {"Babacar", "Niang", "B", "ABANDONNE", 170, "Standard"},
        {"Ibrahima", "Camara", "A", "EN_COURS", 25, "Standard"},
        {"Saliou", "Dieng", "A", "EN_COURS", 50, "Standard"},
        {"Aliou", "Touré", "A", "DIPLOME", 190, "Standard"},
        {"Assane", "Mbodj", "C", "EN_COURS", 40, "Standard"},
        {"Daouda", "Sène", "C", "DIPLOME", 220, "Standard"},
        {"Astou", "Lo", "CP-A", "EN_COURS", 9, null},
        {"Souleymane", "Gaye", "CP-M", "EN_COURS", 18, null},
        {"Yacine", "Diagne", "CP-A", "EN_COURS", 30, null},
        {"Ramatoulaye", "Bâ", "CP-A", "DIPLOME", 100, null},
        {"Omar", "Kébé", "CP-M", "EN_COURS", 3, null},
    };
    /** Élèves dont le compte se connecte avec DEMO_MOT_DE_PASSE (présentation de l'espace élève). */
    private static final Set<String> VITRINE = Set.of("Awa Diop", "Moussa Ba", "Astou Lo");

    private List<Eleve> eleves(List<Bureau> bureaux, List<Moniteur> moniteurs) {
        List<Eleve> l = new ArrayList<>();
        int n = 0;
        for (Object[] x : ELEVES) {
            n++;
            String prenom = (String) x[0], nom = (String) x[1], f = (String) x[2];
            StatutEleve statut = StatutEleve.valueOf((String) x[3]);
            int jours = (int) x[4];
            boolean perf = f.startsWith("CP");
            String tel = String.format("70000%04d", 4000 + n);
            Bureau b = bureaux.get(n % 3 == 0 ? 1 : 0);
            String lieu = n % 4 == 0 ? Bureau.EN_LIGNE : b.getCode();
            CategoriePermis cat = perf ? CategoriePermis.B : CategoriePermis.valueOf(f);
            Moniteur m = cat == CategoriePermis.A ? moniteurs.get(2) : cat == CategoriePermis.C ? moniteurs.get(0) : moniteurs.get(n % 3);
            LocalDate inscrit = aujourdhui.minusDays(jours);
            boolean ancien = jours > 10;
            Eleve e = Eleve.builder().prenom(prenom).nom(nom).telephone(tel)
                    .adresse(new String[]{"Cité Malick Sy, Thiès", "Quartier Médina Fall, Thiès", "Grand Thiès", "Thiès Randoulène", "Cité Lamy, Thiès", "Diakhao, Thiès"}[n % 6])
                    .dateNaissance(LocalDate.of(1985 + n % 20, 1 + n % 12, 1 + n % 27))
                    .site(b.getCode()).lieuInscription(lieu)
                    .typeFormation(perf ? TypeFormation.PERFECTIONNEMENT : TypeFormation.PERMIS)
                    .boiteVitesse(perf ? (f.equals("CP-A") ? BoiteVitesse.AUTOMATIQUE : BoiteVitesse.MANUELLE) : null)
                    .categoriePermis(cat).formule(perf ? null : (String) x[5])
                    .montantTotal(BigDecimal.valueOf(montant(f, (String) x[5])))
                    .dateInscription(inscrit).statut(statut).moniteur(m)
                    .docCertResidence(ancien).docCniLegalisee(ancien).docPhotos(true)
                    .docVisiteMedicale(jours > 20).docGroupeSanguin(jours > 20).docTimbre(jours > 40)
                    .docEnrolement(jours > 60).docDelivrance(statut == StatutEleve.DIPLOME)
                    .archive(statut == StatutEleve.DIPLOME && perf)
                    .dateArchivage(statut == StatutEleve.DIPLOME && perf ? aujourdhui.minusDays(jours - 45) : null)
                    .build();
            // Identifiants envoyés aux élèves déjà installés ; les plus récents sont « à envoyer »
            if (jours > 7) {
                e.setBienvenueEnvoyeeLe(inscrit.atTime(17, 30));
                e.setBienvenueEnvoyeePar("Administrateur");
                if (jours > 12) e.setPremiereConnexionLe(inscrit.plusDays(1).atTime(20, 15));
                compte(prenom + " " + nom, tel, RoleUser.ELEVE);
                if (!VITRINE.contains(prenom + " " + nom) || motDePasseDemo.isBlank()) brouiller(tel);
            }
            l.add(eleveRepo.save(e));
        }
        return l;
    }

    /** Seuls les élèves « vitrine » gardent le mot de passe de démo ; les autres ont un mot de passe inconnu. */
    private void brouiller(String telephone) {
        userRepo.findByEmailIgnoreCase(telephone).ifPresent(u -> { u.setMotDePasse(encoder.encode(UUID.randomUUID().toString())); userRepo.save(u); });
    }

    private static int montant(String f, String formule) {
        if (f.equals("A")) return 80_000;
        if (f.equals("C")) return 130_000;
        if (f.startsWith("CP")) return f.equals("CP-A") ? 85_000 : 40_000;
        return switch (formule) { case "Premium" -> 125_000; case "Prestige" -> 165_000; case "Excellence" -> 210_000; default -> 90_000; };
    }

    // ── Paiements, leçons, examens ─────────────────────────────────────────────

    private void paiements(List<Eleve> eleves) {
        MoyenPaiement[] moyens = {MoyenPaiement.WAVE, MoyenPaiement.ESPECES, MoyenPaiement.ORANGE_MONEY, MoyenPaiement.WAVE};
        int i = 0;
        for (Eleve e : eleves) {
            i++;
            long total = e.getMontantTotal().longValue();
            long jours = Duration.between(e.getDateInscription().atStartOfDay(), aujourdhui.atStartOfDay()).toDays();
            boolean termine = e.getStatut() == StatutEleve.DIPLOME;
            long acompte = Math.round(total * (e.getTypeFormation() == TypeFormation.PERFECTIONNEMENT ? 0.6 : 0.5) / 1000.0) * 1000;
            paiement(e, acompte, TypePaiement.TRANCHE_1, e.getDateInscription(), moyens[i % 4], "Acompte à l'inscription");
            if (termine || jours > 50) {
                long reste = total - acompte;
                long t2 = termine || jours > 120 ? reste : Math.round(reste * 0.5 / 1000.0) * 1000;
                paiement(e, t2, TypePaiement.TRANCHE_2, e.getDateInscription().plusDays(Math.min(jours - 1, 35)), moyens[(i + 1) % 4], "Deuxième versement");
            }
        }
    }

    private void paiement(Eleve e, long montant, TypePaiement type, LocalDate date, MoyenPaiement moyen, String description) {
        if (montant <= 0) return;
        paiementRepo.save(Paiement.builder().eleve(e).montant(BigDecimal.valueOf(montant)).typePaiement(type).date(date)
                .statut(StatutPaiement.PAYE).moyenPaiement(moyen).description(description)
                .transactionId(moyen == MoyenPaiement.ESPECES ? null : "TX" + (100_000 + hasard.nextInt(900_000))).build());
    }

    private void lecons(List<Eleve> eleves, List<Vehicule> vehicules) {
        LocalTime[] creneaux = {LocalTime.of(8, 0), LocalTime.of(10, 0), LocalTime.of(14, 0), LocalTime.of(16, 0)};
        int i = 0;
        for (Eleve e : eleves) {
            if (e.getStatut() == StatutEleve.ABANDONNE) continue;
            i++;
            long jours = Duration.between(e.getDateInscription().atStartOfDay(), aujourdhui.atStartOfDay()).toDays();
            Vehicule v = e.getCategoriePermis() == CategoriePermis.A ? vehicules.get(3)
                    : e.getBoiteVitesse() == BoiteVitesse.AUTOMATIQUE ? vehicules.get(1) : vehicules.get(0);
            int faites = (int) Math.min(12, jours / 9);
            for (int k = 0; k < faites; k++) {
                LocalDate d = e.getDateInscription().plusDays(7 + k * 8L);
                if (!d.isBefore(aujourdhui)) break;
                lecon(e, v, d, creneaux[(i + k) % 4], StatutLecon.TERMINEE, k == 0 ? "Prise en main du véhicule" : null);
            }
            e.setNombreLeconsConduite(faites);
            if (e.getStatut() == StatutEleve.EN_COURS && jours >= 5) {
                lecon(e, v, aujourdhui.plusDays(1 + i % 6), creneaux[i % 4], StatutLecon.PLANIFIEE, null);
                if (i % 2 == 0) lecon(e, v, aujourdhui.plusDays(8 + i % 5), creneaux[(i + 1) % 4], StatutLecon.PLANIFIEE, null);
            }
            eleveRepo.save(e);
        }
    }

    private void lecon(Eleve e, Vehicule v, LocalDate date, LocalTime debut, StatutLecon statut, String obs) {
        leconRepo.save(Lecon.builder().eleve(e).moniteur(e.getMoniteur()).vehicule(v).date(date).heureDebut(debut)
                .heureFin(debut.plusHours(1)).type(TypeLecon.CONDUITE).statut(statut).observations(obs).build());
    }

    private void examens(List<Eleve> eleves) {
        for (Eleve e : eleves) {
            if (e.getTypeFormation() == TypeFormation.PERFECTIONNEMENT || e.getStatut() == StatutEleve.ABANDONNE) continue;
            long jours = Duration.between(e.getDateInscription().atStartOfDay(), aujourdhui.atStartOfDay()).toDays();
            if (e.getStatut() == StatutEleve.DIPLOME) {
                examen(e, TypeExamen.CODE, e.getDateInscription().plusDays(45), ResultatExamen.ADMIS, 26 + hasard.nextInt(5), 1);
                examen(e, TypeExamen.CONDUITE, e.getDateInscription().plusDays(110), ResultatExamen.ADMIS, null, 1);
            } else if (jours > 70) {
                // Code : un échec puis une réussite, ou réussi du premier coup
                if (e.getId() % 2 == 0) examen(e, TypeExamen.CODE, e.getDateInscription().plusDays(40), ResultatExamen.REFUSE, 21, 1);
                examen(e, TypeExamen.CODE, e.getDateInscription().plusDays(e.getId() % 2 == 0 ? 60 : 45), ResultatExamen.ADMIS, 27, e.getId() % 2 == 0 ? 2 : 1);
                examen(e, TypeExamen.CONDUITE, aujourdhui.plusDays(12), ResultatExamen.EN_ATTENTE, null, 1);
            } else if (jours > 30) {
                examen(e, TypeExamen.CODE, aujourdhui.plusDays(10), ResultatExamen.EN_ATTENTE, null, 1);
            }
        }
    }

    private void examen(Eleve e, TypeExamen type, LocalDate date, ResultatExamen r, Integer score, int tentative) {
        examenRepo.save(Examen.builder().eleve(e).type(type).date(date).resultat(r).score(score).tentative(tentative).build());
    }

    // ── Code : séances avec quiz, annales et séries ────────────────────────────

    private void seances(List<Eleve> eleves, List<Moniteur> moniteurs) {
        List<Eleve> code = eleves.stream().filter(e -> e.getTypeFormation() == TypeFormation.PERMIS
                && e.getStatut() == StatutEleve.EN_COURS).toList();
        Object[][] s = {
            {"Les panneaux de danger", ThemeSeance.PANNEAUX_SIGNALISATION, "danger", 1, 6, 28},
            {"Obligations et interdictions", ThemeSeance.PANNEAUX_SIGNALISATION, "obligation-interdiction", 1, 8, 21},
            {"Les règles de priorité", ThemeSeance.REGLES_PRIORITE, "priorite-regles", null, null, 14},
            {"Le marquage au sol", ThemeSeance.SIGNALISATION_SOL, "lignes", null, null, 6},
            {"Feux et carrefours", ThemeSeance.FEUX_SIGNALISATION, "priorite-feux", null, null, -2},
        };
        int k = 0;
        for (Object[] x : s) {
            User moniteur = userRepo.findByEmailIgnoreCase(moniteurs.get(k % 3).getTelephone()).orElseThrow();
            int ilYa = (int) x[5];
            Seance se = Seance.builder().titre((String) x[0]).theme((ThemeSeance) x[1]).statut(StatutSeance.PUBLIE)
                    .dateHeure(aujourdhui.minusDays(ilYa).atTime(9, 0)).moniteur(moniteur)
                    .programme(new ArrayList<>(List.of(new PartieCode((String) x[2], (Integer) x[3], (Integer) x[4]))))
                    .eleves(new ArrayList<>(code)).createdAt(aujourdhui.minusDays(ilYa + 1).atTime(18, 0)).build();
            se = seanceRepo.save(se);
            if (ilYa > 0) {   // séance passée : la plupart ont fait le quiz
                for (Eleve e : code) {
                    if (hasard.nextInt(100) < 25) continue;
                    int total = 6 + (k % 2) * 4, score = Math.max(2, total - hasard.nextInt(4));
                    boolean reussi = score >= Math.ceil(0.7 * total);
                    resultatRepo.save(ResultatQuizSeance.builder().seanceId(se.getId()).eleveId(e.getId()).score(score).total(total)
                            .meilleurScore(score).meilleurTotal(total).reussi(reussi).tentatives(reussi ? 1 : 2)
                            .erreurs(reussi ? null : "« Cassis ou dos-d'âne » confondu avec « Ralentisseur (dos-d'âne) »")
                            .derniereTentative(aujourdhui.minusDays(ilYa).atTime(20, hasard.nextInt(59))).build());
                }
            }
            k++;
        }
    }

    private void publications(List<Eleve> eleves, User admin) {
        List<Eleve> code = eleves.stream().filter(e -> e.getTypeFormation() == TypeFormation.PERMIS
                && e.getStatut() == StatutEleve.EN_COURS).toList();
        String[][] p = {{"annale-b1", "ENTRAINEMENT"}, {"annale-b1", "EXAMEN"}, {"serie-b1", "EXAMEN"}, {"serie-b2", "ENTRAINEMENT"}, {"serie-b2", "EXAMEN"}};
        for (String[] x : p) {
            publicationRepo.save(PublicationSerie.builder().serie(x[0]).mode(x[1]).auteur(admin)
                    .eleves(new ArrayList<>(code)).creeLe(aujourdhui.minusDays(12).atTime(10, 0)).build());
        }
        // Examens blancs déjà passés : de quoi voir « assimilé », « à revoir » et « pas encore fait »
        for (String serie : List.of("annale-b1", "serie-b1", "serie-b2")) {
            for (Eleve e : code) {
                if (hasard.nextInt(100) < 35) continue;
                int score = 15 + hasard.nextInt(11);
                progressionRepo.save(ProgressionCode.builder().eleveId(e.getId()).chapitre(serie).meilleurScore(score).total(25)
                        .reussi(score >= 20).tentatives(1 + hasard.nextInt(3))
                        .derniereTentative(aujourdhui.minusDays(1 + hasard.nextInt(10)).atTime(21, 0)).build());
            }
        }
    }

    private void annonces(User admin) {
        String auteur = configRepo.findAll().stream().findFirst().map(AutoEcoleConfig::getNom).orElse("Auto-École Démo");
        annonce("Examen du code", "La prochaine session d'examen du code aura lieu dans 10 jours. Pensez à réviser vos séries d'examen dans Travaux Dirigés !",
                Annonce.Cible.ELEVES, null, admin, auteur, 3);
        annonce("Fermeture exceptionnelle", "Le bureau de Thiès Nord sera fermé samedi. Les leçons sont maintenues au bureau de Thiès Centre.",
                Annonce.Cible.BUREAU, "THIES_NORD", admin, auteur, 1);
    }

    private void annonce(String titre, String contenu, Annonce.Cible cible, String valeur, User admin, String auteur, int ilYa) {
        annonceRepo.save(Annonce.builder().titre(titre).contenu(contenu).cible(cible).valeur(valeur)
                .auteurId(admin != null ? admin.getId() : null).auteurNom(auteur).auteurRole(RoleUser.SUPER_ADMIN)
                .creeLe(aujourdhui.minusDays(ilYa).atTime(9, 30)).build());
    }
}
