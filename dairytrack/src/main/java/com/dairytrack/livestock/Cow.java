
package com.dairytrack.livestock;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(
        name = "cows",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cows_cow_code",
                        columnNames = "cow_code"
                )
        }
)
public class Cow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Cow code is required")
    @Size(max = 30, message = "Cow code cannot exceed 30 characters")
    @Column(name = "cow_code", nullable = false, length = 30)
    private String cowCode;

    @NotBlank(message = "Breed is required")
    @Size(max = 100, message = "Breed cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String breed;

    @NotNull(message = "Joining date is required")
    @Column(name = "joining_date", nullable = false)
    private LocalDate joiningDate;

    @Column(name = "mating_date")
    private LocalDate matingDate;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CowStatus status = CowStatus.ACTIVE;

    public Cow() {
    }

    public Long getId() {
        return id;
    }

    public String getCowCode() {
        return cowCode;
    }

    public void setCowCode(String cowCode) {
        this.cowCode = cowCode;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public LocalDate getMatingDate() {
        return matingDate;
    }

    public void setMatingDate(LocalDate matingDate) {
        this.matingDate = matingDate;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public CowStatus getStatus() {
        return status;
    }

    public void setStatus(CowStatus status) {
        this.status = status;
    }
}
