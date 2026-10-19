package com.dairytrack.expense.service;

import com.dairytrack.expense.Expense;
import com.dairytrack.expense.ExpenseCategory;
import com.dairytrack.expense.repository.ExpenseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        validateExpense(expense);

        expense.setDescription(expense.getDescription().trim());

        return expenseRepository.save(expense);
    }

    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Expense getExpense(Long id) {
        return findExpense(id);
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesForDate(LocalDate date) {
        requireDate(date, "Expense date");
        return expenseRepository.findByExpenseDateOrderByIdDesc(date);
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesBetween(
            LocalDate startDate, LocalDate endDate) {

        validateDateRange(startDate, endDate);

        return expenseRepository
                .findByExpenseDateBetweenOrderByExpenseDateDescIdDesc(
                        startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByCategory(ExpenseCategory category) {
        if (category == null) {
            throw badRequest("Expense category is required");
        }

        return expenseRepository
                .findByCategoryOrderByExpenseDateDescIdDesc(category);
    }

    @Transactional(readOnly = true)
    public BigDecimal getDailyTotal(LocalDate date) {
        requireDate(date, "Expense date");
        return expenseRepository.getTotalForDate(date);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPeriodTotal(
            LocalDate startDate, LocalDate endDate) {

        validateDateRange(startDate, endDate);
        return expenseRepository.getTotalBetweenDates(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getCategoryTotals(
            LocalDate startDate, LocalDate endDate) {

        validateDateRange(startDate, endDate);

        Map<String, BigDecimal> totals = new LinkedHashMap<>();

        for (ExpenseCategory category : ExpenseCategory.values()) {
            totals.put(category.name(), BigDecimal.ZERO);
        }

        for (Object[] row : expenseRepository.getCategoryTotals(
                startDate, endDate)) {
            ExpenseCategory category = (ExpenseCategory) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            totals.put(category.name(), amount);
        }

        return totals;
    }

    private void validateExpense(Expense expense) {
        if (expense == null) {
            throw badRequest("Expense request body is required");
        }

        requireDate(expense.getExpenseDate(), "Expense date");

        if (expense.getCategory() == null) {
            throw badRequest("Expense category is required");
        }

        if (expense.getDescription() == null
                || expense.getDescription().isBlank()) {
            throw badRequest("Expense description is required");
        }

        if (expense.getDescription().trim().length() > 250) {
            throw badRequest("Description cannot exceed 250 characters");
        }

        BigDecimal amount = expense.getAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw badRequest("Expense amount must be greater than zero");
        }

        if (amount.scale() > 2) {
            throw badRequest("Expense amount supports at most 2 decimal places");
        }

        if (amount.precision() - amount.scale() > 9) {
            throw badRequest("Expense amount exceeds the supported maximum");
        }
    }

    private Expense findExpense(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Expense not found: " + id));
    }

    private void validateDateRange(
            LocalDate startDate, LocalDate endDate) {

        requireDate(startDate, "Start date");
        requireDate(endDate, "End date");

        if (startDate.isAfter(endDate)) {
            throw badRequest("Start date cannot be after end date");
        }
    }

    private void requireDate(LocalDate date, String fieldName) {
        if (date == null) {
            throw badRequest(fieldName + " is required");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, message);
    }
}