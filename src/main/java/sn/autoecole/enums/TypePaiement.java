package sn.autoecole.enums;

public enum TypePaiement {
    // La 1re tranche est l'acompte versé à l'inscription ; la 3e est exceptionnelle.
    TRANCHE_1("1re tranche (acompte)"),
    TRANCHE_2("2e tranche"),
    TRANCHE_3("3e tranche");

    private final String libelle;

    TypePaiement(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
