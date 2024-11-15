import axios from 'axios';
import crypto from 'crypto';
import inquirer from 'inquirer';
import { print } from './prompt';

// OAuth credentials
const CONSUMER_KEY = 'evergit'; // Replace with your actual consumer key

// Launchpad OAuth endpoints
const requestTokenUrl = 'https://launchpad.net/+request-token';
const authorizeUrl = 'https://launchpad.net/+authorize-token';
const accessTokenUrl = 'https://launchpad.net/+access-token';

// Helper function to generate a unique nonce
function generateNonce(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.randomFillSync(new Uint8Array(length)))
        .map(x => charset[x % charset.length])
        .join('');
}

// Step 1: Request Token
async function getRequestToken() {
    const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
    const oauthNonce = generateNonce();
    const oauthSignature = '&'; // Signature is just "&" per Launchpad documentation

    const authorizationHeader = [
        `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
        `oauth_signature_method="PLAINTEXT"`,
        `oauth_signature="${oauthSignature}"`,
        `oauth_timestamp="${oauthTimestamp}"`,
        `oauth_nonce="${oauthNonce}"`,
        `oauth_version="1.0"`
    ].join(', ');

    print('info', `Requesting token with authorization header:\n${authorizationHeader}`);

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

        print('info', 'Request token obtained.');
        return { requestToken, requestTokenSecret };
    } catch (error) {
        print('error', 'Error requesting token.');
        throw error;
    }
}

// Step 2: Direct User to Authorize URL
async function directUserToAuthorize(requestToken: string) {
    const authorizeUrlWithToken = `${authorizeUrl}?oauth_token=${requestToken}`;
    print('info', `Please open the following URL in your browser to authorize the application:\n${authorizeUrlWithToken}`);

    print(
        'info',
        `Please complete the authorization in your browser. Once done, return here and press Enter to continue.`
    );

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
    const oauthSignature = `&${requestTokenSecret}`; // Signature includes the request token secret

    const authorizationHeader = [
        `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
        `oauth_token="${requestToken}"`,
        `oauth_signature_method="PLAINTEXT"`,
        `oauth_signature="${oauthSignature}"`,
        `oauth_timestamp="${oauthTimestamp}"`,
        `oauth_nonce="${oauthNonce}"`,
        `oauth_version="1.0"`
    ].join(', ');

    print('info', `Requesting access token with authorization header:\n${authorizationHeader}`);

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

        print('success', 'Access token obtained.');
        return { accessToken, accessTokenSecret };
    } catch (error) {
        print('error', 'Error obtaining access token.');
        throw error;
    }
}

// Step 4: Make Authenticated Request (example)
async function makeAuthenticatedRequest(url: string, accessToken: string, accessTokenSecret: string) {
    const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
    const oauthNonce = generateNonce();
    const oauthSignature = `&${accessTokenSecret}`; // Signature includes access token secret

    const authorizationHeader = [
        `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
        `oauth_token="${accessToken}"`,
        `oauth_signature_method="PLAINTEXT"`,
        `oauth_signature="${oauthSignature}"`,
        `oauth_timestamp="${oauthTimestamp}"`,
        `oauth_nonce="${oauthNonce}"`,
        `oauth_version="1.0"`
    ].join(', ');

    print('info', `Making authenticated request with authorization header:\n${authorizationHeader}`);

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: authorizationHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    } catch (error) {
        print('error', 'Error in authenticated request.');
        throw error;
    }
}

// Full Authentication Flow
export async function authenticateWithLaunchpad() {
    try {
        // Step 1: Get request token
        const { requestToken, requestTokenSecret } = await getRequestToken();
        if (!requestToken || !requestTokenSecret) {
            throw new Error('Failed to obtain request token or request token secret.');
        }

        // Step 2: Direct user to authorize URL in their browser
        await directUserToAuthorize(requestToken);

        // Step 3: Exchange request token for access token
        const { accessToken, accessTokenSecret } = await getAccessToken(requestToken, requestTokenSecret);

        // Display access token details for the user
        print('success', 'Authorization successful! Access token obtained.');
        print('content', `Access Token: ${accessToken}`);
        print('content', `Access Token Secret: ${accessTokenSecret}`);

        // Optional: Test the access token with an API call (e.g., fetch bug info)
        const { runTest } = await inquirer.prompt({
            type: 'confirm',
            name: 'runTest',
            message: 'Would you like to test the access by retrieving a sample bug info?',
            default: false,
        });

        if (runTest) {
            if (accessToken && accessTokenSecret) {
                const testResponse = await makeAuthenticatedRequest(
                    'https://api.launchpad.net/1.0/bugs/1',
                    accessToken,
                    accessTokenSecret
                );
                print('info', 'Sample API response from Launchpad:');
                console.log(testResponse);
            } else {
                print('error', 'Access token or access token secret is missing.');
            }
        }
    } catch (error) {
        print('error', 'An error occurred during the Launchpad authentication process.');
        console.error(error);
    }
}
