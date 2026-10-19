package com.dairytrack.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ProfitabilityController {

    private final ProfitabilityService profitabilityService;

    public ProfitabilityController(
            ProfitabilityService profitabilityService) {
        this.profitabilityService = profitabilityService;
    }

    @GetMapping("/profitability")
    public ProfitabilitySummary getProfitability(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return profitabilityService.getSummary(startDate, endDate);
    }
}