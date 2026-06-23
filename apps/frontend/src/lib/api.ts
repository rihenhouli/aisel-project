import type {
  LoginResponse,
  PaginatedPatients,
  Patient,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorBody = await response.json();
      message = errorBody.message ?? message;
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getPatients(
    token: string,
    params: {
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request<PaginatedPatients>(`/patients${qs ? `?${qs}` : ''}`, { token });
  },

  getPatient(token: string, id: string) {
    return request<Patient>(`/patients/${id}`, { token });
  },

  createPatient(token: string, data: Omit<Patient, 'id'>) {
    return request<Patient>('/patients', {
      method: 'POST',
      token,
      body: data,
    });
  },

  updatePatient(token: string, id: string, data: Partial<Omit<Patient, 'id'>>) {
    return request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      token,
      body: data,
    });
  },

  deletePatient(token: string, id: string) {
    return request<{ ok: boolean }>(`/patients/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
