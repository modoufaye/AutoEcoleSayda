package sn.autoecole.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import sn.autoecole.entity.User;
import sn.autoecole.service.JournalService;

import java.util.Set;

/**
 * Trace dans le journal chaque modification réussie (POST, PUT, PATCH, DELETE sous /api) faite
 * par le super admin, un administrateur ou le secrétariat. Avant l'action, on note l'élément visé
 * par l'identifiant du chemin (il existe encore s'il va être supprimé) ; après, on préfère l'élément
 * renvoyé par le serveur (nom d'un élève créé, montant d'un paiement modifié).
 */
@Component
@RequiredArgsConstructor
public class JournalInterceptor implements HandlerInterceptor {

    static final String CIBLE = "journal.cible";
    static final String REPONSE = "journal.reponse";
    private static final Set<String> MODIFICATIONS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final JournalService journalService;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if (MODIFICATIONS.contains(req.getMethod()) && JournalService.estTrace(utilisateur()))
            req.setAttribute(CIBLE, journalService.cibleDuChemin(req.getRequestURI()));
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object handler, Exception ex) {
        User u = utilisateur();
        if (!MODIFICATIONS.contains(req.getMethod()) || !JournalService.estTrace(u)) return;
        if (ex != null || res.getStatus() >= 400) return;        // action refusée ou en erreur : rien n'a changé
        Object reponse = req.getAttribute(REPONSE);
        journalService.libelle(req.getMethod(), req.getRequestURI(), reponse).ifPresent(action -> {
            String cible = JournalService.decrire(reponse);
            if (cible == null) cible = (String) req.getAttribute(CIBLE);
            journalService.enregistrer(u, action, cible, req);
        });
    }

    private static User utilisateur() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null && a.getPrincipal() instanceof User u ? u : null;
    }

    /** Garde la réponse des contrôleurs pour que le journal nomme l'élément créé ou modifié. */
    @ControllerAdvice
    static class Reponse implements ResponseBodyAdvice<Object> {
        @Override
        public boolean supports(MethodParameter type, Class<? extends HttpMessageConverter<?>> converter) {
            return true;
        }

        @Override
        public Object beforeBodyWrite(Object body, MethodParameter type, MediaType media,
                                      Class<? extends HttpMessageConverter<?>> converter,
                                      ServerHttpRequest req, ServerHttpResponse res) {
            if (req instanceof ServletServerHttpRequest s && MODIFICATIONS.contains(s.getServletRequest().getMethod()))
                s.getServletRequest().setAttribute(REPONSE, body);
            return body;
        }
    }
}
