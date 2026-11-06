package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.AutoEcoleConfig;
import sn.autoecole.entity.FormulePerfectionnement;
import sn.autoecole.entity.FormulePermis;
import sn.autoecole.enums.BoiteVitesse;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.AutoEcoleConfigRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AutoEcoleConfigController {

    private final AutoEcoleConfigRepository repo;
    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;

    private AutoEcoleConfig getOrCreate() {
        AutoEcoleConfig cfg = repo.findAll().stream().findFirst().orElseGet(AutoEcoleConfig::new);
        var perf = FormulePerfectionnement.completer(cfg.getFormulesPerfectionnement());
        if (cfg.getId() == null || cfg.getFormules() == null || cfg.getFormulesPoidsLourd() == null || cfg.getFormulesMoto() == null
                || !perf.equals(cfg.getFormulesPerfectionnement())) {
            if (cfg.getFormules() == null) cfg.setFormules(FormulePermis.parDefaut());
            if (cfg.getFormulesPoidsLourd() == null) cfg.setFormulesPoidsLourd(FormulePermis.parDefautPoidsLourd());
            if (cfg.getFormulesMoto() == null) cfg.setFormulesMoto(FormulePermis.parDefautMoto());
            cfg.setFormulesPerfectionnement(perf);
            cfg = repo.save(cfg);
        }
        return cfg;
    }

    @GetMapping("/api/admin/config")
    public AutoEcoleConfig get() {
        return getOrCreate();
    }

    @GetMapping("/api/config")
    public AutoEcoleConfig getPublic() {
        return getOrCreate();
    }

    @PutMapping("/api/admin/config")
    public AutoEcoleConfig save(@RequestBody Map<String, Object> body) {
        AutoEcoleConfig cfg = getOrCreate();

        if (body.containsKey("nom"))          cfg.setNom((String) body.get("nom"));
        if (body.containsKey("adresse"))      cfg.setAdresse((String) body.get("adresse"));
        if (body.containsKey("telephone"))    cfg.setTelephone((String) body.get("telephone"));
        if (body.containsKey("email"))        cfg.setEmail((String) body.get("email"));
        if (body.containsKey("logoUrl"))      cfg.setLogoUrl((String) body.get("logoUrl"));
        if (body.containsKey("signatureUrl")) cfg.setSignatureUrl((String) body.get("signatureUrl"));
        if (body.containsKey("lienWave"))        cfg.setLienWave(lienPaiement(body.get("lienWave")));
        if (body.containsKey("lienOrangeMoney")) cfg.setLienOrangeMoney(lienPaiement(body.get("lienOrangeMoney")));

        if (body.containsKey("tarifInscription"))
            cfg.setTarifInscription(toBD(body.get("tarifInscription")));
        if (body.containsKey("tarifHeureCode"))
            cfg.setTarifHeureCode(toBD(body.get("tarifHeureCode")));
        if (body.containsKey("tarifHeureConduite"))
            cfg.setTarifHeureConduite(toBD(body.get("tarifHeureConduite")));
        if (body.containsKey("formules"))
            cfg.setFormules(formules(body.get("formules"), FormulePermis.NOMS, ""));
        if (body.containsKey("formulesPoidsLourd"))
            cfg.setFormulesPoidsLourd(formules(body.get("formulesPoidsLourd"), List.of("Standard"), " (permis C et D)"));
        if (body.containsKey("formulesMoto"))
            cfg.setFormulesMoto(formules(body.get("formulesMoto"), List.of("Standard"), " (permis A)"));
        if (body.containsKey("formulesPerfectionnement"))
            cfg.setFormulesPerfectionnement(formulesPerfectionnement(body.get("formulesPerfectionnement")));
        if (body.containsKey("moniteurParDefautId")) {
            Object v = body.get("moniteurParDefautId");
            cfg.setMoniteurParDefautId(v == null || v.toString().isBlank() ? null : Long.valueOf(v.toString()));
        }

        return repo.save(cfg);
    }

    /**
     * Donne le moniteur par défaut aux élèves actifs qui n'ont aucun moniteur (ex. inscrits importés
     * avant ce réglage). Ceux qui ont déjà un moniteur ne changent pas. Réservé à l'admin (/api/admin/**).
     */
    @PostMapping("/api/admin/config/moniteur-par-defaut/appliquer")
    @Transactional
    public Map<String, Object> appliquerMoniteurParDefaut() {
        Long id = getOrCreate().getMoniteurParDefautId();
        var moniteur = id == null ? null : moniteurRepository.findById(id).filter(m -> m.isActif()).orElse(null);
        if (moniteur == null) throw new BusinessException("Choisissez d'abord un moniteur par défaut actif, puis sauvegardez");
        var eleves = eleveRepository.findByArchiveFalse().stream().filter(e -> e.getMoniteur() == null).toList();
        eleves.forEach(e -> e.setMoniteur(moniteur));
        eleveRepository.saveAll(eleves);
        return Map.of("eleves", eleves.size(), "moniteur", moniteur.getPrenom() + " " + moniteur.getNom());
    }

    /**
     * Les formules nommées, dans l'ordre (les quatre du permis B, ou la Standard du permis A ou des permis C/D).
     * Standard n'a pas de 3e tranche. Les tranches doivent couvrir le montant (une formule encore
     * à 0 est acceptée : pas encore renseignée).
     */
    private List<FormulePermis> formules(Object v, List<String> noms, String precision) {
        if (!(v instanceof List<?> liste)) throw new BusinessException("Formules invalides");
        List<FormulePermis> res = new ArrayList<>();
        for (String nom : noms) {
            Map<?, ?> f = liste.stream().filter(x -> x instanceof Map<?, ?> m && nom.equals(m.get("nom")))
                    .map(x -> (Map<?, ?>) x).findFirst().orElse(Map.of());
            BigDecimal montant = toBD(f.get("montant")), acompte = toBD(f.get("acompte")), t2 = toBD(f.get("tranche2"));
            BigDecimal t3 = "Standard".equals(nom) ? null : toBD(f.get("tranche3"));
            for (BigDecimal x : new BigDecimal[]{montant, acompte, t2, t3 == null ? BigDecimal.ZERO : t3})
                if (x.signum() < 0) throw new BusinessException("Formule " + nom + precision + " : montant négatif");
            BigDecimal total = acompte.add(t2).add(t3 == null ? BigDecimal.ZERO : t3);
            if (total.compareTo(montant) != 0)
                throw new BusinessException("Formule " + nom + precision + " : l'acompte et les tranches (" + total.toBigInteger()
                        + " F) ne font pas le montant de la formule (" + montant.toBigInteger() + " F)");
            res.add(new FormulePermis(nom, montant, acompte, t2, t3));
        }
        return res;
    }

    /**
     * Les formules de perfectionnement : toujours la liste par défaut (boîte et nombre de cours),
     * seuls les montants changent. L'acompte et la 2e tranche doivent faire le montant.
     */
    private List<FormulePerfectionnement> formulesPerfectionnement(Object v) {
        if (!(v instanceof List<?> liste)) throw new BusinessException("Formules de perfectionnement invalides");
        List<FormulePerfectionnement> res = new ArrayList<>();
        for (FormulePerfectionnement d : FormulePerfectionnement.parDefaut()) {
            Map<?, ?> f = liste.stream().filter(x -> x instanceof Map<?, ?> m
                            && d.boite().name().equals(String.valueOf(m.get("boite"))) && String.valueOf(d.cours()).equals(String.valueOf(m.get("cours"))))
                    .map(x -> (Map<?, ?>) x).findFirst().orElse(Map.of());
            BigDecimal montant = toBD(f.get("montant")), acompte = toBD(f.get("acompte")), t2 = toBD(f.get("tranche2"));
            String nom = d.cours() + " cours, boîte " + (d.boite() == BoiteVitesse.AUTOMATIQUE ? "automatique" : "manuelle");
            if (montant.signum() < 0 || acompte.signum() < 0 || t2.signum() < 0)
                throw new BusinessException(nom + " : montant négatif");
            if (acompte.add(t2).compareTo(montant) != 0)
                throw new BusinessException(nom + " : l'acompte et la 2e tranche (" + acompte.add(t2).toBigInteger()
                        + " F) ne font pas le montant (" + montant.toBigInteger() + " F)");
            res.add(new FormulePerfectionnement(d.boite(), d.cours(), montant, acompte, t2));
        }
        return res;
    }

    /** Le lien est rendu tel quel dans un href côté élève : on n'accepte que du https. */
    private String lienPaiement(Object v) {
        String s = v == null ? "" : v.toString().trim();
        if (s.isEmpty()) return null;
        if (!s.startsWith("https://"))
            throw new BusinessException("Le lien de paiement doit commencer par https://");
        return s;
    }

    private BigDecimal toBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }
}
