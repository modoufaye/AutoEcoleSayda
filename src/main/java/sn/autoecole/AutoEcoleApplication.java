package sn.autoecole;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling   // annonce hebdomadaire des champions (PalmaresService)
public class AutoEcoleApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoEcoleApplication.class, args);
    }
}
