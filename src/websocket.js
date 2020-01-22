const socketio = require('socket.io');
const parseStringAsArray = require('./utils/parseStringAsArray');
const calculateDistance = require('./utils/calculateDistance');

let io;
const mobileConnections = [];
const webConnections = [];

exports.setupWebSocket = server => {
    io = socketio(server);

    io.on('connection', socket => {
        const { isWeb, longitude, latitude, techs } = socket.handshake.query;

        if(isWeb) {
            webConnections.push({ id: socket.id });
            console.log(webConnections);
        } else {
            mobileConnections.push({
                id: socket.id,
                coordinates: {
                    longitude: Number(longitude),
                    latitude: Number(latitude)
                },
                techs: parseStringAsArray(techs)
            });
        }
        
        socket.on('disconnect', () => {
            const socketIdWeb = webConnections.indexOf(socket.id);
            webConnections.splice(socketIdWeb, 1);

            const socketIdMobile = mobileConnections.indexOf(socket.id);
            webConnections.splice(socketIdMobile, 1);
        });
    });
};

exports.findConnectionsNewDevAround = (coordinates, techs) => {
    return mobileConnections.filter(connection => {
        return calculateDistance(coordinates, connection.coordinates) < 10
            && mobileConnections.techs.some(item => techs.includes(item))
    })
};

exports.sendMessageNewDevAround = (to, message, data) => {
    to.forEach(connection => {
        io.to(connection.id).emit(message, data);
    });
}

exports.sendMessageNewDev = (data) => {
    //enviar para todos clientes web => não enviar para clientes mobile
    webConnections.forEach( connection => {
        io.to(connection.id).emit('new-dev', data);
    });
}