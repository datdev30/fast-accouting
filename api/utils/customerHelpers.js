/**
 * Customer helper functions
 * Centralized logic for customer ID resolution and debt calculation
 */

import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { calculateInterestAmount } from './interest.js';

/**
 * Resolve customer ID (handles both custom ID and MongoDB _id)
 * @param {string} customerId - Customer ID (KHxxx) or MongoDB _id
 * @returns {Promise<Object|null>} Customer document or null
 */
export async function resolveCustomerId(customerId) {
    if (!customerId) return null;
    
    const id = String(customerId).trim();
    const customer = await Customer.findOne({ 
        $or: [{ id }, { _id: id }] 
    });
    
    return customer;
}

/**
 * Build customer ID resolver map
 * Maps both custom ID and MongoDB _id to unified key
 * @param {Array} customers - Array of customer documents
 * @returns {Object} ID resolver map
 */
export function buildCustomerIdResolver(customers) {
    const idResolver = {};
    
    customers.forEach(c => {
        const rawCustomId = c?.id;
        const customId = rawCustomId !== null && rawCustomId !== undefined
            ? String(rawCustomId).trim()
            : null;

        const mongoId = c?._id !== null && c?._id !== undefined
            ? String(c._id).trim()
            : null;

        const key = customId || mongoId;
        if (!key) return;

        if (customId) idResolver[customId] = key;
        if (mongoId) idResolver[mongoId] = key;
    });
    
    return idResolver;
}

/**
 * Calculate total debt for a customer
 * @param {Array} transactions - Array of transaction documents
 * @param {Date} asOfDate - Date to calculate debt as of (default: now)
 * @returns {Object} Debt calculation result
 */
export function calculateCustomerDebt(transactions, asOfDate = new Date()) {
    let lifetimePrincipal = 0;
    let lifetimeInterest = 0;
    let collected = 0;

    for (const tx of transactions) {
        const principal = Number(tx.amount || 0);
        let interest = 0;

        if (tx.status === 'OPEN') {
            const calc = calculateInterestAmount(
                principal,
                tx.interest_rate_snapshot,
                tx.transaction_date,
                asOfDate
            );
            interest = Number(calc.rounded_interest || 0);
        } else if (tx.status === 'PAID') {
            interest = Number(tx.final_interest || 0);
            const val = Number(tx.final_total ?? (principal + interest));
            collected += val;
        }

        lifetimePrincipal += principal;
        lifetimeInterest += interest;
    }

    const totalPayment = lifetimePrincipal + lifetimeInterest;
    const totalRemaining = totalPayment - collected;
    const totalDebt = Math.round(totalRemaining * 100) / 100;

    return {
        lifetimePrincipal,
        lifetimeInterest,
        collected,
        totalDebt,
        totalPayment
    };
}

/**
 * Get customer status flags
 * @param {Array} transactions - Array of transaction documents
 * @returns {Object} Status flags
 */
export function getCustomerStatus(transactions) {
    const hasHistory = transactions.length > 0;
    const hasOpenDebt = transactions.some(tx => tx.status === 'OPEN');
    const isPaidInFull = hasHistory && !hasOpenDebt;

    return {
        hasHistory,
        hasOpenDebt,
        isPaidInFull
    };
}
