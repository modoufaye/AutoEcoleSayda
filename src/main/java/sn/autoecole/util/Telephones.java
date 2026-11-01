package sn.autoecole.util;

/**
 * Numéro de téléphone d'un élève, aussi son identifiant de connexion : on le garde sous une
 * seule forme (9 chiffres sénégalais, sans espace ni indicatif) pour que « 77 479 07 63 »,
 * « +221774790763 » et « 774790763 » désignent le même compte.
 */
public final class Telephones {

    private Telephones() {}

    /** Chiffres seuls, sans l'indicatif 221 ; null si vide. */
    public static String normaliser(String telephone) {
        if (telephone == null) return null;
        String chiffres = telephone.replaceAll("\\D", "");
        if (chiffres.startsWith("00221")) chiffres = chiffres.substring(5);
        else if (chiffres.startsWith("221") && chiffres.length() == 12) chiffres = chiffres.substring(3);
        return chiffres.isEmpty() ? null : chiffres;
    }
}
