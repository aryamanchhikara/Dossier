/**
 * Minimal Supabase-compatible query builder backed by a local JSON file.
 * Used when USE_LOCAL_DB=true — no cloud setup required for development.
 */
import fs   from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

type TableName = 'users' | 'taste_items' | 'currently_items' | 'widgets'
type Row = Record<string, unknown>

interface DbFile {
  users:           Row[]
  taste_items:     Row[]
  currently_items: Row[]
  widgets:         Row[]
}

const DB_PATH = path.join(process.cwd(), '.local-db.json')

function read(): DbFile {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch {
    return { users: [], taste_items: [], currently_items: [], widgets: [] }
  }
}

function write(db: DbFile) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// ─── Query builder ──────────────────────────────────────────────

class Builder {
  protected _table:  TableName
  protected _cols  = '*'
  protected _where: Array<[string, unknown]> = []
  protected _order?: string

  constructor(table: TableName) { this._table = table }

  select(cols: string) { this._cols = cols; return this }
  eq(col: string, val: unknown) { this._where.push([col, val]); return this }
  order(col: string) { this._order = col; return this }

  protected matchRow(r: Row) {
    return this._where.every(([c, v]) => r[c] === v)
  }

  protected projectRow(r: Row): Row {
    if (this._cols === '*') return r
    const cols = this._cols.split(',').map(c => c.trim().split(/\s+/)[0])
    return Object.fromEntries(cols.map(c => [c, r[c]]))
  }

  // Awaiting the builder returns { data: Row[], error: null }
  then(
    resolve: (v: { data: Row[]; error: null }) => void,
    _reject?: (e: unknown) => void
  ) {
    try {
      const db = read()
      let rows = db[this._table].filter(r => this.matchRow(r))
      if (this._order) {
        const col = this._order
        rows = [...rows].sort((a, b) => Number(a[col]) - Number(b[col]))
      }
      resolve({ data: rows.map(r => this.projectRow(r)), error: null })
    } catch (e) {
      _reject?.(e)
    }
  }

  // Awaiting .single() returns { data: Row | null, error: null }
  single(): Promise<{ data: Row | null; error: null }> {
    const db = read()
    const row = db[this._table].find(r => this.matchRow(r))
    return Promise.resolve({ data: row ? this.projectRow(row) : null, error: null })
  }
}

class InsertBuilder {
  private _table: TableName
  private _rows:  Row[]

  constructor(table: TableName, rows: Row | Row[]) {
    this._table = table
    this._rows  = Array.isArray(rows) ? rows : [rows]
  }

  then(resolve: (v: { data: Row[]; error: null }) => void) {
    const db  = read()
    const now = new Date().toISOString()
    const inserted = this._rows.map(r => ({
      id: randomUUID(), created_at: now, updated_at: now, ...r,
    }))
    db[this._table].push(...inserted)
    write(db)
    resolve({ data: inserted, error: null })
  }
}

class UpdateBuilder extends Builder {
  private _patch: Row

  constructor(table: TableName, patch: Row) {
    super(table)
    this._patch = patch
  }

  then(resolve: (v: { data: Row[]; error: null }) => void) {
    const db  = read()
    const now = new Date().toISOString()
    db[this._table] = db[this._table].map(r =>
      this.matchRow(r) ? { ...r, ...this._patch, updated_at: now } : r
    )
    write(db)
    resolve({ data: [], error: null })
  }
}

class DeleteBuilder extends Builder {
  then(resolve: (v: { data: Row[]; error: null }) => void) {
    const db = read()
    db[this._table] = db[this._table].filter(r => !this.matchRow(r))
    write(db)
    resolve({ data: [], error: null })
  }
}

class UpsertBuilder {
  private _table:      TableName
  private _data:       Row
  private _conflict:   string
  private _selectCols = '*'

  constructor(table: TableName, data: Row, conflict: string) {
    this._table    = table
    this._data     = data
    this._conflict = conflict
  }

  select(cols: string) { this._selectCols = cols; return this }

  single(): Promise<{ data: Row | null; error: null }> {
    const db        = read()
    const conflictKeys = this._conflict.split(',').map(c => c.trim())
    const existing  = db[this._table].find(r =>
      conflictKeys.every(k => r[k] === this._data[k])
    )

    let result: Row
    if (existing) {
      Object.assign(existing, this._data, { updated_at: new Date().toISOString() })
      result = existing
    } else {
      result = { id: randomUUID(), created_at: new Date().toISOString(), ...this._data }
      db[this._table].push(result)
    }
    write(db)

    if (this._selectCols !== '*') {
      const cols = this._selectCols.split(',').map(c => c.trim())
      result = Object.fromEntries(cols.map(c => [c, result[c]]))
    }
    return Promise.resolve({ data: result, error: null })
  }

  then(resolve: (v: { data: Row; error: null }) => void) {
    this.single().then(({ data }) => resolve({ data: data!, error: null }))
  }
}

// ─── Table proxy ────────────────────────────────────────────────

class TableProxy {
  private _t: TableName
  constructor(t: TableName) { this._t = t }

  select(cols = '*') { return new Builder(this._t).select(cols) }
  insert(rows: Row | Row[]) { return new InsertBuilder(this._t, rows) }
  update(patch: Row) { return new UpdateBuilder(this._t, patch) }
  delete() { return new DeleteBuilder(this._t) }
  upsert(data: Row, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    return new UpsertBuilder(this._t, data, opts?.onConflict ?? 'id')
  }
}

export function createLocalClient() {
  return {
    from(table: string) {
      return new TableProxy(table as TableName)
    },
  }
}
