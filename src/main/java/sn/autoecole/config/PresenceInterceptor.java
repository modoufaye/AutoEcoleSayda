package sn.autoecole.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import sn.autoecole.entity.User;
import sn.autoecole.service.PresenceService;

/** Chaque requête d'un compte connecté le marque « en ligne » (PresenceService). */
@Component
@RequiredArgsConstructor
public class PresenceInterceptor implements HandlerInterceptor {

    private final PresenceService presence;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u && !req.getRequestURI().startsWith("/api/presence/depart"))
            presence.noter(u);
        return true;
    }
}
