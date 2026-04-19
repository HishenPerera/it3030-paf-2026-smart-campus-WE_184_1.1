package com.booking.backend.service;

import com.booking.backend.model.CampusResource;
import com.booking.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    @Transactional(readOnly = true)
    public List<CampusResource> getAllResources() {
        return resourceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CampusResource> getResourcesByType(String type) {
        return resourceRepository.findByTypeAndStatus(type.toUpperCase(), "ACTIVE");
    }

    @Transactional
    public CampusResource addResource(CampusResource resource) {
        return resourceRepository.save(resource);
    }

    @Transactional
    public CampusResource updateResource(Long id, CampusResource resourceDetails) {
        CampusResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        
        resource.setName(resourceDetails.getName());
        resource.setType(resourceDetails.getType());
        resource.setLocation(resourceDetails.getLocation());
        resource.setStatus(resourceDetails.getStatus());
        
        return resourceRepository.save(resource);
    }

    @Transactional
    public void deleteResource(Long id) {
        resourceRepository.deleteById(id);
    }
}
