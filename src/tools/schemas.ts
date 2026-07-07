import * as z from 'zod/v4';
import { FIELD_MAX_LENGTHS } from '../constants.js';

export const sendEventInputSchema = {
  channel: z
    .string()
    .min(1)
    .max(FIELD_MAX_LENGTHS.channel)
    .describe('Channel slug (e.g. general, deploys)'),
  title: z.string().min(1).max(FIELD_MAX_LENGTHS.title).describe('Notification title'),
  description: z
    .string()
    .max(FIELD_MAX_LENGTHS.description)
    .optional()
    .describe('Optional body text (not stored server-side)'),
  image_url: z
    .string()
    .max(FIELD_MAX_LENGTHS.image_url)
    .optional()
    .describe('Optional HTTPS image URL (not stored server-side)'),
  level: z
    .enum(['info', 'success', 'warning', 'error'])
    .optional()
    .describe('Notification level (default: info)'),
  delivery_urgency: z
    .enum(['standard', 'time_sensitive'])
    .optional()
    .describe('Delivery urgency (default: standard)'),
  event_type: z
    .string()
    .max(FIELD_MAX_LENGTHS.event_type)
    .optional()
    .describe('Free-form event label (e.g. deploy.completed)'),
  idempotency_key: z
    .string()
    .max(FIELD_MAX_LENGTHS.idempotency_key)
    .optional()
    .describe('Dedup key per workspace; retries return the existing event'),
};

export const sendEventOutputSchema = {
  success: z.boolean(),
  duplicate: z.boolean().optional(),
  event: z
    .object({
      public_id: z.string(),
      event_uuid: z.string(),
      status: z.string(),
      level: z.string(),
      event_type: z.string().nullable(),
      target_device_count: z.number(),
      received_at: z.string(),
    })
    .optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      errors: z.record(z.string(), z.array(z.string())).optional(),
      status_code: z.number().optional(),
      retryable: z.boolean().optional(),
    })
    .optional(),
};
