import type { UserShare } from '../model/calculateModel'

// Who owes whom, after netting everything out.
export interface Settlement {
  from: string // person who pays
  to: string   // person who receives
  amount: number
}

// Transfers are rounded to this many kip — nobody hands over 333 kip.
export const SETTLEMENT_UNIT = 1000

/**
 * Round a set of balances to `unit` WITHOUT losing money.
 *
 * Rounding each balance on its own lets the group total drift away from zero
 * (five people rounded up = 5,000 kip that nobody owes), which leaves the
 * settlement list unbalanced. So: round everyone, measure the residue, then
 * push it back onto the people whose own rounding moved them the furthest, a
 * `unit` at a time, until the balances sum to exactly zero again.
 */
const reconcileRounding = (balances: number[], unit: number): number[] => {
  const rounded = balances.map((b) => Math.round(b / unit) * unit)
  const residue = rounded.reduce((sum, b) => sum + b, 0)
  const steps = Math.round(Math.abs(residue) / unit)
  if (steps === 0) return rounded

  // residue > 0 => the group "owes" too much, so take a unit back from whoever
  // gained the most from rounding (and the mirror image when it is negative).
  const step = residue > 0 ? -unit : unit
  const order = balances
    .map((balance, index) => ({ index, gain: rounded[index] - balance }))
    .sort((a, b) => (residue > 0 ? b.gain - a.gain : a.gain - b.gain))

  for (let k = 0; k < steps; k++) {
    rounded[order[k % order.length].index] += step
  }
  return rounded
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
 * paid and consumed are kept exact (to the kip); only the balance is rounded to
 * SETTLEMENT_UNIT, and that rounding is reconciled across the whole group so the
 * balances still cancel out.
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

  const exactBalances = users.map(
    (u) => consumed[u.userId] - paid[u.userId]
  )
  const balances = reconcileRounding(exactBalances, SETTLEMENT_UNIT)

  return users.map((u, index) => {
    const uPaid = Math.round(paid[u.userId])
    const uConsumed = Math.round(consumed[u.userId])
    return {
      ...u,
      paid: uPaid,
      consumed: uConsumed,
      // initialShare kept for backward-compat readers; now means "amount this
      // person is responsible for" (their consumed total).
      initialShare: uConsumed,
      currentBalance: balances[index],
    }
  })
}

/**
 * Greedy who-pays-whom matcher: creditors (negative balance, should receive)
 * matched against debtors (positive balance, should pay).
 *
 * Balances are reconciled to SETTLEMENT_UNIT first, so they cancel out exactly
 * and every kip on the debit side lands on somebody's credit side.
 */
export const calculateSettlements = (users: UserShare[]): Settlement[] => {
  if (users.length === 0) return []

  const balances = reconcileRounding(
    users.map((u) => u.currentBalance || 0),
    SETTLEMENT_UNIT
  )

  const creditors = users
    .map((u, index) => ({ userName: u.userName, amount: -balances[index] }))
    .filter((c) => c.amount > 0)

  const debtors = users
    .map((u, index) => ({ userName: u.userName, amount: balances[index] }))
    .filter((d) => d.amount > 0)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const settleAmount = Math.min(creditor.amount, debtor.amount)

    if (settleAmount > 0) {
      settlements.push({
        from: debtor.userName,
        to: creditor.userName,
        amount: settleAmount,
      })
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount <= 0) i++
    if (debtor.amount <= 0) j++
  }

  return settlements
}
