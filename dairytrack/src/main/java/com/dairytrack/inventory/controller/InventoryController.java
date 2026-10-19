package com.dairytrack.inventory.controller;

import com.dairytrack.inventory.InventoryItem;
import com.dairytrack.inventory.InventoryTransactionType;
import com.dairytrack.inventory.InventoryItemResponse;
import com.dairytrack.inventory.InventoryTransactionResponse;
import com.dairytrack.inventory.service.InventoryService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemResponse createItem(
            @RequestBody InventoryItem item) {
        return inventoryService.createItem(item);
    }

    @GetMapping("/items")
    public List<InventoryItemResponse> getAllItems() {
        return inventoryService.getAllItems();
    }

    @GetMapping("/items/low-stock")
    public List<InventoryItemResponse> getLowStockItems() {
        return inventoryService.getLowStockItems();
    }

    @GetMapping("/items/{itemId}")
    public InventoryItemResponse getItem(
            @PathVariable Long itemId) {
        return inventoryService.getItem(itemId);
    }

    @PostMapping("/items/{itemId}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryTransactionResponse recordTransaction(
            @PathVariable Long itemId,
            @RequestBody InventoryTransactionRequest request) {

        return inventoryService.recordTransaction(
                itemId,
                request.type(),
                request.quantity(),
                request.unitCost(),
                request.description()
        );
    }

    @GetMapping("/items/{itemId}/transactions")
    public List<InventoryTransactionResponse> getTransactionHistory(
            @PathVariable Long itemId) {
        return inventoryService.getTransactionHistory(itemId);
    }

    public record InventoryTransactionRequest(
            InventoryTransactionType type,
            BigDecimal quantity,
            BigDecimal unitCost,
            String description
    ) {
    }
}