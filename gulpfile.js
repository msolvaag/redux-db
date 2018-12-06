var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");

gulp.task('compress', function (cb) {
	pump([
		gulp.src('dist/redux-db.js'),
		uglify(),
		rename("redux-db.min.js"),
		gulp.dest("dist")
	],
		cb
	);
});

gulp.task('typings', function (cb) {
	pump([
		gulp.src('src/types.ts'),
		gulp.dest("dist")
	],
		cb
	);
});