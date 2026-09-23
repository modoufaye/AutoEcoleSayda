package sn.autoecole.enums;

public enum Site {
    MAZALIK_JINAN("Mazalik Jinan"),
    GUEDIAWAYE("Guédiawaye"),
    KEUR_MASSAR("Keur Massar");

    private final String libelle;

    Site(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
