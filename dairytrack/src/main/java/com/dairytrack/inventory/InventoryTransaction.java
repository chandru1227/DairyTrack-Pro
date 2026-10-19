
package com.dairytrack.inventory;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem item;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InventoryTransactionType type;

    @NotNull
    @DecimalMin(value = "0.001")
    @Digits(integer = 9, fraction = 3)
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 9, fraction = 2)
    @Column(name = "unit_cost", nullable = false,
            precision = 11, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @NotNull
    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    public InventoryTransaction() {
    }

    public Long getId() {
        return id;
    }

    public InventoryItem getItem() {
        return item;
    }

    public void setItem(InventoryItem item) {
        this.item = item;
    }

    public InventoryTransactionType getType() {
        return type;
    }

    public void setType(InventoryTransactionType type) {
        this.type = type;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
