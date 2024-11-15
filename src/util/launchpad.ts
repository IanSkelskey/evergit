import axios from 'axios';
import * as readlineSync from 'readline-sync';
import { URLSearchParams } from 'url';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { print, waitForAuthorization } from './prompt';

// Define constants for Launchpad OAuth endpoints
const requestTokenPage = '+request-token';
const accessTokenPage = '+access-token';
const authorizeTokenPage = '+authorize-token';
const LAUNCHPAD_ROOT = 'https://launchpad.net';

const CONFIG_DIR = join(os.homedir(), '.evergit');
const CONFIG_FILE = join(CONFIG_DIR, 'auth.json');

async function getBugInfo(bugId: string, accessToken: string, accessTokenSecret: string): Promise<Bug> {
    const endpoint = `https://api.launchpad.net/1.0/bugs/${bugId}`;

    const headers = {
        Authorization: `OAuth oauth_consumer_key="evergit", oauth_token="${accessToken}", oauth_signature_method="PLAINTEXT", oauth_signature="%26${accessTokenSecret}"`,
    };

    try {
        const response = await axios.get(endpoint, { headers });
        const data = response.data as { id: string; title: string; description: string };
        return new Bug(data.id, data.title, data.description);
    } catch (error) {
        print('error', 'Error fetching bug information.');
        throw error;
    }
}

function saveCredentials(accessToken: string, accessTokenSecret: string) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }

    const credentials = { accessToken, accessTokenSecret };
    writeFileSync(CONFIG_FILE, JSON.stringify(credentials), { mode: 0o600 });
}

function loadCredentials(): { accessToken: string; accessTokenSecret: string } | null {
    if (existsSync(CONFIG_FILE)) {
        const data = readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    }
    return null;
}

async function authenticateLaunchpad(consumerKey: string) {
    const storedCredentials = loadCredentials();

    if (storedCredentials) {
        print('success', 'Already authorized with Launchpad.');
        return;
    }

    const credentials = new Credentials(consumerKey);
    const authEngine = new RequestTokenAuthorizationEngine(consumerKey);

    try {
        await authEngine.authorize(credentials);

        if (credentials.accessToken) {
            print('success', 'Authorization successful.');
            saveCredentials(credentials.accessToken.key, credentials.accessToken.secret);
        } else {
            print('error', 'Authorization failed.');
        }
    } catch (error) {
        print('error', 'Error authorizing with Launchpad.');
        console.error(error);
    }
}

// Error class for handling HTTP errors
class HTTPError extends Error {
    status: number;
    content: any;
    constructor(status: number, content: any) {
        super(`HTTP Error ${status}`);
        this.status = status;
        this.content = content;
    }
}

// Utility function to handle HTTP POST with OAuth headers
async function httpPost(url: string, headers: Record<string, string>, params: any): Promise<{ content: any }> {
    try {
        const response = await axios.post(url, new URLSearchParams(params), { headers });
        return { content: response.data };
    } catch (error: any) {
        if (error.response) {
            throw new HTTPError(error.response.status, error.response.data);
        }
        throw error;
    }
}

// AccessToken class for holding token data
class AccessToken {
    key: string;
    secret: string;
    context?: string;

    constructor(key: string, secret: string, context?: string) {
        this.key = key;
        this.secret = secret;
        this.context = context;
    }

    static fromParams(params: Record<string, string>): AccessToken {
        return new AccessToken(params['oauth_token'], params['oauth_token_secret'], params['lp.context']);
    }

    static fromString(queryString: string): AccessToken {
        const params = Object.fromEntries(new URLSearchParams(queryString));
        return new AccessToken(params['oauth_token'], params['oauth_token_secret'], params['lp.context']);
    }
}

// Credentials class for managing tokens and making OAuth requests
class Credentials {
    consumerKey: string;
    accessToken?: AccessToken;
    requestToken?: AccessToken;

    constructor(consumerKey: string, accessToken?: AccessToken) {
        this.consumerKey = consumerKey;
        this.accessToken = accessToken;
    }

    // Step 1: Get Request Token
    async getRequestToken(
        webRoot: string = LAUNCHPAD_ROOT,
        tokenFormat: string = 'uri',
    ): Promise<string | Record<string, any>> {
        if (!this.consumerKey) throw new Error('Consumer not specified.');
        if (this.accessToken) throw new Error('Access token already obtained.');

        const params = {
            oauth_consumer_key: this.consumerKey,
            oauth_signature_method: 'PLAINTEXT',
            oauth_signature: '&',
        };
        const url = `${webRoot}/${requestTokenPage}`;
        const headers: Record<string, string> = { Referer: webRoot };
        if (tokenFormat === 'dict') headers['Accept'] = 'application/json';

        const { content } = await httpPost(url, headers, params);
        if (tokenFormat === 'dict') {
            const data = JSON.parse(content);
            this.requestToken = AccessToken.fromParams(data);
            return data;
        } else {
            this.requestToken = AccessToken.fromString(content);
            return `${webRoot}/${authorizeTokenPage}?oauth_token=${this.requestToken.key}`;
        }
    }

    // Step 3: Exchange Request Token for Access Token
    async exchangeRequestTokenForAccessToken(webRoot: string = LAUNCHPAD_ROOT) {
        if (!this.requestToken) throw new Error('getRequestToken() has not been called.');
        const params = {
            oauth_consumer_key: this.consumerKey,
            oauth_signature_method: 'PLAINTEXT',
            oauth_token: this.requestToken.key,
            oauth_signature: `&${this.requestToken.secret}`,
        };
        const url = `${webRoot}/${accessTokenPage}`;
        const headers: Record<string, string> = { Referer: webRoot };

        const { content } = await httpPost(url, headers, params);
        this.accessToken = AccessToken.fromString(content);
    }
}

// Authorization Engine to handle user authorization
class RequestTokenAuthorizationEngine {
    serviceRoot: string;
    applicationName: string;

    constructor(applicationName: string) {
        this.serviceRoot = LAUNCHPAD_ROOT;
        this.applicationName = applicationName;
    }

    // Generate the authorization URL
    authorizationUrl(requestToken: string): string {
        return `${this.serviceRoot}/${authorizeTokenPage}?oauth_token=${requestToken}`;
    }

    async authorize(credentials: Credentials) {
        const authUrl = await credentials.getRequestToken(this.serviceRoot);
        await waitForAuthorization(authUrl as string);
        await credentials.exchangeRequestTokenForAccessToken(this.serviceRoot);
    }
}

class Bug {
    id: string;
    title: string;
    description: string;
    endpoint: string;

    constructor(id: string, title: string, description: string) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.endpoint = `https://api.launchpad.net/1.0/bugs/${id}`;
    }

    async getMessages(): Promise<BugMessage[]> {
        try {
            const response = await axios.get(`${this.endpoint}/messages`);
            const data = response.data as {
                entries: { subject: string; content: string; owner_link: string; self_link: string }[];
            };
            return data.entries.map((entry: any) => {
                const owner = entry.owner_link.split('/').pop();
                const id = parseInt(entry.self_link.split('/').pop());
                return new BugMessage(id, entry.subject, entry.content, owner);
            });
        } catch (error) {
            console.error('Error fetching bug messages:', error);
            throw error;
        }
    }
}

class BugMessage {
    id: number;
    subject: string;
    content: string;
    owner: string;

    constructor(id: number, subject: string, content: string, owner: string) {
        this.id = id;
        this.subject = subject;
        this.content = content;
        this.owner = owner;
    }

    toString(): string {
        // Return a markdown-formatted string
        return `
        ### Message ${this.id}
        **Subject**: ${this.subject}
        **Owner**: ${this.owner}
        **Content**: ${this.content}
        `;
    }
}

export { authenticateLaunchpad, loadCredentials, getBugInfo, Bug, BugMessage };
