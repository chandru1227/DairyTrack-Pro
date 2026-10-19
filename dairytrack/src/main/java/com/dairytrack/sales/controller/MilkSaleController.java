package com.dairytrack.sales.controller;

import com.dairytrack.sales.MilkSale;
import com.dairytrack.sales.service.MilkSaleService;
import com.dairytrack.sales.CustomerSalesSummary;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class MilkSaleController {

    private final MilkSaleService saleService;

    public MilkSaleController(MilkSaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilkSale createSale(@RequestBody MilkSale sale) {
        return saleService.createSale(sale);
    }

    @GetMapping
    public List<MilkSale> getAllSales() {
        return saleService.getAllSales();
    }

    @GetMapping("/{id}")
    public MilkSale getSale(@PathVariable Long id) {
        return saleService.getSale(id);
    }

    @GetMapping("/date")
    public List<MilkSale> getSalesForDate(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return saleService.getSalesForDate(date);
    }

    @GetMapping("/range")
    public List<MilkSale> getSalesBetween(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return saleService.getSalesBetween(startDate, endDate);
    }

    @GetMapping("/search")
    public List<MilkSale> searchByCustomer(
            @RequestParam String customerName) {
        return saleService.searchByCustomer(customerName);
    }

    @PostMapping("/{id}/payments")
    public MilkSale recordPayment(
            @PathVariable Long id,
            @RequestBody PaymentRequest request) {
        return saleService.recordPayment(id, request.amount());
    }

    @GetMapping("/daily-revenue")
    public BigDecimal getDailyRevenue(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return saleService.getDailyRevenue(date);
    }

    @GetMapping("/period-revenue")
    public BigDecimal getPeriodRevenue(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return saleService.getPeriodRevenue(startDate, endDate);
    }

    @GetMapping("/outstanding")
    public BigDecimal getOutstanding(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return saleService.getOutstanding(startDate, endDate);
    }

    @GetMapping("/customer-summary")
    public List<CustomerSalesSummary> getCustomerSalesSummary(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return saleService.getCustomerSalesSummary(startDate, endDate);
    }

    @GetMapping("/customer/{customerId}/history")
    public List<MilkSale> getSalesForCustomer(
            @PathVariable Long customerId) {
        return saleService.getSalesForCustomer(customerId);
    }

    public record PaymentRequest(BigDecimal amount) {
    }
}