/**
 * Calculate time units in months based on custom rules
 * Ported from Python utils.py
 * 
 * Rules:
 * 1. Count full months (30 days = 1 month)
 * 2. Remainder days:
 *    - 1-10 days: +0 month
 *    - 11-20 days: +0.5 month
 *    - 21+ days: +1.0 month
 */
export function calculateTimeUnits(startDate, endDate) {
    // Calculate total days (inclusive)
    const delta = endDate - startDate;
    const totalDays = Math.floor(delta / (1000 * 60 * 60 * 24)) + 1;

    // Assumption: 1 month = 30 days
    const fullMonths = Math.floor(totalDays / 30);
    const remainderDays = totalDays % 30;

    let extraUnits = 0.0;
    if (remainderDays <= 10) {
        extraUnits = 0.0;
    } else if (remainderDays >= 11 && remainderDays <= 20) {
        extraUnits = 0.5;
    } else { // >= 21
        extraUnits = 1.0;
    }

    return fullMonths + extraUnits;
}

/**
 * Calculate interest amount (NOT rounded)
 *
 * NOTE: Interest is computed exactly and not rounded.
 */
export function calculateInterestAmount(principal, ratePerMonth, startDate, endDate) {
    // Handle null rate safely
    const rate = ratePerMonth !== null && ratePerMonth !== undefined ? ratePerMonth : 0.0;

    const units = calculateTimeUnits(startDate, endDate);

    const rawInterest = principal * (rate / 100.0) * units;

    // Rounding to nearest 1000
    // < 500 -> Down, >= 500 -> Up
    const roundedInterest = Math.round(rawInterest / 1000) * 1000;

    return {
        months: units,
        raw_interest: rawInterest,
        rounded_interest: roundedInterest,
        total: principal + roundedInterest
    };
}
