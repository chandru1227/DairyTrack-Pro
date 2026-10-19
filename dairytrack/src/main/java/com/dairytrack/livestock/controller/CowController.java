
package com.dairytrack.livestock.controller;

import com.dairytrack.livestock.Cow;
import com.dairytrack.livestock.CowStatus;
import com.dairytrack.livestock.service.CowService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cows")
public class CowController {

    private final CowService cowService;

    public CowController(CowService cowService) {
        this.cowService = cowService;
    }

    @PostMapping
    public Cow registerCow(@Valid @RequestBody Cow cow) {
        return cowService.registerCow(cow);
    }

    @GetMapping
    public List<Cow> getAllCows(
            @RequestParam(required = false) CowStatus status) {
        return cowService.getAllCows(status);
    }

    @GetMapping("/{id}")
    public Cow getCowById(@PathVariable Long id) {
        return cowService.getCowById(id);
    }

    @GetMapping("/search")
    public List<Cow> searchByCowCode(
            @RequestParam String code) {
        return cowService.searchByCowCode(code);
    }

    @PutMapping("/{id}")
    public Cow updateCow(
            @PathVariable Long id,
            @Valid @RequestBody Cow cow) {
        return cowService.updateCow(id, cow);
    }

    @PatchMapping("/{id}/deactivate")
    public Cow deactivateCow(@PathVariable Long id) {
        return cowService.deactivateCow(id);
    }
    @GetMapping("/active-options")
    public List<Cow> getActiveCowOptions() {
        return cowService.getAllCows(CowStatus.ACTIVE);
    }
}
