package com.booking.backend.controller;

import com.booking.backend.model.Resource;
import com.booking.backend.repository.ResourceRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:5173") 
public class ResourceController {

    @Autowired
    private ResourceRepository repository;

    // 1. GET 
    @GetMapping
    public List<Resource> getAllResources(@RequestParam(required = false) String type) {
        if (type != null) return repository.findByTypeContainingIgnoreCase(type);
        return repository.findAll();
    }

    // 2. POST 
    @PostMapping
    public ResponseEntity<Resource> createResource(@Valid @RequestBody Resource resource) {
        return new ResponseEntity<>(repository.save(resource), HttpStatus.CREATED);
    }

    // 3. PUT
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable Long id, @Valid @RequestBody Resource details) {
        return repository.findById(id).map(r -> {
            r.setName(details.getName());
            r.setType(details.getType());
            r.setCapacity(details.getCapacity());
            r.setLocation(details.getLocation());
            r.setStatus(details.getStatus());
            return ResponseEntity.ok(repository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        return repository.findById(id).map(r -> {
            repository.delete(r);
            return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
        }).orElse(ResponseEntity.notFound().build());
    }
}
