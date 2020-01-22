const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnectionsNewDev, findConnectionsNewDevAround, sendMessageNewDev, sendMessageNewDevAround } = require('../websocket');

module.exports = {
    async store(request, response) {
        const { github_username, techs, longitude, latitude } = request.body;
    
        let dev = await Dev.findOne({ github_username });

        if(!dev) {
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

            let { name, login, avatar_url, bio } = apiResponse.data;

            const techsArray = parseStringAsArray(techs);
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };

            dev = await Dev.create({
                name: name || login,
                github_username,
                avatar_url,
                bio,
                techs: techsArray,
                location
            });

            const sendSocketMessageToNewDevAround = findConnectionsNewDevAround({ longitude, latitude }, techsArray);

            sendMessageNewDevAround(sendSocketMessageToNewDevAround, 'new-dev-around', dev);
            sendMessageNewDev(dev);
        }
    
        return response.json(dev);
    },

    async index(request, response) {
        const devs = await Dev.find();

        return response.json(devs);
    }
}