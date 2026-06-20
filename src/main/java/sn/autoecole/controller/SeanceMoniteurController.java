package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.dto.SeanceRequest;
import sn.autoecole.dto.SeanceResponse;
import sn.autoecole.entity.Eleve;
import sn.autoecole.service.SeanceService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moniteur/seances")
@RequiredArgsConstructor
public class SeanceMoniteurController {

    private final SeanceService seanceService;

    @GetMapping
    public List<SeanceResponse> list(@AuthenticationPrincipal UserDetails user,
                                     @RequestParam(required = false, defaultValue = "false") boolean all) {
        if (all) return seanceService.findAll();
        return seanceService.findByMoniteur(user.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeanceResponse create(@RequestBody SeanceRequest req, @AuthenticationPrincipal UserDetails user) {
        return seanceService.create(req, user.getUsername());
    }

    @PutMapping("/{id}")
    public SeanceResponse update(@PathVariable Long id, @RequestBody SeanceRequest req,
                                 @AuthenticationPrincipal UserDetails user) {
        return seanceService.update(id, req, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        seanceService.delete(id, user.getUsername());
    }

    /** Élèves : tous si admin, sinon ceux du moniteur connecté */
    @GetMapping("/eleves")
    public List<Map<String, Object>> getEleves(@AuthenticationPrincipal UserDetails user) {
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        List<Eleve> eleves = isAdmin
                ? seanceService.findAllEleves()
                : seanceService.findElevesByMoniteur(user.getUsername());
        return eleves.stream()
                .map(e -> Map.<String, Object>of(
                        "id",    e.getId(),
                        "nom",   e.getNom() + " " + e.getPrenom(),
                        "email", e.getEmail() != null ? e.getEmail() : ""
                ))
                .toList();
    }
}
