/**
 * Vietnamese Money Reader
 * Ported from Python utils.py
 */

function docSo3ChuSo(baso) {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    const tram = Math.floor(baso / 100);
    const chuc = Math.floor((baso % 100) / 10);
    const donvi = baso % 10;
    let ketqua = "";

    if (tram === 0 && chuc === 0 && donvi === 0) return "";

    if (tram !== 0) {
        ketqua += ChuSo[tram] + " trăm ";
        if (chuc === 0 && donvi !== 0) ketqua += "linh ";
    }

    if (chuc !== 0 && chuc !== 1) {
        ketqua += ChuSo[chuc] + " mươi";
        if (chuc === 0 && donvi !== 0) ketqua = ketqua + " linh ";
    }

    if (chuc === 1) ketqua += "mười";

    if (donvi === 1) {
        if (chuc !== 0 && chuc !== 1) {
            ketqua += " mốt";
        } else {
            ketqua += " một";
        }
    } else if (donvi === 5) {
        if (chuc === 0) {
            ketqua += " năm";
        } else {
            ketqua += " lăm";
        }
    } else {
        if (donvi !== 0) {
            ketqua += " " + ChuSo[donvi];
        }
    }

    return ketqua;
}

export function readMoney(soTien) {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    if (soTien < 0) return "Số tiền âm";
    if (soTien === 0) return "Không đồng";

    let so = Math.floor(soTien);
    if (so > 8999999999999999) {
        return "Số quá lớn";
    }

    const viTri = new Array(6).fill(0);

    // Phân tích số thành các đơn vị
    viTri[5] = Math.floor(so / 1000000000000000);
    so = so % 1000000000000000;

    viTri[4] = Math.floor(so / 1000000000000);
    so = so % 1000000000000;

    viTri[3] = Math.floor(so / 1000000000);
    so = so % 1000000000;

    viTri[2] = Math.floor(so / 1000000);
    so = so % 1000000;

    viTri[1] = Math.floor(so / 1000);
    so = so % 1000;

    viTri[0] = so % 1000;

    // Tìm vị trí cao nhất
    let lan = 0;
    if (viTri[5] > 0) lan = 5;
    else if (viTri[4] > 0) lan = 4;
    else if (viTri[3] > 0) lan = 3;
    else if (viTri[2] > 0) lan = 2;
    else if (viTri[1] > 0) lan = 1;
    else lan = 0;

    let ketqua = "";
    for (let i = lan; i >= 0; i--) {
        const tmp = docSo3ChuSo(viTri[i]);
        ketqua += tmp;
        if (viTri[i] > 0) ketqua += " " + Tien[i];

        if (i > 0 && tmp.length > 0) ketqua += ",";
    }

    if (ketqua.endsWith(",")) {
        ketqua = ketqua.slice(0, -1);
    }

    // Trim extra spaces
    ketqua = ketqua.split(/\s+/).join(" ").trim();

    // Capitalize first letter
    if (ketqua) {
        ketqua = ketqua.charAt(0).toUpperCase() + ketqua.slice(1);
    }

    return ketqua + " đồng";
}
