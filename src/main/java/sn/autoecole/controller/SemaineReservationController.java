package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.User;
import sn.autoecole.service.CreneauxConduiteService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Ouverture des semaines aux réservations de conduite des élèves : la semaine en cours et la
 * suivante, ouvertes ou refermées par l'administration ou le secrétariat (lecture : personnel).
 */
@RestController
@RequestMapping("/api/semaines-reservation")
@RequiredArgsConstructor
public class SemaineReservationController {

    private final CreneauxConduiteService creneaux;

    @GetMapping
    @Transactional(readOnly = true)
    public List<Map<String, Object>> lister() {
        return creneaux.etatSemaines();
    }

    @PostMapping("/{lundi}")
    @Transactional
    public List<Map<String, Object>> ouvrir(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lundi, Authentication auth) {
        creneaux.ouvrirSemaine(lundi, ((User) auth.getPrincipal()).getNom());
        return creneaux.etatSemaines();
    }

    @DeleteMapping("/{lundi}")
    @Transactional
    public List<Map<String, Object>> fermer(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate lundi) {
        creneaux.fermerSemaine(lundi);
        return creneaux.etatSemaines();
    }
}
