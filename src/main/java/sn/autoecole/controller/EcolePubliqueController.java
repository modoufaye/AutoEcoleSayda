package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.autoecole.service.EcoleService;

import java.util.Map;

/** Identité de l'auto-école (nom, coordonnées, logo), lue sans connexion par les pages publiques. */
@RestController
@RequiredArgsConstructor
public class EcolePubliqueController {

    private final EcoleService ecoleService;

    @GetMapping("/api/public/ecole")
    public Map<String, Object> ecole() {
        return ecoleService.identite();
    }
}
