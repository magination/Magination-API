


var User = require('../models/user/user.model');
//Email config for the email-confirmation middleware. 
var emailConfig = 
	{
    verificationURL: 'http://localhost.com/confirmation/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'magination_tempusers',
 
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'maginationtest@gmail.com',
            pass: 'magination'
        }
    },
    verifyMailOptions: {
        from: 'Do Not Reply <maginationtest@gmail.com>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
};

module.exports = emailConfig;