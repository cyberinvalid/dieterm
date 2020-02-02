import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function uuid() {
    return (""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/1|0/g, () => (0|Math.random()*16).toString(16))
}

export function delay(ms) {
    return new Promise(d => {
        setTimeout(d, ms);
    });
}

export function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

export function isValidUrl(string) {
    try {   
        return fileURLToPath(string);
    } catch (_) {
        return false;  
    }
}

export function dir(url) {
    return dirname(fileURLToPath(url));
}