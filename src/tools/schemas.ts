import * as z from 'zod/v4';
import { FIELD_MAX_LENGTHS } from '../constants.js';

function codePointCount(value: string): number {
  return Array.from(value).length;
}

function zMaxCodePoints(max: number) {
  return z.string().refine((value) => codePointCount(value) <= max, {
    message: `must be at most ${max} characters`,
  });
}

export const sendEventInputSchema = {
  channel: zMaxCodePoints(FIELD_MAX_LENGTHS.channel)
    .refine((value) => value.length >= 1, { message: 'Required' })
    .describe('Channel slug (e.g. general, deploys)'),
  title: zMaxCodePoints(FIELD_MAX_LENGTHS.title)
    .refine((value) => value.length >= 1, { message: 'Required' })
    .describe('Notification title'),
  description: zMaxCodePoints(FIELD_MAX_LENGTHS.description)
    .optional()
    .describe('Optional body text (not stored server-side)'),
  image_url: zMaxCodePoints(FIELD_MAX_LENGTHS.image_url)
    .optional()
    .describe('Optional image URL (not stored server-side)'),
  url: zMaxCodePoints(FIELD_MAX_LENGTHS.url)
    .optional()
    .describe('Optional destination URL (not stored server-side)'),
  level: z
    .enum(['info', 'success', 'warning', 'error'])
    .optional()
    .describe('Notification level (default: info)'),
  delivery_urgency: z
    .enum(['standard', 'time_sensitive'])
    .optional()
    .describe('Delivery urgency (default: standard)'),
  event_type: zMaxCodePoints(FIELD_MAX_LENGTHS.event_type)
    .optional()
    .describe('Free-form event label (e.g. deploy.completed)'),
  idempotency_key: zMaxCodePoints(FIELD_MAX_LENGTHS.idempotency_key)
    .optional()
    .describe('Dedup key per workspace; retries return the existing event ("already stored")'),
};

export const sendEventOutputSchema = {
  success: z.boolean(),
  duplicate: z.boolean().optional(),
  event: z
    .object({
      public_id: z.string(),
      event_uuid: z.string(),
      status: z.string(),
      level: z.enum(['info', 'success', 'warning', 'error']),
      event_type: z.string().nullable(),
      target_device_count: z.number(),
      received_at: z.string().nullable(),
    })
    .optional(),
  request_id: z.string().optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      errors: z.record(z.string(), z.array(z.string())).optional(),
      status_code: z.number().optional(),
      retryable: z.boolean().optional(),
      retry_after_seconds: z.number().optional(),
      request_id: z.string().optional(),
    })
    .optional(),
};
