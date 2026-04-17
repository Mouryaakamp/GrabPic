# API specification — Event photos & face search

Maps to your flows: **Organizer** (auth) → event + join code → S3 presign → confirm → **BullMQ** → worker → ML → **pgvector** / `faces`. **Attendee** (guest or registered) → join code → selfie search → pgvector → matching photos.

**Base URL (example):** `https://api.example.com/api/v1`  
**Auth:** `Authorization: Bearer <JWT>`  
**IDs:** Match your DB (`TEXT` UUIDs/cuids as in Prisma).

---

## 1. Roles & auth model

| Role        | Who | Auth |
|-------------|-----|------|
| `organizer` | Creates events, uploads photos | Register/login; JWT `role: organizer` |
| `attendee`  | Joins via join code, searches   | Register **or** **guest session** (see below) |

### JWT claims (recommended)

```json
{
  "sub": "<user_id>",
  "role": "organizer" | "attendee",
  "events": ["<event_id>"]   // optional: attendee only, events they joined
}
```

- **Organizer:** enforce `role === 'organizer'` on event/photo APIs.
- **Attendee:** enforce membership: `event_members` row for `(event_id, user_id)` before search or viewing photos.

### Guest entry (no full signup)

Your `users` table requires `email` + `password_hash`. For **guest**:

1. **`POST /events/join` (guest)** — validate `join_code`, create **synthetic user**:  
   `email = guest+<uuid>@guest.yourapp.com`, random `password_hash` (never used), `role = attendee`, insert `event_members`, return JWT with `sub` = that user id.  
2. Client stores JWT; **search_logs.user_id** and FKs stay valid.

(Optional later: add `is_guest BOOLEAN` or nullable email if you want cleaner UX.)

---

## 2. Auth APIs

### `POST /auth/register`

Register **organizer** or **attendee** (full account).

| Field | Type | Notes |
|-------|------|--------|
| `email` | string | unique |
| `password` | string | min length server-side |
| `role` | `"organizer"` \| `"attendee"` | reject if you only allow organizer register here and force attendee via join |

**201** — `{ "user": { "id", "email", "role" }, "access_token", "token_type": "Bearer" }`  
**409** — email exists

---

### `POST /auth/login`

| Field | Type |
|-------|------|
| `email` | string |
| `password` | string |

**200** — same shape as register.  
**401** — invalid credentials

---

### `POST /auth/refresh` (optional)

| Field | Type |
|-------|------|
| `refresh_token` | string |

**200** — new `access_token`

---

## 3. Events (organizer)

All require **`organizer`** JWT.

### `POST /events`

Create event; server generates **unique `join_code`**.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `description` | string | no |

**201**

```json
{
  "event": {
    "id": "...",
    "name": "...",
    "description": null,
    "organizer_id": "...",
    "join_code": "ABC7XY",
    "created_at": "..."
  }
}
```

---

### `GET /events`

List events for **`organizer_id === sub`**.

**200** — `{ "events": [ ... ] }`

---

### `GET /events/:eventId`

**200** — single event (only if `organizer_id === sub`).  
**403** — not your event  
**404** — not found

---

### `PATCH /events/:eventId` (optional)

Update `name`, `description`. Organizer only.

---

## 4. Join event (attendee / guest)

### `POST /events/join`

**Auth:** optional. If **no** JWT: treat as **guest** (create synthetic user + member). If JWT **attendee**: add membership to existing user.

| Field | Type | Required |
|-------|------|----------|
| `join_code` | string | yes |

**200**

```json
{
  "event": { "id", "name", "description", "join_code" },
  "access_token": "...",
  "token_type": "Bearer",
  "user": { "id", "email", "role": "attendee" }
}
```

**404** — invalid join code  
**409** — already member (idempotent OK: return same tokens)

Server steps:

1. Resolve `events` by `join_code`.
2. If guest: create `users` row (synthetic email) if needed, else use `sub` from JWT.
3. `INSERT INTO event_members (event_id, user_id)` ON CONFLICT DO NOTHING.
4. Issue JWT with `sub`, `role: attendee`, `events: [eventId]`.

---

## 5. Organizer upload flow (presign → S3 → confirm → queue)

**Auth:** organizer JWT. **Authorize:** `events.organizer_id === sub` for `:eventId`.

### `POST /events/:eventId/photos/presign`

Creates **`photos`** row (`processing_status: pending`) and returns S3 presigned **PUT**.

| Field | Type | Required |
|-------|------|----------|
| `filename` | string | yes (sanitized; used in `storage_key`) |
| `content_type` | string | e.g. `image/jpeg` |

**200**

```json
{
  "photo_id": "...",
  "upload_url": "https://bucket.s3...",
  "storage_key": "events/{eventId}/photos/{photo_id}/{filename}",
  "headers": { "Content-Type": "image/jpeg" },
  "expires_in": 3600
}
```

Client: **PUT** file to `upload_url` (direct to S3).

---

### `POST /events/:eventId/photos/confirm`

After S3 upload succeeds. Enqueues **BullJM** job `process-photo`.

| Field | Type | Required |
|-------|------|----------|
| `photo_id` | string | yes |
| `storage_key` | string | yes (must match row; optional if server trusts photo_id only) |

**200**

```json
{
  "photo_id": "...",
  "processing_status": "pending",
  "job_id": "<bullmq_job_id>"
}
```

Server:

1. Verify photo belongs to event + organizer owns event.
2. Optional: HEAD S3 to ensure object exists.
3. **`queue.add('process-photo', { photoId, eventId, storageKey })`**.
4. Return (worker later sets `photos.processing_status` to `processed` / `failed`, inserts `faces`).

**403** / **404** — as usual

---

### `GET /events/:eventId/photos` (organizer)

List photos + status for dashboard.

**200** — `{ "photos": [{ "id", "storage_key", "processing_status", "uploaded_at" }] }`

---

## 6. Attendee search flow

**Auth:** attendee JWT with membership in `:eventId`.

### `POST /events/:eventId/search`

**Content-Type:** `multipart/form-data`  
Field: **`selfie`** (image file) **or** JSON with base64 if you prefer (multipart is better for Lambda size limits if proxy configured).

Server:

1. Verify `event_members` for `(eventId, sub)`.
2. Run **ML** (Lambda calls your ML service or embedded): face detect → **512-d embedding** (same as stored in `faces`).
3. **pgvector** (cosine): e.g.  
   `SELECT DISTINCT ON (photo_id) photo_id, 1 - (embedding <=> $1::vector) AS score  
    FROM faces WHERE event_id = $2 ORDER BY embedding <=> $1 LIMIT ...`  
   (tune: top-K per face, merge by photo).
4. Insert **`search_logs`** (`user_id`, `event_id`).
5. Load **`photos`** for matched `photo_id`s (only processed).

**200**

```json
{
  "matches": [
    {
      "photo_id": "...",
      "score": 0.92,
      "thumbnail_url": "<presigned GET, short TTL>" 
    }
  ],
  "search_log_id": "..."
}
```

**403** — not a member  
**400** — no face / bad image  
**503** — ML timeout

---

### `GET /events/:eventId/photos/:photoId/download` (attendee)

Presigned **GET** for one photo if attendee is member **and** photo is in same event (optional: only if returned in a prior search — product choice).

**200** — `{ "url", "expires_in" }`

---

## 7. Lambda / infra notes

| Concern | Suggestion |
|---------|------------|
| Presign / confirm | Short Lambda; no heavy CPU |
| Search | If ML + DB &gt; API Gateway timeout, use **async**: enqueue search job, **WebSocket or poll** `GET /searches/:jobId` — optional v2 |
| BullMQ | Enqueue from Lambda; **worker** (ECS/Lambda with SQS bridge, or long-running Node) consumes Redis |
| Redis | Same Redis URL for API (enqueue only) and worker |

---

## 8. Error envelope (recommended)

```json
{
  "error": {
    "code": "INVALID_JOIN_CODE",
    "message": "..."
  }
}
```

| HTTP | Meaning |
|------|--------|
| 400 | validation |
| 401 | missing/invalid JWT |
| 403 | wrong role or not member |
| 404 | resource / join code |
| 409 | conflict |
| 503 | ML/Redis down |

---

## 9. Endpoint summary

| Method | Path | Who |
|--------|------|-----|
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | refresh token |
| POST | `/events` | organizer |
| GET | `/events` | organizer |
| GET | `/events/:eventId` | organizer |
| PATCH | `/events/:eventId` | organizer |
| POST | `/events/join` | guest / attendee |
| POST | `/events/:eventId/photos/presign` | organizer |
| POST | `/events/:eventId/photos/confirm` | organizer |
| GET | `/events/:eventId/photos` | organizer |
| POST | `/events/:eventId/search` | attendee (member) |
| GET | `/events/:eventId/photos/:photoId/download` | attendee (member) |

---

## 10. BullMQ job payload (worker)

```json
{
  "photoId": "...",
  "eventId": "...",
  "storageKey": "..."
}
```

Worker: S3 get → ML → insert `faces` (one row per face per photo) → update `photos.processing_status`.

---

This matches your **Prisma** schema (`users`, `events`, `event_members`, `photos`, `faces`, `search_logs`) and the flows you described.
