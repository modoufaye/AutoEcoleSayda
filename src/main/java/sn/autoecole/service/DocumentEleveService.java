package sn.autoecole.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.entity.DocumentEleve;
import sn.autoecole.entity.Eleve;
import sn.autoecole.enums.TypeDocument;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.DocumentEleveRepository;
import sn.autoecole.repository.EleveRepository;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentEleveService {

    private static final long TAILLE_MAX = 10 * 1024 * 1024;

    private final DocumentEleveRepository documentRepository;
    private final EleveRepository         eleveRepository;

    /*
     * Sous data/ et non uploads/ : uploads/ est servi publiquement (/uploads/**), or ces pièces
     * (CNI, visite médicale…) sont personnelles. data/ est aussi le volume persisté en production.
     */
    @Value("${documents.dir:data/documents-eleves}")
    private String documentsDir;

    @PostConstruct
    void init() throws IOException {
        Files.createDirectories(Paths.get(documentsDir));
    }

    @Transactional(readOnly = true)
    public List<DocumentEleve> lister(Long eleveId) {
        return documentRepository.findByEleveIdOrderByDateAjoutDesc(eleveId);
    }

    public DocumentEleve ajouter(Long eleveId, MultipartFile file, TypeDocument type) {
        Eleve eleve = eleveRepository.findById(eleveId)
                .orElseThrow(() -> new ResourceNotFoundException("Élève", eleveId));
        if (file == null || file.isEmpty()) throw new BusinessException("Fichier vide");
        if (file.getSize() > TAILLE_MAX) throw new BusinessException("Fichier trop lourd (10 Mo maximum)");

        // Type déduit du contenu, pas de l'en-tête envoyé par le navigateur (falsifiable).
        String contentType = detecterType(file);
        if (contentType == null) throw new BusinessException("Seules les images (JPG, PNG, WEBP, HEIC) et les PDF sont acceptés");

        String nomStockage = UUID.randomUUID() + extension(contentType);
        String nom = file.getOriginalFilename();
        if (nom == null || nom.isBlank()) nom = "document" + extension(contentType);
        nom = Paths.get(nom).getFileName().toString();
        if (nom.length() > 200) nom = nom.substring(nom.length() - 200);

        // Un seul dossier Service des Mines par élève : le nouveau remplace l'ancien.
        List<DocumentEleve> remplaces = type == TypeDocument.DOSSIER
                ? documentRepository.findByEleveIdAndType(eleveId, TypeDocument.DOSSIER)
                : List.of();
        documentRepository.deleteAll(remplaces);
        remplaces.forEach(this::supprimerFichier);

        // Ligne en base d'abord (l'INSERT est immédiat avec IDENTITY) : si elle est refusée,
        // aucun fichier n'a été écrit et rien ne reste orphelin sur le disque.
        DocumentEleve doc = documentRepository.save(DocumentEleve.builder()
                .eleve(eleve)
                .type(type != null ? type : TypeDocument.AUTRE)
                .nomFichier(nom)
                .nomStockage(nomStockage)
                .contentType(contentType)
                .taille(file.getSize())
                .dateAjout(LocalDateTime.now())
                .build());
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, Paths.get(documentsDir, nomStockage));
        } catch (IOException e) {
            throw new UncheckedIOException(e);   // rollback : la ligne disparaît aussi
        }
        return doc;
    }

    @Transactional(readOnly = true)
    public DocumentEleve trouver(Long eleveId, Long documentId) {
        return documentRepository.findByIdAndEleveId(documentId, eleveId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", documentId));
    }

    public Resource fichier(DocumentEleve doc) {
        Path path = Paths.get(documentsDir, doc.getNomStockage());
        if (!Files.exists(path)) throw new ResourceNotFoundException("Fichier du document", doc.getId());
        return new PathResource(path);
    }

    public void supprimer(Long eleveId, Long documentId) {
        DocumentEleve doc = trouver(eleveId, documentId);
        documentRepository.delete(doc);
        supprimerFichier(doc);
    }

    /** Appelé avant la suppression d'un élève : la clé étrangère l'exige, et les fichiers ne doivent pas rester sur disque. */
    public void supprimerTous(Long eleveId) {
        List<DocumentEleve> docs = documentRepository.findByEleveIdOrderByDateAjoutDesc(eleveId);
        documentRepository.deleteAll(docs);
        docs.forEach(this::supprimerFichier);
    }

    /* Après le commit seulement : si la suppression en base échoue (rollback), le fichier doit rester. */
    private void supprimerFichier(DocumentEleve doc) {
        Path path = Paths.get(documentsDir, doc.getNomStockage());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // Fichier orphelin sur disque : sans conséquence pour l'utilisateur.
                }
            }
        });
    }

    private static String detecterType(MultipartFile file) {
        byte[] h;
        try (InputStream in = file.getInputStream()) {
            h = in.readNBytes(12);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (debutePar(h, 0, 0x25, 0x50, 0x44, 0x46))             return "application/pdf"; // %PDF
        if (debutePar(h, 0, 0xFF, 0xD8, 0xFF))                   return "image/jpeg";
        if (debutePar(h, 0, 0x89, 0x50, 0x4E, 0x47))             return "image/png";
        if (debutePar(h, 0, 'R', 'I', 'F', 'F') && debutePar(h, 8, 'W', 'E', 'B', 'P')) return "image/webp";
        if (debutePar(h, 4, 'f', 't', 'y', 'p') && h.length >= 12) {
            String marque = new String(Arrays.copyOfRange(h, 8, 12));
            if (List.of("heic", "heix", "mif1", "msf1", "hevc").contains(marque)) return "image/heic";
        }
        return null;
    }

    private static boolean debutePar(byte[] h, int offset, int... octets) {
        if (h.length < offset + octets.length) return false;
        for (int i = 0; i < octets.length; i++) {
            if ((h[offset + i] & 0xFF) != octets[i]) return false;
        }
        return true;
    }

    private static String extension(String contentType) {
        return switch (contentType) {
            case "application/pdf" -> ".pdf";
            case "image/jpeg"      -> ".jpg";
            case "image/png"       -> ".png";
            case "image/webp"      -> ".webp";
            case "image/heic"      -> ".heic";
            default                -> "";
        };
    }
}
