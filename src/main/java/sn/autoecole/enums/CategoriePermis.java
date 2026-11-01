package sn.autoecole.enums;

public enum CategoriePermis {
    A("Moto"),
    B("Véhicule léger"),
    C("Poids lourd"),
    D("Transport en commun");

    private final String description;

    CategoriePermis(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
