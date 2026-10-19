package com.dairytrack.sales.repository;

import com.dairytrack.sales.MilkSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MilkSaleRepository extends JpaRepository<MilkSale, Long> {

    List<MilkSale> findBySaleDateOrderByIdDesc(LocalDate saleDate);

    List<MilkSale> findBySaleDateBetweenOrderBySaleDateDescIdDesc(
            LocalDate startDate, LocalDate endDate);

    List<MilkSale> findByCustomerNameContainingIgnoreCaseOrderBySaleDateDesc(
            String customerName);

    @Query("""
            SELECT COALESCE(SUM(s.quantityLitres * s.pricePerLitre), 0)
            FROM MilkSale s
            WHERE s.saleDate = :date
            """)
    BigDecimal getRevenueForDate(@Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(s.quantityLitres * s.pricePerLitre), 0)
            FROM MilkSale s
            WHERE s.saleDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getRevenueBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT COALESCE(
                SUM((s.quantityLitres * s.pricePerLitre) - s.amountPaid), 0)
            FROM MilkSale s
            WHERE s.saleDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getOutstandingBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
        SELECT COALESCE(SUM(s.quantityLitres), 0)
        FROM MilkSale s
        WHERE s.saleDate BETWEEN :startDate AND :endDate
        """)
    BigDecimal getLitresSoldBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("""
            SELECT new com.dairytrack.sales.CustomerSalesSummary(
                s.customerId,
                s.customerName,
                COUNT(s.id),
                COALESCE(SUM(s.quantityLitres), 0),
                COALESCE(SUM(s.quantityLitres * s.pricePerLitre), 0),
                COALESCE(SUM(s.amountPaid), 0),
                COALESCE(
                    SUM((s.quantityLitres * s.pricePerLitre) - s.amountPaid), 0
                )
            )
            FROM MilkSale s
            WHERE s.saleDate BETWEEN :startDate AND :endDate
            GROUP BY s.customerId, s.customerName
            ORDER BY s.customerName ASC
            """)
    List<com.dairytrack.sales.CustomerSalesSummary> getCustomerSalesSummary(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    List<MilkSale> findByCustomerIdOrderBySaleDateDescIdDesc(
            Long customerId);
}