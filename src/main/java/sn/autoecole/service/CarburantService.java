package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import sn.autoecole.entity.*;
import sn.autoecole.enums.StatutLecon;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.exception.ResourceNotFoundException;
import sn.autoecole.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Carburant des moniteurs de conduite : l'administration (ou le secrétariat) leur remet des
 * dotations ; chacun déclare ses pleins avec le reçu, que l'administration valide ou refuse.
 * Reste à justifier = dotations − pleins validés. Par véhicule : consommation (L/100 km, d'un
 * plein à l'autre grâce au compteur) et coût du carburant par heure de leçon.
 */
@Service
@RequiredArgsConstructor
public class CarburantService {

    private static final String RECU = "/uploads/images/[\\w.-]+";

    private final DotationCarburantRepository dotationRepo;
    private final PleinCarburantRepository pleinRepo;
    private final MoniteurRepository moniteurRepo;
    private final VehiculeRepository vehiculeRepo;
    private final LeconRepository leconRepo;

    /* ── Qui demande ─────────────────────────────────────────── */

    private static boolean gestion(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_SECRETAIRE").contains(a.getAuthority()));
    }

    private static String nom(Authentication auth) {
        return auth.getPrincipal() instanceof User u ? u.getNom() : auth.getName();
    }

    /** Le moniteur connecté (null pour l'administration). */
    private Moniteur moniteurConnecte(Authentication auth) {
        if (gestion(auth)) return null;
        return moniteurRepo.findFirstByTelephone(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé"));
    }

    private static boolean conduite(Moniteur m) {
        return !"CODE".equals(m.getEnseignement());
    }

    /** Menu « Carburant » : personnel de gestion, et moniteurs qui font de la conduite. */
    public boolean acces(Authentication auth) {
        if (gestion(auth)) return true;
        return moniteurRepo.findFirstByTelephone(auth.getName()).map(CarburantService::conduite).orElse(false);
    }

    /* ── Vue d'ensemble ──────────────────────────────────────── */

    @Transactional(readOnly = true)
    public Map<String, Object> etat(Authentication auth) {
        Moniteur moi = moniteurConnecte(auth);
        List<DotationCarburant> dotations = moi == null ? dotationRepo.findAllByOrderByDateDescIdDesc()
                : dotationRepo.findByMoniteurIdOrderByDateDescIdDesc(moi.getId());
        List<PleinCarburant> pleins = moi == null ? pleinRepo.findAllByOrderByDateDescIdDesc()
                : pleinRepo.findByMoniteurIdOrderByDateDescIdDesc(moi.getId());

        // Consommation et alertes : calculées sur tous les pleins du véhicule (même ceux d'autres moniteurs)
        Map<Long, List<PleinCarburant>> parVehicule = new HashMap<>();
        for (PleinCarburant p : pleinRepo.findAllByOrderByDateDescIdDesc())
            if (p.getVehicule() != null && !PleinCarburant.REFUSE.equals(p.getStatut()))
                parVehicule.computeIfAbsent(p.getVehicule().getId(), k -> new ArrayList<>()).add(p);
        Map<Long, Map<String, Object>> analyse = new HashMap<>();
        List<Map<String, Object>> vehicules = new ArrayList<>();
        for (var entry : parVehicule.entrySet()) {
            Map<String, Object> v = analyserVehicule(entry.getValue(), analyse);
            if (moi == null || (moi.getVehicule() != null && moi.getVehicule().getId().equals(entry.getKey()))
                    || pleins.stream().anyMatch(p -> p.getVehicule() != null && p.getVehicule().getId().equals(entry.getKey())))
                vehicules.add(v);
        }
        vehicules.sort(Comparator.comparing(v -> (String) v.get("libelle")));

        // Soldes par moniteur de conduite
        List<Moniteur> moniteurs = moi == null ? moniteurRepo.findAll().stream()
                .filter(m -> conduite(m) || dotations.stream().anyMatch(d -> d.getMoniteur().getId().equals(m.getId())))
                .sorted(Comparator.comparing(m -> m.getPrenom() + " " + m.getNom())).toList() : List.of(moi);
        List<Map<String, Object>> soldes = new ArrayList<>();
        for (Moniteur m : moniteurs) {
            if (moi == null && !m.isActif() && dotations.stream().noneMatch(d -> d.getMoniteur().getId().equals(m.getId()))) continue;
            long donne = dotations.stream().filter(d -> d.getMoniteur().getId().equals(m.getId())).mapToLong(DotationCarburant::getMontant).sum();
            long valide = somme(pleins, m.getId(), PleinCarburant.VALIDE), attente = somme(pleins, m.getId(), PleinCarburant.EN_ATTENTE);
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("id", m.getId());
            s.put("nom", m.getPrenom() + " " + m.getNom());
            s.put("vehicule", m.getVehicule() == null ? null : libelle(m.getVehicule()));
            s.put("vehiculeId", m.getVehicule() == null ? null : m.getVehicule().getId());
            s.put("dotations", donne);
            s.put("valides", valide);
            s.put("enAttente", attente);
            s.put("reste", donne - valide);
            soldes.add(s);
        }

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("gestion", moi == null);
        r.put("moi", moi == null ? null : Map.of("id", moi.getId(), "vehiculeId", moi.getVehicule() == null ? "" : moi.getVehicule().getId()));
        r.put("moniteurs", soldes);
        r.put("vehicules", vehicules);
        r.put("dotations", dotations.stream().map(this::vueDotation).toList());
        r.put("pleins", pleins.stream().map(p -> vuePlein(p, analyse.get(p.getId()))).toList());
        r.put("aValider", pleins.stream().filter(p -> PleinCarburant.EN_ATTENTE.equals(p.getStatut())).count());
        return r;
    }

    private static long somme(List<PleinCarburant> pleins, Long moniteurId, String statut) {
        return pleins.stream().filter(p -> p.getMoniteur().getId().equals(moniteurId) && statut.equals(p.getStatut()))
                .mapToLong(PleinCarburant::getMontant).sum();
    }

    /** Consommation du véhicule et, pour chaque plein, celle depuis le plein précédent (+ alertes). */
    private Map<String, Object> analyserVehicule(List<PleinCarburant> pleins, Map<Long, Map<String, Object>> analyse) {
        Vehicule veh = pleins.get(0).getVehicule();
        List<PleinCarburant> chrono = new ArrayList<>(pleins);
        chrono.sort(Comparator.comparing(PleinCarburant::getDate).thenComparing(PleinCarburant::getId));
        List<PleinCarburant> avecKm = chrono.stream().filter(p -> p.getKilometrage() != null).toList();

        double litresIntervalles = 0; int km = 0;
        Map<Long, Double> consoPlein = new HashMap<>();
        for (int i = 1; i < avecKm.size(); i++) {
            PleinCarburant p = avecKm.get(i), prec = avecKm.get(i - 1);
            int d = p.getKilometrage() - prec.getKilometrage();
            Map<String, Object> a = analyse.computeIfAbsent(p.getId(), k -> new HashMap<>());
            if (d <= 0) { a.put("alerte", "Compteur inférieur ou égal au plein précédent (" + prec.getKilometrage() + " km)"); continue; }
            a.put("distance", d);
            if (p.getLitres() != null) {
                double c = p.getLitres().doubleValue() / d * 100;
                consoPlein.put(p.getId(), c);
                a.put("consommation", arrondi(c));
                litresIntervalles += p.getLitres().doubleValue();
                km += d;
            }
        }
        Double moyenne = km > 0 ? litresIntervalles / km * 100 : null;
        if (moyenne != null && consoPlein.size() >= 3)
            consoPlein.forEach((id, c) -> {
                if (c > moyenne * 1.3) analyse.get(id).putIfAbsent("alerte",
                        "Consommation élevée : " + fr(c) + " L/100 km pour " + fr(moyenne) + " en moyenne");
            });

        long montant = chrono.stream().filter(p -> PleinCarburant.VALIDE.equals(p.getStatut())).mapToLong(PleinCarburant::getMontant).sum();
        double litres = chrono.stream().filter(p -> PleinCarburant.VALIDE.equals(p.getStatut()) && p.getLitres() != null)
                .mapToDouble(p -> p.getLitres().doubleValue()).sum();
        // Heures de leçons faites avec ce véhicule depuis le premier plein
        LocalDate debut = chrono.get(0).getDate(), aujourdhui = LocalDate.now();
        double heures = leconRepo.findByVehiculeId(veh.getId()).stream()
                .filter(l -> l.getStatut() != StatutLecon.ANNULEE && l.getDate() != null && !l.getDate().isBefore(debut) && !l.getDate().isAfter(aujourdhui)
                        && l.getHeureDebut() != null && l.getHeureFin() != null)
                .mapToDouble(l -> Duration.between(l.getHeureDebut(), l.getHeureFin()).toMinutes() / 60.0).sum();

        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", veh.getId());
        v.put("libelle", libelle(veh));
        v.put("pleins", chrono.size());
        v.put("litres", arrondi(litres));
        v.put("montant", montant);
        v.put("km", km);
        v.put("consommation", moyenne == null ? null : arrondi(moyenne));
        v.put("heuresLecons", arrondi(heures));
        v.put("coutHeure", heures > 0 ? Math.round(montant / heures) : null);
        v.put("dernierKm", avecKm.isEmpty() ? null : avecKm.get(avecKm.size() - 1).getKilometrage());
        return v;
    }

    private static double arrondi(double x) { return Math.round(x * 10) / 10.0; }

    private static String fr(double x) { return String.format(Locale.FRANCE, "%.1f", x); }

    private static String libelle(Vehicule v) {
        return String.join(" ", Objects.toString(v.getMarque(), ""), Objects.toString(v.getModele(), "")).trim() + " · " + v.getImmatriculation();
    }

    private Map<String, Object> vueDotation(DotationCarburant d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("moniteurId", d.getMoniteur().getId());
        m.put("moniteur", d.getMoniteur().getPrenom() + " " + d.getMoniteur().getNom());
        m.put("date", d.getDate());
        m.put("montant", d.getMontant());
        m.put("note", d.getNote());
        m.put("donneePar", d.getDonneePar());
        return m;
    }

    private Map<String, Object> vuePlein(PleinCarburant p, Map<String, Object> a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("moniteurId", p.getMoniteur().getId());
        m.put("moniteur", p.getMoniteur().getPrenom() + " " + p.getMoniteur().getNom());
        m.put("vehiculeId", p.getVehicule() == null ? null : p.getVehicule().getId());
        m.put("vehicule", p.getVehicule() == null ? null : libelle(p.getVehicule()));
        m.put("date", p.getDate());
        m.put("litres", p.getLitres());
        m.put("montant", p.getMontant());
        m.put("kilometrage", p.getKilometrage());
        m.put("station", p.getStation());
        m.put("recuUrl", p.getRecuUrl());
        m.put("statut", p.getStatut());
        m.put("motifRefus", p.getMotifRefus());
        m.put("traitePar", p.getTraitePar());
        m.put("traiteLe", p.getTraiteLe());
        m.put("consommation", a == null ? null : a.get("consommation"));
        m.put("distance", a == null ? null : a.get("distance"));
        m.put("alerte", a == null ? null : a.get("alerte"));
        return m;
    }

    /* ── Dotations (administration, secrétariat) ──────────────── */

    @Transactional
    public void donner(Map<String, Object> corps, Authentication auth) {
        if (!gestion(auth)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Réservé à l'administration");
        Moniteur m = moniteurRepo.findById(nombre(corps.get("moniteurId"), "Choisissez le moniteur"))
                .orElseThrow(() -> new ResourceNotFoundException("Moniteur introuvable"));
        int montant = (int) nombre(corps.get("montant"), "Indiquez le montant");
        if (montant <= 0) throw new BusinessException("Le montant doit être positif");
        dotationRepo.save(DotationCarburant.builder().moniteur(m).date(date(corps.get("date"))).montant(montant)
                .note(texte(corps.get("note"), 300)).donneePar(nom(auth)).creeLe(LocalDateTime.now()).build());
    }

    @Transactional
    public void supprimerDotation(Long id, Authentication auth) {
        if (!gestion(auth)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Réservé à l'administration");
        dotationRepo.deleteById(id);
    }

    /* ── Pleins ──────────────────────────────────────────────── */

    @Transactional
    public void declarer(Map<String, Object> corps, Authentication auth) {
        Moniteur moi = moniteurConnecte(auth);
        PleinCarburant p = new PleinCarburant();
        if (moi == null) {
            p.setMoniteur(moniteurRepo.findById(nombre(corps.get("moniteurId"), "Choisissez le moniteur"))
                    .orElseThrow(() -> new ResourceNotFoundException("Moniteur introuvable")));
            // Saisi par l'administration : validé d'office
            p.setStatut(PleinCarburant.VALIDE);
            p.setTraitePar(nom(auth));
            p.setTraiteLe(LocalDateTime.now());
        } else {
            if (!conduite(moi)) throw new BusinessException("Le carburant concerne les moniteurs de conduite");
            p.setMoniteur(moi);
            p.setStatut(PleinCarburant.EN_ATTENTE);
        }
        remplir(p, corps);
        p.setCreeLe(LocalDateTime.now());
        pleinRepo.save(p);
        if (PleinCarburant.VALIDE.equals(p.getStatut())) majCompteur(p);
    }

    @Transactional
    public void modifier(Long id, Map<String, Object> corps, Authentication auth) {
        PleinCarburant p = plein(id);
        Moniteur moi = moniteurConnecte(auth);
        if (moi != null && (!p.getMoniteur().getId().equals(moi.getId()) || PleinCarburant.VALIDE.equals(p.getStatut())))
            throw new BusinessException("Un plein validé ne peut plus être modifié");
        remplir(p, corps);
        if (moi != null) {
            // Corrigé par le moniteur (ex. après un refus) : repart en validation
            p.setStatut(PleinCarburant.EN_ATTENTE);
            p.setMotifRefus(null);
            p.setTraitePar(null);
            p.setTraiteLe(null);
        }
        if (PleinCarburant.VALIDE.equals(p.getStatut())) majCompteur(p);
    }

    @Transactional
    public void supprimer(Long id, Authentication auth) {
        PleinCarburant p = plein(id);
        Moniteur moi = moniteurConnecte(auth);
        if (moi != null && (!p.getMoniteur().getId().equals(moi.getId()) || PleinCarburant.VALIDE.equals(p.getStatut())))
            throw new BusinessException("Un plein validé ne peut plus être supprimé");
        pleinRepo.delete(p);
    }

    @Transactional
    public void traiter(Long id, boolean valider, String motif, Authentication auth) {
        if (!gestion(auth)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Réservé à l'administration");
        PleinCarburant p = plein(id);
        if (!valider && (motif == null || motif.isBlank())) throw new BusinessException("Indiquez le motif du refus");
        p.setStatut(valider ? PleinCarburant.VALIDE : PleinCarburant.REFUSE);
        p.setMotifRefus(valider ? null : texte(motif, 300));
        p.setTraitePar(nom(auth));
        p.setTraiteLe(LocalDateTime.now());
        if (valider) majCompteur(p);
    }

    private PleinCarburant plein(Long id) {
        return pleinRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Plein introuvable"));
    }

    private void remplir(PleinCarburant p, Map<String, Object> c) {
        p.setDate(date(c.get("date")));
        if (p.getDate().isAfter(LocalDate.now())) throw new BusinessException("La date du plein ne peut pas être dans le futur");
        int montant = (int) nombre(c.get("montant"), "Indiquez le montant du plein");
        if (montant <= 0) throw new BusinessException("Le montant doit être positif");
        p.setMontant(montant);
        Object l = c.get("litres");
        if (l == null || l.toString().isBlank()) throw new BusinessException("Indiquez le nombre de litres");
        try {
            BigDecimal litres = new BigDecimal(l.toString().replace(',', '.')).setScale(2, RoundingMode.HALF_UP);
            if (litres.signum() <= 0 || litres.compareTo(BigDecimal.valueOf(500)) > 0) throw new BusinessException("Nombre de litres invalide");
            p.setLitres(litres);
        } catch (NumberFormatException e) { throw new BusinessException("Nombre de litres invalide"); }
        Object km = c.get("kilometrage");
        p.setKilometrage(km == null || km.toString().isBlank() ? null : (int) nombre(km, null));
        Object v = c.get("vehiculeId");
        p.setVehicule(v == null || v.toString().isBlank() ? null
                : vehiculeRepo.findById(nombre(v, null)).orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable")));
        p.setStation(texte(c.get("station"), 120));
        String recu = texte(c.get("recuUrl"), 200);
        if (recu != null && !recu.matches(RECU)) throw new BusinessException("Reçu invalide");
        p.setRecuUrl(recu);
    }

    /** Le compteur du véhicule avance avec les pleins validés. */
    private void majCompteur(PleinCarburant p) {
        if (p.getVehicule() != null && p.getKilometrage() != null && p.getKilometrage() > p.getVehicule().getKilometrage()) {
            p.getVehicule().setKilometrage(p.getKilometrage());
            vehiculeRepo.save(p.getVehicule());
        }
    }

    private static long nombre(Object o, String message) {
        if (o == null || o.toString().isBlank()) throw new BusinessException(message == null ? "Valeur manquante" : message);
        try { return Math.round(Double.parseDouble(o.toString().replace(',', '.'))); }
        catch (NumberFormatException e) { throw new BusinessException("Nombre invalide : " + o); }
    }

    private static LocalDate date(Object o) {
        if (o == null || o.toString().isBlank()) return LocalDate.now();
        try { return LocalDate.parse(o.toString()); } catch (Exception e) { throw new BusinessException("Date invalide"); }
    }

    private static String texte(Object o, int max) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s.length() > max ? s.substring(0, max) : s;
    }
}
