# NearHelp API

Base URL: `http://localhost:3000`

Protected endpoints require this header:

```http
Authorization: Bearer <token>
```

When sending JSON, include:

```http
Content-Type: application/json
```

## Authentication

### Sign up

`POST /api/auth/signup`

Request:

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "strong-password"
}
```

Success: `201 Created`

```json
{
  "user": {
    "id": "user-uuid",
    "name": "Asha Sharma",
    "email": "asha@example.com",
    "role": "user"
  },
  "token": "jwt-token"
}
```

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "asha@example.com",
  "password": "strong-password"
}
```

Success: `200 OK` — returns `user` and `token`.

### Current user

`GET /api/auth/me`

Requires login. Returns:

```json
{
  "user": {
    "id": "user-uuid",
    "name": "Asha Sharma",
    "email": "asha@example.com",
    "role": "user",
    "gender": null,
    "location": null,
    "work": null
  }
}
```

### Update profile

`PATCH /api/auth/profile`

Requires login. Accepts `gender`, `location`, and `work` (all optional strings).

## Places

### Search nearby places

`GET /api/places?lat=<latitude>&lon=<longitude>&radius=<meters>&category=<category>`

`lat` and `lon` are required. `radius` is optional (default `5000`, max `50000` meters). `category` is optional.

Example:

```http
GET /api/places?lat=28.6139&lon=77.2090&radius=3000&category=hospital
```

Success:

```json
{
  "places": [
    {
      "id": "node/123456",
      "name": "Example Hospital",
      "lat": 28.614,
      "lon": 77.209,
      "category": "hospital",
      "address": "Example Road",
      "distanceMeters": 25
    }
  ]
}
```

### Get a place

`GET /api/places/:id`

`id` is the place ID from a search result. Community-submitted places use a
`community-<uuid>` ID and are resolved from the local database; all other IDs
are resolved through the Geoapify provider.

### Submit a community place

`POST /api/places/community`

Requires login. Request:

```json
{
  "name": "City Clinic",
  "category": "hospital",
  "address": "12 Main Road",
  "lat": 28.6139,
  "lon": 77.209
}
```

Submissions are created with `pending` status and appear in search results
only after an admin approves them.

## Community chat

Requires login.

### List messages

`GET /api/chat/public/messages`

Returns the latest 100 messages, oldest first:

```json
{
  "messages": [
    {
      "id": "message-uuid",
      "sender_id": "user-uuid",
      "sender_name": "Asha Sharma",
      "body": "Hello!",
      "created_at": "2026-10-16T10:00:00.000Z"
    }
  ]
}
```

### Send a message

`POST /api/chat/public/messages`

Request:

```json
{
  "body": "Hello, can anyone help?"
}
```

Success: `201 Created` — returns the created message with `sender_name`.

## AI assistant

### Ask a question

`POST /api/assistant/ask`

Request:

```json
{
  "question": "How do I find a nearby pharmacy?"
}
```

Success: `200 OK` — returns `{ "answer": "..." }`.

## Admin

Admin endpoints require a valid login with the `admin` role.

### Dashboard summary

`GET /api/admin/dashboard`

```json
{
  "dashboard": {
    "userCount": 12,
    "pendingPlacesCount": 3
  }
}
```

### List users

`GET /api/admin/users`

Returns `{ "users": [...] }`.

### Update a user's role

`PATCH /api/admin/users/:id/role`

Request:

```json
{
  "role": "admin"
}
```

Allowed roles: `user`, `admin`.

### List pending community places

`GET /api/admin/community-places`

Returns `{ "places": [...] }` for places awaiting review.

### Review a community place

`PATCH /api/admin/community-places/:id`

Request:

```json
{
  "status": "approved"
}
```

Allowed statuses: `approved`, `rejected`.

## Error responses

Errors are returned as JSON:

```json
{
  "error": "Error message"
}
```

Validation errors may also include a `details` array. Common status codes:

- `400` — invalid request data
- `401` — login/token required or invalid
- `403` — admin access required
- `404` — route, place, or user not found
- `409` — email already registered
- `500` — server error
