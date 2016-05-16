var emailConfig = {
	smtpConfig: {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // use SSL
		auth: {
			user: 'maginationtest@gmail.com',
			pass: 'magination'
		}
	}
};

module.exports = emailConfig;
