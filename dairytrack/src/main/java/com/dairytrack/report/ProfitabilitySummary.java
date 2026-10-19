package com.dairytrack.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfitabilitySummary(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal estimatedProfit,
        BigDecimal totalLitresSold,
        BigDecimal totalLitresProduced,
        BigDecimal revenuePerLitreSold,
        BigDecimal expensePerLitreProduced,
        BigDecimal profitMarginPercentage
) {
}