package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.Paiement;
import sn.autoecole.entity.User;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.enums.TypePaiement;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.PaiementRepository;
import sn.autoecole.repository.UserRepository;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EleveService {

    private final EleveRepository    eleveRepository;
    private final MoniteurRepository moniteurRepository;
    private final UserRepository     userRepository;
    private final PaiementRepository paiementRepository;
    private final PasswordEncoder    passwordEncoder;
    private final DocumentEleveService documentService;

    public List<Eleve> listerTous() {
        return eleveRepository.findByArchiveFalse();
    }

    public List<Eleve> listerArchives() {
        return eleveRepository.findByArchiveTrueOrderByDateArchivageDescIdDesc();
    }

    public Eleve trouverParId(Long id) {
        return eleveRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Élève", id));
    }

    public List<Eleve> rechercher(String terme) {
        return eleveRepository.rechercherActifs(terme);
    }

    public List<Eleve> listerParStatut(StatutEleve statut) {
        return eleveRepository.findByStatutAndArchiveFalse(statut);
    }

    public List<Eleve> listerParCategorie(CategoriePermis categorie) {
        return eleveRepository.findByCategoriePermisAndArchiveFalse(categorie);
    }

    public List<Eleve> listerParSite(Site site) {
        return eleveRepository.findBySiteAndArchiveFalse(site);
    }

    /** Guédiawaye est fermé : refusé pour une inscription ou un changement, toléré s'il est déjà en place. */
    private static void verifierBureau(Site demande, Site actuel) {
        if (demande == Site.GUEDIAWAYE && actuel != Site.GUEDIAWAYE) {
            throw new BusinessException("Le bureau de Guédiawaye n'existe plus : choisissez Massalikoul Djinane ou Keur Massar");
        }
    }

    public Eleve creer(EleveRequest request) {
        verifierBureau(request.getSite(), null);
        if (request.getNumeroCni() != null && !request.getNumeroCni().isBlank()) {
            eleveRepository.findByNumeroCni(request.getNumeroCni()).ifPresent(e -> {
                throw new BusinessException("Un élève avec ce numéro CNI existe déjà: " + request.getNumeroCni());
            });
        }
        Eleve eleve = Eleve.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .dateNaissance(request.getDateNaissance())
                .telephone(request.getTelephone())
                .adresse(request.getAdresse())
                .site(request.getSite())
                .email(request.getEmail())
                .numeroCni(request.getNumeroCni())
                .categoriePermis(request.getCategoriePermis())
                .dateInscription(LocalDate.now())
                .statut(request.getStatut() != null ? request.getStatut() : StatutEleve.EN_COURS)
                .docCertResidence(request.isDocCertResidence())
                .docCniLegalisee(request.isDocCniLegalisee())
                .docGroupeSanguin(request.isDocGroupeSanguin())
                .docVisiteMedicale(request.isDocVisiteMedicale())
                .docPhotos(request.isDocPhotos())
                .docTimbre(request.isDocTimbre())
                .docEnrolement(request.isDocEnrolement())
                .docDelivrance(request.isDocDelivrance())
                .build();
        eleve.setMoniteur(resolveMoniteur(request.getMoniteurId()));
        Eleve saved = eleveRepository.save(eleve);
        creerCompteParDefaut(saved);
        if (request.getMontantAvance() != null && request.getMontantAvance().compareTo(BigDecimal.ZERO) > 0) {
            paiementRepository.save(Paiement.builder()
                    .date(LocalDate.now())
                    .montant(request.getMontantAvance())
                    .eleve(saved)
                    .typePaiement(TypePaiement.TARIF_INSCRIPTION)
                    .statut(StatutPaiement.PAYE)
                    .description("Versement à l'inscription")
                    .build());
        }
        return saved;
    }

    /**
     * Identifiants à communiquer dans le message de bienvenue : crée le compte de l'élève
     * s'il n'existe pas, sinon remplace son mot de passe. Renvoie le mot de passe en clair
     * (seul moment où il est connu — il n'est stocké que haché).
     */
    public Map<String, Object> genererIdentifiants(Long id) {
        Eleve eleve = trouverParId(id);
        if (eleve.isArchive()) {
            throw new BusinessException("Élève archivé : réactivez-le avant de lui envoyer ses identifiants");
        }
        if (eleve.getEmail() == null || eleve.getEmail().isBlank()) {
            throw new BusinessException("Renseignez l'email de l'élève : il sert d'identifiant de connexion");
        }
        String motDePasse = motDePasseAleatoire();
        Optional<User> existant = userRepository.findByEmailIgnoreCase(eleve.getEmail());
        User user = existant.orElseGet(() -> User.builder()
                .nom(eleve.getPrenom() + " " + eleve.getNom())
                .email(eleve.getEmail())
                .role(RoleUser.ELEVE)
                .build());
        if (user.getRole() != RoleUser.ELEVE) {
            throw new BusinessException("Cet email appartient à un compte " + user.getRole() + ", pas à un élève");
        }
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        userRepository.save(user);
        return Map.of("identifiant", user.getEmail(), "motDePasse", motDePasse, "compteCree", existant.isEmpty());
    }

    /* 8 caractères sans ambiguïté de lecture (pas de 0/O, 1/l/I) : il sera recopié depuis WhatsApp. */
    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static String motDePasseAleatoire() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return sb.toString();
    }

    private void creerCompteParDefaut(Eleve eleve) {
        if (eleve.getEmail() == null || eleve.getEmail().isBlank()) return;
        if (userRepository.existsByEmail(eleve.getEmail())) return;
        // Mot de passe aléatoire que personne ne connaît : l'élève reçoit ses vrais
        // identifiants via le message de bienvenue (genererIdentifiants).
        String motDePasse = motDePasseAleatoire();
        userRepository.save(User.builder()
                .nom(eleve.getPrenom() + " " + eleve.getNom())
                .email(eleve.getEmail())
                .motDePasse(passwordEncoder.encode(motDePasse))
                .role(RoleUser.ELEVE)
                .build());
    }

    public Eleve modifier(Long id, EleveRequest request) {
        Eleve eleve = trouverParId(id);
        verifierBureau(request.getSite(), eleve.getSite());
        if (request.getNumeroCni() != null && !request.getNumeroCni().equals(eleve.getNumeroCni())) {
            eleveRepository.findByNumeroCni(request.getNumeroCni()).ifPresent(e -> {
                throw new BusinessException("Ce numéro CNI est déjà utilisé");
            });
        }
        eleve.setNom(request.getNom());
        eleve.setPrenom(request.getPrenom());
        eleve.setDateNaissance(request.getDateNaissance());
        eleve.setTelephone(request.getTelephone());
        eleve.setAdresse(request.getAdresse());
        eleve.setSite(request.getSite());
        eleve.setEmail(request.getEmail());
        eleve.setNumeroCni(request.getNumeroCni());
        eleve.setCategoriePermis(request.getCategoriePermis());
        if (request.getStatut() != null) {
            eleve.setStatut(request.getStatut());
        }
        eleve.setDocCertResidence(request.isDocCertResidence());
        eleve.setDocCniLegalisee(request.isDocCniLegalisee());
        eleve.setDocGroupeSanguin(request.isDocGroupeSanguin());
        eleve.setDocVisiteMedicale(request.isDocVisiteMedicale());
        eleve.setDocPhotos(request.isDocPhotos());
        eleve.setDocTimbre(request.isDocTimbre());
        eleve.setDocEnrolement(request.isDocEnrolement());
        eleve.setDocDelivrance(request.isDocDelivrance());
        eleve.setMoniteur(resolveMoniteur(request.getMoniteurId()));
        return eleveRepository.save(eleve);
    }

    private Moniteur resolveMoniteur(Long moniteurId) {
        if (moniteurId == null) return null;
        return moniteurRepository.findById(moniteurId)
                .orElseThrow(() -> new BusinessException("Moniteur introuvable : " + moniteurId));
    }

    /** Archive : l'élève disparaît des listes et ne peut plus se connecter ; rien n'est supprimé. */
    public Eleve archiver(Long id) {
        Eleve eleve = trouverParId(id);
        eleve.setArchive(true);
        eleve.setDateArchivage(LocalDate.now());
        activerCompte(eleve, false);
        return eleveRepository.save(eleve);
    }

    /** L'élève revient : il retrouve son statut, son historique et son compte (même mot de passe). */
    public Eleve reactiver(Long id) {
        Eleve eleve = trouverParId(id);
        eleve.setArchive(false);
        eleve.setDateArchivage(null);
        activerCompte(eleve, true);
        return eleveRepository.save(eleve);
    }

    private void activerCompte(Eleve eleve, boolean actif) {
        if (eleve.getEmail() == null || eleve.getEmail().isBlank()) return;
        userRepository.findByEmailIgnoreCase(eleve.getEmail())
                .filter(u -> u.getRole() == RoleUser.ELEVE)
                .ifPresent(u -> { u.setActif(actif); userRepository.save(u); });
    }

    /**
     * Suppression définitive : réservée aux fiches sans historique (créées par erreur).
     * Un élève qui a payé, pris des leçons ou passé un examen s'archive : supprimer ses
     * paiements fausserait la caisse.
     */
    public void supprimer(Long id) {
        Eleve eleve = trouverParId(id);
        if (!paiementRepository.findByEleveId(id).isEmpty()) {
            throw new BusinessException("Cet élève a des paiements : archivez-le plutôt que de le supprimer");
        }
        // Supprime aussi le compte de connexion, sinon l'élève supprimé peut encore se connecter.
        // Garde-fou sur le rôle : un email d'élève ne doit jamais emporter un compte admin/moniteur.
        if (eleve.getEmail() != null && !eleve.getEmail().isBlank()) {
            userRepository.findByEmailIgnoreCase(eleve.getEmail())
                    .filter(u -> u.getRole() == RoleUser.ELEVE)
                    .ifPresent(userRepository::delete);
        }
        documentService.supprimerTous(id);
        eleveRepository.delete(eleve);
        try {
            // Flush ici pour transformer une contrainte violée (leçons, examens, séances…) en message clair.
            eleveRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("Cet élève a un historique (leçons, examens, séances…) : archivez-le plutôt que de le supprimer");
        }
    }

    public Eleve changerStatut(Long id, StatutEleve statut) {
        Eleve eleve = trouverParId(id);
        eleve.setStatut(statut);
        return eleveRepository.save(eleve);
    }
}
