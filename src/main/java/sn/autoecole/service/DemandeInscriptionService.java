package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.DemandeInscriptionRequest;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.entity.DemandeInscription;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.FormulePerfectionnement;
import sn.autoecole.entity.FormulePermis;
import sn.autoecole.enums.*;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.AutoEcoleConfigRepository;
import sn.autoecole.repository.DemandeInscriptionRepository;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.PaiementRepository;
import sn.autoecole.util.Telephones;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Inscription en ligne : le candidat dépose une demande (page d'accueil), la secrétaire ou
 * l'admin vérifie l'acompte puis l'approuve (l'élève est créé, l'acompte devient la 1re tranche)
 * ou la refuse.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DemandeInscriptionService {

    private final DemandeInscriptionRepository demandeRepository;
    private final EleveRepository eleveRepository;
    private final PaiementRepository paiementRepository;
    private final AutoEcoleConfigRepository configRepository;
    private final MoniteurRepository moniteurRepository;
    private final EleveService eleveService;

    public DemandeInscription soumettre(DemandeInscriptionRequest r) {
        String tel = Telephones.normaliser(r.getTelephone());
        if (tel == null || tel.length() < 9) throw new BusinessException("Numéro de téléphone invalide");
        if (r.getMoyenPaiement() != MoyenPaiement.WAVE && r.getMoyenPaiement() != MoyenPaiement.ORANGE_MONEY)
            throw new BusinessException("L'acompte en ligne se paie par Wave ou Orange Money");
        String transaction = r.getTransactionId() == null || r.getTransactionId().isBlank() ? null : r.getTransactionId().trim();
        if (transaction != null && (paiementRepository.existsByTransactionIdIgnoreCase(transaction)
                || demandeRepository.existsByTransactionIdIgnoreCaseAndStatutNot(transaction, StatutDemande.REFUSEE)))
            throw new BusinessException("Cette référence de transaction a déjà été utilisée");
        if (eleveRepository.existsByTelephone(tel))
            throw new BusinessException("Ce numéro est déjà inscrit : contactez l'auto-école ou connectez-vous à votre espace élève");
        if (demandeRepository.existsByTelephoneAndStatut(tel, StatutDemande.EN_ATTENTE))
            throw new BusinessException("Une demande est déjà en cours pour ce numéro : l'auto-école va vous contacter");

        DemandeInscription d = DemandeInscription.builder()
                .prenom(prenom(r.getPrenom())).nom(r.getNom().trim().toUpperCase())
                .telephone(tel)
                .montantAcompte(r.getMontantAcompte()).moyenPaiement(r.getMoyenPaiement()).transactionId(transaction)
                .dateDemande(LocalDate.now()).creeLe(LocalDateTime.now())
                .build();
        switch (r.getFormation().trim().toUpperCase()) {
            case "A", "B", "C", "D" -> { d.setTypeFormation(TypeFormation.PERMIS); d.setCategoriePermis(CategoriePermis.valueOf(r.getFormation().trim().toUpperCase())); }
            case "CP_M" -> { d.setTypeFormation(TypeFormation.PERFECTIONNEMENT); d.setBoiteVitesse(BoiteVitesse.MANUELLE); }
            case "CP_A" -> { d.setTypeFormation(TypeFormation.PERFECTIONNEMENT); d.setBoiteVitesse(BoiteVitesse.AUTOMATIQUE); }
            default -> throw new BusinessException("Formation inconnue");
        }
        formule(d, r.getFormule());
        return demandeRepository.save(d);
    }

    /**
     * Formule choisie, retrouvée dans Paramètres (le montant ne vient jamais du navigateur).
     * Obligatoire dès que la formation a des formules ; libellé identique à celui de la fiche élève.
     */
    private void formule(DemandeInscription d, String choix) {
        var cfg = configRepository.findAll().stream().findFirst().orElse(null);
        String c = choix == null ? "" : choix.trim();
        if (d.getTypeFormation() == TypeFormation.PERMIS) {
            // Permis C et D : leur propre formule Standard ; A et B : les quatre formules
            boolean lourd = d.getCategoriePermis() == CategoriePermis.C || d.getCategoriePermis() == CategoriePermis.D;
            var liste = cfg == null ? null : lourd ? cfg.getFormulesPoidsLourd() : cfg.getFormules();
            if (liste == null && lourd) liste = FormulePermis.parDefautPoidsLourd();
            var options = (liste == null ? List.<FormulePermis>of() : liste)
                    .stream().filter(f -> f.montant() != null && f.montant().signum() > 0).toList();
            if (options.isEmpty()) return;
            FormulePermis f = options.stream().filter(x -> x.nom().equalsIgnoreCase(c)).findFirst()
                    .orElseThrow(() -> new BusinessException("Choisissez votre formule"));
            d.setFormule(f.nom());
            d.setMontantFormule(f.montant());
        } else {
            var options = FormulePerfectionnement.completer(cfg == null ? null : cfg.getFormulesPerfectionnement())
                    .stream().filter(f -> f.boite() == d.getBoiteVitesse() && f.montant() != null && f.montant().signum() > 0).toList();
            if (options.isEmpty()) return;
            FormulePerfectionnement f = options.stream().filter(x -> String.valueOf(x.cours()).equals(c)).findFirst()
                    .orElseThrow(() -> new BusinessException("Choisissez votre formule"));
            d.setFormule(f.cours() + " cours · " + (f.boite() == BoiteVitesse.AUTOMATIQUE ? "automatique" : "manuelle"));
            d.setMontantFormule(f.montant());
        }
    }

    @Transactional(readOnly = true)
    public List<DemandeInscription> enAttente() {
        return demandeRepository.findByStatutOrderByCreeLeDesc(StatutDemande.EN_ATTENTE);
    }

    @Transactional(readOnly = true)
    public long nombreEnAttente() {
        return demandeRepository.countByStatut(StatutDemande.EN_ATTENTE);
    }

    /**
     * Crée l'élève (lieu « En ligne », date = jour de la demande), l'acompte comme 1re tranche
     * payée avec sa référence de transaction, puis ses identifiants pour le message de bienvenue.
     */
    public Map<String, Object> approuver(Long id, BigDecimal montantTotal, Site bureau, String par) {
        DemandeInscription d = enAttente(id);
        if (montantTotal == null || montantTotal.signum() <= 0) throw new BusinessException("Indiquez le montant total de la formation");
        if (d.getMontantAcompte().compareTo(montantTotal) > 0) throw new BusinessException("L'acompte dépasse le montant total");

        EleveRequest req = new EleveRequest();
        req.setPrenom(d.getPrenom());
        req.setNom(d.getNom());
        req.setTelephone(d.getTelephone());
        req.setDateInscription(d.getDateDemande());
        req.setLieuInscription(Site.EN_LIGNE);
        req.setSite(bureau != null ? bureau : Site.EN_LIGNE);   // en ligne → suivi par Massalikoul Djinane
        req.setTypeFormation(d.getTypeFormation());
        req.setCategoriePermis(d.getCategoriePermis());
        req.setBoiteVitesse(d.getBoiteVitesse());
        req.setMontantTotal(montantTotal);
        req.setFormule(d.getFormule());
        req.setMontantAvance(d.getMontantAcompte());
        req.setMoyenAcompte(d.getMoyenPaiement());
        req.setStatut(StatutEleve.EN_COURS);
        if (d.getTypeFormation() == TypeFormation.PERMIS) req.setMoniteurId(moniteurParDefaut());
        Eleve eleve = eleveService.creer(req);

        // La référence du paiement Wave / Orange Money suit l'acompte dans la caisse
        paiementRepository.findByEleveId(eleve.getId()).stream().findFirst().ifPresent(p -> {
            p.setTransactionId(d.getTransactionId());
            p.setDescription("Acompte versé en ligne — " + d.getMoyenPaiement().getLibelle());
            paiementRepository.save(p);
        });

        d.setStatut(StatutDemande.APPROUVEE);
        d.setEleveId(eleve.getId());
        d.setTraitePar(par);
        d.setTraiteLe(LocalDateTime.now());
        demandeRepository.save(d);
        return Map.of("eleve", eleveService.trouverParId(eleve.getId()), "identifiants", eleveService.genererIdentifiants(eleve.getId()));
    }

    public DemandeInscription refuser(Long id, String motif, String par) {
        DemandeInscription d = enAttente(id);
        d.setStatut(StatutDemande.REFUSEE);
        d.setMotifRefus(motif != null && !motif.isBlank() ? motif.trim() : null);
        d.setTraitePar(par);
        d.setTraiteLe(LocalDateTime.now());
        return demandeRepository.save(d);
    }

    private DemandeInscription enAttente(Long id) {
        DemandeInscription d = demandeRepository.findById(id).orElseThrow(() -> new BusinessException("Demande introuvable"));
        if (d.getStatut() != StatutDemande.EN_ATTENTE) throw new BusinessException("Cette demande a déjà été traitée");
        return d;
    }

    /** Moniteur des cours de code (Paramètres), s'il est actif : comme pour l'import. */
    private Long moniteurParDefaut() {
        return configRepository.findAll().stream().findFirst()
                .map(c -> c.getMoniteurParDefautId())
                .filter(mid -> moniteurRepository.findById(mid).map(m -> m.isActif()).orElse(false))
                .orElse(null);
    }

    /** « awa  fatou » → « Awa Fatou ». */
    private static String prenom(String s) {
        StringBuilder sb = new StringBuilder();
        for (String mot : s.trim().toLowerCase(java.util.Locale.FRENCH).split("\\s+")) {
            if (mot.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(mot.charAt(0))).append(mot.substring(1));
        }
        return sb.toString();
    }
}
