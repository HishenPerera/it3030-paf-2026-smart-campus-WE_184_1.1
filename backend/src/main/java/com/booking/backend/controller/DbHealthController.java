package com.booking.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class DbHealthController {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @GetMapping("/db")
    public ResponseEntity<?> dbHealth() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        String ds = dataSource.getClass().getName();
        return ResponseEntity.ok(Map.of(
                "ok", one != null && one == 1,
                "dataSource", ds
        ));
    }
}

