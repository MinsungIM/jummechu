// M7 notification — Public API stub. unit-of-work-dependency.md M7 섹션.
const NI = (): never => {
  throw new Error('[features/notification] not implemented')
}

export type UpcomingDeparture = {
  partyId: number
  partyName: string
  departAt: number
  minutesUntil: number
}

export async function getUpcomingDeparturesForUser(_userId: number, _withinMinutes: number): Promise<UpcomingDeparture[]> { return NI() }

export { default as InAppNotificationBanner } from './components/InAppNotificationBanner'
export { useDepartureReminders } from './hooks/useDepartureReminders'
