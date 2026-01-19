
const docSo3ChuSo = (baso) => {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    let tram = parseInt(baso / 100);
    let chuc = parseInt((baso % 100) / 10);
    let donvi = baso % 10;
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

    switch (donvi) {
        case 1:
            if (chuc !== 0 && chuc !== 1) {
                ketqua += " mốt";
            } else {
                ketqua += " một";
            }
            break;
        case 5:
            if (chuc === 0) {
                ketqua += " năm";
            } else {
                ketqua += " lăm";
            }
            break;
        default:
            if (donvi !== 0) {
                ketqua += " " + ChuSo[donvi];
            }
            break;
    }
    return ketqua;
}

export const readMoney = (SoTien) => {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const Tien = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    let lan = 0;
    let i = 0;
    let so = 0;
    let ketqua = "";
    let tmp = "";
    let ViTri = new Array();

    if (SoTien < 0) return "Số tiền âm";
    if (SoTien === 0) return "Không đồng";

    if (SoTien > 0) {
        so = SoTien;
    } else {
        so = -SoTien;
    }

    if (SoTien > 8999999999999999) {
        // limit
        return "Số quá lớn";
    }

    ViTri[5] = Math.floor(so / 1000000000000000);
    if (isNaN(ViTri[5])) ViTri[5] = "0";
    so = so - parseFloat(ViTri[5].toString()) * 1000000000000000;
    ViTri[4] = Math.floor(so / 1000000000000);
    if (isNaN(ViTri[4])) ViTri[4] = "0";
    so = so - parseFloat(ViTri[4].toString()) * 1000000000000;
    ViTri[3] = Math.floor(so / 1000000000);
    if (isNaN(ViTri[3])) ViTri[3] = "0";
    so = so - parseFloat(ViTri[3].toString()) * 1000000000;
    ViTri[2] = parseInt(so / 1000000);
    if (isNaN(ViTri[2])) ViTri[2] = "0";
    ViTri[1] = parseInt((so % 1000000) / 1000);
    if (isNaN(ViTri[1])) ViTri[1] = "0";
    ViTri[0] = parseInt(so % 1000);
    if (isNaN(ViTri[0])) ViTri[0] = "0";

    if (ViTri[5] > 0) {
        lan = 5;
    } else if (ViTri[4] > 0) {
        lan = 4;
    } else if (ViTri[3] > 0) {
        lan = 3;
    } else if (ViTri[2] > 0) {
        lan = 2;
    } else if (ViTri[1] > 0) {
        lan = 1;
    } else {
        lan = 0;
    }

    for (i = lan; i >= 0; i--) {
        tmp = docSo3ChuSo(ViTri[i]);
        ketqua += tmp;
        if (ViTri[i] > 0) ketqua += " " + Tien[i];
        if ((i > 0) && (tmp.length > 0)) ketqua += ", "; // Comma separation with space
    }

    // Remove trailing comma and space if exists
    if (ketqua.substring(ketqua.length - 2) === ', ') {
        ketqua = ketqua.substring(0, ketqua.length - 2);
    } else if (ketqua.substring(ketqua.length - 1) === ',') {
        ketqua = ketqua.substring(0, ketqua.length - 1);
    }

    ketqua = ketqua.trim();

    // Capitalize first letter
    ketqua = ketqua.charAt(0).toUpperCase() + ketqua.slice(1);

    return ketqua + " đồng";
}
