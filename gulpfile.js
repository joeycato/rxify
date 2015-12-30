var gulp = require('gulp'),
    mocha = require('gulp-mocha');
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel');

var path = require('path');
var paths = {
    es6: ['es6/**/*.js'],
    es5: 'es5',
    // Must be absolute or relative to source map
    sourceRoot: path.join(__dirname, 'es6'),
};

gulp.task('test', function() {
    gulp.src('test/**/*.js')
        .pipe(mocha({
            reporter: 'nyan',
            clearRequireCache: true,
            ignoreLeaks: true
        }));
});

// Run all unit tests in debug mode
// To use: gulp test-debug
gulp.task('test-debug', function () {
var spawn = require('child_process').spawn;
spawn('node', [
  '--debug-brk',
  path.join(__dirname, 'node_modules/gulp/bin/gulp.js'),
  'test'
], { stdio: 'inherit' });
});

gulp.task('demos', function() {
    var demo = require('./demos/index.js');
    demo.run();
});

gulp.task('demos-debug', function () {
var path = require('path');
var spawn = require('child_process').spawn;
spawn('node', [
  '--debug-brk',
  path.join(__dirname, 'node_modules/gulp/bin/gulp.js'),
  'demos'
], { stdio: 'inherit' });
});

gulp.task('babel', function () { // (A)
    return gulp.src(paths.es6)
        .pipe(sourcemaps.init()) // (B)
        .pipe(babel())
        .pipe(sourcemaps.write('.', // (C)
            { sourceRoot: paths.sourceRoot }))
        .pipe(gulp.dest(paths.es5));
    });
    gulp.task('watch', function() { // (D)
        gulp.watch(paths.es6, ['babel', 'test']);
    });

// Default task
gulp.task('default', ['babel', 'test']);
