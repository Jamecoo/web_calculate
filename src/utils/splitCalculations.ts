import type { UserShare } from '../model/calculateModel'

// Who owes whom, after netting everything out.
export interface Settlement {
  from: string // person who pays
  to: string   // person who receives
  amount: number
}

/**
 * Recompute each person's paid / consumed / balance from the itemised purchases.
 *
 * Each purchase is stored under the person who PAID for it and carries a
 * `consumers` list (userIds of everyone who actually shared that item). The
 * item's cost is split ONLY among its consumers — not everyone equally.
 *
 *   paid[u]     = sum of amounts u paid for
 *   consumed[u] = sum over items u consumed of amount / (number of consumers)
 *   balance[u]  = consumed - paid   (>0 => still owes/pays, <0 => should receive)
 *
 * An empty consumers list is treated as "everyone" (safety / back-compat with
 * older records that had no consumer data).
 */
export const computeUserTotals = (users: UserShare[]): UserShare[] => {
  if (users.length === 0) return users

  const allUserIds = users.map((u) => u.userId)
  const paid: Record<string, number> = {}
  const consumed: Record<string, number> = {}
  users.forEach((u) => {
    paid[u.userId] = 0
    consumed[u.userId] = 0
  })

  users.forEach((payer) => {
    payer.purchases.forEach((p) => {
      paid[payer.userId] += p.amount

      const consumers =
        p.consumers && p.consumers.length > 0 ? p.consumers : allUserIds
      const perConsumer = p.amount / consumers.length
      consumers.forEach((cId) => {
        if (consumed[cId] === undefined) return // ignore unknown ids defensively
        consumed[cId] += perConsumer
      })
    })
  })

  return users.map((u) => {
    const uPaid = Math.round(paid[u.userId] / 1000) * 1000
    const uConsumed = Math.round(consumed[u.userId] / 1000) * 1000
    return {
      ...u,
      paid: uPaid,
      consumed: uConsumed,
      // initialShare kept for backward-compat readers; now means "amount this
      // person is responsible for" (their consumed total).
      initialShare: uConsumed,
      currentBalance: uConsumed - uPaid,
    }
  })
}

/**
 * Greedy who-pays-whom matcher: creditors (negative balance, should receive)
 * matched against debtors (positive balance, should pay). Amounts under 0.01
 * are treated as settled.
 */
export const calculateSettlements = (users: UserShare[]): Settlement[] => {
  if (users.length === 0) return []

  const creditors = users
    .filter((u) => u.currentBalance < 0)
    .map((u) => ({ userName: u.userName, amount: Math.abs(u.currentBalance) }))

  const debtors = users
    .filter((u) => u.currentBalance > 0)
    .map((u) => ({ userName: u.userName, amount: u.currentBalance }))

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const settleAmount = Math.round(Math.min(creditor.amount, debtor.amount) / 1000) * 1000

    if (settleAmount > 0) {
      settlements.push({
        from: debtor.userName,
        to: creditor.userName,
        amount: settleAmount,
      })
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount < 1000) i++
    if (debtor.amount < 1000) j++
  }

  return settlements
}
