package com.dairytrack.inventory.repository;

import com.dairytrack.inventory.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction>
    findByItem_IdOrderByTransactionDateDescIdDesc(Long itemId);
}