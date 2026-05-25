export type Tradition = 'satvik' | 'jain' | 'halal' | 'kosher' | 'christian' | 'custom'
export type ComplianceStatus = 'safe' | 'warning' | 'violation' | 'uncertain'
export type OverallSafety = 'safe' | 'caution' | 'avoid'

export interface UserProfile {
  id: string
  tradition: Tradition
  subTradition: string | null
  allergies: string[]
  dislikes: string[]
  createdAt: string
  updatedAt: string
}

export interface DishCompliance {
  name: string
  status: ComplianceStatus
  confidence: number
  violations: string[]
  violationReason: string
  hiddenRisk: string | null
  alternatives: string[]
  observanceNote: string | null
}

export interface ScanResult {
  restaurant: string | null
  scanId: string
  dishes: DishCompliance[]
  overallSafety: OverallSafety
  observanceAlert: string | null
  safeCount: number
  warningCount: number
  violationCount: number
  uncertainCount: number
  isDemoMode?: boolean
  createdAt?: string
}

export interface ScanRecord {
  id: string
  userId: string
  restaurantName: string | null
  scanResult: ScanResult
  createdAt: string
}

export interface Observance {
  id: string
  tradition: string
  name: string
  description: string
  startDate: string
  endDate: string | null
  dietaryChanges: string[]
  ritualItems: string[]
  isRecurring: boolean
  nextOccurrence: string
}

export interface MarketplaceItem {
  id: string
  name: string
  category: string
  traditions: string[]
  price: number
  imageUrl: string | null
  description: string
  observanceTags: string[]
}

export const STATUS_STYLES = {
  safe:      { bg: '#EDF7F2', text: '#2E7D5B', border: '#2E7D5B', label: 'SAFE' },
  warning:   { bg: '#FFF8E1', text: '#B8860B', border: '#B8860B', label: 'WARNING' },
  violation: { bg: '#FDECEA', text: '#C0392B', border: '#C0392B', label: 'VIOLATION' },
  uncertain: { bg: '#F5F5F5', text: '#888888', border: '#888888', label: 'UNCERTAIN' },
} as const

export const TRADITION_LABELS: Record<Tradition, string> = {
  satvik: 'Satvik / Hindu',
  jain: 'Jain',
  halal: 'Halal',
  kosher: 'Kosher',
  christian: 'Christian Fasting',
  custom: 'Custom',
}

export const TRADITION_DESCRIPTIONS: Record<Tradition, string> = {
  satvik: 'No onion, garlic, meat, eggs, or mushrooms',
  jain: 'No root vegetables, onion, garlic, meat, or mushrooms',
  halal: 'No pork, no alcohol, halal-certified meat only',
  kosher: 'No pork, no shellfish, no meat with dairy',
  christian: 'Lent, Good Friday, and Orthodox fasting periods',
  custom: 'Build your own dietary rules',
}
