
package com.dairytrack.customer.service;

import com.dairytrack.customer.Customer;
import com.dairytrack.customer.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        normalizeCustomer(customer);

        if (customer.getPhoneNumber() != null
                && customerRepository.existsByPhoneNumber(
                customer.getPhoneNumber())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A customer with this phone number already exists"
            );
        }

        return customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found with id: " + id
                ));
    }

    @Transactional(readOnly = true)
    public List<Customer> searchCustomers(String name) {
        if (name == null || name.isBlank()) {
            return getAllCustomers();
        }

        return customerRepository
                .findByNameContainingIgnoreCaseOrderByNameAsc(name.trim());
    }

    @Transactional
    public Customer updateCustomer(Long id, Customer request) {
        Customer existingCustomer = getCustomerById(id);

        normalizeCustomer(request);

        String phoneNumber = request.getPhoneNumber();

        if (phoneNumber != null
                && customerRepository.existsByPhoneNumberAndIdNot(
                phoneNumber, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A customer with this phone number already exists"
            );
        }

        existingCustomer.setName(request.getName());
        existingCustomer.setPhoneNumber(phoneNumber);
        existingCustomer.setAddress(request.getAddress());

        return customerRepository.save(existingCustomer);
    }

    private void normalizeCustomer(Customer customer) {
        if (customer.getName() != null) {
            customer.setName(customer.getName().trim());
        }

        if (customer.getPhoneNumber() != null) {
            String phone = customer.getPhoneNumber().trim();
            customer.setPhoneNumber(phone.isEmpty() ? null : phone);
        }

        if (customer.getAddress() != null) {
            String address = customer.getAddress().trim();
            customer.setAddress(address.isEmpty() ? null : address);
        }
    }
}
