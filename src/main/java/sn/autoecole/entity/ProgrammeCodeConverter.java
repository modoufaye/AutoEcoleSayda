package sn.autoecole.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

/** Le programme de code d'une séance est rangé en JSON dans une seule colonne texte. */
@Converter
public class ProgrammeCodeConverter implements AttributeConverter<List<PartieCode>, String> {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<PartieCode> parties) {
        if (parties == null || parties.isEmpty()) return null;
        try { return JSON.writeValueAsString(parties); }
        catch (Exception e) { throw new IllegalStateException("Programme illisible", e); }
    }

    @Override
    public List<PartieCode> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try { return JSON.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return new ArrayList<>(); }
    }
}
