
package com.dairytrack.milkproduction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MilkProductionResponse(
        Long id,
        Long cowId,
        String cowCode,
        LocalDate productionDate,
        MilkSession session,
        BigDecimal quantityLitres
) {

    public static MilkProductionResponse from(
            MilkProduction production) {

        return new MilkProductionResponse(
                production.getId(),
                production.getCow().getId(),
                production.getCow().getCowCode(),
                production.getProductionDate(),
                production.getSession(),
                production.getQuantityLitres()
        );
    }
}
