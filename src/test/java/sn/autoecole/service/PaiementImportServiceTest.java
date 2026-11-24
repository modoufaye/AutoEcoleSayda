package sn.autoecole.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import sn.autoecole.entity.Eleve;
import sn.autoecole.entity.Paiement;
import sn.autoecole.enums.StatutPaiement;
import sn.autoecole.repository.EleveRepository;
import sn.autoecole.repository.PaiementRepository;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Import des versements : l'élève est retrouvé, et la tranche du fichier évite les doublons. */
class PaiementImportServiceTest {

    EleveRepository eleves = mock(EleveRepository.class);
    PaiementRepository paiements = mock(PaiementRepository.class);
    PaiementService paiementService = mock(PaiementService.class);
    PaiementImportService service = new PaiementImportService(eleves, paiements, paiementService);

    Eleve awa = eleve(1L, "Awa", "DIOP", "+221771234567", 150000);
    Eleve moussa = eleve(2L, "Moussa", "FALL", null, 100000);

    @BeforeEach
    void donnees() {
        when(eleves.findAll()).thenReturn(List.of(awa, moussa));
        // Awa : acompte de 50 000 déjà versé ; Moussa : acompte + 2e tranche (90 000)
        when(paiements.findByEleveId(1L)).thenReturn(List.of(versement(awa, 50000)));
        when(paiements.findByEleveId(2L)).thenReturn(List.of(versement(moussa, 50000), versement(moussa, 40000)));
        when(paiementService.totalEncaisseParEleve(1L)).thenReturn(new BigDecimal(50000));
        when(paiementService.totalEncaisseParEleve(2L)).thenReturn(new BigDecimal(90000));
    }

    @Test
    void analyse() throws Exception {
        var r = service.importer(fichier(
                new Object[]{"Awa", "Diop", "77 123 45 67", 50000, "2e", "Wave"},            // OK (par le téléphone)
                new Object[]{"awa", "DIOP", "771234567", 50000, "3", ""},                      // OK (3e après la 2e du fichier)
                new Object[]{"Moussa", "Fall", "", 20000, "2", "Espèces"},                     // ignorée : 2e déjà là
                new Object[]{"Moussa", "Fall", "", 20000, "3", "OM"},                          // dépasse le reste (10 000)
                new Object[]{"Inconnu", "X", "", 1000, "2", ""},                               // introuvable
                new Object[]{"Awa", "Diop", "", 1000, "deux", "Chèque"}                        // mode inconnu
        ), false);

        assertEquals(List.of("OK", "OK", "IGNOREE", "ERREUR", "ERREUR", "ERREUR"),
                r.lignes().stream().map(PaiementImportService.Ligne::statut).toList());
        assertEquals(2, r.valides());
        assertEquals(0, new BigDecimal(100000).compareTo(r.totalValide()));
        assertTrue(r.lignes().get(3).message().contains("reste à payer"));
        verify(paiements, never()).save(any());
    }

    @Test
    void trancheManquante() throws Exception {
        var r = service.importer(fichier(new Object[]{"Awa", "Diop", "", 10000, "3", ""}), false);
        assertEquals("ERREUR", r.lignes().get(0).statut());
        assertTrue(r.lignes().get(0).message().contains("2e tranche"));
    }

    @Test
    void confirmation() throws Exception {
        var r = service.importer(fichier(new Object[]{"Awa", "Diop", "", 50000, "2", "Wave"}), true);
        assertEquals(1, r.valides());
        verify(paiements).save(argThat(p -> p.getEleve() == awa && p.getStatut() == StatutPaiement.PAYE
                && p.getMoyenPaiement() == sn.autoecole.enums.MoyenPaiement.WAVE
                && p.getDate().equals(LocalDate.now())));
        verify(paiementService).renumeroterTranches(1L);
    }

    @Test
    void modeleRelisible() throws Exception {
        try (Workbook wb = WorkbookFactory.create(new java.io.ByteArrayInputStream(service.modele()))) {
            assertEquals("Tranche", wb.getSheetAt(0).getRow(0).getCell(4).getStringCellValue());
        }
    }

    /* ── Outils ── */

    private static Eleve eleve(Long id, String prenom, String nom, String tel, int total) {
        Eleve e = new Eleve();
        e.setId(id); e.setPrenom(prenom); e.setNom(nom); e.setTelephone(tel);
        e.setMontantTotal(new BigDecimal(total));
        return e;
    }

    private static Paiement versement(Eleve e, int montant) {
        return Paiement.builder().eleve(e).montant(new BigDecimal(montant))
                .date(LocalDate.now().minusDays(30)).statut(StatutPaiement.PAYE).build();
    }

    private static MockMultipartFile fichier(Object[]... lignes) throws Exception {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet f = wb.createSheet();
            String[] titres = {"Prénom", "Nom", "Numéro", "Montant", "Numéro de tranche", "Mode de règlement"};
            Row t = f.createRow(0);
            for (int c = 0; c < titres.length; c++) t.createCell(c).setCellValue(titres[c]);
            for (int r = 0; r < lignes.length; r++) {
                Row row = f.createRow(r + 1);
                for (int c = 0; c < lignes[r].length; c++) {
                    Object v = lignes[r][c];
                    if (v instanceof Integer i) row.createCell(c).setCellValue(i);
                    else row.createCell(c).setCellValue((String) v);
                }
            }
            wb.write(out);
            return new MockMultipartFile("file", "v.xlsx", null, out.toByteArray());
        }
    }
}
