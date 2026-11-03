package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.dto.EleveRequest;
import sn.autoecole.enums.BoiteVitesse;
import sn.autoecole.enums.CategoriePermis;
import sn.autoecole.enums.TypeFormation;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.Site;
import sn.autoecole.enums.StatutEleve;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.util.Telephones;

import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Import des nouveaux inscrits du mois depuis un fichier Excel. Colonnes reconnues par leur
 * titre (casse, accents et espaces ignorés) : Prénoms, Noms, Adresse, Tel, Type de permis,
 * Date d'inscription, Acompte, Total, Mode de règlement, Lieu d'inscription. Le reliquat
 * éventuel est ignoré : il se calcule (total − payé).
 *
 * Deux temps : analyse (rien n'est écrit, chaque ligne reçoit un statut) puis import des
 * lignes valides, en une seule transaction (tout ou rien).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EleveImportService {

    private final EleveService eleveService;
    private final EleveRepository eleveRepository;
    private final sn.autoecole.repository.AutoEcoleConfigRepository configRepository;
    private final sn.autoecole.repository.MoniteurRepository moniteurRepository;

    public record Ligne(int numero, String prenom, String nom, String telephone, String permis,
                        LocalDate dateInscription, BigDecimal acompte, BigDecimal total, String mode,
                        String lieu, String statut, String message) {}

    public record Resultat(boolean importe, int valides, int ignorees, int erreurs, List<Ligne> lignes) {}

    private static final String OK = "OK", IGNOREE = "IGNOREE", ERREUR = "ERREUR";

    public Resultat importer(MultipartFile fichier, boolean confirmer) {
        List<Ligne> lignes = new ArrayList<>();
        List<EleveRequest> aCreer = new ArrayList<>();

        try (InputStream in = fichier.getInputStream(); Workbook wb = WorkbookFactory.create(in)) {
            Sheet feuille = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter(Locale.FRANCE);
            int ligneTitres = trouverLigneTitres(feuille, fmt);
            Map<String, Integer> col = colonnes(feuille.getRow(ligneTitres), fmt);
            for (String requise : List.of("prenom", "nom", "permis", "date", "acompte", "total", "lieu")) {
                if (!col.containsKey(requise)) {
                    throw new BusinessException("Colonne introuvable dans le fichier : " + LIBELLES.get(requise));
                }
            }

            Set<String> telsDuFichier = new HashSet<>();
            for (int r = ligneTitres + 1; r <= feuille.getLastRowNum(); r++) {
                Row row = feuille.getRow(r);
                if (row == null) continue;
                String prenom = prenom(texte(row, col.get("prenom"), fmt));
                String nom = texte(row, col.get("nom"), fmt).toUpperCase(Locale.FRENCH);
                String telBrut = texte(row, col.get("tel"), fmt);
                String permisBrut = texte(row, col.get("permis"), fmt);
                String lieuBrut = texte(row, col.get("lieu"), fmt);
                String modeBrut = texte(row, col.get("mode"), fmt);
                if (prenom.isEmpty() && nom.isEmpty() && telBrut.isEmpty() && permisBrut.isEmpty()) continue;

                String tel = Telephones.normaliser(telBrut);
                CategoriePermis permis = permis(permisBrut);
                // « CP M » / « CP A » dans Type de permis : cours de perfectionnement (boîte manuelle ou automatique)
                boolean perf = simplifier(permisBrut).startsWith("cp");
                BoiteVitesse boite = perf ? boite(permisBrut) : null;
                LocalDate date = date(row.getCell(col.get("date")), fmt);
                BigDecimal acompte = montant(row.getCell(col.get("acompte")), fmt);
                BigDecimal total = montant(row.getCell(col.get("total")), fmt);
                Site lieu = lieu(lieuBrut);
                MoyenPaiement mode = modeBrut.isEmpty() ? MoyenPaiement.ESPECES : mode(modeBrut);
                String adresse = texte(row, col.get("adresse"), fmt);

                String statut = OK, message = "";
                if (prenom.isEmpty() || nom.isEmpty()) { statut = ERREUR; message = "Prénom ou nom manquant"; }
                else if (perf && boite == null) { statut = ERREUR; message = "Perfectionnement : boîte inconnue « " + permisBrut + " » (CP ou CP M = manuelle, CP A = automatique)"; }
                else if (!perf && permis == null) { statut = ERREUR; message = "Type de permis inconnu : « " + permisBrut + " » (A, B, C, D, CP M ou CP A)"; }
                else if (date == null) { statut = ERREUR; message = "Date d'inscription illisible"; }
                else if (date.isAfter(LocalDate.now())) { statut = ERREUR; message = "Date d'inscription dans le futur"; }
                else if (total == null || total.signum() <= 0) { statut = ERREUR; message = "Total manquant"; }
                else if (acompte == null || acompte.signum() <= 0) { statut = ERREUR; message = "Acompte manquant"; }
                else if (acompte.compareTo(total) > 0) { statut = ERREUR; message = "L'acompte dépasse le total"; }
                else if (lieu == null) { statut = ERREUR; message = "Lieu d'inscription inconnu : « " + lieuBrut + " »"; }
                else if (mode == null) { statut = ERREUR; message = "Mode de règlement inconnu : « " + modeBrut + " »"; }
                else if (tel != null && !telsDuFichier.add(tel)) { statut = ERREUR; message = "Téléphone en double dans le fichier"; }
                else if (tel != null && eleveRepository.existsByTelephone(tel)) {
                    statut = IGNOREE;
                    message = "Déjà inscrit (" + eleveRepository.findFirstByTelephone(tel)
                            .map(e -> e.getPrenom() + " " + e.getNom()).orElse(tel) + ")";
                } else if (tel == null && dejaInscritSansTel(prenom, nom, date)) {
                    statut = IGNOREE; message = "Déjà inscrit (même nom et même date)";
                } else if (tel == null) {
                    message = "Sans téléphone : pas de compte tant que le numéro n'est pas ajouté";
                }

                String permisAffiche = boite != null ? (boite == BoiteVitesse.MANUELLE ? "CP manuelle" : "CP automatique")
                        : permis != null && !perf ? permis.name() : permisBrut;
                lignes.add(new Ligne(r + 1, prenom, nom, tel, permisAffiche, date,
                        acompte, total, mode != null ? mode.name() : modeBrut,
                        lieu != null ? lieu.getLibelle() : lieuBrut, statut, message));

                if (OK.equals(statut)) {
                    EleveRequest req = new EleveRequest();
                    req.setPrenom(prenom);
                    req.setNom(nom);
                    req.setTelephone(tel);
                    req.setAdresse(adresse.isEmpty() ? null : adresse);
                    if (perf) {
                        req.setTypeFormation(TypeFormation.PERFECTIONNEMENT);
                        req.setBoiteVitesse(boite);   // catégorie B fixée par EleveService
                    } else {
                        req.setCategoriePermis(permis);
                    }
                    req.setDateInscription(date);
                    req.setMontantAvance(acompte);
                    req.setMontantTotal(total);
                    req.setMoyenAcompte(mode);
                    req.setSite(lieu);
                    req.setLieuInscription(lieu);
                    req.setStatut(StatutEleve.EN_COURS);
                    aCreer.add(req);
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Fichier illisible : envoyez un fichier Excel (.xlsx)");
        }

        if (confirmer) {
            // Les inscrits du fichier n'ont pas de moniteur : celui des cours de code (Paramètres).
            Long moniteurDefaut = moniteurParDefaut();
            // Perfectionnement : pas de cours de code, donc pas ce moniteur.
            aCreer.forEach(req -> {
                if (req.getTypeFormation() != TypeFormation.PERFECTIONNEMENT) req.setMoniteurId(moniteurDefaut);
                eleveService.creer(req);
            });
        }

        int valides = (int) lignes.stream().filter(l -> OK.equals(l.statut())).count();
        int ignorees = (int) lignes.stream().filter(l -> IGNOREE.equals(l.statut())).count();
        return new Resultat(confirmer, valides, ignorees, lignes.size() - valides - ignorees, lignes);
    }

    private Long moniteurParDefaut() {
        return configRepository.findAll().stream().findFirst()
                .map(c -> c.getMoniteurParDefautId())
                .filter(id -> moniteurRepository.findById(id).map(m -> m.isActif()).orElse(false))
                .orElse(null);
    }

    private boolean dejaInscritSansTel(String prenom, String nom, LocalDate date) {
        return eleveRepository.findAll().stream().anyMatch(e ->
                e.getPrenom().equalsIgnoreCase(prenom) && e.getNom().equalsIgnoreCase(nom)
                        && date.equals(e.getDateInscription()));
    }

    /* ── Titres de colonnes ─────────────────────────────────── */

    private static final Map<String, String> LIBELLES = Map.of(
            "prenom", "Prénoms", "nom", "Noms", "permis", "Type de permis", "date", "Date d'inscription",
            "acompte", "Acompte", "total", "Total", "lieu", "Lieu d'inscription");

    /** La ligne des titres n'est pas forcément la première (titre « Tableau 1 » au-dessus). */
    private static int trouverLigneTitres(Sheet feuille, DataFormatter fmt) {
        for (int r = feuille.getFirstRowNum(); r <= Math.min(feuille.getLastRowNum(), 15); r++) {
            Row row = feuille.getRow(r);
            if (row == null) continue;
            Map<String, Integer> c = colonnes(row, fmt);
            if (c.containsKey("prenom") && c.containsKey("nom")) return r;
        }
        throw new BusinessException("Ligne des titres introuvable (colonnes « Prénoms » et « Noms »)");
    }

    private static Map<String, Integer> colonnes(Row row, DataFormatter fmt) {
        Map<String, Integer> c = new HashMap<>();
        for (Cell cell : row) {
            String t = simplifier(fmt.formatCellValue(cell));
            String cle = null;
            if (t.startsWith("prenom")) cle = "prenom";
            else if (t.equals("nom") || t.equals("noms")) cle = "nom";
            else if (t.startsWith("adresse")) cle = "adresse";
            else if (t.startsWith("tel")) cle = "tel";
            else if (t.contains("permis")) cle = "permis";
            else if (t.contains("date")) cle = "date";
            else if (t.startsWith("acompte")) cle = "acompte";
            else if (t.startsWith("total")) cle = "total";
            else if (t.contains("reglement") || t.startsWith("mode")) cle = "mode";
            else if (t.contains("lieu")) cle = "lieu";
            if (cle != null) c.putIfAbsent(cle, cell.getColumnIndex());
        }
        return c;
    }

    /* ── Valeurs des cellules ───────────────────────────────── */

    /** Minuscules, sans accents ni espaces ni ponctuation : « Date \n d’inscription » → « datedinscription ». */
    private static String simplifier(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static String texte(Row row, Integer col, DataFormatter fmt) {
        if (col == null) return "";
        Cell cell = row.getCell(col);
        return cell == null ? "" : fmt.formatCellValue(cell).trim().replaceAll("\\s+", " ");
    }

    /** « MOUSTAPHA DADJI » → « Moustapha Dadji ». */
    private static String prenom(String s) {
        StringBuilder sb = new StringBuilder();
        for (String mot : s.toLowerCase(Locale.FRENCH).split(" ")) {
            if (mot.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(mot.charAt(0))).append(mot.substring(1));
        }
        return sb.toString();
    }

    private static CategoriePermis permis(String s) {
        String t = simplifier(s).replace("permis", "");
        return switch (t) {
            case "a" -> CategoriePermis.A;
            case "b" -> CategoriePermis.B;
            case "c" -> CategoriePermis.C;
            case "d" -> CategoriePermis.D;
            default -> null;
        };
    }

    /** « CP » seul, « CP M », « CP manuelle » → manuelle ; « CP A », « CP auto », « CP automatique » → automatique. */
    private static BoiteVitesse boite(String s) {
        String t = simplifier(s).replaceFirst("^cp", "");
        if (t.isEmpty() || t.equals("m") || t.startsWith("manu")) return BoiteVitesse.MANUELLE;
        if (t.equals("a") || t.startsWith("auto")) return BoiteVitesse.AUTOMATIQUE;
        return null;
    }

    private static Site lieu(String s) {
        String t = simplifier(s);
        if (t.contains("ligne")) return Site.EN_LIGNE;
        if (t.contains("guediawaye")) return Site.GUEDIAWAYE;
        if (t.startsWith("keurmas")) return Site.KEUR_MASSAR;
        if (t.startsWith("massalik") || t.startsWith("mazalik") || t.contains("djinane") || t.contains("jinan")) return Site.MAZALIK_JINAN;
        return null;
    }

    private static MoyenPaiement mode(String s) {
        String t = simplifier(s);
        if (t.startsWith("espece") || t.equals("cash")) return MoyenPaiement.ESPECES;
        if (t.startsWith("wave")) return MoyenPaiement.WAVE;
        if (t.startsWith("orange") || t.equals("om")) return MoyenPaiement.ORANGE_MONEY;
        return null;
    }

    /** Une formule (ex. =G3*2) vaut son dernier résultat calculé par Excel. */
    private static CellType type(Cell cell) {
        return cell.getCellType() == CellType.FORMULA ? cell.getCachedFormulaResultType() : cell.getCellType();
    }

    private static LocalDate date(Cell cell, DataFormatter fmt) {
        if (cell == null) return null;
        if (type(cell) == CellType.NUMERIC) {
            // Excel stocke les dates en nombre de jours, même quand la cellule n'est pas au format date.
            return DateUtil.getLocalDateTime(cell.getNumericCellValue()).toLocalDate();
        }
        String s = fmt.formatCellValue(cell).trim();
        for (String motif : List.of("dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yy")) {
            try { return LocalDate.parse(s, DateTimeFormatter.ofPattern(motif)); } catch (Exception ignored) { }
        }
        return null;
    }

    private static BigDecimal montant(Cell cell, DataFormatter fmt) {
        if (cell == null) return null;
        if (type(cell) == CellType.NUMERIC) return BigDecimal.valueOf(cell.getNumericCellValue());
        String chiffres = fmt.formatCellValue(cell).replaceAll("[^0-9]", "");
        return chiffres.isEmpty() ? null : new BigDecimal(chiffres);
    }
}
