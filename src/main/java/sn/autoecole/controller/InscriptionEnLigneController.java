package sn.autoecole.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.dto.DemandeInscriptionRequest;
import sn.autoecole.entity.DemandeInscription;
import sn.autoecole.entity.FormulePerfectionnement;
import sn.autoecole.entity.FormulePermis;
import sn.autoecole.enums.Site;
import sn.autoecole.repository.AutoEcoleConfigRepository;
import sn.autoecole.service.DemandeInscriptionService;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Inscription en ligne. Public : /api/public/inscriptions (formulaire de la page d'accueil).
 * Admin et secrétariat : /api/demandes-inscription (liste, approbation, refus), voir SecurityConfig.
 */
@RestController
@RequiredArgsConstructor
public class InscriptionEnLigneController {

    /** Par adresse et par heure : demandes enregistrées, et essais (erreurs comprises). */
    private static final int MAX_DEMANDES = 5, MAX_ESSAIS = 30;

    private final DemandeInscriptionService service;
    private final AutoEcoleConfigRepository configRepository;
    /** Horodatages récents par adresse IP : limitent les envois en rafale (robots). */
    private final Map<String, Deque<Long>> demandes = new ConcurrentHashMap<>();
    private final Map<String, Deque<Long>> essais = new ConcurrentHashMap<>();

    /** Ce que le formulaire public affiche : nom de l'école et liens de paiement. */
    @GetMapping("/api/public/inscriptions/infos")
    public Map<String, Object> infos() {
        var c = configRepository.findAll().stream().findFirst();
        Map<String, Object> m = new HashMap<>();
        m.put("nom", c.map(x -> x.getNom()).orElse("Auto-École Khadija"));
        m.put("lienWave", c.map(x -> x.getLienWave()).orElse(null));
        m.put("lienOrangeMoney", c.map(x -> x.getLienOrangeMoney()).orElse(null));
        m.put("telephone", c.map(x -> x.getTelephone()).orElse(null));
        // Formules proposées au candidat (celles qui ont un montant)
        m.put("formules", c.map(x -> x.getFormules()).orElse(List.of()).stream()
                .filter(f -> f.montant() != null && f.montant().signum() > 0).toList());
        m.put("formulesPoidsLourd", c.map(x -> x.getFormulesPoidsLourd()).orElse(FormulePermis.parDefautPoidsLourd()).stream()
                .filter(f -> f.montant() != null && f.montant().signum() > 0).toList());
        m.put("formulesMoto", c.map(x -> x.getFormulesMoto()).orElse(FormulePermis.parDefautMoto()).stream()
                .filter(f -> f.montant() != null && f.montant().signum() > 0).toList());
        m.put("formulesPerfectionnement", FormulePerfectionnement.completer(c.map(x -> x.getFormulesPerfectionnement()).orElse(null)).stream()
                .filter(f -> f.montant() != null && f.montant().signum() > 0).toList());
        return m;
    }

    @PostMapping("/api/public/inscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> soumettre(@Valid @RequestBody DemandeInscriptionRequest r, HttpServletRequest http) {
        // Champ piège rempli : un robot ; on répond comme si tout allait bien, sans rien enregistrer
        if (r.getSiteWeb() != null && !r.getSiteWeb().isBlank()) return Map.of("ok", true);
        String ip = ip(http);
        // Une erreur de saisie ne compte que dans les essais : le candidat peut corriger et renvoyer
        compter(essais, ip, MAX_ESSAIS, true);
        compter(demandes, ip, MAX_DEMANDES, false);
        DemandeInscription d = service.soumettre(r);
        compter(demandes, ip, MAX_DEMANDES, true);
        return Map.of("ok", true, "prenom", d.getPrenom());
    }

    @GetMapping("/api/demandes-inscription")
    public List<DemandeInscription> enAttente() {
        return service.enAttente();
    }

    @GetMapping("/api/demandes-inscription/nombre")
    public Map<String, Long> nombre() {
        return Map.of("enAttente", service.nombreEnAttente());
    }

    /** Corps : { montantTotal, site (bureau de suivi, facultatif) }. */
    @PostMapping("/api/demandes-inscription/{id}/approuver")
    public Map<String, Object> approuver(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        BigDecimal total = body.get("montantTotal") == null ? null : new BigDecimal(body.get("montantTotal").toString());
        Site site = body.get("site") == null || body.get("site").toString().isBlank() ? null : Site.valueOf(body.get("site").toString());
        return service.approuver(id, total, site, auth.getName());
    }

    @PostMapping("/api/demandes-inscription/{id}/refuser")
    public DemandeInscription refuser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return service.refuser(id, body == null ? null : body.get("motif"), auth.getName());
    }

    /** Refuse au-delà de max sur la dernière heure ; ajouter : compte cet envoi. */
    private static void compter(Map<String, Deque<Long>> table, String ip, int max, boolean ajouter) {
        long maintenant = System.currentTimeMillis(), heure = 3_600_000L;
        Deque<Long> d = table.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (d) {
            while (!d.isEmpty() && maintenant - d.peekFirst() > heure) d.pollFirst();
            if (d.size() >= max)
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Trop de demandes envoyées : réessayez dans une heure");
            if (ajouter) d.addLast(maintenant);
        }
    }

    /**
     * Adresse du candidat. server.forward-headers-strategy=native : Tomcat remonte X-Forwarded-For
     * en sautant les proxys internes (nginx de CapRover et du site), et donne le vrai candidat ;
     * une adresse inventée en tête de l'en-tête est ignorée.
     */
    private static String ip(HttpServletRequest http) {
        return http.getRemoteAddr();
    }
}
