
package com.dairytrack.milkproduction.controller;

import com.dairytrack.milkproduction.MilkProductionResponse;
import com.dairytrack.milkproduction.MilkSession;
import com.dairytrack.milkproduction.service.MilkProductionService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/milk-production")
public class MilkProductionController {

    private final MilkProductionService milkService;

    public MilkProductionController(
            MilkProductionService milkService) {
        this.milkService = milkService;
    }

    @PostMapping
    public MilkProductionResponse recordMilk(
            @RequestParam @NotNull Long cowId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date,
            @RequestParam @NotNull MilkSession session,
            @RequestParam
            @NotNull
            @DecimalMin("0.0")
            @Digits(integer = 7, fraction = 2)
            BigDecimal quantityLitres) {

        return milkService.recordMilk(
                cowId, date, session, quantityLitres
        );
    }

    @PutMapping("/{id}")
    public MilkProductionResponse updateMilk(
            @PathVariable Long id,
            @RequestParam @NotNull Long cowId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date,
            @RequestParam @NotNull MilkSession session,
            @RequestParam
            @NotNull
            @DecimalMin("0.0")
            @Digits(integer = 7, fraction = 2)
            BigDecimal quantityLitres) {

        return milkService.updateMilk(
                id, cowId, date, session, quantityLitres
        );
    }

    @GetMapping
    public List<MilkProductionResponse> getMilkForDate(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date) {

        return milkService.getMilkForDate(date);
    }

    @GetMapping("/cow/{cowId}")
    public List<MilkProductionResponse> getCowHistory(
            @PathVariable Long cowId) {
        return milkService.getCowHistory(cowId);
    }

    @GetMapping("/daily-total")
    public BigDecimal getDailyTotal(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date) {

        return milkService.getDailyTotal(date);
    }

    @GetMapping("/weekly-total")
    public BigDecimal getWeeklyTotal(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date) {

        return milkService.getWeeklyTotal(date);
    }

    @GetMapping("/monthly-total")
    public BigDecimal getMonthlyTotal(
            @RequestParam @Min(1) int year,
            @RequestParam @Min(1) @Max(12) int month) {

        return milkService.getMonthlyTotal(year, month);
    }

    @GetMapping("/cow-comparison")
    public List<Map<String, Object>> getCowComparison(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate endDate) {

        return milkService.getCowComparison(startDate, endDate);
    }

    @GetMapping("/production-decrease-alerts")
    public List<Map<String, Object>> getProductionDecreaseAlerts(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @NotNull LocalDate date) {

        return milkService.getProductionDecreaseAlerts(date);
    }
}
