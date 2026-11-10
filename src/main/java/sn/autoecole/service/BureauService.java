package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.entity.Bureau;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.BureauRepository;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/** Bureaux de l'auto-école, réglés dans Paramètres (voir {@link Bureau}). */
@Service
@RequiredArgsConstructor
public class BureauService {

    private final BureauRepository repo;

    public List<Bureau> tous() {
        return repo.findAllByOrderByOrdreAscIdAsc();
    }

    public List<Bureau> actifs() {
        return tous().stream().filter(Bureau::isActif).toList();
    }

    /** Bureau des élèves inscrits en ligne : le principal s'il est ouvert, sinon le premier ouvert. */
    public Optional<Bureau> principal() {
        List<Bureau> ouverts = actifs();
        return ouverts.stream().filter(Bureau::isPrincipal).findFirst().or(() -> ouverts.stream().findFirst());
    }

    public boolean existe(String code) {
        return code != null && repo.existsByCode(code);
    }

    /** « Keur Massar », « En ligne » ; un code inconnu reste affiché tel quel. */
    public String libelle(String code) {
        if (code == null) return null;
        if (Bureau.EN_LIGNE.equals(code)) return "En ligne";
        return repo.findByCode(code).map(Bureau::getNom).orElse(code);
    }

    /**
     * Bureau de suivi d'un élève. « En ligne » n'est pas un bureau : l'élève va au bureau principal.
     * Un bureau fermé est refusé, sauf s'il est déjà celui de l'élève (actuel).
     */
    public String pourEleve(String code, String actuel) {
        if (code == null || code.isBlank()) throw new BusinessException("Le bureau est obligatoire");
        if (Bureau.EN_LIGNE.equals(code)) {
            return principal().map(Bureau::getCode)
                    .orElseThrow(() -> new BusinessException("Aucun bureau ouvert : créez-en un dans Paramètres"));
        }
        if (code.equals(actuel)) return code;
        Bureau b = repo.findByCode(code).orElseThrow(() -> new BusinessException("Bureau inconnu : " + code));
        if (!b.isActif()) throw new BusinessException("Le bureau « " + b.getNom() + " » est fermé");
        return code;
    }

    /** Lieu d'inscription : un bureau existant (même fermé) ou « En ligne » ; vide accepté. */
    public String lieu(String code) {
        if (code == null || code.isBlank()) return null;
        if (Bureau.EN_LIGNE.equals(code) || repo.existsByCode(code)) return code;
        throw new BusinessException("Lieu d'inscription inconnu : " + code);
    }

    /** Bureau dont le nom (ou le code) ressemble au texte saisi, ex. dans un fichier importé. */
    public Optional<String> trouverParNom(String texte) {
        String t = simplifier(texte);
        if (t.isEmpty()) return Optional.empty();
        if (t.contains("ligne")) return Optional.of(Bureau.EN_LIGNE);
        for (Bureau b : tous()) {
            String nom = simplifier(b.getNom()), code = simplifier(b.getCode());
            if (t.equals(nom) || t.equals(code) || nom.startsWith(t) || t.startsWith(nom) || code.startsWith(t) || t.startsWith(code))
                return Optional.of(b.getCode());
        }
        return Optional.empty();
    }

    @Transactional
    public Bureau creer(Map<String, Object> body) {
        Bureau b = new Bureau();
        appliquer(b, body);
        b.setCode(codeLibre(b.getNom()));
        if (!body.containsKey("ordre")) b.setOrdre(tous().stream().mapToInt(Bureau::getOrdre).max().orElse(0) + 1);
        if (tous().isEmpty()) b.setPrincipal(true);   // le premier bureau suit les inscriptions en ligne
        return enregistrer(b);
    }

    @Transactional
    public Bureau modifier(Long id, Map<String, Object> body) {
        Bureau b = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bureau introuvable"));
        appliquer(b, body);
        return enregistrer(b);
    }

    private Bureau enregistrer(Bureau b) {
        Bureau s = repo.save(b);
        if (s.isPrincipal()) repo.findAll().stream().filter(x -> !x.getId().equals(s.getId()) && x.isPrincipal())
                .forEach(x -> { x.setPrincipal(false); repo.save(x); });
        return s;
    }

    private static void appliquer(Bureau b, Map<String, Object> body) {
        if (body.containsKey("nom")) {
            String nom = texte(body.get("nom"));
            if (nom == null) throw new BusinessException("Le nom du bureau est obligatoire");
            b.setNom(nom);
        }
        if (b.getNom() == null) throw new BusinessException("Le nom du bureau est obligatoire");
        if (body.containsKey("adresse")) b.setAdresse(texte(body.get("adresse")));
        if (body.containsKey("telephone")) b.setTelephone(texte(body.get("telephone")));
        if (body.containsKey("localisation")) b.setLocalisation(texte(body.get("localisation")));
        if (body.containsKey("actif")) b.setActif(Boolean.TRUE.equals(body.get("actif")));
        if (body.containsKey("principal")) b.setPrincipal(Boolean.TRUE.equals(body.get("principal")));
        if (body.containsKey("ordre") && body.get("ordre") != null) b.setOrdre(Integer.parseInt(body.get("ordre").toString()));
    }

    /** « Thiès centre » → THIES_CENTRE (THIES_CENTRE_2… s'il existe déjà). */
    private String codeLibre(String nom) {
        String base = Normalizer.normalize(nom, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
        if (base.isEmpty() || base.equals(Bureau.EN_LIGNE)) base = "BUREAU";
        if (base.length() > 50) base = base.substring(0, 50);
        String code = base;
        for (int i = 2; repo.existsByCode(code); i++) code = base + "_" + i;
        return code;
    }

    private static String texte(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static String simplifier(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
