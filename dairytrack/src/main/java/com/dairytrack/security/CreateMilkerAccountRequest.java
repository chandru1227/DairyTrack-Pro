
package com.dairytrack.security;

public class CreateMilkerAccountRequest {

    private Long milkerId;
    private String username;
    private String password;

    public CreateMilkerAccountRequest() {
    }

    public Long getMilkerId() {
        return milkerId;
    }

    public void setMilkerId(Long milkerId) {
        this.milkerId = milkerId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
