package com.dairytrack.milker.repository;

import com.dairytrack.milker.SalaryPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SalaryPaymentRepository
        extends JpaRepository<SalaryPayment, Long> {

    boolean existsByAttendance_Id(Long attendanceId);

    List<SalaryPayment>
    findByAttendance_Milker_IdAndPaymentDateBetweenOrderByPaymentDateAsc(
            Long milkerId,
            LocalDate startDate,
            LocalDate endDate
    );
}