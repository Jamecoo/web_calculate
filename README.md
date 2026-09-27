# Splitzy

Bill splitting for groups, in Lao kip. Log who paid for what and who actually shared
each item, and Splitzy works out the smallest set of transfers that squares everybody
up — then shares the result as a link, a QR code, a PDF or an image.

Built with React 19 + TypeScript + Vite + MUI, on Firebase (Auth, Firestore, Hosting)
with Cloudinary for images.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint
```

`.env` holds the Firebase web config (`VITE_FIREBASE_*`) and the Cloudinary upload
preset. Copy the values from the Firebase console for a new environment.

## Deploying

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules   # required after any rules change
```

> **Deploy the rules.** `trip_invites` and `saved_groups` are denied by default until
> the current `firestore.rules` is live, so join-by-link and saved groups fail without
> that second command.

## How the split works

`src/utils/splitCalculations.ts` is the heart of it and is deliberately the only place
money is rounded:

- Each purchase is stored under the person who **paid** it and carries a `consumers`
  list — the cost is divided only among the people who actually shared that item.
- `computeUserTotals` recomputes `paid`, `consumed` and `currentBalance` from the raw
  purchases every time they are read, so old documents stay correct when the logic
  changes.
- Balances are rounded to `SETTLEMENT_UNIT` (1,000 kip) as a group, not individually:
  the rounding residue is handed back to whoever gained most from it, so balances still
  sum to exactly zero and no kip disappears between the per-person figures and the
  transfer list.
- `calculateSettlements` then greedily matches debtors against creditors.

## Data model (Firestore)

| Collection | What it holds | Who can read it |
| --- | --- | --- |
| `user_splits` | A trip: participants, itemised purchases, slips, members | Owner, invited members, admins |
| `trip_invites/{tripId}` | Public preview for join links: trip name + owner only | Any signed-in user |
| `saved_groups` | Reusable sets of participant names | Their owner |
| `calculation_history` | Plain divide / percentage / subtract calculations | Their owner, admins |

A trip is private: the QR/share link resolves against `trip_invites`, which carries no
amounts, and joining is a self-join write that may only add the joiner's own email to
`memberEmails`.

Admin emails live in **two** places that must be kept in sync: `src/constants/admins.ts`
and the `isAdmin()` function in `firestore.rules`.

## Layout

```
src/
  pages/<page>/            index.tsx + components/ + controllers/ + context/
    home/                  calculator and the split setup -> expenses flow
    historys/              trips, sharing, slips, bill export, join-by-link
    cost-report/           weekly / monthly spend, by person and by category
    balances/              net who-owes-who across every trip
  utils/splitCalculations  balances, rounding and settlement matching
  services/                auth, cloudinary, trip invites, saved groups
  constants/categories.ts  expense categories (ids are stable, labels are not)
```

Each page follows the same shape: a `controllers/` hook holds state and Firestore
access, a `context/` provider exposes it, and `components/` renders it.

## PWA

`public/manifest.webmanifest` + `public/sw.js` make Splitzy installable. The service
worker keeps an offline app shell (network-first for navigations, cache-first for
fingerprinted assets) and is registered only in production builds so it never shadows
Vite's dev server. Firestore is configured with its IndexedDB cache, so an installed
app still shows trips with no signal and replays writes on reconnect.

Bump `CACHE` in `public/sw.js` when the shell handling changes.
