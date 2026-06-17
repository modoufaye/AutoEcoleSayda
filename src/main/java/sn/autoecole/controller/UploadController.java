package sn.autoecole.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.exception.BusinessException;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class UploadController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadDir, "images"));
        Files.createDirectories(Paths.get(uploadDir, "videos"));
        Files.createDirectories(Paths.get(uploadDir, "audios"));
    }

    @PostMapping(value = "/api/moniteur/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        return saveFile(file, "images",
                List.of("image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"));
    }

    @PostMapping(value = "/api/admin/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAdminImage(@RequestParam("file") MultipartFile file) throws IOException {
        return saveFile(file, "images",
                List.of("image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"));
    }

    @PostMapping(value = "/api/moniteur/upload/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadVideo(@RequestParam("file") MultipartFile file) throws IOException {
        return saveFile(file, "videos",
                List.of("video/mp4", "video/webm", "video/ogg", "video/avi", "video/quicktime"));
    }

    @PostMapping(value = "/api/moniteur/upload/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAudio(@RequestParam("file") MultipartFile file) throws IOException {
        return saveFile(file, "audios",
                List.of("audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/webm", "audio/mp4"));
    }

    private Map<String, String> saveFile(MultipartFile file, String subDir, List<String> allowed) throws IOException {
        String ct = file.getContentType();
        if (ct == null || allowed.stream().noneMatch(ct::startsWith)) {
            throw new BusinessException("Type de fichier non autorisé : " + ct);
        }
        String orig = file.getOriginalFilename();
        String ext = (orig != null && orig.contains("."))
                ? orig.substring(orig.lastIndexOf('.'))
                : "";
        String filename = UUID.randomUUID() + ext;
        Path dest = Paths.get(uploadDir, subDir, filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        return Map.of("url", "/uploads/" + subDir + "/" + filename);
    }
}
