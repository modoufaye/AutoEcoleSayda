package sn.autoecole.entity;

import java.math.BigDecimal;
import java.util.List;

/**
 * Formule d'obtention du permis (Standard, Premium, Prestige, Excellence) : montant total et
 * échéancier. tranche3 est nulle pour une formule en deux versements (Standard).
 */
public record FormulePermis(String nom, BigDecimal montant, BigDecimal acompte, BigDecimal tranche2, BigDecimal tranche3) {

    public static final List<String> NOMS = List.of("Standard", "Premium", "Prestige", "Excellence");

    /** Tarifs de départ, modifiables ensuite dans Paramètres. */
    public static List<FormulePermis> parDefaut() {
        return List.of(
                new FormulePermis("Standard",   bd(90_000),  bd(45_000), bd(45_000), null),
                new FormulePermis("Premium",    bd(125_000), bd(45_000), bd(40_000), bd(40_000)),
                new FormulePermis("Prestige",   bd(165_000), bd(65_000), bd(50_000), bd(50_000)),
                new FormulePermis("Excellence", bd(210_000), bd(105_000), bd(55_000), bd(50_000)));
    }

    private static BigDecimal bd(long v) { return BigDecimal.valueOf(v); }
}
