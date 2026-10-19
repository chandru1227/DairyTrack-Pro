
package com.dairytrack.sales;

import java.math.BigDecimal;

public class CustomerSalesSummary {

    private Long customerId;
    private String customerName;
    private Long totalSales;
    private BigDecimal totalLitres;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal outstandingAmount;

    public CustomerSalesSummary(
            Long customerId,
            String customerName,
            Long totalSales,
            BigDecimal totalLitres,
            BigDecimal totalAmount,
            BigDecimal totalPaid,
            BigDecimal outstandingAmount) {

        this.customerId = customerId;
        this.customerName = customerName;
        this.totalSales = totalSales;
        this.totalLitres = totalLitres;
        this.totalAmount = totalAmount;
        this.totalPaid = totalPaid;
        this.outstandingAmount = outstandingAmount;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public Long getTotalSales() {
        return totalSales;
    }

    public BigDecimal getTotalLitres() {
        return totalLitres;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }
}
