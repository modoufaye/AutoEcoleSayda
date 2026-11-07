package sn.autoecole.entity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Formule d'obtention du permis (Standard, Premium, Prestige, Excellence) : montant total,
 * échéancier et ce qu'elle comprend (« Cours de code illimités », « 10 cours de conduite »…).
 * tranche3 est nulle pour une formule en deux versements (Standard). contenu nul : jamais renseigné.
 */
public record FormulePermis(String nom, BigDecimal montant, BigDecimal acompte, BigDecimal tranche2, BigDecimal tranche3,
                            List<String> contenu) {

    public static final List<String> NOMS = List.of("Standard", "Premium", "Prestige", "Excellence");

    /** Ce que comprennent les formules du permis B, à la création (modifiable ensuite dans Paramètres). */
    public static final Map<String, List<String>> CONTENU_B = Map.of(
            "Standard", List.of("Cours de code illimités", "10 cours de conduite"),
            "Prestige", List.of("Cours de code illimités", "16 cours de conduite"),
            "Excellence", List.of("Cours de code illimités", "17 cours de conduite en boîte manuelle", "5 cours de conduite en boîte automatique"));

    public FormulePermis(String nom, BigDecimal montant, BigDecimal acompte, BigDecimal tranche2, BigDecimal tranche3) {
        this(nom, montant, acompte, tranche2, tranche3, null);
    }

    public FormulePermis avecContenu(List<String> c) {
        return new FormulePermis(nom, montant, acompte, tranche2, tranche3, c);
    }

    /** Tarifs de départ, modifiables ensuite dans Paramètres. */
    public static List<FormulePermis> parDefaut() {
        return completerContenuB(List.of(
                new FormulePermis("Standard",   bd(90_000),  bd(45_000), bd(45_000), null),
                new FormulePermis("Premium",    bd(125_000), bd(45_000), bd(40_000), bd(40_000)),
                new FormulePermis("Prestige",   bd(165_000), bd(65_000), bd(50_000), bd(50_000)),
                new FormulePermis("Excellence", bd(210_000), bd(105_000), bd(55_000), bd(50_000))));
    }

    /** Formules du permis B dont le contenu n'a jamais été renseigné : contenu de CONTENU_B. */
    public static List<FormulePermis> completerContenuB(List<FormulePermis> formules) {
        return formules.stream().map(f -> f.contenu() == null && CONTENU_B.containsKey(f.nom()) ? f.avecContenu(CONTENU_B.get(f.nom())) : f).toList();
    }

    /** Permis C et D : une seule formule Standard, en deux versements. */
    public static List<FormulePermis> parDefautPoidsLourd() {
        return List.of(new FormulePermis("Standard", bd(130_000), bd(65_000), bd(65_000), null));
    }

    /** Permis A (moto) : une seule formule Standard, en deux versements. */
    public static List<FormulePermis> parDefautMoto() {
        return List.of(new FormulePermis("Standard", bd(80_000), bd(40_000), bd(40_000), null));
    }

    private static BigDecimal bd(long v) { return BigDecimal.valueOf(v); }
}
