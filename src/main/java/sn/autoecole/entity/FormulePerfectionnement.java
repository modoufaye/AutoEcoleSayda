package sn.autoecole.entity;

import sn.autoecole.enums.BoiteVitesse;

import java.math.BigDecimal;
import java.util.List;

/**
 * Formule de perfectionnement : un nombre de cours pour une boîte de vitesses, son montant,
 * l'acompte et la 2e tranche (0 quand tout se paie à l'inscription).
 */
public record FormulePerfectionnement(BoiteVitesse boite, int cours, BigDecimal montant, BigDecimal acompte, BigDecimal tranche2) {

    /** Formules proposées, dans l'ordre d'affichage ; leurs montants se règlent dans Paramètres. */
    public static List<FormulePerfectionnement> parDefaut() {
        return List.of(
                new FormulePerfectionnement(BoiteVitesse.AUTOMATIQUE, 20, bd(110_000), bd(70_000), bd(40_000)),
                new FormulePerfectionnement(BoiteVitesse.AUTOMATIQUE, 15, bd(85_000),  bd(50_000), bd(35_000)),
                new FormulePerfectionnement(BoiteVitesse.AUTOMATIQUE, 10, bd(59_900),  bd(59_900), BigDecimal.ZERO),
                new FormulePerfectionnement(BoiteVitesse.AUTOMATIQUE,  5, bd(29_000),  bd(29_000), BigDecimal.ZERO),
                new FormulePerfectionnement(BoiteVitesse.MANUELLE,    15, bd(55_000),  bd(55_000), BigDecimal.ZERO),
                new FormulePerfectionnement(BoiteVitesse.MANUELLE,    10, bd(40_000),  bd(40_000), BigDecimal.ZERO),
                new FormulePerfectionnement(BoiteVitesse.MANUELLE,     5, bd(25_000),  bd(25_000), BigDecimal.ZERO));
    }

    /**
     * Liste enregistrée complétée : l'ordre et l'ensemble des formules par défaut, avec les montants
     * déjà enregistrés quand ils existent (une formule ajoutée ici apparaît avec son prix de départ).
     */
    public static List<FormulePerfectionnement> completer(List<FormulePerfectionnement> enregistrees) {
        if (enregistrees == null) return parDefaut();
        return parDefaut().stream().map(d -> enregistrees.stream()
                .filter(f -> f.boite() == d.boite() && f.cours() == d.cours()).findFirst().orElse(d)).toList();
    }

    private static BigDecimal bd(long v) { return BigDecimal.valueOf(v); }
}
