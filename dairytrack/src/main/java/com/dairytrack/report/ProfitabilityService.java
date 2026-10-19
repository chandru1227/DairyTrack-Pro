package com.dairytrack.report;

import com.dairytrack.expense.repository.ExpenseRepository;
import com.dairytrack.milkproduction.repository.MilkProductionRepository;
import com.dairytrack.sales.repository.MilkSaleRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class ProfitabilityService {

    private final MilkSaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final MilkProductionRepository milkProductionRepository;

    public ProfitabilityService(
            MilkSaleRepository saleRepository,
            ExpenseRepository expenseRepository,
            MilkProductionRepository milkProductionRepository) {

        this.saleRepository = saleRepository;
        this.expenseRepository = expenseRepository;
        this.milkProductionRepository = milkProductionRepository;
    }

    @Transactional(readOnly = true)
    public ProfitabilitySummary getSummary(
            LocalDate startDate, LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start date and end date are required");
        }

        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Start date cannot be after end date");
        }

        BigDecimal revenue = zeroIfNull(
                saleRepository.getRevenueBetweenDates(
                        startDate, endDate));

        BigDecimal expenses = zeroIfNull(
                expenseRepository.getTotalBetweenDates(
                        startDate, endDate));

        BigDecimal litresSold = zeroIfNull(
                saleRepository.getLitresSoldBetweenDates(
                        startDate, endDate));

        BigDecimal litresProduced = zeroIfNull(
                milkProductionRepository.getTotalBetweenDates(
                        startDate, endDate));

        revenue = money(revenue);
        expenses = money(expenses);

        BigDecimal profit = money(revenue.subtract(expenses));

        BigDecimal revenuePerLitre = divideSafely(
                revenue, litresSold);

        BigDecimal expensePerLitre = divideSafely(
                expenses, litresProduced);

        BigDecimal profitMargin = revenue.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : profit.multiply(BigDecimal.valueOf(100))
                .divide(revenue, 2, RoundingMode.HALF_UP);

        return new ProfitabilitySummary(
                startDate,
                endDate,
                revenue,
                expenses,
                profit,
                litresSold,
                litresProduced,
                revenuePerLitre,
                expensePerLitre,
                profitMargin
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal divideSafely(
            BigDecimal amount, BigDecimal quantity) {

        if (quantity.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return amount.divide(quantity, 2, RoundingMode.HALF_UP);
    }
}