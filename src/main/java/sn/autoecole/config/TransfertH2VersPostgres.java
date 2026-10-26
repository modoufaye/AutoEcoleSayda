package sn.autoecole.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.time.temporal.Temporal;
import java.util.*;

/**
 * Copie unique de la base H2 (fichier) vers PostgreSQL, au premier démarrage sur PostgreSQL.
 * Actif seulement avec le profil « transfert-h2 » (application-transfert-h2.properties).
 *
 * Déroulement : Hibernate crée d'abord les tables dans PostgreSQL (ddl-auto=update), puis
 * chaque table est copiée depuis H2 — parents avant enfants, colonnes communes seulement —
 * dans une seule transaction : en cas d'erreur, rien n'est écrit et le démarrage échoue.
 * Les compteurs d'identifiants sont ensuite recalés, puis MigrationDonnees est rejouée sur
 * les données copiées.
 *
 * Sans effet si PostgreSQL contient déjà des comptes : redémarrer avec le profil encore
 * actif ne recopie rien.
 */
@Component
@Profile("transfert-h2")
@DependsOn("entityManagerFactory")   // tables PostgreSQL créées avant la copie
@RequiredArgsConstructor
@Slf4j
public class TransfertH2VersPostgres {

    private static final int TAILLE_LOT = 500;

    private final DataSource dataSource;
    private final MigrationDonnees migrationDonnees;

    @Value("${transfert.h2.url}")
    private String h2Url;
    @Value("${transfert.h2.utilisateur}")
    private String h2Utilisateur;
    @Value("${transfert.h2.mot-de-passe}")
    private String h2MotDePasse;

    @PostConstruct
    public void transferer() {
        try (Connection cible = dataSource.getConnection()) {
            if (!cible.getMetaData().getDatabaseProductName().toLowerCase().contains("postgres")) {
                throw new IllegalStateException("Transfert H2 : la base cible n'est pas PostgreSQL (DB_URL non défini ?)");
            }
            if (compter(cible, "users") > 0) {
                log.warn("Transfert H2 ignoré : la base PostgreSQL contient déjà des comptes. "
                        + "Retirer le profil transfert-h2.");
                return;
            }
            try (Connection source = DriverManager.getConnection(h2Url, h2Utilisateur, h2MotDePasse)) {
                copier(source, cible);
            }
        } catch (SQLException e) {
            // Démarrer quand même laisserait une base vide, où AdminSeeder recréerait le compte
            // admin au mot de passe public : mieux vaut un échec visible.
            throw new IllegalStateException("Transfert H2 → PostgreSQL échoué, aucune donnée copiée : " + e.getMessage(), e);
        }
        migrationDonnees.migrer();
    }

    private void copier(Connection source, Connection cible) throws SQLException {
        Set<String> tablesSource = tables(source);
        List<String> ordre = ordreParents(cible, tables(cible));

        cible.setAutoCommit(false);
        try {
            Map<String, Integer> copies = new LinkedHashMap<>();
            for (String table : ordre) {
                if (!tablesSource.contains(table)) {
                    log.info("Transfert H2 : table {} absente de H2, laissée vide", table);
                    continue;
                }
                copies.put(table, copierTable(source, cible, table));
            }
            recalerIdentifiants(cible, copies.keySet());
            cible.commit();
            copies.forEach((t, n) -> log.info("Transfert H2 : {} → {} ligne(s)", t, n));
            tablesSource.stream().filter(t -> !ordre.contains(t))
                    .forEach(t -> log.info("Transfert H2 : table H2 {} sans équivalent, ignorée", t));
            log.info("Transfert H2 → PostgreSQL terminé : {} ligne(s) au total. Retirer le profil transfert-h2.",
                    copies.values().stream().mapToInt(Integer::intValue).sum());
        } catch (SQLException | RuntimeException e) {
            cible.rollback();
            throw e;
        } finally {
            cible.setAutoCommit(true);
        }
    }

    private int copierTable(Connection source, Connection cible, String table) throws SQLException {
        // Colonnes présentes des deux côtés : une colonne orpheline restée dans H2 est ignorée
        List<String> colonnes = new ArrayList<>(colonnes(cible, table));
        colonnes.retainAll(colonnes(source, table));
        if (colonnes.isEmpty()) return 0;

        String liste = String.join(", ", colonnes);
        // Table sans clé primaire (ex. moniteur_categories) : d'anciennes bases H2 y ont des
        // doublons, que la contrainte d'unicité côté PostgreSQL refuserait.
        String select = "SELECT " + (clePrimaire(cible, table) ? "" : "DISTINCT ") + liste + " FROM " + table;
        String insert = "INSERT INTO " + table + " (" + liste + ") VALUES ("
                + String.join(", ", Collections.nCopies(colonnes.size(), "?")) + ")";

        int n = 0;
        try (Statement lecture = source.createStatement();
             ResultSet rs = lecture.executeQuery(select);
             PreparedStatement ecriture = cible.prepareStatement(insert)) {
            while (rs.next()) {
                for (int i = 1; i <= colonnes.size(); i++) ecriture.setObject(i, valeur(rs.getObject(i)));
                ecriture.addBatch();
                if (++n % TAILLE_LOT == 0) ecriture.executeBatch();
            }
            ecriture.executeBatch();
        }
        return n;
    }

    /** Types JDBC standards transmis tels quels ; tout autre type propre à H2 (ENUM…) en texte. */
    private Object valeur(Object v) {
        if (v == null || v instanceof String || v instanceof Number || v instanceof Boolean
                || v instanceof java.util.Date || v instanceof Temporal || v instanceof byte[]
                || v instanceof UUID) return v;
        return v.toString();
    }

    /** Remet chaque compteur d'identifiant après le plus grand id copié. */
    private void recalerIdentifiants(Connection cible, Collection<String> tables) throws SQLException {
        try (Statement st = cible.createStatement()) {
            for (String table : tables) {
                if (!colonnes(cible, table).contains("id")) continue;
                st.execute("SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), "
                        + "COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM " + table
                        + " WHERE pg_get_serial_sequence('" + table + "', 'id') IS NOT NULL");
            }
        }
    }

    /** Tables cibles triées pour insérer chaque table référencée avant celles qui la référencent. */
    private List<String> ordreParents(Connection cible, Set<String> tables) throws SQLException {
        Map<String, Set<String>> parents = new TreeMap<>();
        for (String t : tables) {
            Set<String> p = new HashSet<>();
            try (ResultSet rs = cible.getMetaData().getImportedKeys(null, "public", t)) {
                while (rs.next()) {
                    String parent = rs.getString("PKTABLE_NAME").toLowerCase();
                    if (!parent.equals(t) && tables.contains(parent)) p.add(parent);
                }
            }
            parents.put(t, p);
        }
        List<String> ordre = new ArrayList<>();
        while (!parents.isEmpty()) {
            Optional<String> prete = parents.entrySet().stream()
                    .filter(e -> ordre.containsAll(e.getValue()))
                    .map(Map.Entry::getKey).findFirst();
            if (prete.isEmpty()) {
                throw new IllegalStateException("Transfert H2 : références circulaires entre " + parents.keySet());
            }
            ordre.add(prete.get());
            parents.remove(prete.get());
        }
        return ordre;
    }

    private Set<String> tables(Connection c) throws SQLException {
        Set<String> t = new TreeSet<>();
        try (ResultSet rs = c.getMetaData().getTables(null, schema(c), "%", new String[]{"TABLE"})) {
            while (rs.next()) t.add(rs.getString("TABLE_NAME").toLowerCase());
        }
        return t;
    }

    private List<String> colonnes(Connection c, String table) throws SQLException {
        List<String> cols = new ArrayList<>();
        try (ResultSet rs = c.getMetaData().getColumns(null, schema(c), nom(c, table), "%")) {
            while (rs.next()) cols.add(rs.getString("COLUMN_NAME").toLowerCase());
        }
        return cols;
    }

    private boolean clePrimaire(Connection c, String table) throws SQLException {
        try (ResultSet rs = c.getMetaData().getPrimaryKeys(null, schema(c), nom(c, table))) {
            return rs.next();
        }
    }

    private long compter(Connection c, String table) throws SQLException {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM " + table)) {
            return rs.next() ? rs.getLong(1) : 0;
        }
    }

    /** H2 range les noms non quotés en majuscules, PostgreSQL en minuscules. */
    private String schema(Connection c) throws SQLException {
        return c.getMetaData().storesUpperCaseIdentifiers() ? "PUBLIC" : "public";
    }

    private String nom(Connection c, String table) throws SQLException {
        return c.getMetaData().storesUpperCaseIdentifiers() ? table.toUpperCase() : table;
    }
}
