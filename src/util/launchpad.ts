import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// OAuth credentials - replace with actual credentials or use environment variables
const CONSUMER_KEY = 'evergit';

// Launchpad OAuth endpoints
const requestTokenUrl = 'https://launchpad.net/+request-token';
const authorizeUrl = 'https://launchpad.net/+authorize-token';
const accessTokenUrl = 'https://launchpad.net/+access-token';

// Initialize OAuth without a consumer secret
const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: '' },  // No consumer secret
  signature_method: 'PLAINTEXT',
  hash_function(base_string: crypto.BinaryLike, key: crypto.BinaryLike | crypto.KeyObject) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

// Step 1: Request Token
export async function getRequestToken() {
  const requestData = {
    url: requestTokenUrl,
    method: 'POST',
  };

  const headers = oauth.toHeader(oauth.authorize(requestData));
  headers.Authorization = headers.Authorization.replace('oauth_signature="&"', `oauth_signature="%26"`);  // Ensure signature starts with '&'

  const response = await axios.post(requestData.url, null, {
    headers,
  });

  const params = new URLSearchParams(response.data as string);
  const requestToken = params.get('oauth_token');
  const requestTokenSecret = params.get('oauth_token_secret');

  console.log(`Authorize the app by visiting: ${authorizeUrl}?oauth_token=${requestToken}`);
  return { requestToken, requestTokenSecret };
}

// Step 2: Access Token
export async function getAccessToken(requestToken: string, requestTokenSecret: string, verifier: string) {
  const requestData = {
    url: accessTokenUrl,
    method: 'POST',
  };

  const token = {
    key: requestToken,
    secret: requestTokenSecret,
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));
  headers.Authorization = headers.Authorization.replace('oauth_signature="&"', `oauth_signature="%26${token.secret}"`);  // Signature includes token secret

  const response = await axios.post(requestData.url, null, {
    headers,
    params: { oauth_verifier: verifier },
  });

  const params = new URLSearchParams(response.data as string);
  const accessToken = params.get('oauth_token');
  const accessTokenSecret = params.get('oauth_token_secret');

  return { accessToken, accessTokenSecret };
}

// Step 3: Make Authenticated Request
export async function makeAuthenticatedRequest(url: string, accessToken: string, accessTokenSecret: string) {
  const requestData = {
    url,
    method: 'GET',
  };

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));
  headers.Authorization = headers.Authorization.replace('oauth_signature="&"', `oauth_signature="%26${token.secret}"`);  // Signature includes access token secret

  const response = await axios.get(requestData.url, {
    headers,
  });

  return response.data;
}

// Example: Fetch Bug Information
export async function fetchBugInfo(bugId: number) {
  const bugUrl = `https://api.launchpad.net/1.0/bugs/${bugId}`;
  const { requestToken, requestTokenSecret } = await getRequestToken();
  console.log('Follow the authorization URL to complete setup.');
  // Add access token retrieval and authenticated request logic here when fully implemented
}
