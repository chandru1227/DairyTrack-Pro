
package com.dairytrack.milkproduction.service;

import com.dairytrack.livestock.Cow;
import com.dairytrack.livestock.CowStatus;
import com.dairytrack.livestock.repository.CowRepository;
import com.dairytrack.milkproduction.MilkProduction;
import com.dairytrack.milkproduction.MilkProductionResponse;
import com.dairytrack.milkproduction.MilkSession;
import com.dairytrack.milkproduction.repository.MilkProductionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.dairytrack.security.AppUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.dairytrack.security.AppUserRepository;
@Service
@Transactional
public class MilkProductionService {

    private static final BigDecimal DROP_THRESHOLD =
            new BigDecimal("30");

    private final MilkProductionRepository milkRepository;
    private final CowRepository cowRepository;
    private final AppUserRepository appUserRepository;
    public MilkProductionService(
            MilkProductionRepository milkRepository,
            CowRepository cowRepository,
            AppUserRepository appUserRepository) {
        this.milkRepository = milkRepository;
        this.cowRepository = cowRepository;
        this.appUserRepository = appUserRepository;
    }

    public MilkProductionResponse recordMilk(
            Long cowId,
            LocalDate date,
            MilkSession session,
            BigDecimal quantityLitres,
            String username) {

        validateEntry(date, session, quantityLitres);

        Cow cow = getActiveCow(cowId);

        if (milkRepository
                .existsByCow_IdAndProductionDateAndSession(
                        cowId, date, session)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A milk entry already exists for this cow, date and session"
            );
        }

        MilkProduction record = new MilkProduction();
        record.setCow(cow);
        record.setProductionDate(date);
        record.setSession(session);
        record.setQuantityLitres(quantityLitres);

        AppUser recordedBy = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User account not found"));

        if (!recordedBy.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        record.setRecordedBy(recordedBy);

        return MilkProductionResponse.from(
                milkRepository.save(record)
        );
    }

    public MilkProductionResponse updateMilk(
            Long id,
            Long cowId,
            LocalDate date,
            MilkSession session,
            BigDecimal quantityLitres) {

        validateEntry(date, session, quantityLitres);

        MilkProduction existing = milkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Milk entry not found with ID: " + id
                ));

        Cow cow = getActiveCow(cowId);

        if (milkRepository
                .existsByCow_IdAndProductionDateAndSessionAndIdNot(
                        cowId, date, session, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another milk entry already exists for this cow, date and session"
            );
        }

        existing.setCow(cow);
        existing.setProductionDate(date);
        existing.setSession(session);
        existing.setQuantityLitres(quantityLitres);

        return MilkProductionResponse.from(
                milkRepository.save(existing)
        );
    }

//    @Transactional(readOnly = true)
    @Transactional(readOnly = true)
    public List<MilkProductionResponse> getMilkForDate(
            LocalDate date,
            String username) {

        if (date == null) {
            throw badRequest("Production date is required");
        }

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        List<MilkProduction> records;

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            records = milkRepository
                    .findByProductionDateOrderBySessionAsc(date);
        } else {
            records = milkRepository
                    .findByRecordedBy_IdAndProductionDateOrderBySessionAsc(
                            user.getId(), date
                    );
        }

        return records.stream()
                .map(MilkProductionResponse::from)
                .toList();
    }
    @Transactional(readOnly = true)
    public BigDecimal getDailyTotal(LocalDate date, String username) {
        requireDate(date);

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            return milkRepository.getTotalForDate(date);
        }

        return milkRepository
                .findByRecordedBy_IdAndProductionDateOrderBySessionAsc(
                        user.getId(), date
                )
                .stream()
                .map(MilkProduction::getQuantityLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public BigDecimal getWeeklyTotal(LocalDate date, String username) {
        requireDate(date);

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        LocalDate start = date.with(
                TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)
        );
        LocalDate end = start.plusDays(6);

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            return milkRepository.getTotalBetweenDates(start, end);
        }

        return milkRepository
                .findByRecordedBy_IdAndProductionDateBetween(
                        user.getId(), start, end
                )
                .stream()
                .map(MilkProduction::getQuantityLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMonthlyTotal(
            int year,
            int month,
            String username) {

        YearMonth yearMonth;

        try {
            yearMonth = YearMonth.of(year, month);
        } catch (RuntimeException exception) {
            throw badRequest("A valid year and month are required");
        }

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            return milkRepository.getTotalBetweenDates(start, end);
        }

        return milkRepository
                .findByRecordedBy_IdAndProductionDateBetween(
                        user.getId(), start, end
                )
                .stream()
                .map(MilkProduction::getQuantityLitres)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCowComparison(
            LocalDate startDate,
            LocalDate endDate,
            String username) {

        validateDateRange(startDate, endDate);

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        List<Map<String, Object>> result = new ArrayList<>();

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            for (Object[] row : milkRepository.getCowProductionComparison(
                    startDate, endDate)) {

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("cowId", row[0]);
                item.put("cowCode", row[1]);
                item.put("totalLitres", row[2]);
                result.add(item);
            }

            return result;
        }

        List<MilkProduction> records =
                milkRepository.findByRecordedBy_IdAndProductionDateBetween(
                        user.getId(), startDate, endDate
                );

        Map<Long, BigDecimal> totalsByCow = new LinkedHashMap<>();
        Map<Long, String> cowCodes = new LinkedHashMap<>();

        for (MilkProduction record : records) {
            Long cowId = record.getCow().getId();

            totalsByCow.merge(
                    cowId,
                    record.getQuantityLitres(),
                    BigDecimal::add
            );

            cowCodes.put(cowId, record.getCow().getCowCode());
        }

        for (Map.Entry<Long, BigDecimal> entry : totalsByCow.entrySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("cowId", entry.getKey());
            item.put("cowCode", cowCodes.get(entry.getKey()));
            item.put("totalLitres", entry.getValue());
            result.add(item);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<MilkProductionResponse> getCowHistory(
            Long cowId,
            String username) {

        if (!cowRepository.existsById(cowId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Cow not found with ID: " + cowId
            );
        }

        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User account not found"
                ));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User account is inactive"
            );
        }

        List<MilkProduction> records;

        if (user.getRole() == com.dairytrack.security.UserRole.OWNER) {
            records = milkRepository
                    .findByCow_IdOrderByProductionDateDesc(cowId);
        } else {
            records = milkRepository
                    .findByRecordedBy_IdOrderByProductionDateDesc(
                            user.getId()
                    )
                    .stream()
                    .filter(record -> record.getCow().getId().equals(cowId))
                    .toList();
        }

        return records.stream()
                .map(MilkProductionResponse::from)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProductionDecreaseAlerts(
            LocalDate date) {

        requireDate(date);

        List<Object[]> rows =
                milkRepository.getDailyProductionByCow(
                        date.minusDays(7), date
                );

        Map<Long, CowDailyData> cows = new LinkedHashMap<>();

        for (Object[] row : rows) {
            Long cowId = ((Number) row[0]).longValue();
            String cowCode = (String) row[1];
            LocalDate productionDate = (LocalDate) row[2];
            BigDecimal total = (BigDecimal) row[3];

            CowDailyData data = cows.computeIfAbsent(
                    cowId,
                    ignored -> new CowDailyData(cowCode)
            );

            data.dailyTotals.put(productionDate, total);
        }

        List<Map<String, Object>> alerts = new ArrayList<>();

        for (Map.Entry<Long, CowDailyData> entry : cows.entrySet()) {
            Long cowId = entry.getKey();
            CowDailyData data = entry.getValue();

            BigDecimal current = data.dailyTotals.get(date);

            if (current == null) {
                continue;
            }

            BigDecimal previousSum = BigDecimal.ZERO;
            int recordedDays = 0;

            for (int i = 1; i <= 7; i++) {
                BigDecimal previous =
                        data.dailyTotals.get(date.minusDays(i));

                if (previous != null) {
                    previousSum = previousSum.add(previous);
                    recordedDays++;
                }
            }

            if (recordedDays < 3) {
                continue;
            }

            BigDecimal average = previousSum.divide(
                    BigDecimal.valueOf(recordedDays),
                    2,
                    RoundingMode.HALF_UP
            );

            if (average.signum() == 0
                    || current.compareTo(average) >= 0) {
                continue;
            }

            BigDecimal drop = average.subtract(current)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(average, 2, RoundingMode.HALF_UP);

            if (drop.compareTo(DROP_THRESHOLD) >= 0) {
                Map<String, Object> alert = new LinkedHashMap<>();
                alert.put("cowId", cowId);
                alert.put("cowCode", data.cowCode);
                alert.put("date", date);
                alert.put("currentDailyLitres", current);
                alert.put("previousAverageDailyLitres", average);
                alert.put("dropPercentage", drop);

                alerts.add(alert);
            }
        }

        return alerts;
    }

    private Cow getActiveCow(Long cowId) {
        if (cowId == null) {
            throw badRequest("Cow ID is required");
        }

        Cow cow = cowRepository.findById(cowId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cow not found with ID: " + cowId
                ));

        if (cow.getStatus() != CowStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Milk cannot be recorded for an inactive cow"
            );
        }

        return cow;
    }

    private void validateEntry(
            LocalDate date,
            MilkSession session,
            BigDecimal quantity) {

        if (date == null || session == null || quantity == null) {
            throw badRequest(
                    "Date, session and quantity are required"
            );
        }

        if (quantity.signum() < 0) {
            throw badRequest("Quantity cannot be negative");
        }

        if (quantity.scale() > 2
                || quantity.precision() - quantity.scale() > 7) {
            throw badRequest(
                    "Quantity must have at most 7 integer digits and 2 decimal places"
            );
        }
    }

    private void requireDate(LocalDate date) {
        if (date == null) {
            throw badRequest("Date is required");
        }
    }

    private void validateDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        requireDate(startDate);
        requireDate(endDate);

        if (startDate.isAfter(endDate)) {
            throw badRequest(
                    "Start date cannot be after end date"
            );
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, message
        );
    }

    private static class CowDailyData {
        private final String cowCode;
        private final Map<LocalDate, BigDecimal> dailyTotals =
                new LinkedHashMap<>();

        private CowDailyData(String cowCode) {
            this.cowCode = cowCode;
        }
    }
}
