var User = require('../../../server/models/user/user.model');
var Report = require('../../../server/models/report/report.model');
var testconfig = require('../../test.config');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentReport = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save(done);
});

after(function (done) {
	clearDB(done);
});

it('saves a report', function (done) {
	currentReport = new Report({id: currentUser._id, type: Report.types.USER, reportText: 'spam', owner: currentUser._id});
	currentReport.save(done);
});

it('finds a report by id', function (done) {
	Report.findById(currentReport._id, function (err, report) {
		if (err) return done(err);
		report.should.not.be.empty;
		done();
	});
});

it('removes a report by id', function (done) {
	Report.remove({_id: currentReport._id}, function (err) {
		if (err) throw err;
		done();
	});
});

it('does not find a report with non-existant id', function (done) {
	Report.findById(currentReport._id, function (err, report) {
		if (err) return done(err);
		assert.isNull(report);
		done();
	});
});
