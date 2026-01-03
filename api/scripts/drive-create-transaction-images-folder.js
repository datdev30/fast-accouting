import { google } from 'googleapis';
import dotenv from 'dotenv';

// Loads env from api/.env when running locally
dotenv.config();

function clean(value) {
    if (value === undefined || value === null) return '';
    const trimmed = String(value).trim();
    return trimmed.replace(/^"(.+)"$/s, '$1').replace(/^'(.+)'$/s, '$1').trim();
}

function required(name) {
    const value = clean(process.env[name]);
    if (!value) throw new Error(`Missing env ${name}`);
    return value;
}

async function main() {
    const clientId = required('GOOGLE_DRIVE_OAUTH_CLIENT_ID');
    const clientSecret = required('GOOGLE_DRIVE_OAUTH_CLIENT_SECRET');
    const refreshToken = required('GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN');
    const redirectUri = clean(process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI) || 'http://localhost:53682/oauth2callback';

    const folderName = process.argv.slice(2).join(' ').trim() || 'FastAccounting Transaction Images';

    const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    auth.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    const createResp = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id,name'
    });

    const id = createResp?.data?.id;
    const name = createResp?.data?.name;

    if (!id) {
        throw new Error('Failed to create folder (no id returned)');
    }

    console.log('Created folder:');
    console.log('name:', name);
    console.log('id:', id);
    console.log('url:', `https://drive.google.com/drive/folders/${id}`);
    console.log('\nSet this on Vercel + local:');
    console.log(`DRIVE_TRANSACTION_IMAGES_FOLDER_ID=${id}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
