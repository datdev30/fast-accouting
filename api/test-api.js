#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests all major endpoints to verify functionality
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
const ADMIN_PIN = process.env.ADMIN_PIN || '';

// Colors for console output
// Simplified logging
function log(message, color) {
    console.log(message);
}

async function test(name, fn) {
    try {
        log(`\n🧪 Testing: ${name}`, 'blue');
        await fn();
        log(`✅ PASSED: ${name}`, 'green');
        return true;
    } catch (error) {
        log(`❌ FAILED: ${name}`, 'red');
        log(`   Error: ${error.response?.data?.error || error.message}`, 'red');
        return false;
    }
}

async function runTests() {
    log('\n🚀 Starting API Tests...', 'yellow');
    log(`📍 API Base: ${API_BASE}`, 'yellow');

    let passed = 0;
    let failed = 0;

    const cleanupTasks = [];
    const addCleanup = (name, fn) => cleanupTasks.push({ name, fn });
    const runCleanup = async () => {
        if (cleanupTasks.length === 0) return;
        log(`\n🧹 Cleanup: ${cleanupTasks.length} task(s)...`, 'yellow');
        // Run in reverse order (LIFO)
        for (const task of cleanupTasks.slice().reverse()) {
            try {
                await task.fn();
                log(`   ✅ Cleanup ok: ${task.name}`, 'green');
            } catch (e) {
                log(`   ❌ Cleanup failed: ${task.name}`, 'red');
                log(`      Error: ${e.response?.data?.error || e.message}`, 'red');
                failed++;
            }
        }
    };

    // Shared state for mutation tests
    let customerId = '';
    let transactionId = '';

    try {
        // Test 1: Health Check
        if (await test('Health Check', async () => {
            const res = await axios.get(`${API_BASE.replace('/api', '')}/`);
            if (!res.data.message) throw new Error('No message in response');
        })) passed++; else failed++;

        // Test 2: Login
        if (await test('Login with admin credentials', async () => {
            const res = await axios.post(`${API_BASE}/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });
            authToken = res.data.token;
            if (!authToken) throw new Error('No token received');
            log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
        })) passed++; else failed++;

        const authHeaders = { Authorization: `Bearer ${authToken}` };

        // Test 3: Get Me
        if (await test('Get current user (/auth/me)', async () => {
            const res = await axios.get(`${API_BASE}/auth/me`, {
                headers: authHeaders
            });
            if (res.data.username !== 'admin') throw new Error('Wrong username');
            log(`   Username: ${res.data.username}`, 'blue');
        })) passed++; else failed++;

        // Test 4: Get Interest Configs
        if (await test('Get interest configurations', async () => {
            const res = await axios.get(`${API_BASE}/interest-configs`, {
                headers: authHeaders
            });
            if (!Array.isArray(res.data)) throw new Error('Response is not an array');
            log(`   Found ${res.data.length} configs`, 'blue');
        })) passed++; else failed++;

        // Test 5: Create Customer (requires rollback support)
        if (await test('Create customer (rollback-safe)', async () => {
            if (!ADMIN_PIN) throw new Error('Missing ADMIN_PIN env var (required for rollback-safe delete)');

            const res = await axios.post(`${API_BASE}/customers`, {
                name: `Test Customer ${Date.now()}`,
                contact_info: '0123456789'
            }, {
                headers: authHeaders
            });
            customerId = res.data.id;
            if (!customerId || !String(customerId).startsWith('KH')) throw new Error('Invalid customer ID format');
            log(`   Customer ID: ${customerId}`, 'blue');

            addCleanup(`Delete customer ${customerId}`, async () => {
                await axios.post(`${API_BASE}/customers/delete-secure`, { id: customerId, pin: ADMIN_PIN }, { headers: authHeaders });
            });
        })) passed++; else failed++;

        // Test 6: Create Transaction (requires rollback support)
        if (await test('Create transaction (rollback-safe)', async () => {
            if (!customerId) throw new Error('No customerId available');

            const res = await axios.post(`${API_BASE}/transactions`, {
                customer_id: customerId,
                type: 'TIEN_MAT',
                amount: 10000000,
                content: 'Test loan',
                transaction_date: new Date('2024-10-01')
            }, {
                headers: authHeaders
            });
            transactionId = res.data.id;
            if (!transactionId || !String(transactionId).startsWith('GD')) throw new Error('Invalid transaction ID format');
            log(`   Transaction ID: ${transactionId}`, 'blue');

            addCleanup(`Delete transaction ${transactionId}`, async () => {
                await axios.post(`${API_BASE}/transactions/delete-secure`, { id: transactionId, pin: ADMIN_PIN }, { headers: authHeaders });
            });
        })) passed++; else failed++;

        // Test 7: Get Transactions with problematic ID (read-only)
        if (await test('Get Transactions with specific ID (Reproduction)', async () => {
            const problemId = '69549ec02ce10ac2b0b089f3'; // User's reported ID
            const res = await axios.get(`${API_BASE}/transactions?customer_id=${problemId}`, {
                headers: authHeaders
            });
            log(`   Response status: ${res.status}`, 'blue');
            log(`   Data length: ${res.data.length}`, 'blue');
        })) passed++; else failed++;

        // Test 8a: Toggle created transaction -> OPEN
        if (await test('Patch created transaction -> OPEN', async () => {
            if (!transactionId) throw new Error('No transactionId available');
            const res = await axios.patch(`${API_BASE}/transactions/${transactionId}`,
                { status: 'OPEN' },
                { headers: authHeaders }
            );
            log(`   Status updated to: ${res.data.status}`, 'blue');
        })) passed++; else failed++;

        // Test 8b: Toggle created transaction -> PAID
        if (await test('Patch created transaction -> PAID', async () => {
            if (!transactionId) throw new Error('No transactionId available');
            const res = await axios.patch(`${API_BASE}/transactions/${transactionId}`,
                { status: 'PAID' },
                { headers: authHeaders }
            );
            log(`   Status updated to: ${res.data.status}. Interest: ${res.data.final_interest}`, 'blue');
        })) passed++; else failed++;

        // Test 9: Generate PDF for created customer
        if (await test('Generate PDF report (created customer)', async () => {
            if (!customerId) throw new Error('No customerId available');
            const res = await axios.get(`${API_BASE}/reports/${customerId}/pdf`, {
                headers: authHeaders,
                responseType: 'arraybuffer'
            });
            if (!res.data || res.data.byteLength === 0) throw new Error('Empty PDF');
            log(`   PDF size: ${(res.data.byteLength / 1024).toFixed(2)} KB`, 'blue');
        })) passed++; else failed++;
    } finally {
        await runCleanup();
    }

    if (failed > 0) process.exit(1);
    process.exit(0);
}

// Run tests
runTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
