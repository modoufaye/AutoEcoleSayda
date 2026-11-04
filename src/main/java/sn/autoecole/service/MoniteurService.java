package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import sn.autoecole.dto.MoniteurRequest;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.User;
import sn.autoecole.enums.RoleUser;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.UserRepository;
import sn.autoecole.util.Telephones;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class MoniteurService {

    private final MoniteurRepository moniteurRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Moniteur> listerTous() {
        return moniteurRepository.findAll();
    }

    public List<Moniteur> listerActifs() {
        return moniteurRepository.findByActifTrue();
    }

    public Moniteur trouverParId(Long id) {
        return moniteurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moniteur", id));
    }

    public List<Moniteur> rechercher(String terme) {
        return moniteurRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(terme, terme);
    }

    public Moniteur creer(MoniteurRequest request) {
        Moniteur moniteur = Moniteur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .telephone(verifierTelephone(request.getTelephone(), null))
                .numeroCni(request.getNumeroCni())
                .numeroPermis(request.getNumeroPermis())
                .dateEmbauche(request.getDateEmbauche())
                .photoUrl(request.getPhotoUrl())
                .categoriesAutorisees(request.getCategoriesAutorisees() != null
                        ? request.getCategoriesAutorisees() : new HashSet<>())
                .actif(request.getActif() != null ? request.getActif() : true)
                .accesCoursCode(Boolean.TRUE.equals(request.getAccesCoursCode()))
                .build();
        return moniteurRepository.save(moniteur);
    }

    public Moniteur modifier(Long id, MoniteurRequest request) {
        Moniteur moniteur = trouverParId(id);
        String telephone = verifierTelephone(request.getTelephone(), id);
        renommerCompte(moniteur.getTelephone(), telephone);
        moniteur.setNom(request.getNom());
        moniteur.setPrenom(request.getPrenom());
        moniteur.setTelephone(telephone);
        moniteur.setNumeroCni(request.getNumeroCni());
        moniteur.setNumeroPermis(request.getNumeroPermis());
        moniteur.setPhotoUrl(request.getPhotoUrl());
        if (request.getDateEmbauche() != null) {
            moniteur.setDateEmbauche(request.getDateEmbauche());
        }
        if (request.getCategoriesAutorisees() != null) {
            moniteur.setCategoriesAutorisees(request.getCategoriesAutorisees());
        }
        if (request.getActif() != null) {
            moniteur.setActif(request.getActif());
            activerCompte(moniteur);
        }
        if (request.getAccesCoursCode() != null) {
            moniteur.setAccesCoursCode(request.getAccesCoursCode());
        }
        return moniteurRepository.save(moniteur);
    }

    public void supprimer(Long id) {
        Moniteur moniteur = trouverParId(id);
        // Son compte part avec lui : sinon il pourrait encore se connecter.
        compte(moniteur.getTelephone()).ifPresent(userRepository::delete);
        moniteurRepository.delete(moniteur);
    }

    public Moniteur toggleActif(Long id) {
        Moniteur moniteur = trouverParId(id);
        moniteur.setActif(!moniteur.isActif());
        activerCompte(moniteur);
        return moniteurRepository.save(moniteur);
    }

    /**
     * Message de bienvenue : crée le compte du moniteur s'il n'existe pas, sinon remplace son
     * mot de passe. Renvoie le mot de passe en clair (seul moment où il est connu).
     */
    public Map<String, Object> genererIdentifiants(Long id) {
        Moniteur moniteur = trouverParId(id);
        if (!moniteur.isActif()) {
            throw new BusinessException("Moniteur inactif : réactivez-le avant de lui envoyer ses identifiants");
        }
        String tel = moniteur.getTelephone();
        if (tel == null) {
            throw new BusinessException("Renseignez le téléphone du moniteur : il sert d'identifiant de connexion");
        }
        Optional<User> existant = userRepository.findByEmailIgnoreCase(tel);
        User user = existant.orElseGet(() -> User.builder()
                .nom(moniteur.getPrenom() + " " + moniteur.getNom())
                .email(tel)
                .role(RoleUser.MONITEUR)
                .build());
        if (user.getRole() != RoleUser.MONITEUR) {
            throw new BusinessException("Ce numéro est déjà l'identifiant d'un compte " + user.getRole());
        }
        String motDePasse = motDePasseAleatoire();
        user.setMotDePasse(passwordEncoder.encode(motDePasse));
        user.setActif(true);
        user.debloquer();   // nouveaux identifiants : le compte bloqué repart à zéro
        userRepository.save(user);
        return Map.of("identifiant", tel, "motDePasse", motDePasse, "compteCree", existant.isEmpty());
    }

    /** Un numéro identifie un seul moniteur : c'est son identifiant de connexion. */
    private String verifierTelephone(String telephone, Long idActuel) {
        String tel = Telephones.normaliser(telephone);
        if (tel == null) throw new BusinessException("Le téléphone est obligatoire");
        (idActuel == null ? moniteurRepository.findFirstByTelephone(tel) : moniteurRepository.findFirstByTelephoneAndIdNot(tel, idActuel))
                .ifPresent(m -> { throw new BusinessException("Ce numéro de téléphone est déjà celui du moniteur "
                        + m.getPrenom() + " " + m.getNom()); });
        return tel;
    }

    private Optional<User> compte(String telephone) {
        if (telephone == null) return Optional.empty();
        return userRepository.findByEmailIgnoreCase(telephone).filter(u -> u.getRole() == RoleUser.MONITEUR);
    }

    /** Un moniteur désactivé ne peut plus se connecter. */
    private void activerCompte(Moniteur moniteur) {
        compte(moniteur.getTelephone()).ifPresent(u -> { u.setActif(moniteur.isActif()); userRepository.save(u); });
    }

    /** Le téléphone du moniteur change : son compte suit (même mot de passe). */
    private void renommerCompte(String ancien, String nouveau) {
        if (ancien == null || ancien.equals(nouveau)) return;
        compte(ancien).ifPresent(u -> {
            if (userRepository.existsByEmailIgnoreCase(nouveau)) {
                throw new BusinessException("Un compte utilise déjà le numéro " + nouveau);
            }
            u.setEmail(nouveau);
            userRepository.save(u);
        });
    }

    /* 8 caractères sans ambiguïté de lecture (pas de 0/O, 1/l/I) : il sera recopié depuis WhatsApp. */
    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static String motDePasseAleatoire() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
