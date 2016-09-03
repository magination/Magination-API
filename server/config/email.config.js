var emailConfig = {
	smtpConfig: {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true, // use SSL
		auth: {
			user: 'maginationgame@gmail.com',
			pass: process.env.EMAILPASS
		}
	}
};

module.exports = emailConfig;
