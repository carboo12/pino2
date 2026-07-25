import { z } from 'zod/v4';
import apiClient from './api-client';
import { validateOrThrow } from '@/types/api-schemas';

export async function getValidated<T>(
  url: string,
  schema: z.ZodSchema<T>,
  params?: Record<string, any>,
  label?: string,
): Promise<T> {
  const response = await apiClient.get(url, { params });
  return validateOrThrow(schema, response.data, label || `GET ${url}`);
}

export async function postValidated<T>(
  url: string,
  schema: z.ZodSchema<T>,
  data?: any,
  label?: string,
): Promise<T> {
  const response = await apiClient.post(url, data);
  return validateOrThrow(schema, response.data, label || `POST ${url}`);
}
