import http from 'http';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function required(name) {
    const value = process.env[name];
    if (!value || !String(value).trim()) {
        throw new Error(`Missing env ${name}`);
    }
    return String(value).trim();
}

async function main() {
    const clientId = required('GOOGLE_DRIVE_OAUTH_CLIENT_ID');
    const clientSecret = required('GOOGLE_DRIVE_OAUTH_CLIENT_SECRET');

    const port = Number(process.env.GOOGLE_DRIVE_OAUTH_LOCAL_PORT || 53682);
    const redirectUri = process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI || `http://localhost:${port}/oauth2callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log('1) Open this URL in your browser:');
    console.log(authUrl);
    console.log('\n2) After approving, your browser will redirect to:');
    console.log(redirectUri);

    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, redirectUri);
            if (url.pathname !== '/oauth2callback') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }

            const error = url.searchParams.get('error');
            if (error) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(`OAuth error: ${error}`);
                console.error('OAuth error:', error);
                server.close();
                return;
            }

            const code = url.searchParams.get('code');
            if (!code) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Missing code');
                return;
            }

            const { tokens } = await oauth2Client.getToken(code);

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK. You can close this tab and return to the terminal.');

            console.log('\n=== OAuth tokens ===');
            console.log('refresh_token:', tokens.refresh_token);
            console.log('access_token:', tokens.access_token ? '(received)' : '(none)');
            console.log('expiry_date:', tokens.expiry_date);

            if (!tokens.refresh_token) {
                console.log('\nNOTE: No refresh_token returned. Try again after revoking access at https://myaccount.google.com/permissions and rerun this script.');
            }

            server.close();
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal error');
            console.error('Callback handling error:', e);
            server.close();
        }
    });

    server.listen(port, () => {
        console.log(`\nListening on http://localhost:${port}`);
        console.log('Waiting for OAuth callback...');
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
