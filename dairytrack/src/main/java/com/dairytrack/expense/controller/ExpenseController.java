package com.dairytrack.expense.controller;

import com.dairytrack.expense.Expense;
import com.dairytrack.expense.ExpenseCategory;
import com.dairytrack.expense.service.ExpenseService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Expense createExpense(@RequestBody Expense expense) {
        return expenseService.createExpense(expense);
    }

    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/{id}")
    public Expense getExpense(@PathVariable Long id) {
        return expenseService.getExpense(id);
    }

    @GetMapping("/date")
    public List<Expense> getExpensesForDate(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return expenseService.getExpensesForDate(date);
    }

    @GetMapping("/range")
    public List<Expense> getExpensesBetween(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return expenseService.getExpensesBetween(startDate, endDate);
    }

    @GetMapping("/category/{category}")
    public List<Expense> getExpensesByCategory(
            @PathVariable ExpenseCategory category) {
        return expenseService.getExpensesByCategory(category);
    }

    @GetMapping("/daily-total")
    public BigDecimal getDailyTotal(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return expenseService.getDailyTotal(date);
    }

    @GetMapping("/period-total")
    public BigDecimal getPeriodTotal(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return expenseService.getPeriodTotal(startDate, endDate);
    }

    @GetMapping("/category-totals")
    public Map<String, BigDecimal> getCategoryTotals(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {
        return expenseService.getCategoryTotals(startDate, endDate);
    }
}