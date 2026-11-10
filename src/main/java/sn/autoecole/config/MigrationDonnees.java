package sn.autoecole.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.Arrays;
import java.util.Map;

/**
 * Corrections de schéma et de données appliquées à chaque démarrage, production comprise.
 * Chaque étape est idempotente (sans effet si déjà appliquée) et isolée : un échec est
 * journalisé sans empêcher le démarrage.
 *
 * Les données de démonstration, elles, sont dans data.sql (profil dev uniquement).
 */
@Component
@DependsOn("entityManagerFactory")   // après la création/mise à jour des tables par Hibernate
@RequiredArgsConstructor
@Slf4j
public class MigrationDonnees {

    private final JdbcTemplate jdbc;

    @PostConstruct
    public void migrer() {
        etape("colonnes TD", this::colonnesTd);
        etape("contraintes CHECK des enums", this::supprimerChecksEnums);
        etape("catégories de permis", this::categoriesPermis);
        etape("doublons des catégories moniteurs", this::dedoublonnerCategoriesMoniteurs);
        etape("types de paiement", this::typesPaiement);
        etape("champs élève facultatifs", this::champsEleveFacultatifs);
        etape("téléphones des élèves", this::telephonesEleves);
        etape("téléphones des moniteurs", this::telephonesMoniteurs);
        etape("lieu d'inscription", this::lieuInscription);
        etape("bureaux", this::bureaux);
    }

    /**
     * Les bureaux étaient une liste figée dans le code (MAZALIK_JINAN, GUEDIAWAYE, KEUR_MASSAR) ; ils
     * sont désormais réglés dans Paramètres (table bureaux). Une seule fois, table vide : on crée un
     * bureau pour chaque code déjà porté par un élève ou une annonce. Si ce sont les anciens codes
     * (installation d'origine), on recrée les trois bureaux tels qu'ils étaient affichés, avec leurs
     * adresses, et on reporte sur Paramètres les textes de la page d'accueil, jusque-là dans le code.
     * Les élèves gardent leur code : rien ne change pour eux. Nouvelle installation : aucun élève,
     * aucun bureau ; l'auto-école crée les siens dans Paramètres.
     */
    private void bureaux() {
        Integer deja = jdbc.queryForObject("SELECT COUNT(*) FROM bureaux", Integer.class);
        if (deja != null && deja > 0) return;
        Set<String> codes = new LinkedHashSet<>();
        codes.addAll(jdbc.queryForList("SELECT DISTINCT site FROM eleves WHERE site IS NOT NULL", String.class));
        codes.addAll(jdbc.queryForList("SELECT DISTINCT lieu_inscription FROM eleves WHERE lieu_inscription IS NOT NULL", String.class));
        codes.addAll(jdbc.queryForList("SELECT DISTINCT valeur FROM annonces WHERE cible = 'BUREAU' AND valeur IS NOT NULL", String.class));
        codes.remove("EN_LIGNE");
        if (codes.isEmpty()) return;

        // code, nom, adresse, téléphone, localisation (installation d'origine)
        String[][] anciens = {
            {"MAZALIK_JINAN", "Massalikoul Djinane", "Avenue Cheikh Ahmadou Bamba, en face de la grande mosquée Massalikoul Djinane", "77 329 35 57", "14.701722,-17.446889"},
            {"GUEDIAWAYE", "Guédiawaye", "En face de l'arrêt BRT Fith Mith", "78 651 23 23", null},
            {"KEUR_MASSAR", "Keur Massar", "Rond-point Gouye Gui, immeuble CFC, 3e étage", "78 431 35 35", null},
        };
        boolean origine = Arrays.stream(anciens).anyMatch(a -> codes.contains(a[0]));
        String sql = "INSERT INTO bureaux (code, nom, adresse, telephone, localisation, actif, principal, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        int ordre = 0;
        if (origine) {
            for (String[] a : anciens) {
                ordre++;
                jdbc.update(sql, a[0], a[1], a[2], a[3], a[4], true, ordre == 1, ordre);
                codes.remove(a[0]);
            }
        }
        for (String c : codes) {   // codes inconnus : un bureau à renommer dans Paramètres
            ordre++;
            jdbc.update(sql, c, c, null, null, null, true, ordre == 1, ordre);
        }
        log.info("Migration : {} bureau(x) créé(s) à partir des élèves existants", ordre);

        if (origine) {
            String[][] accueil = {{"ville", "Dakar"}, {"eleves_formes", "12 000+"}, {"taux_reussite", "94 %"},
                    {"nombre_moniteurs", "15+"}, {"horaires", "Lun – Sam : 8h00 – 18h00"}};
            for (String[] a : accueil) jdbc.update("UPDATE auto_ecole_config SET " + a[0] + " = ? WHERE " + a[0] + " IS NULL", a[1]);
            jdbc.update("UPDATE auto_ecole_config SET annee_creation = 2016 WHERE annee_creation IS NULL");
            log.info("Migration : textes de la page d'accueil reportés dans Paramètres");
        }
    }

    private void etape(String nom, Runnable r) {
        try {
            r.run();
        } catch (Exception e) {
            log.warn("Migration « {} » ignorée : {}", nom, e.getMessage());
        }
    }

    /** Anciennes bases H2 uniquement (syntaxe H2) : sur PostgreSQL, le schéma est déjà correct. */
    private void colonnesTd() {
        // Colonnes VARCHAR(1) trop courtes pour les réponses combinées
        silencieux("ALTER TABLE questions_td ALTER COLUMN bonne_reponse VARCHAR(10)");
        silencieux("ALTER TABLE reponses_td ALTER COLUMN reponse VARCHAR(10)");
        // Colonne orpheline de l'ancienne structure
        silencieux("ALTER TABLE reponses_td ALTER COLUMN exercice_id BIGINT NULL");
    }

    /**
     * Hibernate crée une contrainte CHECK figeant la liste des valeurs de chaque colonne enum,
     * et ddl-auto=update ne la met jamais à jour : toute nouvelle valeur (catégorie de permis,
     * type de document, moyen de paiement…) serait refusée par la base. L'enum Java suffit à
     * garantir les valeurs ; les CHECK numériques (score, année…) sont conservés.
     * H2 écrit ces CHECK « col IN('A','B') », PostgreSQL « (col)::text = ANY ((ARRAY['A'::character varying, …])::text[]) »
     * (deux parenthèses avant ARRAY : on cherche donc seulement « ARRAY[ »).
     */
    private void supprimerChecksEnums() {
        List<Map<String, Object>> checks = jdbc.queryForList(
                "SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE " +
                "FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc " +
                "JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc " +
                "  ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME " +
                "WHERE tc.CONSTRAINT_TYPE = 'CHECK' AND UPPER(tc.TABLE_SCHEMA) = 'PUBLIC'");
        int n = 0;
        for (Map<String, Object> c : checks) {
            String clause = String.valueOf(c.get("CHECK_CLAUSE"));
            if (!clause.contains(" IN(") && !clause.contains(" IN (") && !clause.contains("ARRAY[")) continue;
            jdbc.execute("ALTER TABLE \"" + c.get("TABLE_NAME") + "\" DROP CONSTRAINT IF EXISTS \"" + c.get("CONSTRAINT_NAME") + "\"");
            n++;
        }
        if (n > 0) log.info("Migration : {} contrainte(s) CHECK d'enum supprimée(s)", n);
    }

    /**
     * Anciennes catégories vers les catégories actuelles A, B, C, D. C1 (poids lourd léger)
     * rejoint C ; INTERNATIONAL, sans équivalent, rejoint B, le permis le plus courant.
     */
    private void categoriesPermis() {
        Map<String, String> anciennes = Map.of(
                "A", "'A1'",
                "B", "'POIDS_LEGER','INTERNATIONAL','EB'",
                "C", "'POIDS_LOURD','C1','EC'",
                "D", "'TRANSPORT'");
        int n = 0;
        for (Map.Entry<String, String> e : anciennes.entrySet()) {
            String cat = e.getKey(), olds = e.getValue();
            n += jdbc.update("UPDATE eleves SET categorie_permis = '" + cat + "' WHERE categorie_permis IN (" + olds + ")");
            n += jdbc.update("UPDATE vehicules SET categorie = '" + cat + "' WHERE categorie IN (" + olds + ")");
            // Deux anciennes catégories d'un moniteur peuvent donner la même (POIDS_LOURD + C1 → C) :
            // un UPDATE heurterait uk_moniteur_categorie. On ajoute la nouvelle une fois, puis on retire les anciennes.
            jdbc.update("INSERT INTO moniteur_categories (moniteur_id, categorie) " +
                    "SELECT DISTINCT mc.moniteur_id, '" + cat + "' FROM moniteur_categories mc WHERE mc.categorie IN (" + olds + ") " +
                    "AND NOT EXISTS (SELECT 1 FROM moniteur_categories m2 WHERE m2.moniteur_id = mc.moniteur_id AND m2.categorie = '" + cat + "')");
            n += jdbc.update("DELETE FROM moniteur_categories WHERE categorie IN (" + olds + ")");
        }
        if (n > 0) log.info("Migration catégories permis : {} ligne(s) mise(s) à jour", n);
    }

    /**
     * moniteur_categories n'a pas de clé primaire : l'ancien data.sql y réinsérait des
     * catégories à chaque démarrage (centaines de doublons). La table est reconstruite sans
     * doublons ; une contrainte d'unicité empêche toute récidive.
     */
    private void dedoublonnerCategoriesMoniteurs() {
        Integer total = jdbc.queryForObject("SELECT COUNT(*) FROM moniteur_categories", Integer.class);
        Integer distincts = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (SELECT DISTINCT moniteur_id, categorie FROM moniteur_categories)", Integer.class);
        if (total != null && distincts != null && total > distincts) {
            jdbc.execute("CREATE TEMPORARY TABLE mc_dedoublonne AS SELECT DISTINCT moniteur_id, categorie FROM moniteur_categories");
            jdbc.update("DELETE FROM moniteur_categories");
            jdbc.update("INSERT INTO moniteur_categories (moniteur_id, categorie) SELECT moniteur_id, categorie FROM mc_dedoublonne");
            jdbc.execute("DROP TABLE mc_dedoublonne");
            log.info("Migration : {} doublon(s) supprimé(s) dans moniteur_categories", total - distincts);
        }
        silencieux("ALTER TABLE moniteur_categories ADD CONSTRAINT uk_moniteur_categorie UNIQUE (moniteur_id, categorie)");
    }

    /**
     * Anciens types (TARIF_INSCRIPTION, TARIF_CODE, TARIF_CONDUITE, INSCRIPTION…) vers les
     * tranches : pour chaque élève, ses paiements dans l'ordre des dates deviennent 1re tranche
     * (l'acompte), 2e tranche, puis 3e tranche pour tous les suivants.
     */
    private void typesPaiement() {
        int n = jdbc.update(
                "UPDATE paiements SET type_paiement = (" +
                "  SELECT CASE WHEN x.rang = 1 THEN 'TRANCHE_1' WHEN x.rang = 2 THEN 'TRANCHE_2' ELSE 'TRANCHE_3' END" +
                "  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY eleve_id ORDER BY date, id) AS rang FROM paiements) x" +
                "  WHERE x.id = paiements.id)" +
                " WHERE type_paiement NOT IN ('TRANCHE_1', 'TRANCHE_2', 'TRANCHE_3')");
        if (n > 0) log.info("Migration : {} paiement(s) converti(s) en tranches", n);
    }

    /** Date de naissance et téléphone deviennent facultatifs (import Excel). */
    private void champsEleveFacultatifs() {
        silencieux("ALTER TABLE eleves ALTER COLUMN date_naissance DROP NOT NULL");
        silencieux("ALTER TABLE eleves ALTER COLUMN telephone DROP NOT NULL");
        // Inscription en ligne : la référence de transaction n'est plus demandée au candidat
        silencieux("ALTER TABLE demandes_inscription ALTER COLUMN transaction_id DROP NOT NULL");
    }

    /**
     * Le téléphone est l'identifiant de connexion de l'élève : on le garde sous la forme
     * normalisée (Telephones), seule reconnue à la connexion.
     */
    private void telephonesEleves() {
        int n = 0;
        for (Map<String, Object> e : jdbc.queryForList("SELECT id, telephone FROM eleves WHERE telephone IS NOT NULL")) {
            // Clés insensibles à la casse (H2 les rend en majuscules, PostgreSQL en minuscules).
            String brut = String.valueOf(e.get("telephone"));
            String norm = sn.autoecole.util.Telephones.normaliser(brut);
            if (!brut.equals(norm)) {
                n += jdbc.update("UPDATE eleves SET telephone = ? WHERE id = ?", norm, e.get("id"));
            }
        }
        if (n > 0) log.info("Migration : {} téléphone(s) d'élève normalisé(s)", n);
    }

    /** Le téléphone est aussi l'identifiant de connexion du moniteur. */
    private void telephonesMoniteurs() {
        int n = 0;
        for (Map<String, Object> m : jdbc.queryForList("SELECT id, telephone FROM moniteurs WHERE telephone IS NOT NULL")) {
            String brut = String.valueOf(m.get("telephone"));
            String norm = sn.autoecole.util.Telephones.normaliser(brut);
            if (!brut.equals(norm)) n += jdbc.update("UPDATE moniteurs SET telephone = ? WHERE id = ?", norm, m.get("id"));
        }
        if (n > 0) log.info("Migration : {} téléphone(s) de moniteur normalisé(s)", n);
    }

    /** Nouvelle colonne : on y recopie le bureau des élèves qui n'ont pas encore de lieu d'inscription. */
    private void lieuInscription() {
        int n = jdbc.update("UPDATE eleves SET lieu_inscription = site WHERE lieu_inscription IS NULL AND site IS NOT NULL");
        if (n > 0) log.info("Migration : lieu d'inscription recopié du bureau pour {} élève(s)", n);
        // « En ligne » n'est plus un bureau : ces élèves sont suivis par Massalikoul Djinane.
        int m = jdbc.update("UPDATE eleves SET site = 'MAZALIK_JINAN' WHERE site = 'EN_LIGNE'");
        if (m > 0) log.info("Migration : {} élève(s) inscrit(s) en ligne rattaché(s) au bureau de Massalikoul Djinane", m);
    }

    /** Pour les ALTER déjà appliqués (ou sans objet) : l'échec est normal et ignoré. */
    private void silencieux(String sql) {
        try {
            jdbc.execute(sql);
        } catch (Exception ignored) {
            // déjà appliqué
        }
    }
}
