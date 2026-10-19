
package com.dairytrack.livestock.service;

import com.dairytrack.livestock.Cow;
import com.dairytrack.livestock.CowStatus;
import com.dairytrack.livestock.repository.CowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CowService {

    private static final long GESTATION_DAYS = 283;

    private final CowRepository cowRepository;

    public CowService(CowRepository cowRepository) {
        this.cowRepository = cowRepository;
    }

    public Cow registerCow(Cow cow) {
        String newCode = cow.getCowCode().trim();
        cow.setCowCode(newCode);

        if (cowRepository.existsByCowCode(newCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A cow with this code already exists"
            );
        }

        applyExpectedDeliveryDate(cow);
        validateBreedingDates(cow);

        return cowRepository.save(cow);
    }

    @Transactional(readOnly = true)
    public List<Cow> getAllCows(CowStatus status) {
        if (status == null) {
            return cowRepository.findAll();
        }

        return cowRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Cow getCowById(Long id) {
        return cowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cow not found with ID: " + id
                ));
    }

    @Transactional(readOnly = true)
    public List<Cow> searchByCowCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search code cannot be empty"
            );
        }

        return cowRepository.findByCowCodeContainingIgnoreCase(
                code.trim()
        );
    }

    public Cow updateCow(Long id, Cow request) {
        Cow existingCow = getCowById(id);

        String newCode = request.getCowCode().trim();

        if (cowRepository.existsByCowCodeAndIdNot(newCode, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another cow already uses this code"
            );
        }

        existingCow.setCowCode(newCode);
        existingCow.setBreed(request.getBreed().trim());
        existingCow.setJoiningDate(request.getJoiningDate());
        existingCow.setMatingDate(request.getMatingDate());
        existingCow.setExpectedDeliveryDate(
                request.getExpectedDeliveryDate()
        );
        existingCow.setStatus(request.getStatus());

        applyExpectedDeliveryDate(existingCow);
        validateBreedingDates(existingCow);

        return cowRepository.save(existingCow);
    }

    public Cow deactivateCow(Long id) {
        Cow cow = getCowById(id);
        cow.setStatus(CowStatus.INACTIVE);

        return cowRepository.save(cow);
    }

    private void applyExpectedDeliveryDate(Cow cow) {
        if (cow.getMatingDate() != null
                && cow.getExpectedDeliveryDate() == null) {
            cow.setExpectedDeliveryDate(
                    cow.getMatingDate().plusDays(GESTATION_DAYS)
            );
        }
    }

    private void validateBreedingDates(Cow cow) {
        LocalDate matingDate = cow.getMatingDate();
        LocalDate expectedDate = cow.getExpectedDeliveryDate();

        if (matingDate != null && expectedDate != null
                && !expectedDate.isAfter(matingDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Expected delivery date must be after the mating date"
            );
        }
    }
}
