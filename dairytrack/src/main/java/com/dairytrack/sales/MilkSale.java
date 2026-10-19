package com.dairytrack.sales;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "milk_sales")
public class MilkSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Sale date is required")
    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @NotBlank(message = "Customer name is required")
    @Size(max = 120, message = "Customer name cannot exceed 120 characters")
    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;
    @Column(name = "customer_id")
    private Long customerId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than zero")
    @Digits(integer = 9, fraction = 3,
            message = "Quantity supports at most 3 decimal places")
    @Column(name = "quantity_litres", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityLitres;

    @NotNull(message = "Price per litre is required")
    @DecimalMin(value = "0.01", message = "Price per litre must be greater than zero")
    @Digits(integer = 9, fraction = 2,
            message = "Price supports at most 2 decimal places")
    @Column(name = "price_per_litre", nullable = false, precision = 11, scale = 2)
    private BigDecimal pricePerLitre;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @NotNull(message = "Amount paid is required")
    @DecimalMin(value = "0.00", message = "Amount paid cannot be negative")
    @Digits(integer = 11, fraction = 2,
            message = "Amount paid supports at most 2 decimal places")
    @Column(name = "amount_paid", nullable = false, precision = 13, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    @Column(length = 500)
    private String notes;

    public MilkSale() {
    }

    public Long getId() {
        return id;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getQuantityLitres() {
        return quantityLitres;
    }

    public void setQuantityLitres(BigDecimal quantityLitres) {
        this.quantityLitres = quantityLitres;
    }

    public BigDecimal getPricePerLitre() {
        return pricePerLitre;
    }

    public void setPricePerLitre(BigDecimal pricePerLitre) {
        this.pricePerLitre = pricePerLitre;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}