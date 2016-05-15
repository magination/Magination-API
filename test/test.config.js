var User = require('../server/models/user/user.model');

var testconfig = {
	USER_TESTUSER:
	{
		username: 'admin',
		username_lower: 'admin',
		email: 'testuser@test.test',
		password: 'admin',
		isConfirmed: true,
		privileges: User.privileges.ADMINISRATOR
	},
	USER_TESTUSER_LOGINDATA: {
		username: 'admin',
		password: 'admin'
	},
	USER_TESTUSER2:
	{
		username: 'admin2',
		username_lower: 'admin2',
		email: 'test2test2@test2.com',
		password: 'admin',
		isConfirmed: true
	},
	USER_VALID:
	{
		username: 'test',
		email: 'test@test.test',
		password: 'test1234'
	},
	USER_INVALID:
	{
		username: 'test',
		password: 'test'
	}
};
module.exports = testconfig;
