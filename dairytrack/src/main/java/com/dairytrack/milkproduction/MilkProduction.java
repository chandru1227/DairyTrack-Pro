
package com.dairytrack.milkproduction;

import com.dairytrack.livestock.Cow;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Digits;
import com.dairytrack.security.AppUser;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "milk_production",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_milk_cow_date_session",
                        columnNames = {"cow_id", "production_date", "session"}
                )
        }
)
public class MilkProduction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Cow is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cow_id", nullable = false)
    private Cow cow;

    @NotNull(message = "Production date is required")
    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;

    @NotNull(message = "Session is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MilkSession session;

    @NotNull(message = "Milk quantity is required")
    @DecimalMin(value = "0.0", message = "Milk quantity cannot be negative")
    @Digits(integer = 7, fraction = 2,
            message = "Milk quantity supports up to 2 decimal places")
    @Column(name = "quantity_litres", nullable = false, precision = 9, scale = 2)
    private BigDecimal quantityLitres;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_user_id")
    private AppUser recordedBy;

    public MilkProduction() {
    }

    public Long getId() {
        return id;
    }

    public Cow getCow() {
        return cow;
    }

    public void setCow(Cow cow) {
        this.cow = cow;
    }

    public LocalDate getProductionDate() {
        return productionDate;
    }

    public void setProductionDate(LocalDate productionDate) {
        this.productionDate = productionDate;
    }

    public MilkSession getSession() {
        return session;
    }

    public void setSession(MilkSession session) {
        this.session = session;
    }

    public BigDecimal getQuantityLitres() {
        return quantityLitres;
    }

    public void setQuantityLitres(BigDecimal quantityLitres) {
        this.quantityLitres = quantityLitres;
    }

    public AppUser getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(AppUser recordedBy) {
        this.recordedBy = recordedBy;
    }
}
