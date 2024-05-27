import { Server } from 'socket.io'

const io = new Server()

io.on('connection', (socket) => {
  console.log('connection: ', socket.id)
})

io.listen(3000)
