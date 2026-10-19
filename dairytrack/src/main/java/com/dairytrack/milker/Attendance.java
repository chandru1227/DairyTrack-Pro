package com.dairytrack.milker;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "milker_attendance",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_milker_attendance_session",
                columnNames = {"milker_id", "attendance_date", "session"}
        )
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "milker_id", nullable = false)
    private Milker milker;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AttendanceSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AttendanceStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal salaryEarned;

    @Column(length = 250)
    private String notes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Milker getMilker() {
        return milker;
    }

    public void setMilker(Milker milker) {
        this.milker = milker;
    }

    public LocalDate getAttendanceDate() {
        return attendanceDate;
    }

    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public BigDecimal getSalaryEarned() {
        return salaryEarned;
    }

    public void setSalaryEarned(BigDecimal salaryEarned) {
        this.salaryEarned = salaryEarned;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}