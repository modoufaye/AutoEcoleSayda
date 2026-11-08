package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.service.PresenceService;

import java.util.*;

/** Élèves et moniteurs en ligne (super admin et administrateurs), et départ à la déconnexion. */
@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presence;
    private final EleveRepository eleveRepository;
    private final MoniteurRepository moniteurRepository;

    /** { eleves: [id…], moniteurs: [id…] } : fiches dont le compte est en ligne. */
    @GetMapping
    public Map<String, List<Long>> enLigne(Authentication auth) {
        RoleUser r = ((User) auth.getPrincipal()).getRole();
        if (r != RoleUser.SUPER_ADMIN && r != RoleUser.ADMIN) throw new BusinessException("Réservé à l'administration");
        List<Long> eleves = new ArrayList<>(), moniteurs = new ArrayList<>();
        for (PresenceService.Vu v : presence.enLigne()) {
            // Le compte d'un élève ou d'un moniteur a pour identifiant le téléphone de sa fiche
            if (v.role() == RoleUser.ELEVE) eleveRepository.findFirstByTelephone(v.identifiant()).ifPresent(e -> eleves.add(e.getId()));
            else if (v.role() == RoleUser.MONITEUR) moniteurRepository.findFirstByTelephone(v.identifiant()).ifPresent(m -> moniteurs.add(m.getId()));
        }
        return Map.of("eleves", eleves, "moniteurs", moniteurs);
    }

    @PostMapping("/depart")
    public Map<String, Boolean> depart(Authentication auth) {
        presence.partir((User) auth.getPrincipal());
        return Map.of("ok", true);
    }
}
