
package com.dairytrack.inventory;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Entity
@Table(
        name = "inventory_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_inventory_item_code",
                        columnNames = "item_code"
                )
        }
)
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Item code is required")
    @Size(max = 30, message = "Item code cannot exceed 30 characters")
    @Column(name = "item_code", nullable = false, length = 30)
    private String itemCode;

    @NotBlank(message = "Item name is required")
    @Size(max = 100, message = "Item name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InventoryCategory category;

    @NotBlank(message = "Unit is required")
    @Size(max = 20, message = "Unit cannot exceed 20 characters")
    @Column(nullable = false, length = 20)
    private String unit;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 9, fraction = 3)
    @Column(name = "current_stock", nullable = false,
            precision = 12, scale = 3)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @NotNull(message = "Minimum stock is required")
    @DecimalMin("0.0")
    @Digits(integer = 9, fraction = 3)
    @Column(name = "minimum_stock", nullable = false,
            precision = 12, scale = 3)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 9, fraction = 2)
    @Column(name = "average_unit_cost", nullable = false,
            precision = 11, scale = 2)
    private BigDecimal averageUnitCost = BigDecimal.ZERO;

    public InventoryItem() {
    }

    public Long getId() {
        return id;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public InventoryCategory getCategory() {
        return category;
    }

    public void setCategory(InventoryCategory category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(BigDecimal minimumStock) {
        this.minimumStock = minimumStock;
    }

    public BigDecimal getAverageUnitCost() {
        return averageUnitCost;
    }

    public void setAverageUnitCost(BigDecimal averageUnitCost) {
        this.averageUnitCost = averageUnitCost;
    }
}
