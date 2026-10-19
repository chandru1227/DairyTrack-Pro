package com.dairytrack.dashboard;

import com.dairytrack.expense.repository.ExpenseRepository;
import com.dairytrack.inventory.repository.InventoryItemRepository;
import com.dairytrack.livestock.CowStatus;
import com.dairytrack.livestock.repository.CowRepository;
import com.dairytrack.milkproduction.repository.MilkProductionRepository;
import com.dairytrack.sales.repository.MilkSaleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class DashboardService {

    private final MilkProductionRepository milkProductionRepository;
    private final MilkSaleRepository milkSaleRepository;
    private final ExpenseRepository expenseRepository;
    private final CowRepository cowRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public DashboardService(
            MilkProductionRepository milkProductionRepository,
            MilkSaleRepository milkSaleRepository,
            ExpenseRepository expenseRepository,
            CowRepository cowRepository,
            InventoryItemRepository inventoryItemRepository) {

        this.milkProductionRepository = milkProductionRepository;
        this.milkSaleRepository = milkSaleRepository;
        this.expenseRepository = expenseRepository;
        this.cowRepository = cowRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummary getSummary() {

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal todayMilk = zeroIfNull(
                milkProductionRepository.getTotalForDate(today));

        BigDecimal todayRevenue = zeroIfNull(
                milkSaleRepository.getRevenueForDate(today));

        BigDecimal todayExpenses = zeroIfNull(
                expenseRepository.getTotalForDate(today));

        BigDecimal monthlyRevenue = zeroIfNull(
                milkSaleRepository.getRevenueBetweenDates(
                        monthStart, today));

        BigDecimal monthlyExpenses = zeroIfNull(
                expenseRepository.getTotalBetweenDates(
                        monthStart, today));

        BigDecimal monthlyProfit = monthlyRevenue
                .subtract(monthlyExpenses)
                .setScale(2, RoundingMode.HALF_UP);

        long activeCows = cowRepository
                .findByStatus(CowStatus.ACTIVE)
                .size();

        long lowStockItems = inventoryItemRepository
                .findLowStockItems()
                .size();

        return new DashboardSummary(
                today,
                todayMilk,
                todayRevenue,
                todayExpenses,
                monthlyRevenue,
                monthlyExpenses,
                monthlyProfit,
                activeCows,
                lowStockItems
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}