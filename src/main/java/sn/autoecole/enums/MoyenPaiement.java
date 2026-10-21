package sn.autoecole.enums;

public enum MoyenPaiement {
    ESPECES("Espèces"),
    WAVE("Wave"),
    ORANGE_MONEY("Orange Money");

    private final String libelle;

    MoyenPaiement(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
