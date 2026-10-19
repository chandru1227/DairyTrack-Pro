package com.dairytrack.expense.repository;

import com.dairytrack.expense.Expense;
import com.dairytrack.expense.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByExpenseDateOrderByIdDesc(LocalDate expenseDate);

    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDescIdDesc(
            LocalDate startDate, LocalDate endDate);

    List<Expense> findByCategoryOrderByExpenseDateDescIdDesc(
            ExpenseCategory category);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.expenseDate = :date
            """)
    BigDecimal getTotalForDate(@Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.expenseDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getTotalBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT e.category, COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.expenseDate BETWEEN :startDate AND :endDate
            GROUP BY e.category
            ORDER BY e.category
            """)
    List<Object[]> getCategoryTotals(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}