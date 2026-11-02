/**
 * Base de données de démonstration en mémoire, avec la même API que Prisma
 * pour les requêtes utilisées par le site. Le jour où Supabase/Postgres est
 * branché, `@/lib/prisma` repointe vers un vrai PrismaClient sans toucher aux routes.
 */
import { randomBytes } from "crypto";

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;
type Args = Record<string, unknown>;

export type Relation = {
  model: string;
  kind: "one" | "many";
  /** one : clé étrangère portée par ce modèle ; many : clé étrangère portée par l'autre modèle */
  from: string;
  to: string;
};

export type ModelDef = {
  relations: Record<string, Relation>;
  /** clés uniques composées, ex. email_organizationId */
  compound?: Record<string, string[]>;
  defaults?: () => Row;
  /** pas de colonne id (ex. InvoiceCounter) */
  noId?: boolean;
  timestamps?: boolean;
};

export class KnownRequestError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "PrismaClientKnownRequestError";
  }
}

export function cuid() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

const clone = <T,>(v: T): T => structuredClone(v);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v);
}

function cmp(a: unknown, b: unknown): number {
  if (a instanceof Date) a = a.getTime();
  if (b instanceof Date) b = b.getTime();
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b, "fr");
  return (a as number) < (b as number) ? -1 : 1;
}

function eq(a: unknown, b: unknown) {
  if (a instanceof Date || b instanceof Date) {
    return a != null && b != null && new Date(a as Date).getTime() === new Date(b as Date).getTime();
  }
  return (a ?? null) === (b ?? null);
}

export class Store {
  tables: Record<string, Row[]> = {};
  constructor(public defs: Record<string, ModelDef>) {
    for (const name of Object.keys(defs)) this.tables[name] = [];
  }

  /* ---------- filtres ---------- */

  matchScalar(value: unknown, filter: unknown): boolean {
    if (!isPlainObject(filter)) return eq(value, filter);
    const f = filter as Record<string, unknown>;
    const insensitive = f.mode === "insensitive";
    const norm = (s: unknown) => (insensitive && typeof s === "string" ? s.toLowerCase() : s);
    for (const [op, arg] of Object.entries(f)) {
      switch (op) {
        case "mode":
          break;
        case "equals":
          if (!eq(norm(value), norm(arg))) return false;
          break;
        case "in":
          if (!(arg as unknown[]).some((a) => eq(value, a))) return false;
          break;
        case "notIn":
          if ((arg as unknown[]).some((a) => eq(value, a))) return false;
          break;
        case "not":
          if (isPlainObject(arg) ? this.matchScalar(value, arg) : eq(value, arg)) return false;
          break;
        case "lt":
          if (value == null || cmp(value, arg) >= 0) return false;
          break;
        case "lte":
          if (value == null || cmp(value, arg) > 0) return false;
          break;
        case "gt":
          if (value == null || cmp(value, arg) <= 0) return false;
          break;
        case "gte":
          if (value == null || cmp(value, arg) < 0) return false;
          break;
        case "contains":
          if (typeof value !== "string" || !(norm(value) as string).includes(norm(arg) as string)) return false;
          break;
        case "startsWith":
          if (typeof value !== "string" || !(norm(value) as string).startsWith(norm(arg) as string)) return false;
          break;
        case "endsWith":
          if (typeof value !== "string" || !(norm(value) as string).endsWith(norm(arg) as string)) return false;
          break;
        case "has":
          if (!Array.isArray(value) || !value.includes(arg)) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }

  related(model: string, row: Row, rel: string): Row | Row[] | null {
    const r = this.defs[model].relations[rel];
    const table = this.tables[r.model];
    if (r.kind === "one") {
      const key = row[r.from];
      if (key == null) return null;
      return table.find((t) => t[r.to] === key) ?? null;
    }
    return table.filter((t) => t[r.to] === row[r.from]);
  }

  matches(model: string, row: Row, where?: Where): boolean {
    if (!where) return true;
    const def = this.defs[model];
    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue;
      if (key === "AND") {
        const list = Array.isArray(cond) ? cond : [cond];
        if (!list.every((w) => this.matches(model, row, w as Where))) return false;
      } else if (key === "OR") {
        if (!(cond as Where[]).some((w) => this.matches(model, row, w))) return false;
      } else if (key === "NOT") {
        const list = Array.isArray(cond) ? cond : [cond];
        if (list.some((w) => this.matches(model, row, w as Where))) return false;
      } else if (def.compound?.[key]) {
        const fields = def.compound[key];
        if (!fields.every((f) => eq(row[f], (cond as Row)[f]))) return false;
      } else if (def.relations[key]) {
        const r = def.relations[key];
        const rel = this.related(model, row, key);
        if (r.kind === "one") {
          if (cond === null) {
            if (rel !== null) return false;
            continue;
          }
          const c = cond as Where;
          if ("is" in c || "isNot" in c) {
            if ("is" in c) {
              if (c.is === null ? rel !== null : !rel || !this.matches(r.model, rel as Row, c.is as Where)) return false;
            }
            if ("isNot" in c) {
              if (c.isNot === null ? rel === null : !!rel && this.matches(r.model, rel as Row, c.isNot as Where)) return false;
            }
          } else if (!rel || !this.matches(r.model, rel as Row, c)) return false;
        } else {
          const list = rel as Row[];
          const c = cond as { some?: Where; none?: Where; every?: Where };
          if (c.some !== undefined && !list.some((x) => this.matches(r.model, x, c.some))) return false;
          if (c.none !== undefined && list.some((x) => this.matches(r.model, x, c.none))) return false;
          if (c.every !== undefined && !list.every((x) => this.matches(r.model, x, c.every))) return false;
        }
      } else if (!this.matchScalar(row[key], cond)) return false;
    }
    return true;
  }

  /* ---------- tri et pagination ---------- */

  sortValue(model: string, row: Row, spec: Record<string, unknown>): [unknown, string] {
    const [key, dir] = Object.entries(spec)[0];
    const r = this.defs[model].relations[key];
    if (r && isPlainObject(dir)) {
      if ("_count" in dir) {
        const list = this.related(model, row, key) as Row[];
        return [list.length, dir._count as string];
      }
      const rel = this.related(model, row, key) as Row | null;
      return rel ? this.sortValue(r.model, rel, dir) : [null, Object.values(dir)[0] as string];
    }
    if (isPlainObject(dir)) return [row[key], (dir as { sort: string }).sort];
    return [row[key], dir as string];
  }

  order(model: string, rows: Row[], orderBy: unknown): Row[] {
    if (!orderBy) return rows;
    const specs = (Array.isArray(orderBy) ? orderBy : [orderBy]) as Record<string, unknown>[];
    return [...rows].sort((a, b) => {
      for (const spec of specs) {
        const [va, dir] = this.sortValue(model, a, spec);
        const [vb] = this.sortValue(model, b, spec);
        const c = cmp(va, vb);
        if (c !== 0) return dir === "desc" ? -c : c;
      }
      return 0;
    });
  }

  page(rows: Row[], args: Args): Row[] {
    let out = rows;
    if (args.distinct) {
      const fields = args.distinct as string[];
      const seen = new Set<string>();
      out = out.filter((r) => {
        const k = JSON.stringify(fields.map((f) => r[f]));
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    const skip = (args.skip as number) ?? 0;
    const take = args.take as number | undefined;
    if (take !== undefined && take < 0) {
      out = out.slice(Math.max(0, out.length - skip + take), out.length - skip);
    } else {
      out = out.slice(skip, take === undefined ? undefined : skip + take);
    }
    return out;
  }

  query(model: string, args: Args = {}): Row[] {
    const rows = this.tables[model].filter((r) => this.matches(model, r, args.where as Where));
    return this.page(this.order(model, rows, args.orderBy), args);
  }

  /* ---------- projection (select / include / _count) ---------- */

  count(model: string, row: Row, spec: unknown): Record<string, number> {
    const select = (isPlainObject(spec) && "select" in spec ? spec.select : spec) as Record<string, unknown> | true;
    const rels = select === true ? Object.keys(this.defs[model].relations).filter((k) => this.defs[model].relations[k].kind === "many") : Object.keys(select);
    const out: Record<string, number> = {};
    for (const key of rels) {
      const opt = select === true ? true : select[key];
      if (!opt) continue;
      const r = this.defs[model].relations[key];
      let list = this.related(model, row, key) as Row[];
      if (isPlainObject(opt) && opt.where) list = list.filter((x) => this.matches(r.model, x, opt.where as Where));
      out[key] = list.length;
    }
    return out;
  }

  projectRel(model: string, row: Row, key: string, opt: unknown): unknown {
    const r = this.defs[model].relations[key];
    const sub = (isPlainObject(opt) ? opt : {}) as Args;
    if (r.kind === "one") {
      const rel = this.related(model, row, key) as Row | null;
      return rel ? this.project(r.model, rel, sub) : null;
    }
    let list = (this.related(model, row, key) as Row[]).filter((x) => this.matches(r.model, x, sub.where as Where));
    list = this.page(this.order(r.model, list, sub.orderBy), sub);
    return list.map((x) => this.project(r.model, x, sub));
  }

  project(model: string, row: Row, args: Args = {}): Row {
    const def = this.defs[model];
    if (args.select) {
      const out: Row = {};
      for (const [key, opt] of Object.entries(args.select as Record<string, unknown>)) {
        if (!opt) continue;
        if (key === "_count") out._count = this.count(model, row, opt);
        else if (def.relations[key]) out[key] = this.projectRel(model, row, key, opt);
        else out[key] = clone(row[key]);
      }
      return out;
    }
    const out = clone(row);
    if (args.include) {
      for (const [key, opt] of Object.entries(args.include as Record<string, unknown>)) {
        if (!opt) continue;
        if (key === "_count") out._count = this.count(model, row, opt);
        else out[key] = this.projectRel(model, row, key, opt);
      }
    }
    return out;
  }

  /* ---------- écritures ---------- */

  checkUnique(model: string, row: Row, ignore?: Row) {
    const def = this.defs[model];
    const keys = [...Object.values(def.compound ?? {}), ...(def.noId ? [] : [["id"]])];
    for (const fields of keys) {
      if (fields.some((f) => row[f] == null)) continue;
      const clash = this.tables[model].find((t) => t !== ignore && fields.every((f) => eq(t[f], row[f])));
      if (clash) throw new KnownRequestError(`Unique constraint failed on ${fields.join(", ")}`, "P2002");
    }
  }

  splitData(model: string, data: Row) {
    const def = this.defs[model];
    const scalars: Row = {};
    const nested: [string, Row][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      const r = def.relations[key];
      if (!r) {
        scalars[key] = value;
        continue;
      }
      const v = value as Row;
      if (r.kind === "one") {
        if (v.connect) scalars[r.from] = (v.connect as Row)[r.to];
        else if (v.disconnect) scalars[r.from] = null;
        else nested.push([key, v]);
      } else nested.push([key, v]);
    }
    return { scalars, nested };
  }

  insert(model: string, data: Row): Row {
    const def = this.defs[model];
    const { scalars, nested } = this.splitData(model, data);
    const now = new Date();
    const row: Row = {
      ...(def.noId ? {} : { id: cuid() }),
      ...(def.timestamps === false ? {} : { createdAt: now, updatedAt: now }),
      ...(def.defaults?.() ?? {}),
      ...scalars,
    };
    for (const [key, v] of nested) {
      const r = def.relations[key];
      if (r.kind === "one" && v.create) {
        const child = this.insert(r.model, v.create as Row);
        row[r.from] = child[r.to];
      }
    }
    this.checkUnique(model, row);
    this.tables[model].push(row);
    this.applyNestedMany(model, row, nested);
    return row;
  }

  applyNestedMany(model: string, row: Row, nested: [string, Row][]) {
    const def = this.defs[model];
    for (const [key, v] of nested) {
      const r = def.relations[key];
      if (r.kind !== "many") continue;
      const link = { [r.to]: row[r.from] };
      if (v.create) {
        for (const item of Array.isArray(v.create) ? v.create : [v.create]) this.insert(r.model, { ...(item as Row), ...link });
      }
      if (v.createMany) {
        for (const item of (v.createMany as { data: Row[] }).data) this.insert(r.model, { ...item, ...link });
      }
      if (v.deleteMany !== undefined) {
        const where = { ...((v.deleteMany as Where) ?? {}), ...link };
        this.tables[r.model] = this.tables[r.model].filter((x) => !this.matches(r.model, x, where));
      }
    }
  }

  patch(model: string, row: Row, data: Row) {
    const def = this.defs[model];
    const { scalars, nested } = this.splitData(model, data);
    const next = { ...row };
    for (const [key, value] of Object.entries(scalars)) {
      if (isPlainObject(value) && !def.relations[key] && ["increment", "decrement", "set", "multiply", "push"].some((op) => op in value)) {
        const v = value as Record<string, number>;
        if ("set" in v) next[key] = v.set;
        if ("increment" in v) next[key] = ((next[key] as number) ?? 0) + v.increment;
        if ("decrement" in v) next[key] = ((next[key] as number) ?? 0) - v.decrement;
        if ("multiply" in v) next[key] = ((next[key] as number) ?? 0) * v.multiply;
      } else next[key] = value;
    }
    if (def.timestamps !== false && !("updatedAt" in scalars)) next.updatedAt = new Date();
    this.checkUnique(model, next, row);
    Object.assign(row, next);
    this.applyNestedMany(model, row, nested);
  }

  /** Supprime une ligne et applique les suppressions en cascade (comme le schéma Prisma). */
  remove(model: string, rows: Row[]) {
    const set = new Set(rows);
    this.tables[model] = this.tables[model].filter((r) => !set.has(r));
    for (const [childModel, def] of Object.entries(this.defs)) {
      for (const r of Object.values(def.relations)) {
        if (r.kind !== "one" || r.model !== model) continue;
        const keys = new Set(rows.map((x) => x[r.to]));
        const orphans = this.tables[childModel].filter((x) => keys.has(x[r.from]));
        if (!orphans.length) continue;
        if (CASCADE[childModel]?.includes(r.from)) this.remove(childModel, orphans);
        else for (const o of orphans) o[r.from] = null;
      }
    }
  }
}

/** Clés étrangères en `onDelete: Cascade` dans le schéma (les autres passent à null). */
const CASCADE: Record<string, string[]> = {
  user: ["organizationId"],
  permitApplication: ["organizationId", "candidateId"],
  document: ["applicationId"],
  message: ["applicationId"],
  applicationEvent: ["applicationId"],
  passwordToken: ["userId"],
  theorySession: ["organizationId"],
  sessionRegistration: ["sessionId", "candidateId"],
  invoiceCounter: ["organizationId"],
  payment: ["applicationId"],
};

/* ---------- délégués « prisma.modele.* » ---------- */

function uniqueWhere(store: Store, model: string, where: Where): Where {
  return where;
}

export function delegate(store: Store, model: string) {
  const first = (args: Args = {}) => store.query(model, { ...args, take: 1 })[0] ?? null;
  const notFound = () => new KnownRequestError(`No ${model} found`, "P2025");

  return {
    async findMany(args: Args = {}) {
      return store.query(model, args).map((r) => store.project(model, r, args));
    },
    async findFirst(args: Args = {}) {
      const r = first(args);
      return r ? store.project(model, r, args) : null;
    },
    async findFirstOrThrow(args: Args = {}) {
      const r = first(args);
      if (!r) throw notFound();
      return store.project(model, r, args);
    },
    async findUnique(args: Args) {
      const r = first({ where: uniqueWhere(store, model, args.where as Where) });
      return r ? store.project(model, r, args) : null;
    },
    async findUniqueOrThrow(args: Args) {
      const r = first({ where: args.where });
      if (!r) throw notFound();
      return store.project(model, r, args);
    },
    async count(args: Args = {}) {
      return store.query(model, { where: args.where }).length;
    },
    async create(args: Args) {
      const row = store.insert(model, args.data as Row);
      return store.project(model, row, args);
    },
    async createMany(args: Args) {
      const data = args.data as Row[];
      for (const d of data) {
        try {
          store.insert(model, d);
        } catch (e) {
          if (!args.skipDuplicates) throw e;
        }
      }
      return { count: data.length };
    },
    async update(args: Args) {
      const row = first({ where: args.where });
      if (!row) throw notFound();
      store.patch(model, row, args.data as Row);
      return store.project(model, row, args);
    },
    async updateMany(args: Args) {
      const rows = store.query(model, { where: args.where });
      for (const r of rows) store.patch(model, r, args.data as Row);
      return { count: rows.length };
    },
    async upsert(args: Args) {
      const row = first({ where: args.where });
      if (row) {
        store.patch(model, row, args.update as Row);
        return store.project(model, row, args);
      }
      const created = store.insert(model, args.create as Row);
      return store.project(model, created, args);
    },
    async delete(args: Args) {
      const row = first({ where: args.where });
      if (!row) throw notFound();
      const out = store.project(model, row, args);
      store.remove(model, [row]);
      return out;
    },
    async deleteMany(args: Args = {}) {
      const rows = store.query(model, { where: args.where });
      store.remove(model, rows);
      return { count: rows.length };
    },
    async aggregate(args: Args) {
      const rows = store.query(model, { where: args.where });
      const out: Row = {};
      if (args._count) out._count = rows.length;
      for (const op of ["_sum", "_avg", "_min", "_max"] as const) {
        if (!args[op]) continue;
        const agg: Row = {};
        for (const field of Object.keys(args[op] as Row)) {
          const values = rows.map((r) => r[field]).filter((v) => v != null) as number[];
          if (op === "_sum") agg[field] = values.length ? values.reduce((a, b) => a + b, 0) : null;
          if (op === "_avg") agg[field] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
          if (op === "_min") agg[field] = values.length ? values.reduce((a, b) => (cmp(a, b) <= 0 ? a : b)) : null;
          if (op === "_max") agg[field] = values.length ? values.reduce((a, b) => (cmp(a, b) >= 0 ? a : b)) : null;
        }
        out[op] = agg;
      }
      return out;
    },
    async groupBy(args: Args) {
      const by = args.by as string[];
      const rows = store.query(model, { where: args.where });
      const groups = new Map<string, Row[]>();
      for (const r of rows) {
        const k = JSON.stringify(by.map((f) => r[f]));
        groups.set(k, [...(groups.get(k) ?? []), r]);
      }
      return [...groups.values()].map((list) => {
        const out: Row = {};
        for (const f of by) out[f] = clone(list[0][f]);
        if (args._count === true) out._count = list.length;
        else if (args._count) {
          const c: Row = {};
          for (const f of Object.keys(args._count as Row)) c[f] = f === "_all" ? list.length : list.filter((r) => r[f] != null).length;
          out._count = c;
        }
        if (args._sum) {
          const s: Row = {};
          for (const f of Object.keys(args._sum as Row)) s[f] = list.reduce((a, r) => a + ((r[f] as number) ?? 0), 0);
          out._sum = s;
        }
        if (args._max) {
          const s: Row = {};
          for (const f of Object.keys(args._max as Row)) s[f] = list.map((r) => r[f]).reduce((a, b) => (cmp(a, b) >= 0 ? a : b));
          out._max = s;
        }
        return out;
      });
    },
  };
}
