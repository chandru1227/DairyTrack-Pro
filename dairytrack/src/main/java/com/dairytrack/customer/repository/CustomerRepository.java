
package com.dairytrack.customer.repository;

import com.dairytrack.customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    List<Customer> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    List<Customer> findAllByOrderByNameAsc();
}
