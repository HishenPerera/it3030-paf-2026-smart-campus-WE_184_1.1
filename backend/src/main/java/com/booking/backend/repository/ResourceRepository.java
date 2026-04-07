package com.booking.backend.repository;
import com.booking.backend.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByTypeContainingIgnoreCase(String type);
}