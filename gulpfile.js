var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var mocha = require('gulp-mocha');
var runSequence = require('run-sequence');


/*
TODO: Setup environments for development and production. 
 */

gulp.task('server', function () {
   nodemon({
    script: './server/server.js'
  , env: { 'NODE_ENV': 'development' }
  }).on('start', ['test'])
});

	
gulp.task('test', function(done) {
    return gulp.src('./test/test.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({reporter: 'nyan'}));
});


gulp.task('default', function(){
	runSequence('server');
});