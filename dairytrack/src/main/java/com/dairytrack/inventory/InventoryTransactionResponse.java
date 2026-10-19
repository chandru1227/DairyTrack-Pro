package com.dairytrack.inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InventoryTransactionResponse(
        Long id,
        Long itemId,
        String itemCode,
        String itemName,
        InventoryTransactionType type,
        BigDecimal quantity,
        BigDecimal unitCost,
        LocalDateTime transactionDate,
        String description
) {
    public static InventoryTransactionResponse from(
            InventoryTransaction transaction
    ) {
        InventoryItem item = transaction.getItem();

        return new InventoryTransactionResponse(
                transaction.getId(),
                item.getId(),
                item.getItemCode(),
                item.getName(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getUnitCost(),
                transaction.getTransactionDate(),
                transaction.getDescription()
        );
    }
}