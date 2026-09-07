/**
 * Resolve models for current DATA_STORE (mongo mongoose | firestore adapters).
 */
import { isFirestore } from './dataStore.js';
import { createFsModel } from './fsModelFactory.js';
import { hashPassword, hashPin } from '../utils/userAuth.js';
import { activeNotificationFilter } from '../models/SystemNotification.js';

import MongoCustomer from '../models/Customer.js';
import MongoTransaction from '../models/Transaction.js';
import MongoUser from '../models/User.js';
import MongoInterestConfig from '../models/InterestConfig.js';
import MongoCounter from '../models/Counter.js';
import MongoBankAccountConfig from '../models/BankAccountConfig.js';
import MongoDriveOAuthConfig from '../models/DriveOAuthConfig.js';
import MongoSystemNotification from '../models/SystemNotification.js';
import MongoAppSettings from '../models/AppSettings.js';

const fsModels = {
    customers: createFsModel('customers', { idKeys: ['_id', 'id'] }),
    transactions: createFsModel('transactions', { idKeys: ['_id', 'id'] }),
    users: createFsModel('users', { idKeys: ['_id', 'username'] }),
    interest_configs: createFsModel('interest_configs', { idKeys: ['_id', 'code'] }),
    counters: createFsModel('counters', { idKeys: ['_id', 'code'] }),
    bank_account_config: createFsModel('bank_account_config', { idKeys: ['_id'] }),
    drive_oauth_config: createFsModel('drive_oauth_config', { idKeys: ['_id'] }),
    system_notifications: createFsModel('system_notifications', { idKeys: ['_id'] }),
    app_settings: createFsModel('app_settings', { idKeys: ['_id'] }),
};

fsModels.users.hashPassword = hashPassword;
fsModels.users.hashPin = hashPin;
fsModels.system_notifications.activeFilter = activeNotificationFilter;

export function getCustomerModel() {
    return isFirestore() ? fsModels.customers : MongoCustomer;
}
export function getTransactionModel() {
    return isFirestore() ? fsModels.transactions : MongoTransaction;
}
export function getUserModel() {
    return isFirestore() ? fsModels.users : MongoUser;
}
export function getInterestConfigModel() {
    return isFirestore() ? fsModels.interest_configs : MongoInterestConfig;
}
export function getCounterModel() {
    return isFirestore() ? fsModels.counters : MongoCounter;
}
export function getBankAccountConfigModel() {
    return isFirestore() ? fsModels.bank_account_config : MongoBankAccountConfig;
}
export function getDriveOAuthConfigModel() {
    return isFirestore() ? fsModels.drive_oauth_config : MongoDriveOAuthConfig;
}
export function getSystemNotificationModel() {
    return isFirestore() ? fsModels.system_notifications : MongoSystemNotification;
}
export function getAppSettingsModel() {
    return isFirestore() ? fsModels.app_settings : MongoAppSettings;
}
