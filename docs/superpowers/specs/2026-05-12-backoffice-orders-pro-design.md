# Backoffice Pedidos Pro — Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this spec task-by-task.

**Goal:** Add order number, search, date range filtering, collection filtering, and CSV export to the admin Orders tab.

**Architecture:** 
- Database: add `orderNumber` auto-increment field to `Order` model
- Data layer: extend `getOrders()` to accept filters (search, collection, dateFrom, dateTo)
- API: new `GET /api/admin/orders/export` endpoint for CSV download
- UI: OrdersTab gets filters row (search input, date pickers, collection dropdown, clear button) and CSV export button

**Tech Stack:** Next.js 15, Prisma 6, React, Tailwind, react-datepicker (or similar), CSV generation (node built-in `fs` or `papaparse`)

---

## Database Changes

Add to `Order` model in `prisma/schema.prisma`:

```prisma
orderNumber Int @unique @default(autoincrement())
```

Formatted in UI as `#0880-XXXXX` (zero-padded to 5 digits). Postgres autoincrement guarantees uniqueness without application logic. Existing orders receive numbers 1–N when schema is pushed.

---

## Data Layer (`lib/server-actions.ts`)

Extend `getOrders()` signature:

```ts
export async function getOrders(filters?: {
  search?: string        // search in customerName, customerEmail
  status?: string
  reviewOnly?: boolean
  collection?: string    // filter by product.collection
  dateFrom?: string      // ISO date string
  dateTo?: string        // ISO date string
}) {
  // ...
}
```

**Filtering logic:**
- `search` (min 2 chars): case-insensitive substring in customerName OR customerEmail
- `collection`: exact match on `product.collection`
- `dateFrom/dateTo`: `createdAt >= dateFrom AND createdAt <= dateTo`; if `dateFrom > dateTo`, ignore `dateTo`
- Combine with existing `status` and `reviewOnly` logic

**Return value:** 
- `orders: Order[]` with product relation
- `collections: string[]` (distinct product.collection values, for dropdown population)

Example Prisma where clause:
```ts
where: {
  ...(filters?.search
    ? {
        OR: [
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerEmail: { contains: filters.search, mode: 'insensitive' } },
        ],
      }
    : {}),
  ...(filters?.collection ? { product: { collection: filters.collection } } : {}),
  ...(filters?.dateFrom ? { createdAt: { gte: new Date(filters.dateFrom) } } : {}),
  ...(filters?.dateTo ? { createdAt: { lte: new Date(filters.dateTo) } } : {}),
  // ...existing status, reviewOnly logic
}
```

---

## API Endpoint (`app/api/admin/orders/export/route.ts`)

New `GET` endpoint accepts query params:
- `search`, `collection`, `dateFrom`, `dateTo`, `status`, `reviewOnly` (mirror `getOrders()`)
- Requires admin session (use existing auth check)

**CSV columns:**
```
Order #, Date, Customer Name, Customer Email, Customer Phone, Product, Collection, Total (MXN), Payment Status, Shipping Status, Tracking, Shipping Line 1, Shipping Line 2 (Colonia), Shipping City, Shipping State, Shipping Postal Code, Shipping Country, Shipping References, Needs Review, Review Reason
```

**Response:**
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="orders-YYYY-MM-DD.csv"`
- Body: CSV rows (no BOM)

**Error handling:**
- Missing auth → 401
- DB error → 500 with `{ error: "..." }` JSON (UI catches and shows toast)

---

## UI Changes (`components/admin/OrdersTab.jsx`)

**State additions:**
```jsx
const [search, setSearch] = useState('')
const [dateFrom, setDateFrom] = useState(null)
const [dateTo, setDateTo] = useState(null)
const [selectedCollection, setSelectedCollection] = useState('')
const [collections, setCollections] = useState([])
```

**Filter row (above table):**
- Search input: "Buscar por nombre o email" placeholder
- Date pickers: "Desde" / "Hasta" (readonly, click to open calendar)
- Collection dropdown: "Todas las colecciones" default option, filled from `collections` array
- Clear button: resets all filters and reloads table

**CSV export button:**
- Placed in header row (next to Sync button)
- Icon: download (Lucide)
- Click → constructs query string with active filters → navigates to `/api/admin/orders/export?...`
- Tooltip: "Descarga todos los pedidos filtrados (nombre, email, teléfono, dirección completa, total, estado)"

**Table/Modal:**
- Order ID cell displays `#0880-XXXXX` (format orderNumber)
- Modal header includes order number
- Date column shows `createdAt` formatted as `DD/MM/YYYY HH:mm`

**Filter behavior:**
- Filters apply immediately (on keystroke for search, on date pick, on dropdown change)
- `useEffect` watches `[search, dateFrom, dateTo, selectedCollection, reviewOnly]` → calls `loadOrders()` with all filters
- Clear button sets all to empty/null/default and triggers reload

---

## Validation & Error Handling

**Input validation:**
- `search`: min 2 characters (backend enforces, UI disables loading until met)
- `dateFrom/dateTo`: if `dateFrom > dateTo`, backend ignores `dateTo`
- `collection`: validated against server-side list (dropdown only offers valid values)

**Error states:**
- CSV export fails → toast "Error al descargar CSV"
- Session expires during export → 401 → redirect to login (standard auth behavior)
- DB query fails → 500 → toast "Error al cargar pedidos"

---

## Testing

**Unit tests (`lib/server-actions.test.ts`):**
- `getOrders()` with search filter → only matching orders returned
- `getOrders()` with collection filter → only matching collection returned
- `getOrders()` with dateFrom/dateTo → only orders in range returned
- `getOrders()` with multiple filters combined → all applied correctly
- `getOrders()` returns `collections` array with correct distinct values

**Integration tests (`app/api/admin/orders/export.test.ts`):**
- CSV export with no filters → all orders included
- CSV export with search filter → only matching rows in CSV
- CSV export with date range → only rows in date range
- CSV headers present and correct
- CSV encoding is UTF-8

**E2E test (manual):**
- Create 3 test orders: 2 in "Collection A", 1 in "Collection B"
- Filter by "Collection A" → table shows 2 orders
- Filter by customer name → table shows matching order
- Filter by date range containing order → shows it; outside range → hidden
- Export CSV → file downloads, headers correct, all filtered rows present

---

## Data Backfill

When `db push` executes, Postgres autoincrement starts at 1. Existing orders (created before this change) will receive sequential `orderNumber` values automatically. No manual backfill required.

---

## Related Documents

- Spec validation: 2026-05-12
- Implementation plan: (to be created)
