import * as indexeddb from 'lib0/indexeddb'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { WhiteboardData } from './Whiteboard3'

const DB_NAME = 'meshed.whiteboard.db'
const STORE_NAME = 'meshed.whiteboard.store'

export class WhiteboardDB {
  private static instance: WhiteboardDB

  private declare readonly projectId: string
  private declare db: IDBDatabase

  constructor (projectId: string) {
    this.projectId = projectId
  }

  static getInstance (projectId: string): WhiteboardDB {
    if (!WhiteboardDB.instance) {
      WhiteboardDB.instance = new WhiteboardDB(projectId)
    }
    return WhiteboardDB.instance
  }

  public async connect (): Promise<void> {
    return await new Promise((resolve) => {
      indexeddb.openDB(DB_NAME, (db) => {
        db.createObjectStore(STORE_NAME)
        console.log('indexed db store created', db.version, STORE_NAME)
      }).then((db) => {
        this.db = db
        resolve()
      })
    })
  }

  public async get (): Promise<WhiteboardData> {
    const store = this.getStore()
    const item = await indexeddb.get(store, this.projectId) as ArrayBuffer
    return decode<WhiteboardData>(item)
  }

  public async set (data: WhiteboardData<readonly ExcalidrawElement[]>): Promise<void> {
    const store = this.getStore()
    await indexeddb.put(store, encode(data), this.projectId)
    console.log('set', data)
  }

  private getStore (): IDBObjectStore {
    return this.db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
  }
}

function encode (data: any): ArrayBuffer {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder).buffer
}

function decode<T> (buffer: ArrayBuffer): T {
  const decoder = decoding.createDecoder(new Uint8Array(buffer))
  return decoding.readAny(decoder)
}
