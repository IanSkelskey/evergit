import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const CONFIG_PATH = join(homedir(), '.evergitconfig');

interface Config {
    name?: string;
    email?: string;
}

function loadConfig(): Config {
    if (existsSync(CONFIG_PATH)) {
        const configContent = readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(configContent);
    }
    return {};
}

function saveConfig(config: Config): void {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function setConfig(key: keyof Config, value: string): void {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}

function getConfig(key: keyof Config): string | undefined {
    const config = loadConfig();
    return config[key];
}

function clearConfig(key: keyof Config): void {
    const config = loadConfig();
    delete config[key];
    saveConfig(config);
}

function getAllConfig(): Config {
    return loadConfig();
}

function isValidKey(key: string): key is keyof Config {
    return ['name', 'email'].includes(key);
}

export { setConfig, getConfig, clearConfig, getAllConfig, loadConfig, saveConfig, isValidKey, CONFIG_PATH };
