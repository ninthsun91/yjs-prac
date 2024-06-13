'use client'

import { useCallback, useEffect } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { io, Socket } from 'socket.io-client'

import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

import { useCallbackRefState } from '@/hooks/useCallbackStateRef'
import { useWindowEventListener } from '@/hooks/useWindowEventListener'

import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'

interface WhiteboardData {
  elements: readonly ExcalidrawElement[]
  files: BinaryFiles
}

const socket = io('http://localhost:3333', {
  auth: {
    token: 'auth token'
  },
  query: {
    projectId: 'project-id-1234'
  },
  withCredentials: true,
  autoConnect: false
})

export function Whiteboard2 () {
  const [excalidrawAPI, excalidrawRefCallback] = useCallbackRefState<ExcalidrawImperativeAPI>()

  const onChangeHandler = (elements: readonly ExcalidrawElement[], state: AppState, files: BinaryFiles) => { }

  useWindowEventListener('keydown', (e) => {
    if (excalidrawAPI == null) return
    const isCtrlOrCmd = e.metaKey || e.ctrlKey
    if (isCtrlOrCmd && e.code === 'KeyV') {
      setTimeout(() => {
        const files = excalidrawAPI.getFiles()
        console.log('files pasted', files)
      }, 500)
    }
  })

  useWindowEventListener('mouseup', (e) => {
    e.preventDefault()
    if (excalidrawAPI == null) return
    const elements = excalidrawAPI.getSceneElements()
    const files = excalidrawAPI.getFiles()
    console.log('update', elements)
    socket.emit('update', encodeData({ elements, files }))
  })

  const addSocketListeners = useCallback((socket: Socket) => {
    socket.on('connect', () => {
      console.log('connected to socket server', socket.id)
    })

    socket.on('sync', (buffer: ArrayBuffer) => {
      const data = decodeData(buffer)
      const { elements, appState } = reconcileData(excalidrawAPI!, data)
      excalidrawAPI!.updateScene({ elements, appState })
      if (data.files) excalidrawAPI!.addFiles(Object.values(data.files))
    })
  }, [excalidrawAPI])

  useEffect(() => {
    return () => {
      if (socket.connected) socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (excalidrawAPI == null) return

    socket.connect()
    addSocketListeners(socket)
  }, [excalidrawAPI, addSocketListeners])

  return (
    <div className='border border-red-500 h-screen'>
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        onChange={onChangeHandler}
      />
    </div>
  )
}

function decodeData (data: ArrayBuffer): WhiteboardData {
  const decoder = decoding.createDecoder(new Uint8Array(data))
  return decoding.readAny(decoder)
}

function encodeData (data: WhiteboardData): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeAny(encoder, data)
  return encoding.toUint8Array(encoder)
}

function reconcileData (api: ExcalidrawImperativeAPI, remoteData: WhiteboardData) {
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

function arrayToMap (elements: readonly ExcalidrawElement[]): Map<string, ExcalidrawElement> {
  return elements.reduce((acc, element) => {
    acc.set(element.id, element)
    return acc
  }, new Map<string, ExcalidrawElement>())
}

function convergeElements (local: ExcalidrawElement, remote: ExcalidrawElement): ExcalidrawElement {
  if (local.version > remote.version) return local
  if (remote.version > local.version) return remote
  if (local.versionNonce <= remote.versionNonce) return local
  return remote
}
