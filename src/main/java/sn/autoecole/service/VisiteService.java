package sn.autoecole.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sn.autoecole.entity.Visite;
import sn.autoecole.repository.VisiteRepository;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registre des visites des pages publiques et des essais d'inscription en ligne (Journal → Visites,
 * super admin). Une même adresse sur une même page n'est notée qu'une fois par demi-heure ; les
 * entrées de plus de 90 jours sont effacées. Un échec d'écriture ne gêne jamais le visiteur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VisiteService {

    /** Pages publiques suivies ; toute autre valeur envoyée par le navigateur est ignorée. */
    public static final Set<String> PAGES = Set.of("/", "/login", "/inscription");
    private static final long DEMI_HEURE = 30 * 60_000L;
    private static final int CONSERVATION_JOURS = 90;

    private final VisiteRepository repo;
    /** Dernière visite notée par « adresse|page », pour ne pas compter chaque rechargement. */
    private final Map<String, Long> dernieres = new ConcurrentHashMap<>();
    private volatile long dernierMenage = 0;

    public void visite(HttpServletRequest http, String page, String provenance) {
        if (!PAGES.contains(page)) return;
        String ip = http.getRemoteAddr();
        long maintenant = System.currentTimeMillis();
        Long avant = dernieres.put(ip + "|" + page, maintenant);
        if (avant != null && maintenant - avant < DEMI_HEURE) return;
        enregistrer(Visite.builder().type(Visite.Type.VISITE).page(page).provenance(hote(provenance)), http);
    }

    /** Essai d'inscription, réussi ou non : nom et téléphone saisis, et le résultat. */
    public void inscription(HttpServletRequest http, String prenom, String nom, String telephone, String resultat) {
        String qui = ((prenom == null ? "" : prenom.trim()) + " " + (nom == null ? "" : nom.trim())).trim();
        enregistrer(Visite.builder().type(Visite.Type.INSCRIPTION).page("/inscription")
                .nom(coupe(qui.isEmpty() ? null : qui, 120)).telephone(coupe(telephone, 30)).resultat(coupe(resultat, 200)), http);
    }

    private void enregistrer(Visite.VisiteBuilder v, HttpServletRequest http) {
        try {
            repo.save(v.date(LocalDateTime.now()).ip(coupe(http.getRemoteAddr(), 45))
                    .navigateur(coupe(http.getHeader("User-Agent"), 300)).build());
            menage();
        } catch (RuntimeException e) {
            log.warn("Visite non enregistrée : {}", e.getMessage());
        }
    }

    /** Une fois par jour : visites de plus de 90 jours effacées, mémoire des doublons vidée. */
    private void menage() {
        long maintenant = System.currentTimeMillis();
        if (maintenant - dernierMenage < 24 * 3_600_000L) return;
        dernierMenage = maintenant;
        dernieres.entrySet().removeIf(e -> maintenant - e.getValue() > DEMI_HEURE);
        int n = repo.supprimerAvant(LocalDateTime.now().minusDays(CONSERVATION_JOURS));
        if (n > 0) log.info("Visites : {} entrée(s) de plus de {} jours effacée(s)", n, CONSERVATION_JOURS);
    }

    /** « https://l.facebook.com/l.php?u=… » → « l.facebook.com » : seul le site d'origine est gardé. */
    static String hote(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            String h = URI.create(url.trim()).getHost();
            return h == null ? null : coupe(h.toLowerCase(), 200);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String coupe(String s, int max) {
        return s == null ? null : s.length() > max ? s.substring(0, max) : s;
    }
}
