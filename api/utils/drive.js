import { google } from 'googleapis';

let cachedDrive = null;

function loadOAuthCredentialsFromEnv() {
    const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;
    const redirectUri = process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI || 'http://localhost:53682/oauth2callback';

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            'Missing Google Drive OAuth credentials. Set GOOGLE_DRIVE_OAUTH_CLIENT_ID, GOOGLE_DRIVE_OAUTH_CLIENT_SECRET, and GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN.'
        );
    }

    return { clientId, clientSecret, refreshToken, redirectUri };
}

async function createDriveClientWithOAuth() {
    const { clientId, clientSecret, refreshToken, redirectUri } = loadOAuthCredentialsFromEnv();

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth });
}

export async function getDriveClient() {
    if (cachedDrive) return cachedDrive;
    cachedDrive = await createDriveClientWithOAuth();
    return cachedDrive;
}

export async function uploadTransactionImageToDrive({
    buffer,
    mimeType,
    originalName,
    transactionId
}) {
    const drive = await getDriveClient();

    const folderId = process.env.DRIVE_TRANSACTION_IMAGES_FOLDER_ID;
    if (!folderId) {
        throw new Error('Missing DRIVE_TRANSACTION_IMAGES_FOLDER_ID');
    }

    // Validate folder access early for clearer errors.
    const folderMeta = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,driveId',
        supportsAllDrives: true
    });

    // Keep folderMeta referenced so lint/type checkers don't flag it as unused.
    // Also acts as a clear preflight check.
    if (!folderMeta?.data?.id) {
        throw new Error('Drive folder access check failed');
    }

    const safeOriginal = (originalName || 'image')
        .replace(/[\\/\r\n\t]/g, '_')
        .slice(0, 80);

    const filename = `${transactionId}__${Date.now()}__${safeOriginal}`;

    const { Readable } = await import('stream');
    const bodyStream = Readable.from(buffer);

    const resp = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
            name: filename,
            parents: [folderId]
        },
        media: {
            mimeType,
            body: bodyStream
        },
        fields: 'id'
    });

    return resp?.data?.id;
}


export async function downloadDriveFileStream(fileId) {
    const drive = await getDriveClient();

    const resp = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
    );

    return resp;
}

export async function deleteDriveFile(fileId) {
    const drive = await getDriveClient();
    try {
        await drive.files.delete({ fileId, supportsAllDrives: true });
        return true;
    } catch (error) {
        console.error('Error deleting file from Drive:', error);
        return false;
    }
}

