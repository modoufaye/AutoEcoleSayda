package sn.autoecole.enums;

/** Boîte de vitesses choisie pour un cours de perfectionnement. */
public enum BoiteVitesse {
    MANUELLE("Manuelle"),
    AUTOMATIQUE("Automatique");

    private final String libelle;

    BoiteVitesse(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
