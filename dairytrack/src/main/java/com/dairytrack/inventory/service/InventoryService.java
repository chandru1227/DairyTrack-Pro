package com.dairytrack.inventory.service;

import com.dairytrack.inventory.InventoryItem;
import com.dairytrack.inventory.InventoryTransaction;
import com.dairytrack.inventory.InventoryTransactionType;
import com.dairytrack.inventory.InventoryItemResponse;
import com.dairytrack.inventory.InventoryTransactionResponse;
import com.dairytrack.inventory.repository.InventoryItemRepository;
import com.dairytrack.inventory.repository.InventoryTransactionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryItemRepository itemRepository;
    private final InventoryTransactionRepository transactionRepository;

    public InventoryService(
            InventoryItemRepository itemRepository,
            InventoryTransactionRepository transactionRepository) {
        this.itemRepository = itemRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public InventoryItemResponse createItem(InventoryItem item) {

        if (item.getItemCode() == null
                || item.getItemCode().isBlank()) {
            throw badRequest("Item code is required");
        }

        if (item.getName() == null || item.getName().isBlank()) {
            throw badRequest("Item name is required");
        }

        if (item.getCategory() == null) {
            throw badRequest("Item category is required");
        }

        if (item.getUnit() == null || item.getUnit().isBlank()) {
            throw badRequest("Item unit is required");
        }

        if (item.getMinimumStock() == null
                || item.getMinimumStock().signum() < 0) {
            throw badRequest("Minimum stock cannot be negative");
        }

        if (item.getMinimumStock().scale() > 3) {
            throw badRequest("Minimum stock supports at most 3 decimal places");
        }

        String code = item.getItemCode().trim();

        if (itemRepository.existsByItemCode(code)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An inventory item with this code already exists"
            );
        }

        // Stock must be changed through recorded transactions.
//        item.setId(null);
        item.setItemCode(code);
        item.setName(item.getName().trim());
        item.setUnit(item.getUnit().trim());
        item.setCurrentStock(BigDecimal.ZERO);
        item.setAverageUnitCost(BigDecimal.ZERO);

        InventoryItem saved = itemRepository.save(item);

        return InventoryItemResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getAllItems() {
        return itemRepository.findAll()
                .stream()
                .map(InventoryItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getItem(Long itemId) {
        return InventoryItemResponse.from(findItem(itemId));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getLowStockItems() {
        return itemRepository.findLowStockItems()
                .stream()
                .map(InventoryItemResponse::from)
                .toList();
    }

    @Transactional
    public InventoryTransactionResponse recordTransaction(
            Long itemId,
            InventoryTransactionType type,
            BigDecimal quantity,
            BigDecimal unitCost,
            String description) {

        InventoryItem item = findItem(itemId);

        if (type == null) {
            throw badRequest("Transaction type is required");
        }

        if (quantity == null || quantity.signum() <= 0) {
            throw badRequest("Quantity must be greater than zero");
        }

        if (quantity.scale() > 3) {
            throw badRequest("Quantity supports at most 3 decimal places");
        }

        if (description != null && description.length() > 500) {
            throw badRequest("Description cannot exceed 500 characters");
        }

        BigDecimal currentStock = item.getCurrentStock();
        BigDecimal currentCost = item.getAverageUnitCost();

        if (currentStock == null || currentCost == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Inventory item has invalid stock or cost data"
            );
        }

        BigDecimal recordedUnitCost;

        if (type == InventoryTransactionType.PURCHASE) {

            if (unitCost == null || unitCost.signum() < 0) {
                throw badRequest("Purchase unit cost cannot be negative");
            }

            if (unitCost.scale() > 2) {
                throw badRequest("Unit cost supports at most 2 decimal places");
            }

            BigDecimal purchaseCost = unitCost.setScale(2);
            BigDecimal newStock = currentStock.add(quantity);

            // Weighted-average cost:
            // (existing stock value + purchase value) / new stock
            BigDecimal existingValue = currentStock.multiply(currentCost);
            BigDecimal purchaseValue = quantity.multiply(purchaseCost);

            BigDecimal newAverageCost = existingValue
                    .add(purchaseValue)
                    .divide(newStock, 2, RoundingMode.HALF_UP);

            item.setCurrentStock(newStock);
            item.setAverageUnitCost(newAverageCost);

            recordedUnitCost = purchaseCost;

        } else if (type == InventoryTransactionType.CONSUMPTION
                || type == InventoryTransactionType.ADJUSTMENT_OUT) {

            if (currentStock.compareTo(quantity) < 0) {
                throw badRequest(
                        "Insufficient stock. Available stock: " + currentStock
                );
            }

            item.setCurrentStock(currentStock.subtract(quantity));
            recordedUnitCost = currentCost;

        } else if (type == InventoryTransactionType.ADJUSTMENT_IN) {

            item.setCurrentStock(currentStock.add(quantity));
            recordedUnitCost = currentCost;

        } else {
            throw badRequest("Unsupported transaction type");
        }

        itemRepository.save(item);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setItem(item);
        transaction.setType(type);
        transaction.setQuantity(quantity);
        transaction.setUnitCost(recordedUnitCost);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setDescription(
                description == null || description.isBlank()
                        ? null
                        : description.trim()
        );

        InventoryTransaction saved =
                transactionRepository.save(transaction);

        return InventoryTransactionResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getTransactionHistory(
            Long itemId) {

        // Also verifies that the item exists.
        findItem(itemId);

        return transactionRepository
                .findByItem_IdOrderByTransactionDateDescIdDesc(itemId)
                .stream()
                .map(InventoryTransactionResponse::from)
                .toList();
    }

    private InventoryItem findItem(Long itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inventory item not found: " + itemId
                ));
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message
        );
    }
}