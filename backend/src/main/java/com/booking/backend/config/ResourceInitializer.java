package com.booking.backend.config;

import com.booking.backend.model.CampusResource;
import com.booking.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ResourceInitializer implements CommandLineRunner {

    private final ResourceRepository resourceRepository;

    @Override
    public void run(String... args) {
        if (resourceRepository.count() == 0) {
            log.info("Initializing campus resources...");
            List<CampusResource> resources = new ArrayList<>();

            // 100 Library Seats
            for (int i = 1; i <= 100; i++) {
                resources.add(CampusResource.builder()
                        .name("Seat L-" + String.format("%03d", i))
                        .type("LIBRARY_SEAT")
                        .location("Main Library - Floor " + (i <= 50 ? "1" : "2"))
                        .status("ACTIVE")
                        .build());
            }

            // 50 Computer Lab Stations
            for (int i = 1; i <= 50; i++) {
                resources.add(CampusResource.builder()
                        .name("Station C-" + String.format("%03d", i))
                        .type("LAB_STATION")
                        .location("IT Building - Lab " + (i <= 25 ? "A" : "B"))
                        .status("ACTIVE")
                        .build());
            }

            resourceRepository.saveAll(resources);
            log.info("Successfully seeded 150 campus resources.");
        }
    }
}
