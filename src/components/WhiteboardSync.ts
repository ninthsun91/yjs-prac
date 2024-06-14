import { Socket, io } from 'socket.io-client'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

export class WhiteboardSync {
  private static instance: WhiteboardSync

  private roomId: string = 'project-id'
  private lastHashVersion: number = -1

  private readonly socket: Socket
  private readonly api: ExcalidrawImperativeAPI

  constructor(api: ExcalidrawImperativeAPI, projectId: string) {
    this.disconnect()
    const url = 'http://localhost:3333'

    this.api = api
    this.roomId = projectId
    this.socket = io(url, {
      auth: { token: 'auth-token' },
      query: { projectId },
      withCredentials: true,
      autoConnect: false,
    })
  }

  static getInstance(api: ExcalidrawImperativeAPI, projectId: string): WhiteboardSync {
    if (!WhiteboardSync.instance) {
      WhiteboardSync.instance = new WhiteboardSync(api, projectId)
    }
    return WhiteboardSync.instance
  }

  public async connect() {
    return new Promise<void>((resolve) => {
      this.socket.connect()
      this.socket.on('connect', () => {
        console.log('socket.io connected ', this.socket.id)
        resolve()
      })
    })
  }

  public disconnect() {
    if (this.socket?.connected) this.socket.disconnect()
  }

  public listen() {
    this.socket.on('sync', (buffer: ArrayBuffer) => {
      const remoteData = decodeData(buffer)
      const { elements, appState } = reconcileData(this.api, remoteData.elements)
      this.api.updateScene({ elements, appState })
    })
  }

  public update(elements: readonly ExcalidrawElement[]): void {
    const hashVersion = hashElementsVersion(elements)
    if (hashVersion === this.lastHashVersion) return

    this.socket.emit('update', encodeData({ elements }))
    this.lastHashVersion = hashVersion
  }
}

function decodeData(data: ArrayBuffer): { elements: ExcalidrawElement[] } {
  const decoder = decoding.createDecoder(new Uint8Array(data))
  return decoding.readAny(decoder)
}

function encodeData(data: any): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder)
}

function reconcileData(api: ExcalidrawImperativeAPI, remoteElements: ExcalidrawElement[]): {
  elements: ExcalidrawElement[]
  appState: AppState
} {
  const localElements = api.getSceneElementsIncludingDeleted()
  const localState = api.getAppState()

  const localElementMap = arrayToMap(localElements)
  const converged = new Map<string, ExcalidrawElement>()

  remoteElements.forEach((remoteElement) => {
    if (converged.has(remoteElement.id)) return

    const localElement = localElementMap.get(remoteElement.id)
    if (shouldDiscardRemoteElement(localElement, localState, remoteElement)) {
      converged.set(localElement.id, localElement)
    } else {
      converged.set(remoteElement.id, remoteElement)
    }
  })

  // elements deleted in remote, but exist in local
  localElements
    .filter(localElement => !converged.has(localElement.id))
    .forEach(localElement => {
      // keep local elements in editing
      if (isLocalElementEditing(localElement, localState)) converged.set(localElement.id, localElement)
    })

  return {
    elements: [...converged.values()],
    appState: localState
  }
}

function arrayToMap(elements: readonly ExcalidrawElement[]): Map<string, ExcalidrawElement> {
  return elements.reduce((acc, element) => {
    acc.set(element.id, element)
    return acc
  }, new Map<string, ExcalidrawElement>())
}

function shouldDiscardRemoteElement(local: ExcalidrawElement | undefined, localState: AppState, remote: ExcalidrawElement): local is ExcalidrawElement {
  return (
    // element exist in both local and remote
    !(local == null) && (
      // element is being edited in local
      isLocalElementEditing(local, localState) ||
      // local element has latest version
      local.version > remote.version ||
      (local.version === remote.version &&
        // take low versionNonce, if version is equal
        local.versionNonce < remote.versionNonce
      )
    )
  )
}

function isLocalElementEditing(local: ExcalidrawElement, localState: AppState): boolean {
  return (
    local.id === localState.editingElement?.id ||
    local.id === localState.resizingElement?.id ||
    local.id === localState.draggingElement?.id
  )
}

function hashElementsVersion(elements: readonly ExcalidrawElement[]): number {
  let hash = 5381
  elements.forEach((element) => {
    hash = (hash << 5) + hash + element.versionNonce
  })
  return hash >>> 0
}

