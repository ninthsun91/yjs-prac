import { Server } from 'socket.io'

import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types/types';

type ProjectID = string;
interface WhiteboardData {
  elements: ExcalidrawElement[];
  files: BinaryFiles;
}

class DB {
  constructor(
    private readonly db: Map<ProjectID, WhiteboardData>,
  ) {}

  public get(roomID: ProjectID): WhiteboardData {
    const data = this.db.get(roomID);
    if (data) return data;

    const newData: WhiteboardData = {
      elements: [],
      files: {},
    };
    this.db.set(roomID, newData);
    return newData;
  }
}

const io = new Server({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  }
})

const db = new DB(new Map());

io.on('connection', (socket) => {
  // Join room with projectID
  // and send whiteboard data back to client
  const { projectId } = socket.handshake.query;
  if (typeof projectId !== 'string') {
    console.log('disconnecting: no projectId');
    socket.disconnect();
    return;
  }

  console.log('connection: ', socket.id);

  socket.join(projectId);

  const data = db.get(projectId);
  socket.emit('sync', encodeData(data));

  socket.on('update', (data: any) => {
    // socket.emit('sync', data);
    socket.broadcast.to(projectId).emit('sync', data);
  })
});

io.listen(3333);

function encodeData(data: WhiteboardData): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeAny(encoder, data);
  return encoding.toUint8Array(encoder);
}

function decodeData(buffer: Uint8Array): WhiteboardData {
  const decoder = decoding.createDecoder(buffer);
  return decoding.readAny(decoder);
}