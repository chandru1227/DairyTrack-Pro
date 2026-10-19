package com.dairytrack.inventory.repository;

import com.dairytrack.inventory.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, Long> {

    boolean existsByItemCode(String itemCode);

    Optional<InventoryItem> findByItemCode(String itemCode);

    @Query("""
            SELECT i
            FROM InventoryItem i
            WHERE i.currentStock <= i.minimumStock
            ORDER BY i.name
            """)
    List<InventoryItem> findLowStockItems();
}