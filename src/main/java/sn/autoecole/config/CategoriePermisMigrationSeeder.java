package sn.autoecole.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategoriePermisMigrationSeeder {

    private final JdbcTemplate jdbc;

    @PostConstruct
    public void migrer() {
        try {
            // Élargir la colonne bonne_reponse si elle est encore VARCHAR(1)
            try {
                jdbc.execute("ALTER TABLE questions_td ALTER COLUMN bonne_reponse VARCHAR(10)");
                log.info("Colonne questions_td.bonne_reponse élargie à VARCHAR(10)");
            } catch (Exception ignored) {}

            // Supprimer les anciennes contraintes CHECK qui bloquent la migration
            dropCheckConstraints("ELEVES", "CATEGORIE_PERMIS");
            dropCheckConstraints("MONITEUR_CATEGORIES", "CATEGORIE");

            // Migrer les anciennes valeurs vers les nouvelles
            int n = 0;
            n += jdbc.update("UPDATE eleves SET categorie_permis = 'POIDS_LEGER' WHERE categorie_permis IN ('A','A1','B','EB')");
            n += jdbc.update("UPDATE eleves SET categorie_permis = 'POIDS_LOURD' WHERE categorie_permis IN ('C','EC')");
            n += jdbc.update("UPDATE eleves SET categorie_permis = 'TRANSPORT'   WHERE categorie_permis = 'D'");
            n += jdbc.update("UPDATE moniteur_categories SET categorie = 'POIDS_LEGER' WHERE categorie IN ('A','A1','B','EB')");
            n += jdbc.update("UPDATE moniteur_categories SET categorie = 'POIDS_LOURD' WHERE categorie IN ('C','EC')");
            n += jdbc.update("UPDATE moniteur_categories SET categorie = 'TRANSPORT'   WHERE categorie = 'D'");
            dropCheckConstraints("VEHICULES", "CATEGORIE");
            n += jdbc.update("UPDATE vehicules SET categorie = 'POIDS_LEGER' WHERE categorie IN ('A','A1','B','EB')");
            n += jdbc.update("UPDATE vehicules SET categorie = 'POIDS_LOURD' WHERE categorie IN ('C','EC')");
            n += jdbc.update("UPDATE vehicules SET categorie = 'TRANSPORT'   WHERE categorie = 'D'");
            if (n > 0) log.info("Migration catégories permis : {} ligne(s) mise(s) à jour", n);
        } catch (Exception e) {
            log.warn("Migration catégories permis ignorée : {}", e.getMessage());
        }
    }

    private void dropCheckConstraints(String table, String column) {
        try {
            var names = jdbc.queryForList(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE " +
                "WHERE TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);
            for (String name : names) {
                try {
                    jdbc.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + name);
                    log.info("Contrainte supprimée : {}.{}", table, name);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }
}
