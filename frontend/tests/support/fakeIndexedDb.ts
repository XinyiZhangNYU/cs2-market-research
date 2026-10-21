/**
 * A deliberately small IndexedDB stand-in.
 *
 * jsdom ships no IndexedDB and this task must not add a dependency, so this covers exactly the
 * surface `IndexedDbPersonalWatchlistStore` uses: a versioned open with an `upgradeneeded`
 * versionchange transaction, `getAll` / `put` / `delete` / `clear`, and transaction abort.
 * It also records every destructive call so a test can prove the legacy store survived.
 */

type StoredRecord = Record<string, unknown>

class FakeObjectStoreState {
  readonly data = new Map<string, StoredRecord>()
  constructor(readonly name: string, readonly keyPath: string) {}
}

export class FakeDatabaseState {
  version = 0
  readonly stores = new Map<string, FakeObjectStoreState>()
  /** Every `clear()` call, by store name. Nothing here should ever name the legacy store. */
  readonly clearedStores: string[] = []
  readonly deletedKeys: Array<Readonly<{ store: string; key: string }>> = []

  seed(storeName: string, keyPath: string, records: readonly StoredRecord[]): void {
    const store = new FakeObjectStoreState(storeName, keyPath)
    for (const record of records) {
      store.data.set(String(record[keyPath]), structuredClone(record))
    }
    this.stores.set(storeName, store)
    this.version = Math.max(this.version, 1)
  }

  read(storeName: string): readonly StoredRecord[] {
    return [...(this.stores.get(storeName)?.data.values() ?? [])]
  }
}

class FakeRequest<T> extends EventTarget {
  result!: T
  error: unknown = null
  transaction: FakeTransaction | null = null
}

class FakeObjectStore {
  constructor(
    private readonly state: FakeObjectStoreState,
    private readonly transaction: FakeTransaction,
    private readonly database: FakeDatabaseState,
  ) {}

  createIndex(): void {
    // Index maintenance is irrelevant to the behaviour under test.
  }

  getAll(): FakeRequest<StoredRecord[]> {
    const request = new FakeRequest<StoredRecord[]>()
    this.transaction.enqueue(() => {
      request.result = [...this.state.data.values()].map((record) => structuredClone(record))
      request.dispatchEvent(new Event('success'))
    })
    return request
  }

  put(value: StoredRecord): void {
    this.transaction.enqueue(() => {
      this.state.data.set(String(value[this.state.keyPath]), structuredClone(value))
    })
  }

  delete(key: string): void {
    this.transaction.enqueue(() => {
      this.database.deletedKeys.push({ store: this.state.name, key })
      this.state.data.delete(key)
    })
  }

  clear(): void {
    this.transaction.enqueue(() => {
      this.database.clearedStores.push(this.state.name)
      this.state.data.clear()
    })
  }
}

class FakeTransaction extends EventTarget {
  error: unknown = null
  private aborted = false
  private settled = false
  private readonly queue: Array<() => void> = []
  /** Writes made during a versionchange transaction are discarded when it aborts. */
  private readonly rollback: Map<string, Map<string, StoredRecord>> | null

  constructor(
    private readonly database: FakeDatabaseState,
    versionchange: boolean,
  ) {
    super()
    this.rollback = versionchange
      ? new Map([...database.stores].map(([name, store]) => [name, new Map(store.data)]))
      : null
    setTimeout(() => this.settle(), 0)
  }

  enqueue(operation: () => void): void {
    if (this.aborted) return
    this.queue.push(operation)
    queueMicrotask(() => this.drain())
  }

  private drain(): void {
    if (this.aborted) return
    while (this.queue.length > 0) {
      const operation = this.queue.shift()
      operation?.()
    }
  }

  private settle(): void {
    if (this.settled) return
    this.drain()
    if (this.aborted) return
    this.settled = true
    this.dispatchEvent(new Event('complete'))
  }

  objectStore(name: string): FakeObjectStore {
    const state = this.database.stores.get(name)
    if (!state) throw new Error(`unknown object store ${name}`)
    return new FakeObjectStore(state, this, this.database)
  }

  abort(): void {
    if (this.aborted || this.settled) return
    this.aborted = true
    this.queue.length = 0
    if (this.rollback) {
      for (const [name, data] of this.rollback) {
        const store = this.database.stores.get(name)
        if (store) {
          store.data.clear()
          for (const [key, value] of data) store.data.set(key, value)
        }
      }
      for (const name of [...this.database.stores.keys()]) {
        if (!this.rollback.has(name)) this.database.stores.delete(name)
      }
    }
    this.settled = true
    queueMicrotask(() => this.dispatchEvent(new Event('abort')))
  }
}

class FakeDatabase {
  closed = false
  constructor(private readonly state: FakeDatabaseState) {}

  get objectStoreNames() {
    return { contains: (name: string) => this.state.stores.has(name) }
  }

  createObjectStore(name: string, options: { keyPath: string }): FakeObjectStore {
    const store = new FakeObjectStoreState(name, options.keyPath)
    this.state.stores.set(name, store)
    return new FakeObjectStore(store, this.activeUpgrade!, this.state)
  }

  activeUpgrade: FakeTransaction | null = null

  transaction(name: string, _mode: string): FakeTransaction {
    void _mode
    const transaction = new FakeTransaction(this.state, false)
    if (!this.state.stores.has(name)) throw new Error(`unknown object store ${name}`)
    return transaction
  }

  close(): void {
    this.closed = true
  }
}

export function installFakeIndexedDb(state: FakeDatabaseState): () => void {
  const original = Reflect.get(globalThis, 'indexedDB') as unknown
  const fake = {
    open(_name: string, version: number) {
      void _name
      const request = new FakeRequest<FakeDatabase>()
      const database = new FakeDatabase(state)
      request.result = database
      const oldVersion = state.version
      setTimeout(() => {
        if (version > oldVersion) {
          const upgrade = new FakeTransaction(state, true)
          database.activeUpgrade = upgrade
          request.transaction = upgrade
          state.version = version
          upgrade.addEventListener('complete', () => {
            request.transaction = null
            request.dispatchEvent(new Event('success'))
          }, { once: true })
          upgrade.addEventListener('abort', () => {
            state.version = oldVersion
            request.transaction = null
            request.error = new Error('upgrade aborted')
            request.dispatchEvent(new Event('error'))
          }, { once: true })
          const event = new Event('upgradeneeded') as Event & { oldVersion: number }
          Object.defineProperty(event, 'oldVersion', { value: oldVersion })
          request.dispatchEvent(event)
        } else {
          request.dispatchEvent(new Event('success'))
        }
      }, 0)
      return request
    },
  }
  Object.defineProperty(globalThis, 'indexedDB', { value: fake, configurable: true, writable: true })
  return () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: original, configurable: true, writable: true })
  }
}
