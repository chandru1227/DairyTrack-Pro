package com.dairytrack.sales.service;
import com.dairytrack.sales.CustomerSalesSummary;
import com.dairytrack.sales.MilkSale;
import com.dairytrack.sales.PaymentStatus;
import com.dairytrack.sales.repository.MilkSaleRepository;
import com.dairytrack.customer.Customer;
import com.dairytrack.customer.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class MilkSaleService {

    private final MilkSaleRepository saleRepository;
    private final CustomerRepository customerRepository;

    public MilkSaleService(
            MilkSaleRepository saleRepository,
            CustomerRepository customerRepository) {
        this.saleRepository = saleRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public MilkSale createSale(MilkSale sale) {
        validateSale(sale);

        if (sale.getCustomerId() != null) {
            Customer customer = customerRepository.findById(sale.getCustomerId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Customer not found with id: " + sale.getCustomerId()
                    ));

            sale.setCustomerName(customer.getName());
        }

        sale.setCustomerName(sale.getCustomerName().trim());
        sale.setAmountPaid(BigDecimal.ZERO);
        sale.setPaymentStatus(PaymentStatus.PENDING);

        if (sale.getNotes() != null) {
            sale.setNotes(sale.getNotes().trim());
        }

        return saleRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public List<MilkSale> getAllSales() {
        return saleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public MilkSale getSale(Long id) {
        return findSale(id);
    }

    @Transactional(readOnly = true)
    public List<MilkSale> getSalesForDate(LocalDate date) {
        requireDate(date, "Sale date");
        return saleRepository.findBySaleDateOrderByIdDesc(date);
    }

    @Transactional(readOnly = true)
    public List<MilkSale> getSalesBetween(
            LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);

        return saleRepository
                .findBySaleDateBetweenOrderBySaleDateDescIdDesc(
                        startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<MilkSale> searchByCustomer(String customerName) {
        if (customerName == null || customerName.isBlank()) {
            throw badRequest("Customer name is required for searching");
        }

        return saleRepository
                .findByCustomerNameContainingIgnoreCaseOrderBySaleDateDesc(
                        customerName.trim());
    }

    @Transactional
    public MilkSale recordPayment(Long saleId, BigDecimal paymentAmount) {
        MilkSale sale = findSale(saleId);

        if (paymentAmount == null || paymentAmount.signum() <= 0) {
            throw badRequest("Payment amount must be greater than zero");
        }

        if (paymentAmount.scale() > 2) {
            throw badRequest("Payment amount supports at most 2 decimal places");
        }

        BigDecimal saleTotal = calculateSaleTotal(sale);
        BigDecimal currentPaid = sale.getAmountPaid();
        BigDecimal remaining = saleTotal.subtract(currentPaid);

        if (paymentAmount.compareTo(remaining) > 0) {
            throw badRequest(
                    "Payment exceeds outstanding balance: " + remaining);
        }

        BigDecimal newPaid = currentPaid.add(paymentAmount);
        sale.setAmountPaid(newPaid);

        if (newPaid.compareTo(saleTotal) == 0) {
            sale.setPaymentStatus(PaymentStatus.PAID);
        } else {
            sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        return saleRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public BigDecimal getDailyRevenue(LocalDate date) {
        requireDate(date, "Sale date");
        return saleRepository.getRevenueForDate(date);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPeriodRevenue(
            LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        return saleRepository.getRevenueBetweenDates(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public BigDecimal getOutstanding(
            LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        return saleRepository.getOutstandingBetweenDates(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<CustomerSalesSummary> getCustomerSalesSummary(
            LocalDate startDate, LocalDate endDate) {

        validateDateRange(startDate, endDate);

        return saleRepository.getCustomerSalesSummary(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<MilkSale> getSalesForCustomer(Long customerId) {
        if (customerId == null || customerId <= 0) {
            throw badRequest("A valid customer ID is required");
        }

        if (!customerRepository.existsById(customerId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Customer not found with id: " + customerId
            );
        }

        return saleRepository.findByCustomerIdOrderBySaleDateDescIdDesc(
                customerId
        );
    }

    private BigDecimal calculateSaleTotal(MilkSale sale) {
        return sale.getQuantityLitres()
                .multiply(sale.getPricePerLitre())
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void validateSale(MilkSale sale) {
        if (sale == null) {
            throw badRequest("Sale request body is required");
        }

        requireDate(sale.getSaleDate(), "Sale date");

        if (sale.getCustomerName() == null
                || sale.getCustomerName().isBlank()) {
            throw badRequest("Customer name is required");
        }

        if (sale.getCustomerName().trim().length() > 120) {
            throw badRequest("Customer name cannot exceed 120 characters");
        }

        if (sale.getQuantityLitres() == null
                || sale.getQuantityLitres().signum() <= 0) {
            throw badRequest("Quantity must be greater than zero");
        }

        if (sale.getQuantityLitres().scale() > 3) {
            throw badRequest("Quantity supports at most 3 decimal places");
        }

        if (sale.getPricePerLitre() == null
                || sale.getPricePerLitre().signum() <= 0) {
            throw badRequest("Price per litre must be greater than zero");
        }

        if (sale.getPricePerLitre().scale() > 2) {
            throw badRequest("Price supports at most 2 decimal places");
        }

        if (sale.getNotes() != null && sale.getNotes().length() > 500) {
            throw badRequest("Notes cannot exceed 500 characters");
        }
    }

    private MilkSale findSale(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sale not found: " + id));
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