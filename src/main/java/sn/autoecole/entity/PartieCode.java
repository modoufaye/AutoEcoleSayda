package sn.autoecole.entity;

/**
 * Partie du cours de code publiée dans une séance : un chapitre (identifiant de
 * frontend/src/contenu, ex. « danger ») et, si besoin, seulement ses panneaux n° de à a
 * (numérotés à partir de 1, bornes comprises). Sans bornes : tout le chapitre.
 */
public record PartieCode(String chapitre, Integer de, Integer a) {

    public boolean complete() { return de == null && a == null; }
}
