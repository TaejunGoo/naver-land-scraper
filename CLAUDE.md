# CLAUDE.md

## Language Guidelines

- **Chat**: Korean (for conversation with the user)
- **Code**: English (comments, variable names, function names)
- **Documentation**: English (README, SPEC, inline docs, this file)

## Project Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `ComplexCard.tsx` |
| Route Files | camelCase + Routes suffix | `statsRoutes.ts` |
| Middleware Files | camelCase + Middleware suffix | `authMiddleware.ts` |
| UI Components (shadcn) | kebab-case | `alert-dialog.tsx` |
| Utility Files | camelCase | `format.ts`, `constants.ts` |
| Test Files | `.test.ts` / `.test.tsx` suffix | `ComplexCard.test.tsx` |

### TypeScript

- Use `interface` for props and data structures (no `I` prefix)
- Props interface naming: `[ComponentName]Props`
- Prefer `interface` over `type` for object shapes

```typescript
// Correct
interface ComplexCardProps {
  complex: Complex;
  onEdit: (complex: Complex) => void;
}

// Avoid
interface IComplexCardProps { ... }
type ComplexCardProps = { ... }
```

### React Components

- All components are functional (no class components)
- Named exports for components, default exports for pages
- Destructure props in function parameters

```typescript
// Component
export function ComplexCard({ complex, onEdit }: ComplexCardProps) { ... }

// Page
export default function ComplexDetail() { ... }
```

### Import Order

1. External packages (react, react-router-dom, lucide-react)
2. Type imports and API (`@/lib/api`, `@/types`)
3. Components (`@/components`)
4. Utilities (`@/lib`)
5. Hooks (`@/hooks`)

### State Management

- **Zustand**: UI state (alerts, header)
- **React Query (TanStack Query v5)**: Server state

```typescript
// Zustand store
export const useAlertStore = create<AlertState>((set) => ({ ... }));

// React Query
const { data } = useQuery({
  queryKey: ["complex", id],
  queryFn: () => complexApi.getById(id),
});
```

### API Routes (Backend)

- RESTful structure with try-catch error handling
- Consistent error response format: `{ error: "message" }`

```typescript
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.complex.findUnique({ where: { id: Number(id) } });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});
```

### Styling

- Tailwind CSS utility-first (no custom CSS files)
- Conditional classes with template literals
- shadcn/ui components from `@/components/ui`

### Date/Time Handling

- Always use KST (Korea Standard Time, UTC+9)
- Use `formatDateKST()` and `getTodayKST()` from `@/lib/format.ts`
- SQLite queries: `date(scrapedAt / 1000, 'unixepoch', '+9 hours')`

### Testing

- Vitest for unit tests
- Test files colocated with source files
- Mock external dependencies with `vi.mock()`
- Use `describe()` and `it()` with descriptive names

### Authentication (Backend)

- JWT Bearer token authentication via `authMiddleware.ts`
- All `/api/*` routes (except `/api/auth/*`, `/api/health`, `/api/cron/*`) require a valid token
- Tokens are stored in `localStorage` on the frontend (`auth_token` key)
- Token expiry: 7 days
- Password comparison uses `crypto.timingSafeEqual()` to prevent timing attacks
- Login endpoint is rate-limited: 10 attempts per 15 minutes per IP

```typescript
// Protected route example
app.use('/api/complexes', authMiddleware, complexRoutes)

// Frontend: token is auto-attached via Axios interceptor in api.ts
```

### Security Guidelines

- `express.json({ limit: '1mb' })` — prevent large payload attacks
- Never compare passwords with `===`; use `timingSafeEqual()`
- Numeric user inputs must be bounded: `Math.min(value, MAX_VALUE)`
- Cron endpoints are protected by `CRON_SECRET` header, not JWT

### Deployment (Railway)

- Docker-based deployment using `Dockerfile` (multistage build)
- SQLite DB persisted via Railway Volume mounted at `/app/data/`
- `DATABASE_URL=file:/app/data/dev.db` in Railway Variables
- `start.sh` initializes DB on first boot if not found
- Auto-scraping via GitHub Actions (`.github/workflows/daily-scrape.yml`)
- Serverless (App Sleeping) enabled to minimize cost (~$0.10/month)

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | Prisma DB path |
| `DB_PATH` | ✅ | Raw DB file path (for backup routes) |
| `ADMIN_USERNAME` | ✅ | Login username |
| `ADMIN_PASSWORD` | ✅ | Login password |
| `JWT_SECRET` | ✅ | JWT signing key (32+ random bytes) |
| `CRON_SECRET` | ✅ | Cron endpoint auth key |
| `CHROME_PATH` | Railway only | `/usr/bin/chromium` |
| `PORT` | optional | Server port (default: 5500) |
