import express from 'express';
import { google } from 'googleapis';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { APIError, ErrorCodes } from '../utils/errors.js';
import logger from '../utils/logger.js';
import DriveOAuthConfig from '../models/DriveOAuthConfig.js';

const router = express.Router();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function cleanEnvValue(value) {
    if (value === undefined || value === null) return '';
    const trimmed = String(value).trim();
    return trimmed.replace(/^"(.+)"$/s, '$1').replace(/^'(.+)'$/s, '$1').trim();
}

function getOAuthCredentials() {
    const clientId = cleanEnvValue(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID);
    const clientSecret = cleanEnvValue(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET);
    const redirectUri = cleanEnvValue(process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI) || 'http://localhost:53682/oauth2callback';

    if (!clientId || !clientSecret) {
        throw new APIError(
            'Missing Google Drive OAuth credentials. Set GOOGLE_DRIVE_OAUTH_CLIENT_ID and GOOGLE_DRIVE_OAUTH_CLIENT_SECRET.',
            500,
            ErrorCodes.DRIVE_ERROR
        );
    }

    return { clientId, clientSecret, redirectUri };
}

/**
 * GET /api/drive-oauth/refresh-token
 * Lấy refresh token hiện tại (masked, chỉ ADMIN)
 */
router.get('/refresh-token', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const config = await DriveOAuthConfig.findOne();
        
        if (!config) {
            return res.json({
                refresh_token: null,
                refresh_token_masked: null,
                token_created_at: null,
                google_account_email: null,
                has_token: false
            });
        }

        // Mask token: chỉ hiển thị 6 ký tự cuối
        const token = config.refresh_token;
        const masked = token.length > 6 ? `***${token.slice(-6)}` : '***';

        res.json({
            refresh_token: null, // Không trả về token thật
            refresh_token_masked: masked,
            token_created_at: config.token_created_at,
            google_account_email: config.google_account_email,
            has_token: true
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/drive-oauth/refresh-token
 * Lưu refresh token thủ công (chỉ ADMIN)
 */
router.put('/refresh-token', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token || !String(refresh_token).trim()) {
            throw new APIError('Refresh token không được để trống', 400, ErrorCodes.VALIDATION_ERROR);
        }

        const token = String(refresh_token).trim();

        // Tìm hoặc tạo config
        let config = await DriveOAuthConfig.findOne();
        
        if (config) {
            config.refresh_token = token;
            config.token_created_at = new Date();
        } else {
            config = new DriveOAuthConfig({
                refresh_token: token,
                token_created_at: new Date()
            });
        }

        await config.save();

        logger.info('Drive OAuth refresh token updated manually', { 
            has_token: true,
            created_at: config.token_created_at 
        });

        res.json({
            success: true,
            message: 'Đã lưu refresh token thành công',
            refresh_token_masked: token.length > 6 ? `***${token.slice(-6)}` : '***',
            token_created_at: config.token_created_at
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/drive-oauth/generate-url
 * Lấy OAuth URL để generate refresh token mới (chỉ ADMIN)
 */
router.get('/generate-url', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { clientId, clientSecret, redirectUri } = getOAuthCredentials();

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent' // Bắt buộc consent để nhận refresh_token
        });

        res.json({
            auth_url: authUrl,
            redirect_uri: redirectUri,
            message: 'Mở URL này trong trình duyệt để authorize và lấy refresh token'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/drive-oauth/callback
 * Xử lý OAuth callback và lưu refresh token (chỉ ADMIN)
 */
router.post('/callback', authMiddleware, requireAdmin, async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            throw new APIError('Missing authorization code', 400, ErrorCodes.VALIDATION_ERROR);
        }

        const { clientId, clientSecret, redirectUri } = getOAuthCredentials();

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            throw new APIError(
                'Không nhận được refresh_token. Vui lòng revoke access tại https://myaccount.google.com/permissions và thử lại.',
                400,
                ErrorCodes.DRIVE_ERROR
            );
        }

        // Lấy thông tin account Google
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        let googleAccountEmail = null;
        try {
            const userInfo = await oauth2.userinfo.get();
            googleAccountEmail = userInfo.data.email || null;
        } catch (e) {
            logger.warn('Could not fetch Google account email', { error: e.message });
        }

        // Lưu refresh token vào DB
        let config = await DriveOAuthConfig.findOne();
        
        if (config) {
            config.refresh_token = tokens.refresh_token;
            config.token_created_at = new Date();
            config.google_account_email = googleAccountEmail;
        } else {
            config = new DriveOAuthConfig({
                refresh_token: tokens.refresh_token,
                token_created_at: new Date(),
                google_account_email: googleAccountEmail
            });
        }

        await config.save();

        logger.info('Drive OAuth refresh token generated and saved', { 
            has_token: true,
            email: googleAccountEmail,
            created_at: config.token_created_at 
        });

        res.json({
            success: true,
            message: 'Đã tạo và lưu refresh token thành công',
            refresh_token: tokens.refresh_token, // Trả về để user có thể copy
            refresh_token_masked: tokens.refresh_token.length > 6 
                ? `***${tokens.refresh_token.slice(-6)}` 
                : '***',
            google_account_email: googleAccountEmail,
            token_created_at: config.token_created_at
        });
    } catch (error) {
        if (error.response?.data?.error === 'invalid_grant') {
            throw new APIError(
                'Authorization code đã hết hạn hoặc đã được sử dụng. Vui lòng tạo URL mới và thử lại.',
                400,
                ErrorCodes.DRIVE_ERROR
            );
        }
        next(error);
    }
});

export default router;
