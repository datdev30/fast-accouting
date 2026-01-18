import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateInterestAmount } from './interest.js';
import { readMoney } from './money.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Font paths
const FONTS = {
    regular: path.join(__dirname, '../fonts/times.ttf'),
    bold: path.join(__dirname, '../fonts/timesbd.ttf'),
    italic: path.join(__dirname, '../fonts/timesi.ttf'),
    boldItalic: path.join(__dirname, '../fonts/timesbi.ttf')
};

/**
 * Format money with Vietnamese style (1.000.000)
 */
function formatMoney(val) {
    return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getPrintableTableLayout(doc) {
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const tableWidth = doc.page.width - left - right;

    // Follow client PrintableReport table widths:
    // Ngày: w-20, Tiền gốc: w-24, Lãi: w-12, TG: w-16, Tiền lãi: w-24, Tổng: w-24
    // Content takes the remaining space.
    // Use point values that preserve those proportions on A4.
    const fixed = {
        date: 56,
        principal: 72,
        rate: 36,
        time: 48,
        interest: 72,
        total: 72
    };

    const fixedSum = fixed.date + fixed.principal + fixed.rate + fixed.time + fixed.interest + fixed.total;
    const content = Math.max(140, tableWidth - fixedSum);

    const colWidths = [
        fixed.date,
        content,
        fixed.principal,
        fixed.rate,
        fixed.time,
        fixed.interest,
        fixed.total
    ];

    // If we overflow, scale down fixed columns and retry once.
    const sum = colWidths.reduce((a, b) => a + b, 0);
    if (sum > tableWidth) {
        const availableForFixed = Math.max(0, tableWidth - 140);
        const scale = fixedSum > 0 ? availableForFixed / fixedSum : 1;
        const sDate = Math.max(44, Math.floor(fixed.date * scale));
        const sPrincipal = Math.max(56, Math.floor(fixed.principal * scale));
        const sRate = Math.max(28, Math.floor(fixed.rate * scale));
        const sTime = Math.max(34, Math.floor(fixed.time * scale));
        const sInterest = Math.max(56, Math.floor(fixed.interest * scale));
        const sTotal = Math.max(56, Math.floor(fixed.total * scale));
        const sFixedSum = sDate + sPrincipal + sRate + sTime + sInterest + sTotal;
        const sContent = Math.max(140, tableWidth - sFixedSum);
        return { left, tableWidth, colWidths: [sDate, sContent, sPrincipal, sRate, sTime, sInterest, sTotal] };
    }

    return { left, tableWidth, colWidths };
}

function drawCell(doc, x, y, w, h, text, opts = {}) {
    const {
        align = 'left',
        valign = 'top',
        padX = 4,
        padY = 3,
        font = 'TimesNewRoman',
        fontSize = 10,
        bold = false,
        fill = null,
        stroke = '#000'
    } = opts;

    if (fill) {
        doc.rect(x, y, w, h).fillAndStroke(fill, stroke);
        doc.fillColor('#000');
    } else {
        doc.rect(x, y, w, h).stroke(stroke);
    }

    doc.font(bold ? 'TimesNewRoman-Bold' : font).fontSize(fontSize);

    const textX = x + padX;
    const textW = Math.max(0, w - padX * 2);
    const textH = Math.max(0, h - padY * 2);
    const textY = valign === 'middle' ? y + (h - doc.heightOfString(text || '', { width: textW, align })) / 2 : y + padY;

    doc.text(text ?? '', textX, textY, {
        width: textW,
        height: textH,
        align
    });
}

function drawPrintableHeaderRow(doc, layout, headers) {
    const y = doc.y;
    const h = 18;
    let x = layout.left;

    for (let i = 0; i < headers.length; i++) {
        drawCell(doc, x, y, layout.colWidths[i], h, headers[i], {
            align: 'center',
            bold: true,
            fill: '#f1f5f9',
            fontSize: 10,
            padX: 4,
            padY: 3
        });
        x += layout.colWidths[i];
    }

    doc.y = y + h;
}

function getContentBox(doc) {
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const width = doc.page.width - left - right;
    return { left, right, width };
}

function drawKeyValueRow(doc, label, value, opts = {}) {
    const { left, width } = getContentBox(doc);
    const {
        fontSize = 11,
        valueWidth = 160,
        gap = 10,
        bold = true
    } = opts;

    const labelWidth = Math.max(0, width - valueWidth - gap);
    const y = doc.y;

    doc.font(bold ? 'TimesNewRoman-Bold' : 'TimesNewRoman').fontSize(fontSize);
    doc.text(label, left, y, { width: labelWidth, align: 'left' });

    doc.font('TimesNewRoman-Bold').fontSize(fontSize);
    doc.text(value, left + width - valueWidth, y, { width: valueWidth, align: 'right' });

    const rowH = Math.max(
        doc.heightOfString(label, { width: labelWidth, align: 'left' }),
        doc.heightOfString(value, { width: valueWidth, align: 'right' })
    );
    doc.y = y + rowH + 4;
}

function drawRightAlignedMixed(doc, prefix, value, opts = {}) {
    const { left, width } = getContentBox(doc);
    const { fontSize = 11, prefixFont = 'TimesNewRoman-Italic', valueFont = 'TimesNewRoman-BoldItalic' } = opts;

    const y = doc.y;
    doc.font(prefixFont).fontSize(fontSize);
    const prefixW = doc.widthOfString(prefix);
    doc.font(valueFont).fontSize(fontSize);
    const valueW = doc.widthOfString(value);
    const totalW = prefixW + valueW;

    const startX = left + Math.max(0, width - totalW);

    doc.font(prefixFont).fontSize(fontSize);
    doc.text(prefix, startX, y, { lineBreak: false });
    doc.font(valueFont).fontSize(fontSize);
    doc.text(value, startX + prefixW, y, { lineBreak: false });

    const lineH = Math.max(
        doc.heightOfString(prefix, { width, align: 'left' }),
        doc.heightOfString(value, { width, align: 'left' })
    );
    doc.y = y + lineH + 4;
}

/**
 * Generate PDF report for customer debt settlement
 * Ported from Python fpdf2 implementation
 * @param {Object} customer - Customer object
 * @param {Array} transactions - Array of transaction objects
 * @param {boolean} includeAll - If true, include all transactions (PAID and OPEN), otherwise only OPEN
 */
export async function generatePDF(customer, transactions, includeAll = false) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Buffer to store PDF
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Register fonts
            doc.registerFont('TimesNewRoman', FONTS.regular);
            doc.registerFont('TimesNewRoman-Bold', FONTS.bold);
            doc.registerFont('TimesNewRoman-Italic', FONTS.italic);
            doc.registerFont('TimesNewRoman-BoldItalic', FONTS.boldItalic);

            // Header
            doc.font('TimesNewRoman-Bold').fontSize(16);
            doc.text('ĐẠI LÝ CÔNG PHÚ', { align: 'center' });
            doc.moveDown(0.3);

            doc.font('TimesNewRoman').fontSize(12);
            doc.text('Thôn Đắk Kual 2, xã Đức An, tỉnh Lâm Đồng', { align: 'center' });
            doc.moveDown(0.3);

            doc.font('TimesNewRoman-Bold').fontSize(11);
            doc.text('0342 789 046 — 0367 973 948', { align: 'center' });
            doc.moveDown(0.5);

            // Divider line
            const lineY = doc.y;
            doc.moveTo(250, lineY).lineTo(350, lineY).stroke();
            doc.moveDown(1);

            // Title
            doc.font('TimesNewRoman-Bold').fontSize(16);
            const title = includeAll ? 'TẤT CẢ GIAO DỊCH' : 'PHIẾU THANH TOÁN CÔNG NỢ';
            doc.text(title, { align: 'center' });
            doc.moveDown(1);

            // Customer info
            doc.font('TimesNewRoman-Bold').fontSize(11);
            doc.text('Tên khách hàng: ', { continued: true });
            doc.font('TimesNewRoman').text(customer.name);

            doc.font('TimesNewRoman-Bold');
            doc.text('Ngày giờ: ', { continued: true });
            doc.font('TimesNewRoman');
            const now = new Date();
            const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
            doc.text(dateStr);
            doc.moveDown(1);

            // Group transactions by month
            const groups = {};
            for (const tx of transactions) {
                // If includeAll is false, only include OPEN transactions (backward compatible)
                if (!includeAll && tx.status !== 'OPEN') continue;
                
                // Ensure transaction_date is a Date object
                const txDate = tx.transaction_date instanceof Date 
                    ? tx.transaction_date 
                    : new Date(tx.transaction_date);
                
                // Skip if date is invalid
                if (isNaN(txDate.getTime())) {
                    console.warn('Invalid transaction_date:', tx.transaction_date, 'for transaction:', tx._id);
                    continue;
                }
                
                const monthKey = `${(txDate.getMonth() + 1).toString().padStart(2, '0')}/${txDate.getFullYear()}`;
                if (!groups[monthKey]) groups[monthKey] = [];
                groups[monthKey].push(tx);
            }

            let globalPrincipal = 0;
            let globalInterest = 0;
            let globalPaidPrincipal = 0;
            let globalPaidInterest = 0;
            let globalUnpaidPrincipal = 0;
            let globalUnpaidInterest = 0;

            if (Object.keys(groups).length === 0) {
                doc.font('TimesNewRoman-Italic').fontSize(11);
                doc.text('Không có giao dịch nợ nào.', { align: 'center' });
            }

            // Draw each month's transactions
            for (const [month, txs] of Object.entries(groups)) {
                // Month header
                doc.font('TimesNewRoman-Bold').fontSize(11);
                {
                    const { left, width } = getContentBox(doc);
                    doc.text(`Tháng: ${month}`, left, doc.y, { width, align: 'left' });
                }
                const underlineY = doc.y + 2;
                doc.moveTo(doc.page.margins.left, underlineY).lineTo(doc.page.width - doc.page.margins.right, underlineY).stroke();
                doc.moveDown(0.4);

                const headers = ['Ngày', 'Nội dung', 'Tiền gốc', 'Lãi', 'TG', 'Tiền lãi', 'Tổng'];

                const layout = getPrintableTableLayout(doc);
                drawPrintableHeaderRow(doc, layout, headers);

                // Table rows
                doc.font('TimesNewRoman').fontSize(10);
                let monthPrincipal = 0;
                let monthInterest = 0;
                let monthUnpaidPrincipal = 0;
                let monthUnpaidInterest = 0;

                for (const tx of txs) {
                    try {
                        // Ensure transaction_date is a Date object
                        let txDate;
                        try {
                            txDate = tx.transaction_date instanceof Date 
                                ? tx.transaction_date 
                                : new Date(tx.transaction_date);
                            
                            // Validate date
                            if (isNaN(txDate.getTime())) {
                                console.warn('Invalid transaction_date for transaction:', tx._id, tx.transaction_date);
                                continue; // Skip invalid transactions
                            }
                        } catch (dateError) {
                            console.warn('Error parsing transaction_date for transaction:', tx._id, dateError);
                            continue; // Skip transactions with invalid dates
                        }
                        
                        // For PAID transactions, use saved final_interest if available
                        let interest = 0;
                        let calc = null;
                        
                        try {
                            if (tx.status === 'PAID' && tx.final_interest !== undefined && tx.final_interest !== null) {
                                interest = tx.final_interest;
                                // Still calculate months for display (use saved final_interest months if available, otherwise calculate)
                                if (tx.final_interest_months !== undefined && tx.final_interest_months !== null) {
                                    calc = { months: tx.final_interest_months };
                                } else {
                                    // Calculate months for display purposes
                                    calc = calculateInterestAmount(
                                        tx.amount || 0,
                                        tx.interest_rate_snapshot || 0,
                                        txDate,
                                        now
                                    );
                                }
                            } else {
                                calc = calculateInterestAmount(
                                    tx.amount || 0,
                                    tx.interest_rate_snapshot || 0,
                                    txDate,
                                    now
                                );
                                interest = calc.rounded_interest;
                            }
                        } catch (calcError) {
                            console.warn('Error calculating interest for transaction:', tx._id, calcError);
                            // Use default values
                            interest = 0;
                            calc = { months: 0 };
                        }
                        
                        const total = (tx.amount || 0) + interest;

                        monthPrincipal += tx.amount || 0;
                        monthInterest += interest;

                        // Track paid vs unpaid for summary
                        if (includeAll) {
                            if (tx.status === 'PAID') {
                                globalPaidPrincipal += tx.amount || 0;
                                globalPaidInterest += interest;
                            } else {
                                globalUnpaidPrincipal += tx.amount || 0;
                                globalUnpaidInterest += interest;
                                // Track unpaid for month subtotal
                                monthUnpaidPrincipal += tx.amount || 0;
                                monthUnpaidInterest += interest;
                            }
                        } else {
                            // If not includeAll, all are unpaid (OPEN only)
                            monthUnpaidPrincipal += tx.amount || 0;
                            monthUnpaidInterest += interest;
                        }

                        const dateCell = `${txDate.getDate().toString().padStart(2, '0')}/${(txDate.getMonth() + 1).toString().padStart(2, '0')}/${txDate.getFullYear()}`;
                        const contentCell = tx.content || '';
                        const amountCell = formatMoney(tx.amount || 0);
                        const rateCell = (tx.interest_rate_snapshot ?? '').toString();
                        const timeCell = calc && calc.months !== undefined ? calc.months.toFixed(1) : '0.0';
                        const interestCell = formatMoney(interest);
                        const totalCell = formatMoney(total);

                        // Calculate row height (top-aligned like PrintableReport).
                        const padX = 4;
                        const padY = 3;
                        const heights = [
                            doc.heightOfString(dateCell, { width: layout.colWidths[0] - padX * 2, align: 'center' }),
                            doc.heightOfString(contentCell, { width: layout.colWidths[1] - padX * 2, align: 'left' }),
                            doc.heightOfString(amountCell, { width: layout.colWidths[2] - padX * 2, align: 'right' }),
                            doc.heightOfString(rateCell, { width: layout.colWidths[3] - padX * 2, align: 'center' }),
                            doc.heightOfString(timeCell, { width: layout.colWidths[4] - padX * 2, align: 'center' }),
                            doc.heightOfString(interestCell, { width: layout.colWidths[5] - padX * 2, align: 'right' }),
                            doc.heightOfString(totalCell, { width: layout.colWidths[6] - padX * 2, align: 'right' })
                        ];
                        const rowHeight = Math.max(...heights, 10) + padY * 2;

                        // Page break if needed (repeat month + header).
                        const bottomLimit = doc.page.height - doc.page.margins.bottom - 130;
                        if (doc.y + rowHeight > bottomLimit) {
                            doc.addPage();
                            doc.font('TimesNewRoman-Bold').fontSize(11);
                            {
                                const { left, width } = getContentBox(doc);
                                doc.text(`Tháng: ${month} (tiếp)`, left, doc.y, { width, align: 'left' });
                            }
                            const underlineY2 = doc.y + 2;
                            doc.moveTo(doc.page.margins.left, underlineY2).lineTo(doc.page.width - doc.page.margins.right, underlineY2).stroke();
                            doc.moveDown(0.4);
                            const layout2 = getPrintableTableLayout(doc);
                            drawPrintableHeaderRow(doc, layout2, headers);
                            doc.font('TimesNewRoman').fontSize(10);
                        }

                        const rowY = doc.y;
                        let xPos = layout.left;

                        // Background color for PAID transactions (yellow: #f9fc88)
                        const isPaid = tx.status === 'PAID';
                        const fillColor = (includeAll && isPaid) ? '#f9fc88' : null;

                        drawCell(doc, xPos, rowY, layout.colWidths[0], rowHeight, dateCell, { align: 'center', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[0];

                        drawCell(doc, xPos, rowY, layout.colWidths[1], rowHeight, contentCell, { align: 'left', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[1];

                        drawCell(doc, xPos, rowY, layout.colWidths[2], rowHeight, amountCell, { align: 'right', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[2];

                        drawCell(doc, xPos, rowY, layout.colWidths[3], rowHeight, rateCell, { align: 'center', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[3];

                        drawCell(doc, xPos, rowY, layout.colWidths[4], rowHeight, timeCell, { align: 'center', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[4];

                        drawCell(doc, xPos, rowY, layout.colWidths[5], rowHeight, interestCell, { align: 'right', padX, padY, fontSize: 10, fill: fillColor });
                        xPos += layout.colWidths[5];

                        drawCell(doc, xPos, rowY, layout.colWidths[6], rowHeight, totalCell, { align: 'right', padX, padY, fontSize: 10, bold: true, fill: fillColor });

                        doc.y = rowY + rowHeight;
                    } catch (txError) {
                        console.error('Error processing transaction:', tx._id, txError);
                        console.error('Transaction data:', {
                            id: tx._id,
                            date: tx.transaction_date,
                            amount: tx.amount,
                            status: tx.status
                        });
                        // Skip this transaction and continue with next one
                        continue;
                    }
                }

                // Month total row - chỉ tính những giao dịch còn nợ
                const totalRowY = doc.y;
                const subtotalH = 18;
                const padX2 = 4;
                const padY2 = 3;
                let xPos = layout.left;

                // colSpan=2 cell (Ngày + Nội dung)
                drawCell(doc, xPos, totalRowY, layout.colWidths[0] + layout.colWidths[1], subtotalH, 'Tổng Tháng', {
                    align: 'right',
                    bold: true,
                    fill: '#f8fafc',
                    padX: padX2,
                    padY: padY2,
                    fontSize: 10
                });
                xPos += layout.colWidths[0] + layout.colWidths[1];

                // Use unpaid amounts for month subtotal
                const monthSubtotalPrincipal = includeAll ? monthUnpaidPrincipal : monthPrincipal;
                const monthSubtotalInterest = includeAll ? monthUnpaidInterest : monthInterest;

                drawCell(doc, xPos, totalRowY, layout.colWidths[2], subtotalH, formatMoney(monthSubtotalPrincipal), {
                    align: 'right',
                    bold: true,
                    fill: '#f8fafc',
                    padX: padX2,
                    padY: padY2,
                    fontSize: 10
                });
                xPos += layout.colWidths[2];

                // colSpan=2 empty (Lãi + TG)
                drawCell(doc, xPos, totalRowY, layout.colWidths[3] + layout.colWidths[4], subtotalH, '', {
                    fill: '#f8fafc',
                    padX: padX2,
                    padY: padY2,
                    fontSize: 10
                });
                xPos += layout.colWidths[3] + layout.colWidths[4];

                drawCell(doc, xPos, totalRowY, layout.colWidths[5], subtotalH, formatMoney(monthSubtotalInterest), {
                    align: 'right',
                    bold: true,
                    fill: '#f8fafc',
                    padX: padX2,
                    padY: padY2,
                    fontSize: 10
                });
                xPos += layout.colWidths[5];

                drawCell(doc, xPos, totalRowY, layout.colWidths[6], subtotalH, formatMoney(monthSubtotalPrincipal + monthSubtotalInterest), {
                    align: 'right',
                    bold: true,
                    fill: '#f8fafc',
                    padX: padX2,
                    padY: padY2,
                    fontSize: 10
                });

                doc.moveDown(2);

                // Update global totals
                if (includeAll) {
                    // globalPaidPrincipal, globalPaidInterest, globalUnpaidPrincipal, globalUnpaidInterest
                    // đã được cộng trực tiếp trong vòng lặp transaction (dòng 372-379)
                    // Chỉ cần cộng monthPrincipal và monthInterest vào globalPrincipal và globalInterest
                    globalPrincipal += monthPrincipal;
                    globalInterest += monthInterest;
                    // KHÔNG cộng lại globalUnpaidPrincipal và globalUnpaidInterest vì đã cộng trong vòng lặp
                } else {
                    // All are unpaid (OPEN status only)
                    globalUnpaidPrincipal += monthPrincipal;
                    globalUnpaidInterest += monthInterest;
                    globalPrincipal += monthPrincipal;
                    globalInterest += monthInterest;
                }
            }

            // Đảm bảo có chỗ cho tổng cuối + "Bằng chữ" + chữ ký (~160pt) trước khi sang trang
            const spaceForTotalsAndSignatures = 160;
            if (doc.y + spaceForTotalsAndSignatures > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                doc.y = doc.page.margins.top;
            }
            doc.moveDown(1);

            // Two-column totals - different format for includeAll
            doc.font('TimesNewRoman').fontSize(11);
            
            if (includeAll) {
                // Show simplified totals
                drawKeyValueRow(doc, 'Tổng tiền gốc:', `${formatMoney(globalPrincipal)} đ`, { fontSize: 11, valueWidth: 180 });
                drawKeyValueRow(doc, 'Tổng tiền lãi:', `${formatMoney(globalInterest)} đ`, { fontSize: 11, valueWidth: 180 });
                drawKeyValueRow(doc, 'Tổng cộng:', `${formatMoney(globalPrincipal + globalInterest)} đ`, { fontSize: 11, valueWidth: 180 });
                
                // Paid section
                doc.moveDown(0.3);
                doc.font('TimesNewRoman-Bold').fontSize(11);
                doc.fillColor('#15803d'); // emerald-700
                drawKeyValueRow(doc, 'Đã thanh toán:', `${formatMoney(globalPaidPrincipal + globalPaidInterest)} đ`, { fontSize: 11, valueWidth: 180 });
                
                // Big total line for unpaid
                doc.moveDown(0.3);
                doc.fillColor('#92400e'); // amber-800
                {
                    const { left, width } = getContentBox(doc);
                    const valueWidth = 220;
                    const label = 'CÒN NỢ LẠI:';
                    // Còn nợ lại = Tổng cộng - Đã thanh toán
                    const totalAmount = globalPrincipal + globalInterest;
                    const paidAmount = globalPaidPrincipal + globalPaidInterest;
                    const unpaidTotal = totalAmount - paidAmount;
                    const value = `${formatMoney(unpaidTotal)} đ`;
                    const y = doc.y + 2;

                    doc.font('TimesNewRoman-Bold').fontSize(14);
                    doc.text(label, left, y, { width: Math.max(0, width - valueWidth - 10), align: 'left' });
                    doc.text(value, left + width - valueWidth, y, { width: valueWidth, align: 'right' });

                    // Double underline under the value
                    const lineY1 = y + 18;
                    const x1 = left + width - valueWidth;
                    const x2 = left + width;
                    doc.moveTo(x1, lineY1).lineTo(x2, lineY1).stroke();
                    doc.moveTo(x1, lineY1 + 3).lineTo(x2, lineY1 + 3).stroke();

                    doc.y = y + 24;
                }

                // Right-aligned "Bằng chữ" for unpaid
                doc.fillColor('#000000');
                // Còn nợ lại = Tổng cộng - Đã thanh toán
                const totalAmount = globalPrincipal + globalInterest;
                const paidAmount = globalPaidPrincipal + globalPaidInterest;
                const unpaidTotal = totalAmount - paidAmount;
                drawRightAlignedMixed(doc, 'Số tiền bằng chữ: ', readMoney(unpaidTotal), { fontSize: 11 });
            } else {
                // Original format for debt report
                drawKeyValueRow(doc, 'Tổng tiền nợ gốc:', `${formatMoney(globalPrincipal)} đ`, { fontSize: 11, valueWidth: 180 });
                drawKeyValueRow(doc, 'Tổng tiền lãi:', `${formatMoney(globalInterest)} đ`, { fontSize: 11, valueWidth: 180 });

                // Big total line
                {
                    const { left, width } = getContentBox(doc);
                    const valueWidth = 220;
                    const label = 'TỔNG SỐ TIỀN PHẢI THANH TOÁN:';
                    const value = `${formatMoney(globalPrincipal + globalInterest)} đ`;
                    const y = doc.y + 2;

                    doc.font('TimesNewRoman-Bold').fontSize(14);
                    doc.text(label, left, y, { width: Math.max(0, width - valueWidth - 10), align: 'left' });
                    doc.text(value, left + width - valueWidth, y, { width: valueWidth, align: 'right' });

                    // Double underline under the value (similar to border-double)
                    const lineY1 = y + 18;
                    const x1 = left + width - valueWidth;
                    const x2 = left + width;
                    doc.moveTo(x1, lineY1).lineTo(x2, lineY1).stroke();
                    doc.moveTo(x1, lineY1 + 3).lineTo(x2, lineY1 + 3).stroke();

                    doc.y = y + 24;
                }

                // Right-aligned "Bằng chữ" like PrintableReport
                drawRightAlignedMixed(doc, 'Bằng chữ: ', readMoney(globalPrincipal + globalInterest), { fontSize: 11 });
            }
            
            // Reset fill color to black
            doc.fillColor('#000000');

            // Khu vực chữ ký: đặt ngay dưới "Bằng chữ" với khoảng cách vừa phải (tránh cách quá xa)
            doc.moveDown(2.5);
            const sigY = doc.y;
            const { left: contentLeft, width: contentWidth } = getContentBox(doc);
            const sigGap = 50;
            const sigBlockW = (contentWidth - sigGap) / 2;
            const sigLeftX = contentLeft;
            const sigRightX = contentLeft + sigBlockW + sigGap;

            doc.font('TimesNewRoman-Bold').fontSize(11);
            doc.text('Đại diện bên trả nợ', sigLeftX, sigY, { width: sigBlockW, align: 'center' });
            doc.text('Đại diện bên nhận nợ', sigRightX, sigY, { width: sigBlockW, align: 'center' });

            doc.font('TimesNewRoman-Italic').fontSize(10);
            doc.text('(Ký và ghi rõ họ tên)', sigLeftX, sigY + 20, { width: sigBlockW, align: 'center' });
            doc.text('(Ký và ghi rõ họ tên)', sigRightX, sigY + 20, { width: sigBlockW, align: 'center' });

            // Finalize PDF
            doc.end();
        } catch (error) {
            console.error('PDF generation error in generatePDF:', error);
            console.error('Error stack:', error.stack);
            console.error('Customer:', customer?.id || customer?._id || customer?.name);
            console.error('Transactions count:', transactions?.length);
            console.error('IncludeAll:', includeAll);
            reject(error);
        }
    });
}
