import { v4 } from 'uuid';

interface RequesterOptions {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    includeAuthorization?: boolean;
    body?: string;
    contentType?: 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data';
    formData?: Record<string, string | Blob>;
    fileFieldName?: string;
}

let authorization: string = "";

/**
 * Updates the module-level authorization header value.
 * @param token - Raw session token string without the "Token " prefix.
 */
export const updateToken = (token: string) => {
    if (!token) return;
    authorization = `Token ${token}`;
}

/**
 * Performs an HTTP request to Character.AI with optional authorization.
 * Adds realistic browser headers and supports JSON or form payloads.
 * @param url - Target endpoint URL.
 * @param options - Request options including method, auth, and body.
 * @returns Fetch Response from the remote server.
 */
export const request = async (url: string, options: RequesterOptions) => {
    let headers: any = {
        "User-Agent": "Character.AI",
        "DNT": "1",
        "Sec-GPC": "1",
        "Connection": "close",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Origin": "https://character.ai",
        "Referer": "https://character.ai/",
        "TE": "trailers"
    }
    
    let body: any = options.body;

    if (options.includeAuthorization) headers["Authorization"] = authorization;
    if (options.contentType) headers["Content-Type"] = options.contentType;

    if (options.formData) {
        const formData = options.contentType == 'application/x-www-form-urlencoded' ? new URLSearchParams() : new FormData();
        Object.entries(options.formData).forEach((entry) => formData.append(entry[0], entry[1] as any));
        body = formData;
    }
    
    if (typeof body === "string") headers["Content-Length"] = body.length;

    return await fetch(url, { headers, method: options.method, body });
}
