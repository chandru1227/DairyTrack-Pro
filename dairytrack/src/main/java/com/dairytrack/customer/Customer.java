
package com.dairytrack.customer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Customer name is required")
    @Size(max = 120, message = "Customer name cannot exceed 120 characters")
    @Column(name = "customer_name", nullable = false, length = 120)
    private String name;

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    @Column(length = 255)
    private String address;

    public Customer() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
