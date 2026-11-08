package sn.autoecole.config;

import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final JournalInterceptor journalInterceptor;
    private final PresenceInterceptor presenceInterceptor;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }

    /** Journal des actions des gestionnaires (super admin, administrateurs, secrétariat) et présence. */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(journalInterceptor).addPathPatterns("/api/**");
        // Présence en ligne (élèves et moniteurs, vue par l'administration)
        registry.addInterceptor(presenceInterceptor).addPathPatterns("/api/**");
    }
}
