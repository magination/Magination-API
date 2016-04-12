var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var url = serverconfig.ADRESS + serverconfig.PORT;

it('GET /api/games - should return availiable games', function (done) {
	request(url)
	.get('/api/games')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) {
			throw err;
		}
		done();
	});
});
