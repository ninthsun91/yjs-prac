import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export class WhiteboardSync {
  private readonly doc: Y.Doc;
  private readonly ws: WebsocketProvider;
  private readonly db: IndexeddbPersistence;

  constructor(roomId: string) {
    this.doc = new Y.Doc();
    this.ws = new WebsocketProvider('ws://localhost:1234', roomId, this.doc, { connect: false });
    this.db = new IndexeddbPersistence(roomId, this.doc);
  }

  public connect() {
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
    this.ws.disconnect();
    this.db.destroy();
  }

  public getData(roomId: string) {
    return this.doc.getMap(roomId);
  }
}