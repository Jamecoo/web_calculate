import { Timestamp } from 'firebase/firestore'

export type CalculationType = 'divide' | 'percentage' | 'subtract' | 'split_users'

export interface UserShare {
  userId: string
  userName: string
  initialShare: number
  currentBalance: number
  purchases: Purchase[]
}

export interface Purchase {
  id: string
  itemName: string
  amount: number
  timestamp: Timestamp
}

// For split among users calculation
export interface SplitCalculationDocument {
  totalAmount: number
  totalUsers: number
  perUserAmount: number
  users: UserShare[]
  timestamp: Timestamp
  calculationType: 'split_users'
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


export interface UserShare {
  userId: string
  userName: string
  initialShare: number
  currentBalance: number
  purchases: Purchase[]
}

export interface Purchase {
  id: string
  itemName: string
  amount: number
  timestamp: Timestamp
}

// For split among users calculation
export interface SplitCalculationDocument {
  totalAmount: number
  totalUsers: number
  perUserAmount: number
  users: UserShare[]
  timestamp: Timestamp
  calculationType: 'split_users'
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