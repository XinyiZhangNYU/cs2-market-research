// Which statuses mean the case is still open is decided by the Python state machine, not by how
// the enum names read in English. ledger.py rejects any further event whose previous status is
// RESOLVED, UNRESOLVED or RETRACTED with "terminal case records cannot be rewritten". UNRESOLVED
// reads like "still waiting" but is terminal: models.py pairs it with ResolutionCode.DATA_LOSS,
// i.e. closed because the data left.
//
// That classification describes the ledger. A state snapshot is narrower still: every case_status
// assignment in engine.py and context.py writes ACTIVE, SUSPENDED or None and nothing else
// (engine.py 283/575/685, context.py 378/527/634/796), and on closure engine.py clears both case
// ids and sets None. models.py then rejects a case_status with no case id behind it. So a snapshot
// carrying a terminal status is unreachable, and a page that renders one is showing a state the
// backend cannot produce. Terminal statuses belong to lifecycle events and outcomes.

import { CaseStatus } from './enums'

export const OPEN_CASE_STATUSES: readonly CaseStatus[] = [
  CaseStatus.ACTIVE,
  CaseStatus.SUSPENDED,
]

export const TERMINAL_CASE_STATUSES: readonly CaseStatus[] = [
  CaseStatus.RESOLVED,
  CaseStatus.UNRESOLVED,
  CaseStatus.RETRACTED,
]

// The complete set a state snapshot can carry. null means the unit has no case at all.
export const SNAPSHOT_CASE_STATUSES: readonly (CaseStatus | null)[] = [
  CaseStatus.ACTIVE,
  CaseStatus.SUSPENDED,
  null,
]

export function hasOpenCase(status: CaseStatus | null): boolean {
  return status !== null && OPEN_CASE_STATUSES.includes(status)
}
