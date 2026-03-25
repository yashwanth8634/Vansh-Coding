# AGENTS.md

Agent guide for the `VanshCoding` repository.
Tech stack: Node.js + Express + MongoDB + EJS (server-rendered views).

## 1) Build / Lint / Test Commands

### Build and run

There is no compile step in this repo (plain JavaScript, CommonJS).

- Install dependencies: `npm install`
- Run production-style (PM2 runtime): `npm start`
- Run app directly: `node server.js`
- Run with reload during development: `npx nodemon server.js`

### Lint / formatting

No linter or formatter is configured currently:

- No `.eslintrc*` or `eslint.config.*`
- No `.prettierrc*` or `prettier.config.*`
- No lint scripts in `package.json`

Useful local checks agents can run:

- Syntax check one file: `node --check server.js`
- Boot check (app + DB path): `node server.js`

If lint/format tooling is introduced later, add scripts first, then use:

- `npm run lint`
- `npm run format`

### Tests (current state)

`npm test` is a placeholder and fails intentionally:

- `npm test` -> prints `Error: no test specified` and exits with code 1.

No Jest/Vitest/Mocha config exists. Testing is currently script/integration driven.

### Existing test-like scripts

- API smoke flow for coding routes: `node test_runner.js`
- Wandbox compiler list check: `node wandbox_test.js`
- Seed sample coding challenge data: `node seed_challenge.js`

Prerequisites for those scripts:

- Server running at `http://localhost:3000` (needed for `test_runner.js`)
- Valid `MONGO_URI`
- Internet access (Wandbox API)

### Running a single test (important)

Since there is no formal test runner, "single test" means one targeted execution flow.

Preferred options:

1. Run one focused integration script:
   - `node test_runner.js`
2. Hit a single endpoint with one payload via `curl`:
   - `curl -X POST http://localhost:3000/api/coding/student/execute -H "Content-Type: application/json" -d '{"code":"print(1)","language":"python","input":""}'`
3. Submit exactly one challenge item in `submissions` to `/api/coding/student/submit`.

If a real test framework is added, document exact single-test commands here (e.g.,
`npm test -- path/to/file` or `vitest path/to/file -t "case"`).

## 2) Repository-Specific Code Style Guidelines

Use existing project conventions unless explicitly asked to refactor.

### Language and module system

- JavaScript only (no TypeScript currently)
- CommonJS only (`require`, `module.exports`)
- Keep domain split by folders:
  - `routes/` route handlers and composition
  - `models/` Mongoose schemas/models
  - `middleware/` auth/middleware logic
  - `utils/` shared utilities/cache helpers
  - `config/` startup/infrastructure setup

### Imports / requires

Group requires in this order:

1. Node built-ins
2. Third-party packages
3. Internal modules

Keep ordering stable within each group (alphabetical or consistently by usage).

### Formatting

- 2-space indentation
- Single quotes
- Semicolons enabled
- Prefer trailing commas in multiline arrays/objects
- Prefer `const`; use `let` only when reassignment is needed
- Use concise arrow functions for simple callbacks

### Naming conventions

- `camelCase` for variables/functions (`connectDB`, `shuffleArray`)
- `PascalCase` for models/constructors (`User`, `CodingAttempt`)
- Route file names reflect domain (`codingStudent.js`, `adminPages.js`)
- Cache keys are prefixed and templated (`user-${id}`, `test-${link}`)
- Env vars are uppercase snake case (`MONGO_URI`, `JWT_SECRET`, `PORT`)

### Types and validation

No static types are present; enforce validation at runtime:

- Validate required fields early and return `400` on bad input
- Normalize user input when relevant (`trim`, roll number case normalization)
- Return `404` for missing DB documents/resources
- Handle Mongo duplicate-key errors (`error.code === 11000`) explicitly

### Error handling and HTTP semantics

- Wrap async route logic with `try/catch`
- Return API errors as JSON with a clear `message`
- Use status codes consistently:
  - `400` invalid input/bad request
  - `401` unauthorized
  - `403` forbidden or duplicate attempt/submission
  - `404` not found
  - `500` internal/server error
- Log internal details with `console.error`; do not leak sensitive internals
- Keep centralized error middleware behavior in `server.js`

### Security and middleware patterns

- Reuse `protect` middleware for protected routes
- Auth token is an HTTP-only `token` cookie
- Preserve existing security middleware (`helmet`, `compression`, rate limiting)
- Do not remove execution/auth throttles from sensitive endpoints

### Data and performance conventions

- Export models via `mongoose.model(...)` with singular model names
- Keep schema middleware/method logic near the model (e.g., password hash compare)
- Use explicit projection/select for sensitive fields
- Reuse `utils/cache.js` caches; invalidate affected keys after writes
- Prefer batch queries over per-item DB lookups where possible

### Frontend scripts

- Browser scripts live in `public/js/`
- Keep response contracts aligned with frontend expectations
- Preserve EJS + vanilla JS approach unless asked otherwise

## 3) Agent Operating Rules for This Repo

- Make minimal, surgical changes
- Preserve architecture and naming patterns
- Avoid new dependencies unless clearly required
- Update docs/scripts when adding new operational commands
- Prefer backward-compatible changes unless breaking changes are requested

## 4) Cursor / Copilot Rule Files

Workspace scan result:

- `.cursor/rules/`: not found
- `.cursorrules`: not found
- `.github/copilot-instructions.md`: not found

No additional Cursor/Copilot rule files are currently present.
