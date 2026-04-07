package com.booking.backend.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
@Entity
@Data

public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Type is required")
    private String type; // Lecture Hall, Lab, Projector

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    private String status = "ACTIVE"; // ACTIVE or OUT_OF_SERVICE
}
    

