
package com.dairytrack.livestock.repository;

import com.dairytrack.livestock.Cow;
import com.dairytrack.livestock.CowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CowRepository extends JpaRepository<Cow, Long> {

    Optional<Cow> findByCowCode(String cowCode);

    boolean existsByCowCode(String cowCode);

    boolean existsByCowCodeAndIdNot(String cowCode, Long id);

    List<Cow> findByStatus(CowStatus status);

    List<Cow> findByCowCodeContainingIgnoreCase(String code);
}
