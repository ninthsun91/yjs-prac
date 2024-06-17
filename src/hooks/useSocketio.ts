import { useCallback, useEffect, useRef, useState } from 'react'
import { Socket, io } from 'socket.io-client'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const CONNECTION_URL = 'https://e8f4092340f1.ngrok.app'

interface UseSocketio {
  isConnected: boolean
  fetchData: () => Promise<{ elements: ExcalidrawElement[] }>
  listenFetchData: (cb: () => Promise<{ elements: ExcalidrawElement[] }>) => void
  listenSync: (api: ExcalidrawImperativeAPI) => void
  update: (elements: readonly ExcalidrawElement[]) => void
}

export const useSocketio = (projectId: string): UseSocketio => {
  const lastHashVersion = useRef<number>(-1)

  const [socket, setSocket] = useState<Socket>()
  const [isConnected, setIsConnected] = useState<boolean>(false)

  const update = useCallback((elements: readonly ExcalidrawElement[]): void => {
    if (socket == null) return

    const hashVersion = hashElementsVersion(elements)
    console.log('hash version ', elements, hashVersion)
    if (hashVersion === lastHashVersion.current) return

    socket.emit('update', encodeData({ elements }))
    lastHashVersion.current = hashVersion
    // setLastHashVersion(hashVersion)
  }, [socket])

  const listenSync = useCallback((api: ExcalidrawImperativeAPI): void => {
    socket?.on('sync', (buffer: ArrayBuffer) => {
      const remoteData = decodeData(buffer)
      const { elements, appState } = reconcileData(api, remoteData.elements)
      api.updateScene({ elements, appState })
    })
  }, [socket])

  const listenFetchData = useCallback((cb: () => Promise<{ elements: ExcalidrawElement[] }>): void => {
    socket?.on('fetch-data', async (callback) => {
      const { elements } = await cb()
      callback({ elements })
    })
  }, [socket])

  const fetchData = useCallback(async (): Promise<{ elements: ExcalidrawElement[] }> => {
    if (socket == null) throw new Error()

    const size = await socket.emitWithAck('room-size')
    if (size === 0) throw new Error()

    if (size === 1) {
      console.log('should fetch data from server')
      return {
        elements: []
      }
    } else {
      console.log('should fetch data from peers')
      const data = await socket.emitWithAck('fetch-data')
      return data
    }
  }, [socket])

  useEffect(() => {
    const socket = io(CONNECTION_URL, {
      auth: {
        token: 'auth token'
      },
      query: { projectId },
      withCredentials: true,
      autoConnect: true
    })
    socket.on('connect', async () => {
      console.log('socket.io connected', socket.id)
      setIsConnected(true)
    })
    setSocket(socket)

    return () => {
      if (socket.connected) {
        socket.disconnect()
        console.log('socket.io disconnected', socket.id, socket.disconnected)
        setIsConnected(false)
      }
    }
  }, [projectId])

  return {
    isConnected,
    fetchData,
    listenFetchData,
    listenSync,
    update
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
