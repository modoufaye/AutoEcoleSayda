package sn.autoecole.enums;

public enum CategoriePermis {
    POIDS_LEGER("Poids léger"),
    POIDS_LOURD("Poids lourd"),
    TRANSPORT("Transport"),
    C1("C1"),
    INTERNATIONAL("International");

    private final String description;

    CategoriePermis(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
