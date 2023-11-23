require('dotenv').config();

const mongoose = require('mongoose');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('DB connected');
    } catch (error) {
        console.log('DB connection error', error);
    }
};
connectDb();

//Bring in the models
require('./models/User');
require('./models/Chatroom');
require('./models/Message');

const app = require('./app');

const server = app.listen(8080, () => {
    console.log('Server is listening on port 8080');
});

const io = require('socket.io')(server, {
    allowEIO3: true,
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const jwt = require('jwt-then');

const Message = mongoose.model('Message');
const User = mongoose.model('User');

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.query.token;
        const payload = await jwt.verify(token, process.env.SECRET);
        socket.userId = payload.id;
        next();
    } catch (err) {}
});

io.on('connection', (socket) => {
    console.log('Connected: ' + socket.userId);

    socket.on('disconnect', () => {
        console.log('Disconnected: ' + socket.userId);
    });

    socket.on('joinRoom', ({ chatroomId }) => {
        socket.join(chatroomId);
        console.log('A user joined chatroom: ' + chatroomId);
    });

    socket.on('leaveRoom', ({ chatroomId }) => {
        socket.leave(chatroomId);
        console.log('A user left chatroom: ' + chatroomId);
    });

    socket.on('chatroomMessage', async ({ chatroomId, message }) => {
        if (message.trim().length > 0) {
            const user = await User.findOne({ _id: socket.userId });
            const newMessage = new Message({
                chatroom: chatroomId,
                user: socket.userId,
                message,
            });
            io.to(chatroomId).emit('newMessage', {
                message,
                name: user.name,
                userId: socket.userId,
            });
            await newMessage.save();
        }
    });
});
