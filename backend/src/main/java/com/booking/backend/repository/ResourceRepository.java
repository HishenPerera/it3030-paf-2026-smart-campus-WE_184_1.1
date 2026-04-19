package com.booking.backend.repository;

import com.booking.backend.model.CampusResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<CampusResource, Long> {
    List<CampusResource> findByTypeAndStatus(String type, String status);
    List<CampusResource> findByLocationContainingIgnoreCase(String location);
}
