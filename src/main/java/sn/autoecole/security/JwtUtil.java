package sn.autoecole.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
@Slf4j
public class JwtUtil {

    /** Variable d'environnement JWT_SECRET en production (voir application.properties). */
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey signingKey;

    @PostConstruct
    void initialiserCle() {
        if (secret == null || secret.isBlank()) {
            // Sans secret configuré, une clé aléatoire reste sûre (personne ne peut forger de
            // jeton) mais change à chaque démarrage : tout le monde doit se reconnecter.
            byte[] cle = new byte[64];
            new SecureRandom().nextBytes(cle);
            signingKey = Keys.hmacShaKeyFor(cle);
            log.warn("JWT_SECRET non défini : clé aléatoire, les connexions seront perdues à chaque redémarrage.");
            return;
        }
        byte[] cle = secret.getBytes(StandardCharsets.UTF_8);
        if (cle.length < 32) {
            throw new IllegalStateException("JWT_SECRET trop court : 32 caractères minimum (64 conseillés).");
        }
        signingKey = Keys.hmacShaKeyFor(cle);
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claimsResolver.apply(claims);
    }
}
