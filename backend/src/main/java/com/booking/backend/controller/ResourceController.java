package com.booking.backend.controller;

import com.booking.backend.model.CampusResource;
import com.booking.backend.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public List<CampusResource> getAllResources(@RequestParam(required = false) String type) {
        if (type != null) {
            return resourceService.getResourcesByType(type);
        }
        return resourceService.getAllResources();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CampusResource addResource(@RequestBody CampusResource resource) {
        return resourceService.addResource(resource);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CampusResource updateResource(@PathVariable Long id, @RequestBody CampusResource resource) {
        return resourceService.updateResource(id, resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok().build();
    }
}
