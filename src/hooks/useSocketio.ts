import { useEffect, useState } from 'react'
import { Socket, io } from 'socket.io-client'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

const CONNECTION_URL = 'http://localhost:3333'

interface WhiteboardData {
  elements: readonly ExcalidrawElement[]
}

export const useSocketio = (projectId: string) => {
  const [socket, setSocket] = useState<Socket>(null!)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [lastHashVersion, setLastHashVersion] = useState<number>(-1)

  const update = (elements: readonly ExcalidrawElement[]) => {
    const hashVersion = hashElementsVersion(elements)
    console.log('hash version ', elements, hashVersion);
    if (hashVersion === lastHashVersion) return

    socket.emit('update', encodeData({ elements }))
    setLastHashVersion(hashVersion)
  }

  const listenSync = (api: ExcalidrawImperativeAPI) => {
    socket.on('sync', (buffer: ArrayBuffer) => {
      const data = decodeData(buffer)
      const { elements, appState } = reconcileData(api, data)
      api.updateScene({ elements, appState })
    })
  }

  useEffect(() => {
    const socket = io(CONNECTION_URL, {
      auth: {
        token: 'auth token'
      },
      query: { projectId },
      withCredentials: true,
      autoConnect: true
    })
    socket.on('connect', () => {
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
    update,
    listenSync,
    isConnected
  }
}

function decodeData(data: ArrayBuffer): WhiteboardData {
  const decoder = decoding.createDecoder(new Uint8Array(data))
  return decoding.readAny(decoder)
}

function encodeData(data: WhiteboardData): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder)
}

function reconcileData(api: ExcalidrawImperativeAPI, remoteData: WhiteboardData) {
  const localData = api.getSceneElementsIncludingDeleted()
  const localState = api.getAppState()

  const localElementMap = arrayToMap(localData)
  remoteData.elements.forEach((element) => {
    if (localElementMap.has(element.id)) {
      const localElement = localElementMap.get(element.id)!
      localElementMap.set(element.id, convergeElements(localElement, element))
    } else {
      localElementMap.set(element.id, element)
    }
  })

  const reconciledElements = [...localElementMap.values()]

  return {
    elements: reconciledElements,
    appState: localState
  }
}

function arrayToMap(elements: readonly ExcalidrawElement[]): Map<string, ExcalidrawElement> {
  return elements.reduce((acc, element) => {
    acc.set(element.id, element)
    return acc
  }, new Map<string, ExcalidrawElement>())
}

function convergeElements(local: ExcalidrawElement, remote: ExcalidrawElement): ExcalidrawElement {
  if (local.version > remote.version) return local
  if (remote.version > local.version) return remote
  if (local.versionNonce <= remote.versionNonce) return local
  return remote
}

function hashElementsVersion(elements: readonly ExcalidrawElement[]): number {
  let hash = 5381
  elements.forEach((element) => {
    hash = (hash << 5) + hash + element.versionNonce
  })
  return hash >>> 0
}
