import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import InterestConfig from './models/InterestConfig.js';

dotenv.config();

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create admin user with PIN
        console.log('\n📝 Creating admin user...');

        // Check if admin exists
        let admin = await User.findOne({ username: 'admin' });

        if (!admin) {
            const hashedPassword = await User.hashPassword('admin123');
            const hashedPin = await User.hashPin('1234');

            admin = new User({
                username: 'admin',
                password_hash: hashedPassword,
                pin_hash: hashedPin,
                legacy_password: false,
                display_name: 'Admin',
                role: 'ADMIN'
            });

            await admin.save();
            console.log('✅ Admin user created');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   PIN: 1234');
        } else {
            console.log('ℹ️  Admin user already exists');

            // Update PIN if not set
            if (!admin.pin_hash) {
                const hashedPin = await User.hashPin('1234');
                admin.pin_hash = hashedPin;
                await admin.save();
                console.log('✅ Admin PIN set to: 1234');
            }

            // Ensure role/display_name are present for dev
            let changed = false;
            if (!admin.role) {
                admin.role = 'ADMIN';
                changed = true;
            }
            if (!admin.display_name) {
                admin.display_name = 'Admin';
                changed = true;
            }
            if (changed) {
                await admin.save();
                console.log('✅ Admin role/display_name updated');
            }
        }

        // 1b. Ensure every user has a role (default SALE)
        console.log('\n📝 Ensuring user roles...');
        const allUsers = await User.find().select('username role');
        let updatedCount = 0;
        for (const u of allUsers) {
            if (!u.role) {
                u.role = u.username === 'admin' ? 'ADMIN' : 'SALE';
                await u.save();
                updatedCount++;
            }
        }
        console.log(`✅ Roles ensured. Updated: ${updatedCount}`);

        // 1c. Create a sample SALE user for testing
        console.log('\n📝 Creating SALE test user...');
        let saleUser = await User.findOne({ username: 'sale1' });
        if (!saleUser) {
            const hashedPassword = await User.hashPassword('sale123');
            saleUser = new User({
                username: 'sale1',
                password_hash: hashedPassword,
                legacy_password: false,
                display_name: 'Sale 1',
                role: 'SALE'
            });
            await saleUser.save();
            console.log('✅ SALE user created');
            console.log('   Username: sale1');
            console.log('   Password: sale123');
        } else {
            let changed = false;
            if (!saleUser.role) {
                saleUser.role = 'SALE';
                changed = true;
            }
            if (!saleUser.display_name) {
                saleUser.display_name = 'Sale 1';
                changed = true;
            }
            if (changed) {
                await saleUser.save();
                console.log('✅ SALE user updated (role/display_name)');
            } else {
                console.log('ℹ️  SALE user already exists');
            }
        }

        // 2. Create interest configurations
        console.log('\n📝 Creating interest configurations...');

        const configs = [
            {
                code: 'TIEN_MAT',
                name: 'Tiền mặt',
                rate_per_month: 2.0,
                description: 'Cho vay tiền mặt - Lãi suất 2%/tháng'
            },
            {
                code: 'CHUYEN_KHOAN',
                name: 'Chuyển khoản',
                rate_per_month: 2.0,
                description: 'Cho vay chuyển khoản - Lãi suất 2%/tháng'
            },
            {
                code: 'MUA_HANG',
                name: 'Mua hàng',
                rate_per_month: 1.5,
                description: 'Mua hàng (phân bón, thuốc trừ sâu) - Lãi suất 1.5%/tháng'
            }
        ];

        for (const configData of configs) {
            const existing = await InterestConfig.findOne({ code: configData.code });

            if (!existing) {
                const config = new InterestConfig(configData);
                await config.save();
                console.log(`✅ Created: ${configData.name} (${configData.rate_per_month}%/tháng)`);
            } else {
                console.log(`ℹ️  Already exists: ${configData.name}`);
            }
        }

        console.log('\n🎉 Database seeding completed!');
        console.log('\n📋 Summary:');
        console.log('   - Admin user: admin / admin123');
        console.log('   - Admin PIN: 1234');
        console.log('   - Admin role: ADMIN');
        console.log('   - SALE user: sale1 / sale123');
        console.log('   - Interest configs: 3 types');

        console.log('\n🚀 You can now:');
        console.log('   1. Start the server: node index.js');
        console.log('   2. Login with admin/admin123');
        console.log('   3. Create customers and transactions');

    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

seedDatabase();
