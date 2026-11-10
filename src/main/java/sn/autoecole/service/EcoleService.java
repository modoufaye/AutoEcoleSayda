package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import sn.autoecole.entity.AutoEcoleConfig;
import sn.autoecole.repository.AutoEcoleConfigRepository;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Identité de l'auto-école installée : son nom et ses coordonnées, saisis dans Paramètres.
 * La même application sert plusieurs auto-écoles (une installation chacune) : aucun nom n'est
 * écrit dans le code. Tant que Paramètres n'a pas de nom, on prend ecole.nom (variable ECOLE_NOM
 * de l'installation).
 */
@Service
@RequiredArgsConstructor
public class EcoleService {

    private final AutoEcoleConfigRepository configRepository;

    @Value("${ecole.nom:Auto-École}")
    private String nomParDefaut;

    private Optional<AutoEcoleConfig> config() {
        return configRepository.findAll().stream().findFirst();
    }

    private static String texte(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** « Auto-École … » : nom affiché à la place de l'administration (annonces, messages, cours publiés). */
    public String nom() {
        return config().map(AutoEcoleConfig::getNom).map(EcoleService::texte).orElse(nomParDefaut);
    }

    /** Ce que les pages publiques affichent (accueil, connexion, inscription en ligne). */
    public Map<String, Object> identite() {
        Optional<AutoEcoleConfig> c = config();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nom", nom());
        m.put("telephone", c.map(AutoEcoleConfig::getTelephone).map(EcoleService::texte).orElse(null));
        m.put("email", c.map(AutoEcoleConfig::getEmail).map(EcoleService::texte).orElse(null));
        m.put("adresse", c.map(AutoEcoleConfig::getAdresse).map(EcoleService::texte).orElse(null));
        m.put("logoUrl", c.map(AutoEcoleConfig::getLogoUrl).map(EcoleService::texte).orElse(null));
        return m;
    }
}
