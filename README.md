<div align="center">
  <img src="../assets/jatri-icon.svg" alt="Jatri" width="72" />
  <h1>Jatri — Server</h1>
  <p><em>Express · TypeScript · MongoDB · Socket.io · Stripe</em></p>
</div>

The Jatri backend: a typed Express (MVC) API plus a Socket.io gateway that powers real-time, conflict-free
seat selection, a cron-based hold reconciler, and dynamic Stripe checkout.

> Part of the **Jatri** monorepo — see the root [`README.md`](../README.md) and
> [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for system diagrams.

---

## 🧱 Tech Stack

- **Runtime:** Node + Express 4, TypeScript (run with `tsx`)
- **Database:** MongoDB via Mongoose 8
- **Realtime:** Socket.io 4 (per-trip rooms)
- **Jobs:** `node-cron` (release expired seat holds every minute)
- **Payments:** Stripe (dynamic product + price + Checkout Session, webhook settlement)
- **Validation:** Zod schemas via a `validate` middleware
- **Security:** helmet · cors (credentialed) · express-rate-limit · JWT (`jsonwebtoken`) · `bcryptjs`

---

## 📂 Project Structure

```
server/src/
├── app.ts                 # Express app: security, raw-body webhook, routes, error handlers
├── index.ts               # Bootstrap: DB, HTTP server, Socket.io, cron
├── config/                # env loader, db connection
├── controllers/           # auth, user, vehicle, trip, booking, stripe
├── routes/                # REST route definitions (role-guarded)
├── services/              # seat.service (atomic holds), stripe.service
├── sockets/               # io singleton + seat.socket gateway
├── jobs/                  # releaseHolds cron
├── middleware/            # auth (JWT/roles), validate (zod), error
├── models/                # User, Vehicle, Trip, Seat, Booking, Transaction
├── validators/            # zod schemas
├── utils/                 # ApiError, asyncHandler, jwt
└── scripts/seed.ts        # seed Bangladesh routes + admin
```

---

## 🔌 How the realtime seat engine works

A seat hold is a **single atomic `findOneAndUpdate`** whose filter encodes the business rule:

```ts
// services/seat.service.ts  (simplified)
Seat.findOneAndUpdate(
  { trip, seatNumber, $or: [
      { status: 'available' },
      { status: 'held', holderId },                 // re-select my own seat
      { status: 'held', holdExpiresAt: { $lt: now } } // steal an expired hold
  ]},
  { $set: { status: 'held', holderId, holderUser, holdExpiresAt: now + 5m } },
  { new: true }
);
```

The database guarantees a single winner under concurrency. The socket gateway then broadcasts
`seat:locked` to the `trip:<id>` room; losers receive `seat:unavailable`. A `node-cron` job releases
expired holds and emits `seat:released`, so inventory never deadlocks. See diagrams in
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

### Socket events

| Direction | Event | Payload |
|-----------|-------|---------|
| client → server | `trip:join` / `trip:leave` | `tripId` |
| client → server | `seat:select` (ack) | `{ tripId, seatNumber, holderId, userId? }` |
| client → server | `seat:deselect` (ack) | `{ tripId, seatNumber, holderId }` |
| server → room | `seat:locked` | `{ seatNumber, holderId, holdExpiresAt }` |
| server → room | `seat:released` | `{ seatNumbers[] }` |
| server → room | `seat:booked` | `{ seatNumbers[] }` |
| server → socket | `seat:unavailable` | `{ seatNumber, message }` |

---

## 🌐 REST API

Base path: `/api` · auth via `Authorization: Bearer <jwt>` (or `token` cookie).

### Auth — `/api/auth`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/register` | public | Email/password signup |
| POST | `/login` | public | Email/password login |
| POST | `/google` | public | Google OAuth exchange |
| GET | `/me` | auth | Current user |
| POST | `/logout` | public | Clear session |

### Users — `/api/users`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/me` | auth | Profile |
| PATCH | `/me` | auth | Update profile |
| GET | `/` | admin | List users |
| GET | `/vendors` | admin | List vendors |
| POST | `/vendors` | admin | Create vendor |
| PATCH | `/:id/role` | admin | Change role |
| PATCH | `/:id/fraud` | admin | Flag fraud |

### Vehicles — `/api/vehicles`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/mine` | vendor | Assigned vehicles |
| GET | `/` | admin | All vehicles |
| POST | `/` | admin | Create vehicle |
| GET | `/:id` | auth | Vehicle detail |
| PATCH | `/:id/assign` | admin | Assign to vendor |
| DELETE | `/:id` | admin | Delete |

### Trips — `/api/trips`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/` | public | Search/filter/sort/paginate |
| GET | `/latest` | public | Latest trips |
| GET | `/advertised` | public | Advertised trips |
| GET | `/:id` | public | Trip detail |
| GET | `/:id/seats` | public | Seat map for a trip |
| GET | `/mine` | vendor | Vendor's trips |
| GET | `/revenue` | vendor | Revenue analytics |
| POST | `/` | vendor | Create trip |
| GET | `/all` | admin | All trips |
| PATCH | `/:id/advertise` | admin | Toggle advertise |
| PATCH | `/:id` | vendor/admin | Update trip |
| DELETE | `/:id` | vendor/admin | Delete trip |

### Bookings & Payments — `/api/bookings`, `/api/stripe`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/bookings/checkout` | auth | Create pending booking + Stripe session |
| POST | `/bookings/confirm` | auth | Confirm session (webhook fallback) |
| GET | `/bookings/mine` | auth | My bookings |
| GET | `/bookings/transactions` | auth | My transactions |
| PATCH | `/bookings/:id/cancel` | auth | Cancel a pending booking |
| POST | `/stripe/webhook` | Stripe | Settlement (raw body, signed) |
| GET | `/health` | public | Health check |

---

## ⚙️ Setup

```bash
cd server
cp .env.example .env     # fill in values
npm install
npm run seed             # seed Bangladesh routes + admin user
npm run dev              # tsx watch → http://localhost:5000
```

### Scripts
| Script | Action |
|--------|--------|
| `npm run dev` | Hot-reload dev server (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run seed` | Seed routes + admin |

### Environment (`server/.env`)
| Var | Description |
|-----|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CLIENT_URL` | Allowed CORS origin / redirect base |
| `IMGBB_KEY` | ImgBB image-host key |
| `PORT` | Server port (default `5000`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seeded admin credentials |

> **Local Stripe webhooks:** run `stripe listen --forward-to localhost:5000/api/stripe/webhook`,
> or rely on the `POST /bookings/confirm` fallback used by the success page.

---

## 🔐 Security Notes

- Stripe webhook is registered **before** `express.json()` so the raw body survives signature verification.
- `passwordHash` is stripped from all JSON responses via the User model's `toJSON` transform.
- Rate limiting: 300 requests / 15 min per IP on `/api`.
- Payment settlement is **idempotent** — a `paid` booking is never re-finalized.
