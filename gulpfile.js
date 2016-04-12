var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var mocha = require('gulp-mocha');
var eslint = require('gulp-eslint');
var runsequence = require('run-sequence');

gulp.task('server', function () {
   nodemon({
    script: './server/server.js'
  , env: { 'NODE_ENV': 'development' }
  }).on('start', ['test'])
});

gulp.task('lint', function () {
	return gulp.src('./**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('test', function(done) {
    return gulp.src('./test/test.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('default', ['lint'], function(){
	runsequence('server');
});