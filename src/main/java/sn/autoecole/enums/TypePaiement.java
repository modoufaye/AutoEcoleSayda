package sn.autoecole.enums;

public enum TypePaiement {
    TARIF_INSCRIPTION("Tarif inscription"),
    TARIF_CODE("Tarif code"),
    TARIF_CONDUITE("Tarif conduite"),
    INSCRIPTION("Frais d'inscription"),
    LECON("Frais de leçon"),
    EXAMEN("Frais d'examen"),
    AUTRE("Autre paiement");

    private final String libelle;

    TypePaiement(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
