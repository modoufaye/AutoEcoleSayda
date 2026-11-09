package sn.autoecole.entity;

/**
 * Série d'examen ou catalogue des annales publié dans une séance (contenu/seriesExamen.js,
 * contenu/annales.js), avec le mode choisi : ENTRAINEMENT (correction à chaque question) ou
 * EXAMEN (examen blanc chronométré, note enregistrée).
 */
public record SeriePubliee(String serie, String mode) {}
