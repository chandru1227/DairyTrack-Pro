package com.dairytrack.milker.repository;

import com.dairytrack.milker.Attendance;
import com.dairytrack.milker.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByMilker_IdAndAttendanceDateAndSession(
            Long milkerId,
            LocalDate attendanceDate,
            AttendanceSession session
    );

    boolean existsByMilker_IdAndAttendanceDateAndSessionAndIdNot(
            Long milkerId,
            LocalDate attendanceDate,
            AttendanceSession session,
            Long id
    );

    Optional<Attendance> findByIdAndMilker_Id(
            Long attendanceId,
            Long milkerId
    );

    List<Attendance>
    findByMilker_IdAndAttendanceDateBetweenOrderByAttendanceDateAscSessionAsc(
            Long milkerId,
            LocalDate startDate,
            LocalDate endDate
    );
}