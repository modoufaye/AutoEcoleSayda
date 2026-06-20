package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sn.autoecole.dto.BlocRequest;
import sn.autoecole.dto.SeanceRequest;
import sn.autoecole.dto.SeanceResponse;
import sn.autoecole.entity.BlocContenu;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Moniteur;
import sn.autoecole.entity.Seance;
import sn.autoecole.entity.User;
import sn.autoecole.enums.StatutSeance;
import sn.autoecole.enums.ThemeSeance;
import sn.autoecole.enums.TypeBloc;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.MoniteurRepository;
import sn.autoecole.repository.SeanceRepository;
import sn.autoecole.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SeanceService {

    private final SeanceRepository seanceRepo;
    private final UserRepository userRepo;
    private final EleveRepository eleveRepo;
    private final MoniteurRepository moniteurRepo;

    @Transactional(readOnly = true)
    public List<SeanceResponse> findAll() {
        return seanceRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeanceResponse> findByMoniteur(String email) {
        User moniteur = userRepo.findByEmail(email).orElseThrow();
        return seanceRepo.findByMoniteurOrderByCreatedAtDesc(moniteur).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeanceResponse> findPublishedForEleve(String email) {
        // Lien entre compte auth (User.email) et profil école (Eleve.email)
        Eleve eleve = eleveRepo.findByEmailIgnoreCase(email).orElse(null);
        if (eleve == null) return List.of();
        return seanceRepo.findByStatutAndElevesContainingOrderByDateHeureDesc(StatutSeance.PUBLIE, eleve).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeanceResponse findByIdForEleve(Long id, String email) {
        Eleve eleve = eleveRepo.findByEmailIgnoreCase(email).orElse(null);
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (s.getStatut() != StatutSeance.PUBLIE || eleve == null || !s.getEleves().contains(eleve)) {
            throw new BusinessException("Séance non accessible");
        }
        return toResponse(s);
    }

    /** Retourne les élèves assignés à ce moniteur (via le profil Moniteur matchant l'email du compte User) */
    @Transactional(readOnly = true)
    public List<Eleve> findElevesByMoniteur(String moniteurEmail) {
        Moniteur moniteur = moniteurRepo.findByEmailIgnoreCase(moniteurEmail).orElse(null);
        if (moniteur == null) return List.of();
        return eleveRepo.findByMoniteur(moniteur);
    }

    @Transactional(readOnly = true)
    public List<Eleve> findAllEleves() {
        return eleveRepo.findAll();
    }

    public SeanceResponse create(SeanceRequest req, String moniteurEmail) {
        User moniteur = userRepo.findByEmail(moniteurEmail).orElseThrow();
        Seance s = new Seance();
        s.setMoniteur(moniteur);
        s.setTitre(req.titre());
        applyFields(s, req);
        return toResponse(seanceRepo.save(s));
    }

    public SeanceResponse update(Long id, SeanceRequest req, String moniteurEmail) {
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (!s.getMoniteur().getEmail().equals(moniteurEmail)) {
            throw new BusinessException("Non autorisé");
        }
        s.setTitre(req.titre());
        applyFields(s, req);
        return toResponse(seanceRepo.save(s));
    }

    public void delete(Long id, String moniteurEmail) {
        Seance s = seanceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        if (!s.getMoniteur().getEmail().equals(moniteurEmail)) {
            throw new BusinessException("Non autorisé");
        }
        seanceRepo.delete(s);
    }

    private void applyFields(Seance s, SeanceRequest req) {
        if (req.dateHeure() != null && !req.dateHeure().isBlank()) {
            String dh = req.dateHeure().length() == 16 ? req.dateHeure() + ":00" : req.dateHeure();
            s.setDateHeure(LocalDateTime.parse(dh));
        }
        if (req.theme() != null && !req.theme().isBlank()) {
            s.setTheme(ThemeSeance.valueOf(req.theme()));
        }
        s.setStatut(req.statut() != null && !req.statut().isBlank()
                ? StatutSeance.valueOf(req.statut()) : StatutSeance.BROUILLON);

        if (req.eleveIds() != null) {
            s.getEleves().clear();
            s.getEleves().addAll(eleveRepo.findAllById(req.eleveIds()));
        }

        s.getBlocs().clear();
        if (req.blocs() != null) {
            int order = 0;
            for (BlocRequest b : req.blocs()) {
                BlocContenu bloc = new BlocContenu();
                bloc.setSeance(s);
                bloc.setTypeBloc(TypeBloc.valueOf(b.typeBloc()));
                bloc.setContenu(b.contenu());
                bloc.setMediaUrl(b.mediaUrl());
                bloc.setOrdre(b.ordre() != null ? b.ordre() : order);
                s.getBlocs().add(bloc);
                order++;
            }
        }
    }

    private SeanceResponse toResponse(Seance s) {
        List<SeanceResponse.EleveInfo> elevesInfo = s.getEleves().stream()
                .map(e -> new SeanceResponse.EleveInfo(e.getId(), e.getNom() + " " + e.getPrenom(), e.getEmail()))
                .toList();
        List<SeanceResponse.BlocInfo> blocsInfo = s.getBlocs().stream()
                .map(b -> new SeanceResponse.BlocInfo(b.getId(), b.getTypeBloc().name(),
                        b.getContenu(), b.getMediaUrl(), b.getOrdre()))
                .toList();
        return new SeanceResponse(
                s.getId(), s.getTitre(), s.getDateHeure(),
                s.getTheme() != null ? s.getTheme().name() : null,
                s.getStatut().name(),
                s.getMoniteur().getId(), s.getMoniteur().getNom(),
                elevesInfo, blocsInfo, s.getCreatedAt()
        );
    }
}
