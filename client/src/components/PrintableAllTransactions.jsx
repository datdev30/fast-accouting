import React, { forwardRef } from 'react';
import { Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDate } from '../utils/dateUtils';
import { readMoney } from '../utils/numberToWords';

const PrintableAllTransactions = forwardRef(({ customer, transactions, groupedTransactions }, ref) => {

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Calculate totals for all transactions (both paid and unpaid)
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalPaidPrincipal = 0;
    let totalPaidInterest = 0;
    let totalUnpaidPrincipal = 0;
    let totalUnpaidInterest = 0;

    if (transactions) {
        transactions.forEach(tx => {
            const principal = tx.amount || 0;
            const interest = tx.interest_calculation?.rounded_interest || 0;
            
            totalPrincipal += principal;
            totalInterest += interest;

            if (tx.status === 'PAID') {
                totalPaidPrincipal += principal;
                totalPaidInterest += interest;
            } else {
                totalUnpaidPrincipal += principal;
                totalUnpaidInterest += interest;
            }
        });
    }

    return (
        <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] text-base" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase mb-1">ĐẠI LÝ CÔNG PHÚ</h1>
                <p className="text-lg">Thôn Đắk Kual 2, xã Đức An, tỉnh Lâm Đồng</p>
                <div className="flex items-center justify-center gap-2 mt-1 text-slate-700">
                    <Phone size={16} />
                    <span className="font-bold">0342 789 046 <span className="mx-2">–</span> 0367 973 948</span>
                </div>
                <div className="border-b-2 border-slate-800 w-1/3 mx-auto my-3"></div>
                <h2 className="text-2xl font-bold uppercase mt-4">TẤT CẢ GIAO DỊCH</h2>
            </div>

            {/* Info */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between">
                    <span className="font-bold">Tên khách hàng: {customer?.name}</span>
                    <span>Ngày giờ: {dateStr}</span>
                </div>
            </div>

            {/* Content */}
            {Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center italic py-4">Không có giao dịch nào.</div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTransactions)
                        .sort(([keyA], [keyB]) => {
                            if (keyA === 'Khác') return 1;
                            if (keyB === 'Khác') return -1;
                            const [mA, yA] = keyA.split('/').map(Number);
                            const [mB, yB] = keyB.split('/').map(Number);
                            return new Date(yA, mA - 1) - new Date(yB, mB - 1);
                        })
                        .map(([month, txs]) => {
                            // Sort transactions strictly Oldest -> Newest for display
                            const sortedTxs = [...txs].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

                            // Include ALL transactions (both paid and unpaid)
                            if (sortedTxs.length === 0) return null;

                            // Calculate month subtotals for all transactions
                            let monthPrincipal = 0;
                            let monthInterest = 0;
                            let monthPaidPrincipal = 0;
                            let monthPaidInterest = 0;
                            let monthUnpaidPrincipal = 0;
                            let monthUnpaidInterest = 0;

                            sortedTxs.forEach(tx => {
                                const calc = tx.interest_calculation;
                                const principal = tx.amount || 0;
                                const interest = calc?.rounded_interest || 0;
                                
                                monthPrincipal += principal;
                                monthInterest += interest;

                                if (tx.status === 'PAID') {
                                    monthPaidPrincipal += principal;
                                    monthPaidInterest += interest;
                                } else {
                                    monthUnpaidPrincipal += principal;
                                    monthUnpaidInterest += interest;
                                }
                            });

                            return (
                                <div key={month} className="mb-4 break-inside-avoid">
                                    <h3 className="font-bold border-b border-black mb-2">Tháng: {month}</h3>
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border border-black bg-slate-100">
                                                <th className="border border-black px-2 py-1 center w-20">Ngày</th>
                                                <th className="border border-black px-2 py-1 text-left">Nội dung</th>
                                                <th className="border border-black px-2 py-1 text-right w-24">Tiền gốc</th>
                                                <th className="border border-black px-2 py-1 center w-12">Lãi</th>
                                                <th className="border border-black px-2 py-1 center w-16">TG</th>
                                                <th className="border border-black px-2 py-1 text-right w-24">Tiền lãi</th>
                                                <th className="border border-black px-2 py-1 text-right w-24">Tổng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedTxs.map(tx => {
                                                const calc = tx.interest_calculation;
                                                const interest = calc?.rounded_interest || 0;
                                                const total = tx.amount + interest;
                                                const isPaid = tx.status === 'PAID';

                                                return (
                                                    <tr 
                                                        key={tx._id} 
                                                        className={clsx(
                                                            "border border-black",
                                                            isPaid && "bg-yellow-50"
                                                        )}
                                                        style={isPaid ? { backgroundColor: '#f9fc88' } : {}}
                                                    >
                                                        <td className="border border-black px-2 py-1 text-center align-top">
                                                            {formatDate(tx.transaction_date)}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-left align-top whitespace-pre-wrap">
                                                            {tx.content}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-right align-top">
                                                            {tx.amount.toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-center align-top">
                                                            {tx.interest_rate_snapshot}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-center align-top">
                                                            {calc?.months?.toFixed(1)}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-right align-top">
                                                            {interest.toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="border border-black px-2 py-1 text-right align-top font-bold">
                                                            {total.toLocaleString('vi-VN')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Month Subtotal - chỉ tính những giao dịch còn nợ */}
                                            <tr className="border border-black bg-slate-50 font-bold">
                                                <td colSpan="2" className="border border-black px-2 py-1 text-right">Tổng Tháng</td>
                                                <td className="border border-black px-2 py-1 text-right">{monthUnpaidPrincipal.toLocaleString('vi-VN')}</td>
                                                <td colSpan="2" className="border border-black"></td>
                                                <td className="border border-black px-2 py-1 text-right">{monthUnpaidInterest.toLocaleString('vi-VN')}</td>
                                                <td className="border border-black px-2 py-1 text-right">{(monthUnpaidPrincipal + monthUnpaidInterest).toLocaleString('vi-VN')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Grand Total */}
            <div className="mt-8 border-t-2 border-black pt-4 break-inside-avoid">
                <table className="w-full text-base">
                    <tbody>
                        <tr>
                            <td className="py-1 font-bold">Tổng tiền gốc:</td>
                            <td className="py-1 text-right font-bold w-48">{totalPrincipal.toLocaleString('vi-VN')} đ</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold">Tổng tiền lãi:</td>
                            <td className="py-1 text-right font-bold w-48">{totalInterest.toLocaleString('vi-VN')} đ</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold">Tổng cộng:</td>
                            <td className="py-1 text-right font-bold w-48 border-b border-slate-300">
                                {(totalPrincipal + totalInterest).toLocaleString('vi-VN')} đ
                            </td>
                        </tr>
                        <tr>
                            <td className="py-1 font-bold text-emerald-700">Đã thanh toán:</td>
                            <td className="py-1 text-right font-bold w-48 text-emerald-700 border-b border-emerald-300">
                                {(totalPaidPrincipal + totalPaidInterest).toLocaleString('vi-VN')} đ
                            </td>
                        </tr>
                        <tr className="text-xl">
                            <td className="py-2 font-bold uppercase text-amber-800">Còn nợ lại:</td>
                            <td className="py-2 text-right font-bold w-48 border-b-2 border-double border-black text-amber-800">
                                {((totalPrincipal + totalInterest) - (totalPaidPrincipal + totalPaidInterest)).toLocaleString('vi-VN')} đ
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-2 text-right italic text-slate-600">
                    Số tiền bằng chữ: <b>{readMoney((totalPrincipal + totalInterest) - (totalPaidPrincipal + totalPaidInterest))}</b>
                </div>
            </div>

            {/* Signatures */}
            <div className="mt-16 flex justify-between text-center break-inside-avoid">
                <div className="w-1/2">
                    <p className="font-bold">Đại diện bên trả nợ</p>
                    <p className="text-sm italic mb-16">(Ký và ghi rõ họ tên)</p>
                </div>
                <div className="w-1/2">
                    <p className="font-bold">Đại diện bên nhận nợ</p>
                    <p className="text-sm italic mb-16">(Ký và ghi rõ họ tên)</p>
                </div>
            </div>
        </div>
    );
});

export default PrintableAllTransactions;
