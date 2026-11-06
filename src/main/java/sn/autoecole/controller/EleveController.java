package sn.autoecole.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.entity.DocumentEleve;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Examen;
import sn.autoecole.entity.Lecon;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.enums.TypeDocument;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.service.DocumentEleveService;
import sn.autoecole.service.EleveImportService;
import sn.autoecole.service.EleveService;
import sn.autoecole.service.ExamenService;
import sn.autoecole.service.LeconService;
import sn.autoecole.service.PaiementService;
import sn.autoecole.service.SeanceService;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eleves")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EleveController {

    private final EleveService    eleveService;
    private final LeconService    leconService;
    private final ExamenService   examenService;
    private final PaiementService paiementService;
    private final DocumentEleveService documentService;
    private final UserRepository  userRepository;
    private final EleveImportService importService;
    private final SeanceService   seanceService;

    @GetMapping
    public ResponseEntity<List<Eleve>> listerTous(@RequestParam(defaultValue = "false") boolean archives) {
        return ResponseEntity.ok(archives ? eleveService.listerArchives() : eleveService.listerTous());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Eleve> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(eleveService.trouverParId(id));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<Eleve>> rechercher(@RequestParam String terme) {
        return ResponseEntity.ok(eleveService.rechercher(terme));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Eleve>> listerParStatut(@PathVariable StatutEleve statut) {
        return ResponseEntity.ok(eleveService.listerParStatut(statut));
    }

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<Eleve>> listerParCategorie(@PathVariable CategoriePermis categorie) {
        return ResponseEntity.ok(eleveService.listerParCategorie(categorie));
    }

    @GetMapping("/site/{site}")
    public ResponseEntity<List<Eleve>> listerParSite(@PathVariable Site site) {
        return ResponseEntity.ok(eleveService.listerParSite(site));
    }

    @PostMapping
    public ResponseEntity<Eleve> creer(@Valid @RequestBody EleveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eleveService.creer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Eleve> modifier(@PathVariable Long id, @Valid @RequestBody EleveRequest request) {
        return ResponseEntity.ok(eleveService.modifier(id, request));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Eleve> changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        StatutEleve statut = StatutEleve.valueOf(body.get("statut"));
        return ResponseEntity.ok(eleveService.changerStatut(id, statut));
    }

    /** Documents remis cochés depuis la fiche (clé → true/false) ; les clés absentes ne changent pas. */
    @PatchMapping("/{id}/documents-remis")
    public ResponseEntity<Eleve> documentsRemis(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(eleveService.documentsRemis(id, body));
    }

    /** Archiver / réactiver : réservé à l'admin (SecurityConfig). */
    @PatchMapping("/{id}/archiver")
    public ResponseEntity<Eleve> archiver(@PathVariable Long id) {
        return ResponseEntity.ok(eleveService.archiver(id));
    }

    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<Eleve> reactiver(@PathVariable Long id) {
        return ResponseEntity.ok(eleveService.reactiver(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        eleveService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    /** Cours publiés pour l'élève dans les séances (code ou conduite), avec son résultat au quiz. */
    @GetMapping("/{id}/seances")
    public ResponseEntity<List<Map<String, Object>>> seances(@PathVariable Long id) {
        return ResponseEntity.ok(seanceService.publieesPourEleve(eleveService.trouverParId(id)));
    }

    @GetMapping("/{id}/lecons")
    public ResponseEntity<List<Lecon>> listerLecons(@PathVariable Long id) {
        return ResponseEntity.ok(leconService.listerParEleve(id));
    }

    @GetMapping("/{id}/examens")
    public ResponseEntity<List<Examen>> listerExamens(@PathVariable Long id) {
        return ResponseEntity.ok(examenService.listerParEleve(id));
    }

    @GetMapping("/{id}/paiements")
    public ResponseEntity<List<Paiement>> listerPaiements(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.listerParEleve(id));
    }

    @GetMapping("/{id}/total-paye")
    public ResponseEntity<Map<String, BigDecimal>> totalPaye(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("totalPaye", paiementService.totalEncaisseParEleve(id)));
    }

    // ── Pièces jointes du dossier (images / PDF) ── suppression : admin uniquement (SecurityConfig)

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<DocumentEleve>> listerDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.lister(id));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentEleve> ajouterDocument(@PathVariable Long id,
                                                         @RequestParam("file") MultipartFile file,
                                                         @RequestParam(value = "type", required = false) TypeDocument type) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.ajouter(id, file, type));
    }

    @GetMapping("/{id}/documents/{docId}/fichier")
    public ResponseEntity<Resource> telechargerDocument(@PathVariable Long id, @PathVariable Long docId) {
        DocumentEleve doc = documentService.trouver(id, docId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(doc.getNomFichier(), StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(documentService.fichier(doc));
    }

    @DeleteMapping("/{id}/documents/{docId}")
    public ResponseEntity<Void> supprimerDocument(@PathVariable Long id, @PathVariable Long docId) {
        documentService.supprimer(id, docId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/creer-compte")
    public ResponseEntity<?> creerCompte(@PathVariable Long id) {
        Eleve eleve = eleveService.trouverParId(id);
        if (eleve.getTelephone() == null)
            return ResponseEntity.badRequest().body(Map.of("erreur", "L'élève n'a pas de téléphone renseigné"));
        if (userRepository.existsByEmailIgnoreCase(eleve.getTelephone()))
            return ResponseEntity.badRequest().body(Map.of("erreur", "Un compte existe déjà pour ce numéro"));
        Map<String, Object> ids = eleveService.genererIdentifiants(id);
        return ResponseEntity.ok(Map.of("email", ids.get("identifiant"), "motDePasse", ids.get("motDePasse")));
    }

    /**
     * Import des nouveaux inscrits depuis un fichier Excel. confirmer=false : analyse seule
     * (rien n'est écrit) ; confirmer=true : crée les élèves valides. Réservé à l'admin (SecurityConfig).
     */
    @PostMapping("/import")
    public ResponseEntity<EleveImportService.Resultat> importer(@RequestParam("file") MultipartFile file,
                                                                @RequestParam(defaultValue = "false") boolean confirmer) {
        return ResponseEntity.ok(importService.importer(file, confirmer));
    }

    /** Message de bienvenue : (re)génère les identifiants de l'élève. Réservé à l'admin (SecurityConfig). */
    @PostMapping("/{id}/identifiants")
    public ResponseEntity<Map<String, Object>> genererIdentifiants(@PathVariable Long id) {
        return ResponseEntity.ok(eleveService.genererIdentifiants(id));
    }

    @GetMapping("/{id}/compte")
    public ResponseEntity<?> statutCompte(@PathVariable Long id) {
        Eleve eleve = eleveService.trouverParId(id);
        boolean existe = eleve.getTelephone() != null && userRepository.existsByEmailIgnoreCase(eleve.getTelephone());
        return ResponseEntity.ok(Map.of("compteActif", existe, "identifiant", eleve.getTelephone() != null ? eleve.getTelephone() : ""));
    }

    @GetMapping("/comptes")
    public ResponseEntity<List<Map<String, Object>>> listerComptes() {
        return ResponseEntity.ok(
            userRepository.findAllByRole(RoleUser.ELEVE).stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("nom", u.getNom());
                    m.put("email", u.getEmail());
                    return m;
                })
                .toList()
        );
    }
}
