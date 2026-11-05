package sn.autoecole.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/** Les formules sont rangées en JSON dans une seule colonne texte de la configuration. */
@Converter
public class FormulesPermisConverter implements AttributeConverter<List<FormulePermis>, String> {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<FormulePermis> formules) {
        if (formules == null) return null;
        try { return JSON.writeValueAsString(formules); }
        catch (Exception e) { throw new IllegalStateException("Formules illisibles", e); }
    }

    @Override
    public List<FormulePermis> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return null;
        try { return JSON.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return null; }
    }
}
