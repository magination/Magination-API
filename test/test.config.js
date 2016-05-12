var User = require('../server/models/user/user.model');

var testconfig = {
	USER_TESTUSER:
	{
		username: 'admin',
		email: 'testuser@test.test',
		password: 'admin',
		isConfirmed: true,
		privileges: User.privileges.ADMINISRATOR
	},
	USER_TESTUSER2:
	{
		username: 'admin2',
		email: 'test2test2@test2.com',
		password: 'admin',
		isConfirmed: true
	},
	USER_VALID:
	{
		username: 'test',
		email: 'test@test.test',
		password: 'test'
	},
	USER_INVALID:
	{
		username: 'test',
		password: 'test'
	}
};
module.exports = testconfig;
