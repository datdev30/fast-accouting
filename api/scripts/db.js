/**
 * db.js — công cụ truy vấn / sửa dữ liệu trực tiếp, không cần vào app.
 *
 *   node scripts/db.js <lệnh> [tham số] [tuỳ chọn]
 *
 * ── Lệnh ĐỌC (chạy ngay, không cần xác nhận) ──────────────────────────
 *   list                                    liệt kê collection + số document
 *   find   <coll> [filter] [--limit N] [--sort '<json>'] [--project '<json>']
 *   count  <coll> [filter]
 *   users                                   liệt kê tài khoản (ẩn hash)
 *
 * ── Lệnh GHI (bắt buộc --yes, luôn xem trước) ─────────────────────────
 *   update <coll> <filter> <update> [--many] --yes
 *   delete <coll> <filter> [--many] --yes
 *   set-password <username> <mật-khẩu-mới> --yes      (tự băm bcrypt)
 *   set-pin      <username> <pin-4-số>     --yes      (tự băm bcrypt)
 *   set-role     <username> ADMIN|SALE     --yes
 *
 * ── Tuỳ chọn ──────────────────────────────────────────────────────────
 *   --yes          xác nhận thao tác ghi
 *   --many         áp dụng cho mọi document khớp (mặc định chỉ 1)
 *   --force-all    cho phép filter rỗng {} (cực kỳ nguy hiểm)
 *   --json         in JSON thô thay vì bảng
 *   --limit N      giới hạn số dòng của find (mặc định 20)
 *
 * ── Rào chắn ──────────────────────────────────────────────────────────
 *   · Mọi lệnh đều in rõ database đang kết nối trước khi làm gì.
 *   · Ghi mà thiếu --yes thì chỉ chạy thử (dry-run) và in ra thứ SẼ đổi.
 *   · Filter rỗng {} bị chặn trên update/delete trừ khi có --force-all.
 *   · Mọi trường chứa hash / mật khẩu / token đều bị che khi in ra.
 *   · Mật khẩu và PIN luôn đi qua bcrypt — xem ghi chú ở cuối file.
 *
 * Ví dụ:
 *   node scripts/db.js users
 *   node scripts/db.js find customers '{"name":{"$regex":"Nguyễn"}}' --limit 5
 *   node scripts/db.js count transactions '{"status":"OPEN"}'
 *   node scripts/db.js update transactions '{"_id":"..."}' '{"$set":{"status":"PAID"}}' --yes
 *   node scripts/db.js set-password dat 'MatKhauMoi@2026' --yes
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SECRET_FIELD = /hash|password|pin|token|secret|credential/i;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const opt = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
        if (['limit', 'sort', 'project'].includes(a.slice(2))) i += 1; // bỏ qua giá trị đi kèm
        continue;
    }
    positional.push(a);
}

const [command, ...args] = positional;
const YES = flags.has('--yes');
const MANY = flags.has('--many');
const AS_JSON = flags.has('--json');

function die(msg) {
    console.error(`\n✖ ${msg}\n`);
    process.exit(1);
}

function parseJson(raw, label) {
    if (raw === undefined) return {};
    try {
        return JSON.parse(raw);
    } catch (err) {
        die(`${label} không phải JSON hợp lệ: ${err.message}\n  Đã nhận: ${raw}`);
    }
}

/** Che mọi giá trị nhạy cảm trước khi in ra màn hình. */
function redact(value) {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object' && !(value instanceof Date)) {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = SECRET_FIELD.test(k) && typeof v === 'string'
                ? `<đã ẩn, ${v.startsWith('$2') ? 'bcrypt' : 'chuỗi'} ${v.length} ký tự>`
                : redact(v);
        }
        return out;
    }
    return value;
}

function show(docs) {
    const safe = docs.map(redact);
    if (AS_JSON) return console.log(JSON.stringify(safe, null, 2));
    if (!safe.length) return console.log('(không có document nào khớp)');
    console.log(JSON.stringify(safe, null, 2));
}

/** Chặn thao tác ghi trên toàn bộ collection do lỡ tay. */
function guardFilter(filter) {
    if (Object.keys(filter).length === 0 && !flags.has('--force-all')) {
        die('Filter rỗng {} sẽ áp dụng cho TOÀN BỘ collection.\n  Nếu thật sự cố ý, thêm --force-all.');
    }
}

async function findUser(db, username) {
    const user = await db.collection('users').findOne({ username });
    if (user) return user;
    const all = await db.collection('users').find({}, { projection: { username: 1, role: 1 } }).toArray();
    console.error(`\n✖ Không có user "${username}". Hiện có:`);
    all.forEach((u) => console.error(`    - ${u.username} (${u.role || 'chưa đặt role'})`));
    process.exit(1);
}

/** Xem trước rồi mới ghi. Thiếu --yes thì dừng lại ở bước xem trước. */
async function writeGuard(db, coll, filter, describe) {
    const matched = await db.collection(coll).countDocuments(filter);
    console.log(`\nKhớp ${matched} document trong "${coll}".`);

    if (matched === 0) {
        console.log('Không có gì để đổi.');
        return false;
    }

    const sample = await db.collection(coll).find(filter).limit(3).toArray();
    console.log('\nMẫu document sẽ bị ảnh hưởng:');
    show(sample);
    console.log(`\nThao tác: ${describe}`);
    console.log(`Phạm vi : ${MANY ? `TẤT CẢ ${matched} document` : 'chỉ document ĐẦU TIÊN'}`);

    if (!YES) {
        console.log('\n⚠ Đây mới là chạy thử. Thêm --yes để thực hiện thật.\n');
        return false;
    }
    return true;
}

// ── Kết nối ───────────────────────────────────────────────────────────

if (!command || flags.has('--help') || command === 'help') {
    console.log(String.raw`
db.js — truy vấn / sửa dữ liệu trực tiếp

  ĐỌC   list · find <coll> [filter] · count <coll> [filter] · users
  GHI   update <coll> <filter> <update> --yes
        delete <coll> <filter> --yes
        set-password <username> <pass> --yes
        set-pin <username> <pin4> --yes
        set-role <username> ADMIN|SALE --yes

  Cờ    --yes --many --force-all --json --limit N --sort '<json>' --project '<json>'

Xem phần chú thích đầu file scripts/db.js để biết ví dụ.
`);
    process.exit(0);
}

if (!process.env.MONGODB_URI) die('MONGODB_URI chưa được đặt trong api/.env');

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const host = mongoose.connection.host;

console.log('─'.repeat(64));
console.log(`  Database : ${mongoose.connection.name}`);
console.log(`  Host     : ${host}`);
console.log(`  Chế độ   : ${YES ? '⚠  GHI THẬT' : 'chỉ đọc / chạy thử'}`);
console.log('─'.repeat(64));

try {
    switch (command) {
        case 'list': {
            const colls = await db.listCollections().toArray();
            const rows = [];
            for (const c of colls) {
                rows.push({ collection: c.name, documents: await db.collection(c.name).countDocuments() });
            }
            console.table(rows);
            break;
        }

        case 'users': {
            const docs = await db.collection('users')
                .find({}, { projection: { username: 1, display_name: 1, role: 1, legacy_password: 1, password_hash: 1, pin_hash: 1 } })
                .toArray();
            console.table(docs.map((u) => ({
                username: u.username,
                display_name: u.display_name || '—',
                role: u.role || '(chưa đặt)',
                'kiểu mật khẩu': !u.password_hash ? '—'
                    : String(u.password_hash).startsWith('$2') ? 'bcrypt'
                        : /^[a-f0-9]{32}$/i.test(u.password_hash) ? 'MD5 (legacy)' : 'khác',
                'có PIN': u.pin_hash ? 'có' : 'không',
            })));
            break;
        }

        case 'find': {
            const [coll, filterRaw] = args;
            if (!coll) die('Thiếu tên collection.');
            const docs = await db.collection(coll)
                .find(parseJson(filterRaw, 'filter'))
                .project(parseJson(opt('project', undefined), 'project'))
                .sort(parseJson(opt('sort', undefined), 'sort'))
                .limit(Number(opt('limit', 20)))
                .toArray();
            console.log(`\n${docs.length} document:`);
            show(docs);
            break;
        }

        case 'count': {
            const [coll, filterRaw] = args;
            if (!coll) die('Thiếu tên collection.');
            console.log(`\n${await db.collection(coll).countDocuments(parseJson(filterRaw, 'filter'))} document khớp.`);
            break;
        }

        case 'update': {
            const [coll, filterRaw, updateRaw] = args;
            if (!coll || !filterRaw || !updateRaw) die('Cú pháp: update <coll> <filter> <update> --yes');
            const filter = parseJson(filterRaw, 'filter');
            const update = parseJson(updateRaw, 'update');
            guardFilter(filter);

            if (coll === 'users' && JSON.stringify(update).match(/password_hash|pin_hash/)) {
                die('Không sửa password_hash / pin_hash bằng "update" — giá trị phải là hash bcrypt.\n'
                    + '  Dùng: node scripts/db.js set-password <username> <mật-khẩu> --yes');
            }

            if (!await writeGuard(db, coll, filter, JSON.stringify(update))) break;
            const res = MANY
                ? await db.collection(coll).updateMany(filter, update)
                : await db.collection(coll).updateOne(filter, update);
            console.log(`\n✅ Đã sửa ${res.modifiedCount}/${res.matchedCount} document.`);
            break;
        }

        case 'delete': {
            const [coll, filterRaw] = args;
            if (!coll || !filterRaw) die('Cú pháp: delete <coll> <filter> --yes');
            const filter = parseJson(filterRaw, 'filter');
            guardFilter(filter);
            if (!await writeGuard(db, coll, filter, 'XOÁ VĨNH VIỄN')) break;
            const res = MANY
                ? await db.collection(coll).deleteMany(filter)
                : await db.collection(coll).deleteOne(filter);
            console.log(`\n✅ Đã xoá ${res.deletedCount} document.`);
            break;
        }

        case 'set-password': {
            const [username, newPassword] = args;
            if (!username || !newPassword) die("Cú pháp: set-password <username> '<mật-khẩu-mới>' --yes");
            if (newPassword.length < 4) die('Mật khẩu phải có ít nhất 4 ký tự.');

            const user = await findUser(db, username);
            console.log(`\nTài khoản: ${user.username} (${user.role || 'chưa đặt role'}) — ${user.display_name || 'không có tên hiển thị'}`);
            console.log('Thao tác : đặt lại password_hash bằng bcrypt, và bỏ cờ legacy_password');

            if (!YES) {
                console.log('\n⚠ Đây mới là chạy thử. Thêm --yes để thực hiện thật.\n');
                break;
            }
            await db.collection('users').updateOne(
                { username },
                { $set: { password_hash: await bcrypt.hash(newPassword, await bcrypt.genSalt(10)), legacy_password: false } }
            );
            console.log(`\n✅ Đã đổi mật khẩu cho "${username}". Đăng nhập lại bằng mật khẩu mới.`);
            break;
        }

        case 'set-pin': {
            const [username, pin] = args;
            if (!username || !pin) die('Cú pháp: set-pin <username> <pin-4-số> --yes');
            if (!/^\d{4}$/.test(pin)) die('PIN phải đúng 4 chữ số.');

            const user = await findUser(db, username);
            console.log(`\nTài khoản: ${user.username} — đặt lại pin_hash bằng bcrypt`);
            if (!YES) {
                console.log('\n⚠ Đây mới là chạy thử. Thêm --yes để thực hiện thật.\n');
                break;
            }
            await db.collection('users').updateOne(
                { username },
                { $set: { pin_hash: await bcrypt.hash(pin, await bcrypt.genSalt(10)) } }
            );
            console.log(`\n✅ Đã đổi PIN cho "${username}".`);
            break;
        }

        case 'set-role': {
            const [username, role] = args;
            if (!username || !role) die('Cú pháp: set-role <username> ADMIN|SALE --yes');
            if (!['ADMIN', 'SALE'].includes(role)) die('Role chỉ nhận ADMIN hoặc SALE.');

            const user = await findUser(db, username);
            console.log(`\nTài khoản: ${user.username} — đổi role ${user.role || '(chưa đặt)'} → ${role}`);
            if (!YES) {
                console.log('\n⚠ Đây mới là chạy thử. Thêm --yes để thực hiện thật.\n');
                break;
            }
            await db.collection('users').updateOne({ username }, { $set: { role } });
            console.log(`\n✅ Đã đổi role cho "${username}" thành ${role}.`);
            break;
        }

        default:
            die(`Không hiểu lệnh "${command}". Chạy: node scripts/db.js help`);
    }
} finally {
    await mongoose.disconnect();
}

/*
 * ── Vì sao không đổi mật khẩu bằng update thẳng? ──────────────────────
 *
 * models/User.js so khớp mật khẩu như sau:
 *   · chuỗi bắt đầu bằng "$2"     → bcrypt.compare
 *   · chuỗi 32 ký tự hex          → so sánh MD5 (dữ liệu cũ từ bản Python)
 *   · còn lại                     → không bao giờ khớp
 *
 * Nên nếu chạy:
 *   db.users.updateOne({username:'dat'}, {$set:{password_hash:'MatKhauMoi'}})
 * thì tài khoản đó sẽ KHÔNG đăng nhập được bằng bất kỳ mật khẩu nào —
 * "MatKhauMoi" không phải bcrypt, cũng không phải MD5 hex.
 *
 * Lệnh set-password ở trên băm đúng cách trước khi ghi.
 */
