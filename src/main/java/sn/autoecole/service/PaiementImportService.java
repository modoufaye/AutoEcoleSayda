package sn.autoecole.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.MoyenPaiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.enums.TypePaiement;
import sn.autoecole.exception.BusinessException;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.PaiementRepository;
import sn.autoecole.util.Telephones;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static sn.autoecole.service.EleveImportService.*;

/**
 * Import de versements (2e, 3e tranche…) pour plusieurs élèves déjà inscrits, depuis un fichier
 * Excel. Colonnes reconnues par leur titre (casse, accents et espaces ignorés) : Prénom, Nom,
 * Tel (ou Numéro), Montant, Tranche, Mode de règlement, et Date (facultative : aujourd'hui).
 *
 * L'élève est retrouvé par son téléphone, sinon par son prénom et son nom. La tranche n'est pas
 * enregistrée telle quelle (l'appli la calcule d'après l'ordre des versements) : elle sert de
 * contrôle. Tranche déjà enregistrée → ligne ignorée, ce qui évite les doublons si le fichier est
 * importé deux fois ; tranche précédente manquante → erreur.
 *
 * Deux temps, comme l'import des élèves : analyse (rien n'est écrit) puis import des lignes
 * valides, en une seule transaction (tout ou rien).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PaiementImportService {

    private final EleveRepository eleveRepository;
    private final PaiementRepository paiementRepository;
    private final PaiementService paiementService;

    public record Ligne(int numero, String prenom, String nom, String telephone, String eleveTrouve,
                        BigDecimal montant, Integer tranche, String mode, LocalDate date,
                        String statut, String message) {}

    public record Resultat(boolean importe, int valides, int ignorees, int erreurs, BigDecimal totalValide,
                           List<Ligne> lignes) {}

    private static final String OK = "OK", IGNOREE = "IGNOREE", ERREUR = "ERREUR";

    private static final Map<String, String> LIBELLES = Map.of(
            "prenom", "Prénom", "nom", "Nom", "montant", "Montant", "tranche", "Tranche");

    private record AFaire(Eleve eleve, BigDecimal montant, MoyenPaiement mode, LocalDate date, int tranche) {}

    public Resultat importer(MultipartFile fichier, boolean confirmer) {
        List<Ligne> lignes = new ArrayList<>();
        List<AFaire> aCreer = new ArrayList<>();
        List<Eleve> tous = eleveRepository.findAll();
        // Par élève : versements déjà comptés (base + lignes valides du fichier), montant déjà prévu dans le fichier
        Map<Long, Integer> versements = new HashMap<>();
        Map<Long, BigDecimal> prevu = new HashMap<>();

        try (InputStream in = fichier.getInputStream(); Workbook wb = WorkbookFactory.create(in)) {
            Sheet feuille = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter(Locale.FRANCE);
            int ligneTitres = trouverLigneTitres(feuille, fmt);
            Map<String, Integer> col = colonnes(feuille.getRow(ligneTitres), fmt);
            for (String requise : List.of("prenom", "nom", "montant", "tranche")) {
                if (!col.containsKey(requise)) {
                    throw new BusinessException("Colonne introuvable dans le fichier : " + LIBELLES.get(requise));
                }
            }

            for (int r = ligneTitres + 1; r <= feuille.getLastRowNum(); r++) {
                Row row = feuille.getRow(r);
                if (row == null) continue;
                String prenom = prenom(texte(row, col.get("prenom"), fmt));
                String nom = texte(row, col.get("nom"), fmt).toUpperCase(Locale.FRENCH);
                String telBrut = texte(row, col.get("tel"), fmt);
                String montantBrut = texte(row, col.get("montant"), fmt);
                String trancheBrut = texte(row, col.get("tranche"), fmt);
                String modeBrut = texte(row, col.get("mode"), fmt);
                if (prenom.isEmpty() && nom.isEmpty() && telBrut.isEmpty() && montantBrut.isEmpty()) continue;

                String tel = Telephones.normaliser(telBrut);
                BigDecimal montant = montant(row.getCell(col.get("montant")), fmt);
                Integer tranche = tranche(trancheBrut);
                MoyenPaiement mode = modeBrut.isEmpty() ? MoyenPaiement.ESPECES : mode(modeBrut);
                Cell celluleDate = col.containsKey("date") ? row.getCell(col.get("date")) : null;
                boolean dateVide = celluleDate == null || fmt.formatCellValue(celluleDate).isBlank();
                LocalDate date = dateVide ? LocalDate.now() : date(celluleDate, fmt);

                String statut = OK, message = "";
                Eleve eleve = null;
                if (prenom.isEmpty() || nom.isEmpty()) { statut = ERREUR; message = "Prénom ou nom manquant"; }
                else if (montant == null || montant.signum() <= 0) { statut = ERREUR; message = "Montant manquant"; }
                else if (tranche == null) { statut = ERREUR; message = "Tranche illisible : « " + trancheBrut + " » (1, 2 ou 3)"; }
                else if (mode == null) { statut = ERREUR; message = "Mode de règlement inconnu : « " + modeBrut + " »"; }
                else if (date == null) { statut = ERREUR; message = "Date illisible"; }
                else if (date.isAfter(LocalDate.now())) { statut = ERREUR; message = "Date dans le futur"; }
                else {
                    List<Eleve> trouves = trouver(tous, tel, prenom, nom);
                    if (trouves.isEmpty()) { statut = ERREUR; message = "Élève introuvable (ni par le téléphone, ni par le nom)"; }
                    else if (trouves.size() > 1) { statut = ERREUR; message = "Plusieurs élèves portent ce nom : ajoutez leur téléphone"; }
                    else eleve = trouves.get(0);
                }

                if (eleve != null) {
                    Long id = eleve.getId();
                    List<Paiement> existants = paiementRepository.findByEleveId(id).stream()
                            .filter(p -> p.getStatut() != StatutPaiement.ANNULE).toList();
                    int deja = versements.computeIfAbsent(id, k -> existants.size());
                    int attendue = deja + 1;
                    LocalDate dernier = existants.stream().map(Paiement::getDate).filter(Objects::nonNull)
                            .max(Comparator.naturalOrder()).orElse(null);
                    BigDecimal paye = paiementService.totalEncaisseParEleve(id).add(prevu.getOrDefault(id, BigDecimal.ZERO));
                    BigDecimal reste = eleve.getMontantTotal() == null ? null : eleve.getMontantTotal().subtract(paye);

                    if (tranche < attendue) {
                        statut = IGNOREE; message = libelle(tranche) + " déjà enregistrée";
                    } else if (tranche > attendue) {
                        statut = ERREUR; message = "Il manque la " + libelle(attendue) + " (" + deja + " versement" + (deja > 1 ? "s" : "") + " enregistré" + (deja > 1 ? "s" : "") + ")";
                    } else if (dernier != null && date.isBefore(dernier)) {
                        statut = ERREUR; message = "Date avant le dernier versement (" + dernier + ")";
                    } else if (reste != null && montant.compareTo(reste) > 0) {
                        statut = ERREUR; message = reste.signum() <= 0 ? "Formation déjà soldée"
                                : "Le montant dépasse le reste à payer (" + reste.stripTrailingZeros().toPlainString() + " F)";
                    } else {
                        versements.put(id, deja + 1);
                        prevu.merge(id, montant, BigDecimal::add);
                        aCreer.add(new AFaire(eleve, montant, mode, date, tranche));
                        if (eleve.isArchive()) message = "Élève archivé";
                    }
                }

                lignes.add(new Ligne(r + 1, prenom, nom, tel,
                        eleve != null ? eleve.getPrenom() + " " + eleve.getNom() : null,
                        montant, tranche, mode != null ? mode.name() : modeBrut, date, statut, message));
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Fichier illisible : envoyez un fichier Excel (.xlsx)");
        }

        if (confirmer) {
            Set<Long> touches = new HashSet<>();
            for (AFaire a : aCreer) {
                paiementRepository.save(Paiement.builder()
                        .date(a.date())
                        .montant(a.montant())
                        .eleve(a.eleve())
                        .typePaiement(TypePaiement.TRANCHE_1)   // provisoire : fixé par renumeroterTranches
                        .statut(StatutPaiement.PAYE)
                        .moyenPaiement(a.mode())
                        .description("Import Excel — " + libelle(a.tranche()))
                        .build());
                touches.add(a.eleve().getId());
            }
            touches.forEach(paiementService::renumeroterTranches);
        }

        int valides = (int) lignes.stream().filter(l -> OK.equals(l.statut())).count();
        int ignorees = (int) lignes.stream().filter(l -> IGNOREE.equals(l.statut())).count();
        BigDecimal total = aCreer.stream().map(AFaire::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Resultat(confirmer, valides, ignorees, lignes.size() - valides - ignorees, total, lignes);
    }

    /** Fichier modèle à remplir : la ligne des titres et deux exemples. */
    @Transactional(readOnly = true)
    public byte[] modele() {
        try (Workbook wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            Sheet f = wb.createSheet("Versements");
            CellStyle gras = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            gras.setFont(font);
            String[][] lignes = {
                    {"Prénom", "Nom", "Téléphone", "Montant", "Tranche", "Mode de règlement", "Date (facultatif)"},
                    {"Awa", "DIOP", "77 123 45 67", "50000", "2", "Wave", ""},
                    {"Moussa", "FALL", "78 765 43 21", "25000", "3", "Espèces", ""},
            };
            for (int r = 0; r < lignes.length; r++) {
                Row row = f.createRow(r);
                for (int c = 0; c < lignes[r].length; c++) {
                    Cell cell = row.createCell(c);
                    if (r > 0 && c == 3) cell.setCellValue(Double.parseDouble(lignes[r][c]));
                    else cell.setCellValue(lignes[r][c]);
                    if (r == 0) cell.setCellStyle(gras);
                }
            }
            for (int c = 0; c < lignes[0].length; c++) f.setColumnWidth(c, 18 * 256);
            wb.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new BusinessException("Modèle impossible à créer");
        }
    }

    /** Par le téléphone d'abord ; sinon (ou numéro inconnu) par le prénom et le nom. */
    private static List<Eleve> trouver(List<Eleve> tous, String tel, String prenom, String nom) {
        if (tel != null) {
            List<Eleve> parTel = tous.stream().filter(e -> tel.equals(e.getTelephone())).toList();
            if (!parTel.isEmpty()) {
                // Même numéro pour plusieurs fiches (parent, fratrie) : le nom départage
                if (parTel.size() == 1) return parTel;
                List<Eleve> parNom = parNom(parTel, prenom, nom);
                return parNom.isEmpty() ? parTel : parNom;
            }
        }
        List<Eleve> parNom = parNom(tous, prenom, nom);
        // Homonymes : les élèves actifs d'abord (un ancien élève archivé ne doit pas bloquer)
        if (parNom.size() > 1) {
            List<Eleve> actifs = parNom.stream().filter(e -> !e.isArchive()).toList();
            if (actifs.size() == 1) return actifs;
        }
        return parNom;
    }

    private static List<Eleve> parNom(List<Eleve> eleves, String prenom, String nom) {
        String p = simplifier(prenom), n = simplifier(nom);
        return eleves.stream().filter(e -> simplifier(Objects.toString(e.getPrenom(), "")).equals(p)
                && simplifier(Objects.toString(e.getNom(), "")).equals(n)).toList();
    }

    private static String libelle(int tranche) {
        return tranche == 1 ? "1re tranche" : tranche + "e tranche";
    }

    /** « 2 », « 2e », « 2ème », « Tranche 2 », « deuxième » → 2. */
    private static Integer tranche(String s) {
        String t = simplifier(s);
        String chiffres = t.replaceAll("[^0-9]", "");
        int n;
        if (!chiffres.isEmpty()) n = Integer.parseInt(chiffres);
        else if (t.contains("premi") || t.contains("acompte")) n = 1;
        else if (t.contains("deux") || t.contains("second")) n = 2;
        else if (t.contains("trois")) n = 3;
        else return null;
        return n >= 1 && n <= 3 ? n : null;
    }

    /* ── Titres de colonnes ─────────────────────────────────── */

    private static int trouverLigneTitres(Sheet feuille, DataFormatter fmt) {
        for (int r = feuille.getFirstRowNum(); r <= Math.min(feuille.getLastRowNum(), 15); r++) {
            Row row = feuille.getRow(r);
            if (row == null) continue;
            Map<String, Integer> c = colonnes(row, fmt);
            if (c.containsKey("prenom") && c.containsKey("nom")) return r;
        }
        throw new BusinessException("Ligne des titres introuvable (colonnes « Prénom » et « Nom »)");
    }

    private static Map<String, Integer> colonnes(Row row, DataFormatter fmt) {
        Map<String, Integer> c = new HashMap<>();
        for (Cell cell : row) {
            String t = simplifier(fmt.formatCellValue(cell));
            String cle = null;
            if (t.startsWith("prenom")) cle = "prenom";
            else if (t.equals("nom") || t.equals("noms")) cle = "nom";
            else if (t.startsWith("tel") || t.startsWith("numerodetel") || t.equals("numero") || t.startsWith("portable")) cle = "tel";
            else if (t.contains("tranche")) cle = "tranche";
            else if (t.startsWith("montant") || t.startsWith("somme") || t.startsWith("versement")) cle = "montant";
            else if (t.contains("reglement") || t.startsWith("mode") || t.startsWith("moyen")) cle = "mode";
            else if (t.contains("date")) cle = "date";
            if (cle != null) c.putIfAbsent(cle, cell.getColumnIndex());
        }
        return c;
    }
}
