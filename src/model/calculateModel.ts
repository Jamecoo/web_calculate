import { Timestamp } from 'firebase/firestore'

export type CalculationType = 'divide' | 'percentage' | 'subtract' | 'split_users'

export interface UserShare {
  userId: string
  userName: string
  initialShare: number
  currentBalance: number
  paid?: number
  consumed?: number
  purchases: Purchase[]
  isPaid?: boolean
}

export interface Purchase {
  id: string
  itemName: string
  amount: number
  consumers?: string[]
  // Id from EXPENSE_CATEGORIES (src/constants/categories.ts). Optional: older
  // records were logged before categories existed and read as "ອື່ນໆ".
  category?: string
  timestamp: Timestamp
}

// A payment slip (transfer screenshot) uploaded to a shared trip.
export interface TripSlip {
  id: string
  imageUrl: string
  uploadedByEmail: string
  timestamp: Timestamp
}

// For split among users calculation
export interface SplitCalculationDocument {
  tripName?: string
  userId?: string
  userEmail?: string
  userName?: string
  memberEmails?: string[]
  slips?: TripSlip[]
  totalAmount: number
  totalUsers: number
  perUserAmount: number
  users: UserShare[]
  timestamp: Timestamp
  calculationType: 'split_users'
}

// Public preview of a trip, used by the QR/link join flow so that people who
// are not members yet can see what they are joining without being able to read
// the trip itself. Lives in `trip_invites/{tripId}`.
export interface TripInviteDocument {
  tripId: string
  tripName: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  memberCount: number
  updatedAt: Timestamp
}

// A reusable set of names ("the usual crew"), so a trip with the same people
// does not have to be typed out again. Lives in `saved_groups/{groupId}`.
export interface SavedGroupDocument {
  userId: string
  name: string
  memberNames: string[]
  createdAt: Timestamp
  lastUsedAt?: Timestamp
}

export interface SavedGroup extends SavedGroupDocument {
  id: string
}

// Existing calculation types
export interface CalculationHistoryDocument {
  userId: string
  totalAmount: number
  userAmount: number
  result: number
  calculationType: CalculationType
  timestamp: Timestamp
  percentage: number
  remaining: number
  details: {
    type: CalculationType
    formula: string
  }
}

export interface CalculationHistory extends CalculationHistoryDocument {
  id: string
}

export interface CalculationHistoryInput {
  userId: string
  totalAmount: number
  userAmount: number
  result: number
  calculationType: CalculationType
  percentage: number
  remaining: number
  details: {
    type: CalculationType
    formula: string
  }
}

export interface CalculationResult {
  totalAmount: number
  userAmount: number
  result: number
  percentage: number
  remaining: number
}
