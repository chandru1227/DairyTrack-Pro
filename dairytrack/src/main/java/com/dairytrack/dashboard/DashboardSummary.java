package com.dairytrack.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardSummary(
        LocalDate reportDate,
        BigDecimal todayMilkProducedLitres,
        BigDecimal todayRevenue,
        BigDecimal todayExpenses,
        BigDecimal monthlyRevenue,
        BigDecimal monthlyExpenses,
        BigDecimal monthlyEstimatedProfit,
        long activeCows,
        long lowStockItems
) {
}