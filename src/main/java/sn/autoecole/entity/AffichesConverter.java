package sn.autoecole.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/** Les affiches sont rangées en JSON dans une seule colonne texte de la configuration. */
@Converter
public class AffichesConverter implements AttributeConverter<List<Affiche>, String> {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Affiche> affiches) {
        if (affiches == null) return null;
        try { return JSON.writeValueAsString(affiches); }
        catch (Exception e) { throw new IllegalStateException("Affiches illisibles", e); }
    }

    @Override
    public List<Affiche> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return null;
        try { return JSON.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return null; }
    }
}
