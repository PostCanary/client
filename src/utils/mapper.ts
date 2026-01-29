// client/src/utils/mapper.ts
export const REQUIRED_MAIL = ['address1','city','state','zip','sent_date'] as const
export const REQUIRED_CRM  = ['address1','city','state','zip','job_date'] as const
export const CANON_FIELDS  = Array.from(new Set([...REQUIRED_MAIL, ...REQUIRED_CRM]))
export const FIELD_LABELS  = { sent_date: 'Mail Date', job_date: 'Job Date' } as const