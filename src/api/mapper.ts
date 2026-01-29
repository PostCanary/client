// client/src/api/mapper.ts
import { getRaw, post } from "./http";

export type HeaderType = "string" | "number" | "date" | "unknown";

export type MappingSide = Record<string, string>;
export type Mapping = { mail: MappingSide; crm: MappingSide };

/**
 * Pair of batch IDs – either or both may be present.
 * If a side is missing, we just treat it as "no data / no mapping".
 */
export type BatchPair = {
  mailBatchId?: string | null;
  crmBatchId?: string | null;
};

/* ----------------------------
 * Headers / samples
 * ---------------------------- */

type HeadersRes = {
  headers?: string[];
  sample_headers?: string[];
  sample_rows?: Record<string, any>[];

  // NEW: backend per-source header type hints
  header_types?: Record<string, HeaderType>;
};

export type HeadersBundle = {
  mailHeaders: string[];
  crmHeaders: string[];
  mailSamples: Record<string, any>[];
  crmSamples: Record<string, any>[];

  // NEW: optional maps from header name -> inferred type
  mailHeaderTypes?: Record<string, HeaderType>;
  crmHeaderTypes?: Record<string, HeaderType>;
};

/**
 * Fetch headers + sample rows for the mapper, for the *current batches*.
 *
 * - if mailBatchId is present → /upload/:mailBatchId/headers?source=mail
 * - if crmBatchId  is present → /upload/:crmBatchId/headers?source=crm
 * - if either side is missing, we return empty arrays for that side
 */
export async function fetchHeaders(params: BatchPair): Promise<HeadersBundle> {
  const { mailBatchId, crmBatchId } = params;

  const mailPromise: Promise<{ data?: HeadersRes }> = mailBatchId
    ? getRaw<HeadersRes>(
        `/api/upload/${encodeURIComponent(mailBatchId)}/headers`,
        { params: { source: "mail", sample: 25 } }
      )
    : Promise.resolve({ data: {} });

  const crmPromise: Promise<{ data?: HeadersRes }> = crmBatchId
    ? getRaw<HeadersRes>(
        `/api/upload/${encodeURIComponent(crmBatchId)}/headers`,
        { params: { source: "crm", sample: 25 } }
      )
    : Promise.resolve({ data: {} });

  const [mailRes, crmRes] = await Promise.all([mailPromise, crmPromise]);

  const mailHeaders =
    mailRes.data?.headers ?? mailRes.data?.sample_headers ?? [];
  const crmHeaders =
    crmRes.data?.headers ?? crmRes.data?.sample_headers ?? [];

  const mailSamples = mailRes.data?.sample_rows ?? [];
  const crmSamples = crmRes.data?.sample_rows ?? [];

  const mailHeaderTypes = mailRes.data?.header_types ?? {};
  const crmHeaderTypes = crmRes.data?.header_types ?? {};

  return {
    mailHeaders,
    crmHeaders,
    mailSamples,
    crmSamples,
    mailHeaderTypes,
    crmHeaderTypes,
  };
}

/* ----------------------------
 * Mapping + meta
 * ---------------------------- */

export type MappingPayload = {
  mapping: Record<string, string>;
  fields: string[];
  required: string[];
  optional: string[];
  missing: string[];
  from_auto: boolean;
  labels: Record<string, string>;
};

export type MappingBundle = {
  mail: MappingPayload;
  crm: MappingPayload;
};

type MappingResponse = MappingPayload;

const EMPTY_MAPPING_PAYLOAD: MappingResponse = {
  mapping: {},
  fields: [],
  required: [],
  optional: [],
  missing: [],
  from_auto: false,
  labels: {},
};

/**
 * Fetch mapper payloads (mail + crm) for the *current batches*.
 *
 * - if mailBatchId is present → /upload/:mailBatchId/mapping?source=mail
 * - if crmBatchId  is present → /upload/:crmBatchId/mapping?source=crm
 * - missing sides get EMPTY_MAPPING_PAYLOAD
 */
export async function fetchMapping(params: BatchPair): Promise<MappingBundle> {
  const { mailBatchId, crmBatchId } = params;

  const mailPromise: Promise<{ data?: MappingResponse }> = mailBatchId
    ? getRaw<MappingResponse>(
        `/api/upload/${encodeURIComponent(mailBatchId)}/mapping`,
        { params: { source: "mail" } }
      )
    : Promise.resolve({ data: EMPTY_MAPPING_PAYLOAD });

  const crmPromise: Promise<{ data?: MappingResponse }> = crmBatchId
    ? getRaw<MappingResponse>(
        `/api/upload/${encodeURIComponent(crmBatchId)}/mapping`,
        { params: { source: "crm" } }
      )
    : Promise.resolve({ data: EMPTY_MAPPING_PAYLOAD });

  const [mailRes, crmRes] = await Promise.all([mailPromise, crmPromise]);

  const mailPayload: MappingPayload = mailRes.data ?? EMPTY_MAPPING_PAYLOAD;
  const crmPayload: MappingPayload = crmRes.data ?? EMPTY_MAPPING_PAYLOAD;

  return { mail: mailPayload, crm: crmPayload };
}

/* ----------------------------
 * Save mapping back to server
 * ---------------------------- */

export type SaveMappingParams = BatchPair & {
  mapping: Mapping;
};

/**
 * Save mapping for the *current batches*.
 *
 * - if mailBatchId is present → POST /upload/:mailBatchId/mapping
 * - if crmBatchId  is present → POST /upload/:crmBatchId/mapping
 */
export async function saveMapping(params: SaveMappingParams): Promise<void> {
  const { mailBatchId, crmBatchId, mapping } = params;

  const tasks: Promise<unknown>[] = [];

  if (mailBatchId) {
    tasks.push(
      post(`/api/upload/${encodeURIComponent(mailBatchId)}/mapping`, {
        source: "mail",
        mapping: mapping.mail,
      })
    );
  }

  if (crmBatchId) {
    tasks.push(
      post(`/api/upload/${encodeURIComponent(crmBatchId)}/mapping`, {
        source: "crm",
        mapping: mapping.crm,
      })
    );
  }

  await Promise.all(tasks);
}