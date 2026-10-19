
package com.dairytrack.milkproduction.repository;

import com.dairytrack.milkproduction.MilkProduction;
import com.dairytrack.milkproduction.MilkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MilkProductionRepository
        extends JpaRepository<MilkProduction, Long> {

    boolean existsByCow_IdAndProductionDateAndSession(
            Long cowId,
            LocalDate date,
            MilkSession session
    );

    boolean existsByCow_IdAndProductionDateAndSessionAndIdNot(
            Long cowId,
            LocalDate date,
            MilkSession session,
            Long id
    );

    List<MilkProduction> findByProductionDateOrderBySessionAsc(
            LocalDate date
    );

    List<MilkProduction> findByCow_IdOrderByProductionDateDesc(
            Long cowId
    );

    @Query("""
        SELECT COALESCE(SUM(m.quantityLitres), 0)
        FROM MilkProduction m
        WHERE m.productionDate = :date
        """)
    BigDecimal getTotalForDate(@Param("date") LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(m.quantityLitres), 0)
        FROM MilkProduction m
        WHERE m.productionDate BETWEEN :startDate AND :endDate
        """)
    BigDecimal getTotalBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT m.cow.id, m.cow.cowCode,
               SUM(m.quantityLitres)
        FROM MilkProduction m
        WHERE m.productionDate BETWEEN :startDate AND :endDate
        GROUP BY m.cow.id, m.cow.cowCode
        ORDER BY SUM(m.quantityLitres) DESC
        """)
    List<Object[]> getCowProductionComparison(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT m.cow.id, m.cow.cowCode,
               m.productionDate, SUM(m.quantityLitres)
        FROM MilkProduction m
        WHERE m.productionDate BETWEEN :startDate AND :endDate
        GROUP BY m.cow.id, m.cow.cowCode, m.productionDate
        """)
    List<Object[]> getDailyProductionByCow(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<MilkProduction> findByRecordedBy_IdAndProductionDateOrderBySessionAsc(
            Long userId,
            LocalDate productionDate
    );

    List<MilkProduction> findByRecordedBy_IdOrderByProductionDateDesc(
            Long userId
    );

    List<MilkProduction> findByRecordedBy_IdAndProductionDateBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );
}
