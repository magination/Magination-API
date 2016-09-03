var path = require('path');
var server = {
	PORT: 8000,
	SECRET: process.env.SECRET,
	IP: '127.0.0.1',
	ADDRESS: 'https://localhost:',
	MAX_CONTENT_LENGTH_ACCEPTED: 999999999,
	LOCAL_ROOT_IMAGE_PATH: path.join(__dirname, '../../public/img'),
	ABSOLUTE_IMAGE_PATH_ROOT: 'https://api.maginationgame.com/public/img/upload/',
	REMOTE_GAME_SITE: 'https://game.maginationgame.com'
};

module.exports = server;
