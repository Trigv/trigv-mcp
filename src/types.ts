import type { DELIVERY_URGENCIES, LEVELS } from './constants.js';

export type NotificationLevel = (typeof LEVELS)[number];

export type DeliveryUrgency = (typeof DELIVERY_URGENCIES)[number];

export interface TrigvClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
}

export interface SendEventParams {
  channel: string;
  title: string;
  description?: string;
  image_url?: string;
  url?: string;
  level?: NotificationLevel;
  delivery_urgency?: DeliveryUrgency;
  event_type?: string;
  idempotency_key?: string;
}

export interface Event {
  public_id: string;
  event_uuid: string;
  status: string;
  level: string;
  event_type: string | null;
  target_device_count: number;
  received_at: string;
}

export interface SendEventResult {
  event: Event;
  duplicate: boolean;
}

export interface ValidationErrors {
  [field: string]: string[];
}
