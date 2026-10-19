package com.dairytrack.inventory;

import java.math.BigDecimal;

public record InventoryItemResponse(
        Long id,
        String itemCode,
        String name,
        InventoryCategory category,
        String unit,
        BigDecimal currentStock,
        BigDecimal minimumStock,
        BigDecimal averageUnitCost,
        BigDecimal inventoryValue,
        boolean lowStock
) {
    public static InventoryItemResponse from(InventoryItem item) {
        BigDecimal value = item.getCurrentStock()
                .multiply(item.getAverageUnitCost())
                .setScale(2, java.math.RoundingMode.HALF_UP);

        return new InventoryItemResponse(
                item.getId(),
                item.getItemCode(),
                item.getName(),
                item.getCategory(),
                item.getUnit(),
                item.getCurrentStock(),
                item.getMinimumStock(),
                item.getAverageUnitCost(),
                value,
                item.getCurrentStock()
                        .compareTo(item.getMinimumStock()) <= 0
        );
    }
}