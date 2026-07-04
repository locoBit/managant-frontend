const DEFAULT_BASE = 'http://localhost:8080';

function getBaseUrl() {
  // Vite: import.meta.env.*
  // Important: allow empty string '' to mean "same origin".
  try {
    const env = import.meta.env.VITE_API_BASE;
    return env !== undefined ? env : DEFAULT_BASE;
  } catch {
    return DEFAULT_BASE;
  }
}

function getToken() {
  try {
    return window.localStorage.getItem('managant-token') || '';
  } catch {
    return '';
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const token = getToken();

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      (typeof data === 'string' ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

// API client for the Spring Boot backend.
export const httpApi = {
  async loginWithGoogle({ idToken }) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { idToken },
    });

    // Persist token for subsequent requests
    if (res?.token) {
      try {
        window.localStorage.setItem('managant-token', res.token);
      } catch {
        // ignore
      }
    }

    return res;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      try {
        window.localStorage.removeItem('managant-token');
      } catch {
        // ignore
      }
    }

    return { success: true };
  },

  async listUsers() {
    return request('/api/compat/users');
  },

  async upsertUser({ personId, gmail, active }) {
    return request('/api/compat/users', {
      method: 'POST',
      body: { personId, gmail, active },
    });
  },

  async listRoles() {
    return request('/api/compat/roles');
  },

  async createRole({ name, scope, maxPeople }) {
    return request('/api/compat/roles', {
      method: 'POST',
      body: { name, scope, maxPeople },
    });
  },

  async updateRole(id, { name, scope, maxPeople, active }) {
    return request(`/api/compat/roles/${id}`, {
      method: 'PUT',
      body: { name, scope, maxPeople, active },
    });
  },

  async deleteRole(id) {
    return request(`/api/compat/roles/${id}`, { method: 'DELETE' });
  },

  async listAreaCategories() {
    return request('/api/compat/area-categories');
  },

  async createAreaCategory({ name }) {
    return request('/api/compat/area-categories', {
      method: 'POST',
      body: { name },
    });
  },

  async listAreas() {
    return request('/api/compat/areas');
  },

  async createArea(payload) {
    return request('/api/compat/areas', { method: 'POST', body: payload });
  },

  async updateArea(id, patch) {
    return request(`/api/compat/areas/${id}`, { method: 'PUT', body: patch });
  },

  async listPeople() {
    return request('/api/compat/people');
  },

  async createPerson(payload) {
    return request('/api/compat/people', { method: 'POST', body: payload });
  },

  async updatePerson(id, payload) {
    return request(`/api/compat/people/${id}`, { method: 'PUT', body: payload });
  },

  async assignPersonToAreaWithRole(payload) {
    return request('/api/compat/people/assign', { method: 'POST', body: payload });
  },

  async unassignPersonFromAreaWithRole(payload) {
    return request('/api/compat/people/unassign', { method: 'POST', body: payload });
  },

  async changePersonRoleInArea(payload) {
    return request('/api/compat/people/change-role', { method: 'POST', body: payload });
  },

  async listEvents() {
    return request('/api/events');
  },

  async createEvent(payload) {
    // backend derives createdByPersonId from token
    const { createdByPersonId, ...rest } = payload || {};
    return request('/api/compat/events', { method: 'POST', body: rest });
  },

  async registerAttendance(payload) {
    return request('/api/compat/events/attendance', { method: 'POST', body: payload });
  },

  async upsertAttendance(payload) {
    return request('/api/compat/events/attendance/upsert', {
      method: 'POST',
      body: payload,
    });
  },

  async updateEventObservations(eventId, { observations }) {
    return request(`/api/compat/events/${eventId}/observations`, {
      method: 'PUT',
      body: { observations },
    });
  },

  async softDeletePerson(personId) {
    return request(`/api/compat/people/${personId}/deactivate`, { method: 'POST' });
  },

  async searchPeopleByName(query, { limit = 20 } = {}) {
    const params = new URLSearchParams();
    params.set('q', String(query || ''));
    params.set('limit', String(limit));
    return request(`/api/people-search?${params.toString()}`);
  },

  async listAttendancesByEvent(eventId) {
    return request(`/api/compat/events/${eventId}/attendance`);
  },
};
