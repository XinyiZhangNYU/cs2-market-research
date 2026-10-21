export const FRONTEND_DATA_MODES = ['MOCK', 'FORMAL_FIXTURE'] as const

export type FrontendDataMode = (typeof FRONTEND_DATA_MODES)[number]
