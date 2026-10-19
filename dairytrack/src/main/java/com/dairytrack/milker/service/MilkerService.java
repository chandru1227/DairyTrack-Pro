
package com.dairytrack.milker.service;

import com.dairytrack.expense.Expense;
import com.dairytrack.expense.ExpenseCategory;
import com.dairytrack.expense.repository.ExpenseRepository;
import com.dairytrack.milker.*;
import com.dairytrack.milker.repository.AttendanceRepository;
import com.dairytrack.milker.repository.MilkerRepository;
import com.dairytrack.milker.repository.SalaryPaymentRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MilkerService {

    private final MilkerRepository milkerRepository;
    private final AttendanceRepository attendanceRepository;
    private final SalaryPaymentRepository salaryPaymentRepository;
    private final ExpenseRepository expenseRepository;

    public MilkerService(
            MilkerRepository milkerRepository,
            AttendanceRepository attendanceRepository,
            SalaryPaymentRepository salaryPaymentRepository,
            ExpenseRepository expenseRepository) {
        this.milkerRepository = milkerRepository;
        this.attendanceRepository = attendanceRepository;
        this.salaryPaymentRepository = salaryPaymentRepository;
        this.expenseRepository = expenseRepository;
    }

    // ---------------- MILKER MANAGEMENT ----------------

    @Transactional
    public Milker createMilker(Milker milker) {
        validateMilker(milker);

        milker.setId(null);
        milker.setFullName(milker.getFullName().trim());
        milker.setPhoneNumber(clean(milker.getPhoneNumber()));

        if (milker.getMorningRate() == null) {
            milker.setMorningRate(new BigDecimal("300.00"));
        }
        if (milker.getEveningRate() == null) {
            milker.setEveningRate(new BigDecimal("300.00"));
        }

        validateRates(milker);
        milker.setActive(true);

        return milkerRepository.save(milker);
    }

    @Transactional(readOnly = true)
    public List<Milker> getAllMilkers() {
        return milkerRepository.findAllByOrderByFullNameAsc();
    }

    @Transactional(readOnly = true)
    public Milker getMilker(Long id) {
        return findMilker(id);
    }

    @Transactional
    public Milker updateMilker(Long id, Milker request) {
        Milker existing = findMilker(id);

        validateMilker(request);
        validateRates(request);

        existing.setFullName(request.getFullName().trim());
        existing.setPhoneNumber(clean(request.getPhoneNumber()));
        existing.setMorningRate(request.getMorningRate());
        existing.setEveningRate(request.getEveningRate());
        existing.setActive(request.isActive());

        return milkerRepository.save(existing);
    }

    // ---------------- ATTENDANCE ----------------

    @Transactional
    public Attendance recordAttendance(Long milkerId, Attendance request) {
        Milker milker = findMilker(milkerId);

        if (!milker.isActive()) {
            throw badRequest("Cannot record attendance for an inactive milker.");
        }

        validateAttendanceRequest(request);

        if (attendanceRepository
                .existsByMilker_IdAndAttendanceDateAndSession(
                        milkerId,
                        request.getAttendanceDate(),
                        request.getSession())) {
            throw badRequest(
                    "Attendance already exists for this milker, date and session.");
        }

        request.setId(null);
        request.setMilker(milker);
        request.setNotes(clean(request.getNotes()));
        calculateSalary(request, milker);

        return attendanceRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendance(
            Long milkerId, LocalDate startDate, LocalDate endDate) {
        findMilker(milkerId);
        validateDateRange(startDate, endDate);

        return attendanceRepository
                .findByMilker_IdAndAttendanceDateBetweenOrderByAttendanceDateAscSessionAsc(
                        milkerId, startDate, endDate);
    }

    @Transactional
    public Attendance updateAttendance(
            Long milkerId, Long attendanceId, Attendance request) {
        Milker milker = findMilker(milkerId);

        Attendance existing = attendanceRepository
                .findByIdAndMilker_Id(attendanceId, milkerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Attendance record not found."));

        // Do not alter attendance after its salary has been paid.
        if (salaryPaymentRepository.existsByAttendance_Id(attendanceId)) {
            throw badRequest(
                    "This session has already been paid. Use a correction process instead.");
        }

        validateAttendanceRequest(request);

        if (attendanceRepository
                .existsByMilker_IdAndAttendanceDateAndSessionAndIdNot(
                        milkerId,
                        request.getAttendanceDate(),
                        request.getSession(),
                        attendanceId)) {
            throw badRequest(
                    "Another attendance record already exists for this date and session.");
        }

        existing.setAttendanceDate(request.getAttendanceDate());
        existing.setSession(request.getSession());
        existing.setStatus(request.getStatus());
        existing.setNotes(clean(request.getNotes()));
        calculateSalary(existing, milker);

        return attendanceRepository.save(existing);
    }

    private void calculateSalary(Attendance attendance, Milker milker) {
        if (attendance.getStatus() == AttendanceStatus.ABSENT) {
            attendance.setSalaryEarned(BigDecimal.ZERO);
        } else if (attendance.getSession() == AttendanceSession.MORNING) {
            attendance.setSalaryEarned(milker.getMorningRate());
        } else {
            attendance.setSalaryEarned(milker.getEveningRate());
        }
    }

    // ---------------- DAILY SALARY PAYMENT ----------------

    @Transactional
    public SalaryPayment payDailySalary(
            Long milkerId, Long attendanceId, LocalDate paymentDate) {
        if (paymentDate == null) {
            throw badRequest("Payment date is required.");
        }

        Attendance attendance = attendanceRepository
                .findByIdAndMilker_Id(attendanceId, milkerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Attendance record not found."));

        if (attendance.getStatus() != AttendanceStatus.PRESENT) {
            throw badRequest("Salary can only be paid for a present session.");
        }

        if (!paymentDate.equals(attendance.getAttendanceDate())) {
            throw badRequest(
                    "The payment date must match the attendance date for daily salary payment.");
        }

        if (salaryPaymentRepository.existsByAttendance_Id(attendanceId)) {
            throw badRequest("Salary has already been paid for this session.");
        }

        BigDecimal amount = attendance.getSalaryEarned();
        if (amount == null || amount.signum() <= 0) {
            throw badRequest("The session salary must be greater than zero.");
        }

        // Create the labour expense and salary payment in one transaction.
        Expense expense = new Expense();
        expense.setExpenseDate(paymentDate);
        expense.setCategory(ExpenseCategory.LABOUR);
        expense.setDescription(
                "Milker salary - " + attendance.getMilker().getFullName()
                        + " - " + attendance.getSession()
                        + " - " + paymentDate);
        expense.setAmount(amount);

        Expense savedExpense = expenseRepository.save(expense);

        SalaryPayment payment = new SalaryPayment();
        payment.setAttendance(attendance);
        payment.setPaymentDate(paymentDate);
        payment.setAmount(amount);
        payment.setExpenseId(savedExpense.getId());

        try {
            return salaryPaymentRepository.saveAndFlush(payment);
        } catch (DataIntegrityViolationException ex) {
            // The unique attendance constraint prevents duplicate payment.
            throw badRequest("Salary has already been paid for this session.");
        }
    }

    @Transactional(readOnly = true)
    public List<SalaryPayment> getSalaryPayments(
            Long milkerId, LocalDate startDate, LocalDate endDate) {
        findMilker(milkerId);
        validateDateRange(startDate, endDate);

        return salaryPaymentRepository
                .findByAttendance_Milker_IdAndPaymentDateBetweenOrderByPaymentDateAsc(
                        milkerId, startDate, endDate);
    }

    // ---------------- VALIDATION ----------------

    private void validateAttendanceRequest(Attendance attendance) {
        if (attendance == null
                || attendance.getAttendanceDate() == null
                || attendance.getSession() == null
                || attendance.getStatus() == null) {
            throw badRequest("Attendance date, session and status are required.");
        }

        if (attendance.getAttendanceDate().isAfter(LocalDate.now())) {
            throw badRequest("Future attendance cannot be recorded.");
        }

        if (attendance.getNotes() != null && attendance.getNotes().length() > 250) {
            throw badRequest("Attendance notes cannot exceed 250 characters.");
        }
    }

    private void validateMilker(Milker milker) {
        if (milker == null
                || milker.getFullName() == null
                || milker.getFullName().isBlank()) {
            throw badRequest("Milker name is required.");
        }

        if (milker.getFullName().trim().length() > 120) {
            throw badRequest("Milker name cannot exceed 120 characters.");
        }

        if (milker.getPhoneNumber() != null
                && milker.getPhoneNumber().trim().length() > 30) {
            throw badRequest("Phone number cannot exceed 30 characters.");
        }
    }

    private void validateRates(Milker milker) {
        if (milker.getMorningRate() == null
                || milker.getEveningRate() == null
                || milker.getMorningRate().signum() < 0
                || milker.getEveningRate().signum() < 0
                || milker.getMorningRate().scale() > 2
                || milker.getEveningRate().scale() > 2) {
            throw badRequest(
                    "Morning and evening rates must be non-negative amounts with at most two decimal places.");
        }
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isAfter(end)) {
            throw badRequest("Provide a valid start date and end date.");
        }
    }

    private Milker findMilker(Long id) {
        return milkerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Milker not found."));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
