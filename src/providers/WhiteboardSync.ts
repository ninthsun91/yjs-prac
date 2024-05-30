import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

import type { BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export class WhiteboardSync {
  private static instance: WhiteboardSync;

  private declare doc: Y.Doc;
  private declare ws: WebsocketProvider;
  private declare db: IndexeddbPersistence;

  private declare roomId: string;
  private declare api: ExcalidrawImperativeAPI;

  static getInstance(): WhiteboardSync {
    if (!WhiteboardSync.instance) {
      WhiteboardSync.instance = new WhiteboardSync();
    }
    return WhiteboardSync.instance;
  }

  /** 
   * @description Should be called before using any other methods
   * @param api excalidraw api
   * @param roomId project id
  */
  public connect(api: ExcalidrawImperativeAPI, roomId: string) {
    this.disconnect();

    this.doc = new Y.Doc();
    this.ws = new WebsocketProvider('ws://localhost:1234', roomId, this.doc, { connect: false });
    this.db = new IndexeddbPersistence(roomId, this.doc);

    this.roomId = roomId;
    this.api = api;

    this.ws.connect();
    return new Promise<void>((resolve) => {
      this.ws.on('status', (event: any) => {
        if (event.status === 'connected') {
          console.log('connected', this.ws.roomname, event.status);
          resolve();
        }
      });
    });
  }

  /**
   * @description
   * Disconnect opened connections. Call it when the component is unmounted.
   */
  public disconnect() {
    this.ws?.disconnect();
    this.db?.destroy();
  }
  
  /**
   * @description 
   * Listen to changes in the whiteboard. It will also load initial data.
   */
  public listen() {
    const map = this.doc.getMap(this.roomId);
    map.observe((event) => {
      console.log('observe', event, map);
      if (event.keysChanged.has('elements')) {
        const elements = map.get('elements') as ExcalidrawElement[];
        this.api.updateScene({ elements });
      }
      if (event.keysChanged.has('files')) {
        const files = map.get('files') as BinaryFiles;
        this.api.addFiles(Object.values(files));
      }
    });
  }

  /**
   * @description
   * Update changes. Changes will be broadcasted to all connected users.
   */
  public update() {
    const map = this.doc.getMap(this.roomId);
    const elements = this.api.getSceneElements();
    const files = this.api.getFiles();
    map.set('elements', elements);
    map.set('files', files);
  }
}
