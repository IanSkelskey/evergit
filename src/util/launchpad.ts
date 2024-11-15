import axios from 'axios';
import inquirer from 'inquirer';
import crypto from 'crypto';
import { print } from './prompt';

// OAuth credentials
const CONSUMER_KEY = 'evergit';

// Launchpad OAuth endpoints
const requestTokenUrl = 'https://launchpad.net/+request-token';
const authorizeUrl = 'https://launchpad.net/+authorize-token';
const accessTokenUrl = 'https://launchpad.net/+access-token';

// Helper function to generate a unique nonce
function generateNonce(length = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.randomFillSync(new Uint8Array(length)))
        .map(x => charset[x % charset.length])
        .join('');
}

// Step 1: Request Token
async function getRequestToken() {
    const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
    const oauthNonce = generateNonce();
    const oauthSignature = '%26';  // Signature as required by Launchpad

    const authorizationHeader = [
        `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
        `oauth_signature_method="PLAINTEXT"`,
        `oauth_signature="${oauthSignature}"`,
        `oauth_timestamp="${oauthTimestamp}"`,
        `oauth_nonce="${oauthNonce}"`,
        `oauth_version="1.0"`
    ].join(', ');

    try {
        const response = await axios.post(requestTokenUrl, null, {
            headers: {
                Authorization: authorizationHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const params = new URLSearchParams(response.data as string);
        const requestToken = params.get('oauth_token');
        const requestTokenSecret = params.get('oauth_token_secret');

        if (!requestToken || !requestTokenSecret) {
            throw new Error('Failed to obtain request token or request token secret.');
        }

        print('info', 'Request token obtained.');
        return { requestToken, requestTokenSecret };
    } catch (error) {
        print('error', 'Error requesting token.');
        throw error;
    }
}

// Step 2: Display Authorization URL for User to Copy and Navigate
async function authorizeRequestToken(requestToken: string) {
    const authorizeUrlWithToken = `${authorizeUrl}?oauth_token=${requestToken}`;
    print('info', `Please authorize the app by copying this URL into your browser:\n${authorizeUrlWithToken}`);

    // Wait for user confirmation after they've authorized the app
    await inquirer.prompt({
        type: 'input',
        name: 'confirmed',
        message: 'Press Enter once you have completed the authorization in the browser.',
    });
}

// Step 3: Exchange Request Token for Access Token
async function getAccessToken(requestToken: string, requestTokenSecret: string) {
    const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
    const oauthNonce = generateNonce();

    const token = {
        key: requestToken,
        secret: requestTokenSecret,
    };

    const oauthSignature = `%26${token.secret}`;  // Signature includes token secret

    const authorizationHeader = [
        `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
        `oauth_token="${token.key}"`,
        `oauth_signature_method="PLAINTEXT"`,
        `oauth_signature="${oauthSignature}"`,
        `oauth_timestamp="${oauthTimestamp}"`,
        `oauth_nonce="${oauthNonce}"`,
        `oauth_version="1.0"`
    ].join(', ');

    try {
        const response = await axios.post(accessTokenUrl, null, {
            headers: {
                Authorization: authorizationHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const params = new URLSearchParams(response.data as string);
        const accessToken = params.get('oauth_token');
        const accessTokenSecret = params.get('oauth_token_secret');

        if (!accessToken || !accessTokenSecret) {
            throw new Error('Failed to obtain access token or access token secret.');
        }

        print('success', 'Access token obtained.');
        return { accessToken, accessTokenSecret };
    } catch (error) {
        print('error', 'Error obtaining access token.');
        throw error;
    }
}

// Main Authentication Flow
export async function authenticateWithLaunchpad() {
    try {
        // Step 1: Request token
        const { requestToken, requestTokenSecret } = await getRequestToken();

        // Step 2: Display authorization URL and wait for user to authorize
        await authorizeRequestToken(requestToken);

        // Step 3: Exchange request token for access token
        const { accessToken, accessTokenSecret } = await getAccessToken(requestToken, requestTokenSecret);

        // Display access token details for the user
        print('success', 'Authorization successful! Access token obtained.');
        print('content', `Access Token: ${accessToken}`);
        print('content', `Access Token Secret: ${accessTokenSecret}`);
    } catch (error) {
        print('error', 'An error occurred during the Launchpad authentication process.');
        console.error(error);
    }
}
