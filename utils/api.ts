const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiOptions {
    withAuth?: boolean;
    suppressThrow?: boolean;
}

function getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
}

async function handleResponse<T>(response: Response, suppressThrow?: boolean): Promise<T> {
    if (!response.ok) {
        if (suppressThrow) {
            return { success: false, error: response.statusText } as any;
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

export async function apiGet<T>(
    url: string,
    options?: ApiOptions
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (options?.withAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers,
    });

    return handleResponse<T>(response, options?.suppressThrow);
}

export async function apiPost<T>(
    url: string,
    payload: any,
    options?: ApiOptions
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (options?.withAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    return handleResponse<T>(response, options?.suppressThrow);
}

export async function apiPut<T>(
    url: string,
    payload: any,
    options?: ApiOptions
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (options?.withAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
    });

    return handleResponse<T>(response, options?.suppressThrow);
}

export async function apiPatch<T>(
    url: string,
    payload: any,
    options?: ApiOptions
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (options?.withAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
    });

    return handleResponse<T>(response, options?.suppressThrow);
}

export async function apiDelete<T>(
    url: string,
    options?: ApiOptions
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (options?.withAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers,
    });

    return handleResponse<T>(response, options?.suppressThrow);
}
