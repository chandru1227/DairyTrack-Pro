package com.dairytrack.milker;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "milkers")
public class Milker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(length = 30)
    private String phoneNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal morningRate = new BigDecimal("300.00");

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal eveningRate = new BigDecimal("300.00");

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public BigDecimal getMorningRate() {
        return morningRate;
    }

    public void setMorningRate(BigDecimal morningRate) {
        this.morningRate = morningRate;
    }

    public BigDecimal getEveningRate() {
        return eveningRate;
    }

    public void setEveningRate(BigDecimal eveningRate) {
        this.eveningRate = eveningRate;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}