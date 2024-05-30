import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export class WhiteboardSync {
  private static instance: WhiteboardSync;

  private declare doc: Y.Doc;
  private declare ws: WebsocketProvider;
  private declare db: IndexeddbPersistence;

  static getInstance(): WhiteboardSync {
    if (!WhiteboardSync.instance) {
      WhiteboardSync.instance = new WhiteboardSync();
    }
    return WhiteboardSync.instance;
  }

  public connect(roomId: string) {
    this.disconnect();

    this.doc = new Y.Doc();
    this.ws = new WebsocketProvider('ws://localhost:1234', roomId, this.doc, { connect: false });
    this.db = new IndexeddbPersistence(roomId, this.doc);

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

  public disconnect() {
    this.ws?.disconnect();
    this.db?.destroy();
  }

  public getData(roomId: string) {
    return this.doc.getMap(roomId);
  }
}
