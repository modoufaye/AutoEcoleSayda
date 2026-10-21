package sn.autoecole.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
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
    }

    private void etape(String nom, Runnable r) {
        try {
            r.run();
        } catch (Exception e) {
            log.warn("Migration « {} » ignorée : {}", nom, e.getMessage());
        }
    }

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
     */
    private void supprimerChecksEnums() {
        List<Map<String, Object>> checks = jdbc.queryForList(
                "SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE " +
                "FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc " +
                "JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc " +
                "  ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME " +
                "WHERE tc.CONSTRAINT_TYPE = 'CHECK' AND tc.TABLE_SCHEMA = 'PUBLIC'");
        int n = 0;
        for (Map<String, Object> c : checks) {
            String clause = String.valueOf(c.get("CHECK_CLAUSE"));
            if (!clause.contains(" IN(") && !clause.contains(" IN (")) continue;
            jdbc.execute("ALTER TABLE \"" + c.get("TABLE_NAME") + "\" DROP CONSTRAINT IF EXISTS \"" + c.get("CONSTRAINT_NAME") + "\"");
            n++;
        }
        if (n > 0) log.info("Migration : {} contrainte(s) CHECK d'enum supprimée(s)", n);
    }

    /** Anciennes catégories (A, B, C…) vers les catégories actuelles. */
    private void categoriesPermis() {
        String[][] tables = { {"eleves", "categorie_permis"}, {"moniteur_categories", "categorie"}, {"vehicules", "categorie"} };
        int n = 0;
        for (String[] t : tables) {
            n += jdbc.update("UPDATE " + t[0] + " SET " + t[1] + " = 'POIDS_LEGER' WHERE " + t[1] + " IN ('A','A1','B','EB')");
            n += jdbc.update("UPDATE " + t[0] + " SET " + t[1] + " = 'POIDS_LOURD' WHERE " + t[1] + " IN ('C','EC')");
            n += jdbc.update("UPDATE " + t[0] + " SET " + t[1] + " = 'TRANSPORT'   WHERE " + t[1] + " = 'D'");
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
     * L'avance versée à l'inscription était enregistrée en INSCRIPTION, alors que les écrans
     * (libellés, couleurs, filtres) n'utilisent que TARIF_INSCRIPTION.
     */
    private void typesPaiement() {
        int n = jdbc.update("UPDATE paiements SET type_paiement = 'TARIF_INSCRIPTION' WHERE type_paiement = 'INSCRIPTION'");
        if (n > 0) log.info("Migration : {} paiement(s) INSCRIPTION → TARIF_INSCRIPTION", n);
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
