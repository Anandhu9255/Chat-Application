# Chat Backend

Minimal backend boilerplate for the real-time chat app.

Setup

1. Copy `.env.example` to `.env` and fill values.
2. From the `Backend` folder run:

```bash
npm install
npm run dev
```

API endpoints

- `POST /api/auth/register` — { name, email, password }
- `POST /api/auth/login` — { email, password } returns `{ token, user }`
- `GET /api/auth/me` — protected, requires `Authorization: Bearer <token>`

Socket.io

The server exposes Socket.io on the same HTTP server used by Express.
