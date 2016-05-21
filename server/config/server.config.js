var path = require('path');
var server = {
	PORT: 8000,
	IP: '127.0.0.1',
	ADDRESS: 'https://localhost:',
	SECRET: 'topSecret', // Server secret for signing jwt-tokens. This should be a 128 bit password in production, pref. randomly generated.
	MAX_CONTENT_LENGTH_ACCEPTED: 999999999,
	LOCAL_ROOT_IMAGE_PATH: path.join(__dirname, '../../public/img'),
	ABSOLUTE_IMAGE_PATH_ROOT: 'https://localhost:8000/public/img/upload/',
	REMOTE_GAME_SITE: 'https://localhost:8080'
};

module.exports = server;
