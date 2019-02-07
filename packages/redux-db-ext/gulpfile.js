var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");
var del = require('del');

gulp.task('clean', function () {
	return del([
		'dist/**/*',
	]);
});

gulp.task('compress', function (cb) {
	pump([
		gulp.src('dist/redux-db-ext.js'),
		uglify(),
		rename("redux-db-ext.min.js"),
		gulp.dest("dist")
	],
		cb
	);
});
