import axios from 'axios';
import crypto from 'crypto';

const CONSUMER_KEY = 'evergit';
const requestTokenUrl = 'https://launchpad.net/+request-token';
const authorizeUrl = 'https://launchpad.net/+authorize-token';

function generateNonce(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map(x => charset[x % charset.length])
    .join('');
}

export async function getRequestToken() {
  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = generateNonce();

  const oauthSignature = `%26`;  // Ensure signature starts with "&" for Launchpad requirements

  // Manually build the Authorization header
  const authorizationHeader = [
    `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
    `oauth_signature_method="PLAINTEXT"`,
    `oauth_signature="${oauthSignature}"`,
    `oauth_timestamp="${oauthTimestamp}"`,
    `oauth_nonce="${oauthNonce}"`,
    `oauth_version="1.0"`
  ].join(', ');

  console.log('Generated Authorization Header:', authorizationHeader);

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

    console.log(`Authorize the app by visiting: ${authorizeUrl}?oauth_token=${requestToken}`);
    return { requestToken, requestTokenSecret };
  } catch (error: any) {
    console.error('Error requesting token:', error.response ? error.response.data : error.message);
    throw error;
  }
}
