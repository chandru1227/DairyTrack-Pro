package com.dairytrack.milker.controller;

import com.dairytrack.milker.Attendance;
import com.dairytrack.milker.Milker;
import com.dairytrack.milker.service.MilkerService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import com.dairytrack.milker.SalaryPayment;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/milkers")
public class MilkerController {

    private final MilkerService milkerService;

    public MilkerController(MilkerService milkerService) {
        this.milkerService = milkerService;
    }

    @PostMapping
    public Milker createMilker(@RequestBody Milker milker) {
        return milkerService.createMilker(milker);
    }

    @GetMapping
    public List<Milker> getAllMilkers() {
        return milkerService.getAllMilkers();
    }

    @GetMapping("/{id}")
    public Milker getMilker(@PathVariable Long id) {
        return milkerService.getMilker(id);
    }

    @PutMapping("/{id}")
    public Milker updateMilker(
            @PathVariable Long id,
            @RequestBody Milker milker) {

        return milkerService.updateMilker(id, milker);
    }

    @PostMapping("/{id}/attendance")
    public Attendance recordAttendance(
            @PathVariable Long id,
            @RequestBody Attendance attendance) {

        return milkerService.recordAttendance(id, attendance);
    }

    @GetMapping("/{id}/attendance")
    public List<Attendance> getAttendance(
            @PathVariable Long id,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return milkerService.getAttendance(id, startDate, endDate);
    }


    @PostMapping("/{id}/attendance/{attendanceId}/pay")
    public SalaryPayment payDailySalary(
            @PathVariable Long id,
            @PathVariable Long attendanceId,
            @RequestParam
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate paymentDate) {

        return milkerService.payDailySalary(id, attendanceId, paymentDate);
    }

    @GetMapping("/{id}/salary-payments")
    public java.util.List<SalaryPayment> getSalaryPayments(
            @PathVariable Long id,
            @RequestParam
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate startDate,
            @RequestParam
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate endDate) {

        return milkerService.getSalaryPayments(id, startDate, endDate);
    }


    @PutMapping("/{id}/attendance/{attendanceId}")
    public Attendance updateAttendance(
            @PathVariable Long id,
            @PathVariable Long attendanceId,
            @RequestBody Attendance attendance) {

        return milkerService.updateAttendance(
                id, attendanceId, attendance
        );
    }

}