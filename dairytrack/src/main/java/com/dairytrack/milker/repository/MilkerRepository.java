package com.dairytrack.milker.repository;

import com.dairytrack.milker.Milker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilkerRepository extends JpaRepository<Milker, Long> {

    List<Milker> findAllByOrderByFullNameAsc();
}