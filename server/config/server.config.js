var path = require('path');
var server = {
	PORT: 8000,
	ADDRESS: 'https://localhost:',
	SECRET: 'topSecret',
	MAX_CONTENT_LENGTH_ACCEPTED: 999999999,
	LOCAL_ROOT_IMAGE_PATH: path.join(__dirname, '../../public/img'),
	ABSOLUTE_IMAGE_PATH_ROOT: 'https://localhost:8000/public/img/upload/',
	REMOTE_GAME_SITE: 'https://localhost:8080'
};

module.exports = server;
