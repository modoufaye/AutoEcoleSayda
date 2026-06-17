package sn.autoecole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import sn.autoecole.entity.AutoEcoleConfig;
import sn.autoecole.repository.AutoEcoleConfigRepository;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AutoEcoleConfigController {

    private final AutoEcoleConfigRepository repo;

    private AutoEcoleConfig getOrCreate() {
        return repo.findAll().stream().findFirst()
                .orElseGet(() -> repo.save(new AutoEcoleConfig()));
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

        if (body.containsKey("tarifInscription"))
            cfg.setTarifInscription(toBD(body.get("tarifInscription")));
        if (body.containsKey("tarifHeureCode"))
            cfg.setTarifHeureCode(toBD(body.get("tarifHeureCode")));
        if (body.containsKey("tarifHeureConduite"))
            cfg.setTarifHeureConduite(toBD(body.get("tarifHeureConduite")));

        return repo.save(cfg);
    }

    private BigDecimal toBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }
}
