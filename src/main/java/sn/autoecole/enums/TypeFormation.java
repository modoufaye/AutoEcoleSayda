package sn.autoecole.enums;

/**
 * Formation suivie par l'élève. Stocké en base : null (fiches antérieures) vaut PERMIS.
 * Le perfectionnement est de la conduite seule : ni code, ni examen, ni dossier du permis.
 */
public enum TypeFormation {
    PERMIS("Permis de conduire"),
    PERFECTIONNEMENT("Perfectionnement");

    private final String libelle;

    TypeFormation(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
