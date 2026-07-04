import { httpApi } from './httpApi.js';

// Single source of truth: always use the real backend.
export const api = httpApi;
