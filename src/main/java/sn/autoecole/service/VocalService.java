package sn.autoecole.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Audios privés (messages vocaux, audios des annonces) : rangés sous uploads/<dossier>, jamais servis
 * directement (SecurityConfig refuse ces dossiers), seulement par les contrôleurs après contrôle d'accès.
 */
@Service
public class VocalService {

    public static final String MESSAGES = "messages-vocaux";
    public static final String ANNONCES = "annonces-audio";

    /** Type annoncé par le navigateur → extension ; le type est relu depuis l'extension à l'écoute. */
    private static final Map<String, String> EXTENSIONS = Map.ofEntries(
            Map.entry("audio/webm", ".webm"), Map.entry("audio/ogg", ".ogg"), Map.entry("audio/opus", ".ogg"),
            Map.entry("audio/mp4", ".m4a"), Map.entry("audio/x-m4a", ".m4a"), Map.entry("audio/m4a", ".m4a"),
            Map.entry("audio/aac", ".aac"), Map.entry("audio/x-aac", ".aac"),
            Map.entry("audio/mpeg", ".mp3"), Map.entry("audio/mp3", ".mp3"),
            Map.entry("audio/wav", ".wav"), Map.entry("audio/x-wav", ".wav"), Map.entry("audio/wave", ".wav"));
    private static final Map<String, String> TYPES = Map.of(
            ".webm", "audio/webm", ".ogg", "audio/ogg", ".m4a", "audio/mp4", ".aac", "audio/aac", ".mp3", "audio/mpeg", ".wav", "audio/wav");

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    /** Enregistre le fichier ; renvoie son nom (à garder sur le message ou l'annonce). */
    public String enregistrer(MultipartFile file, String dossier, long maxOctets) throws IOException {
        if (file == null || file.isEmpty()) throw new BusinessException("Audio vide");
        if (file.getSize() > maxOctets) throw new BusinessException("Audio trop lourd (" + maxOctets / (1024 * 1024) + " Mo au plus)");
        String type = file.getContentType() == null ? "" : file.getContentType().split(";")[0].trim().toLowerCase();
        String ext = EXTENSIONS.get(type);
        if (ext == null) {
            // Téléphone qui n'annonce pas le type (application/octet-stream) : on se fie à l'extension
            String orig = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
            String e = orig.contains(".") ? orig.substring(orig.lastIndexOf('.')) : "";
            ext = TYPES.containsKey(e) ? e : null;
        }
        if (ext == null) throw new BusinessException("Format audio non reconnu : " + type);
        Path d = Paths.get(uploadDir, dossier);
        Files.createDirectories(d);
        String nom = UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), d.resolve(nom), StandardCopyOption.REPLACE_EXISTING);
        return nom;
    }

    public ResponseEntity<Resource> lire(String dossier, String nom) {
        Path f = Paths.get(uploadDir, dossier, nom);
        if (nom == null || nom.contains("/") || nom.contains("..") || !Files.exists(f)) throw new ResourceNotFoundException("Audio introuvable");
        String type = TYPES.getOrDefault(nom.substring(nom.lastIndexOf('.')), "application/octet-stream");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(type))
                .header("Cache-Control", "private, max-age=86400").body(new FileSystemResource(f));
    }

    public void supprimer(String dossier, String nom) {
        if (nom == null || nom.contains("/") || nom.contains("..")) return;
        try { Files.deleteIfExists(Paths.get(uploadDir, dossier, nom)); } catch (IOException ignored) { /* fichier orphelin, sans gravité */ }
    }
}
