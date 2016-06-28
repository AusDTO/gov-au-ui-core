'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    cssnano = require('gulp-cssnano'),
    kss = require('kss'),
    sassLint = require('gulp-sass-lint'),
    autoprefixer = require('gulp-autoprefixer'),
    gitVersion = require('gulp-gitversion'),
    scssMerge = require('./lib/gulp-scss-merge.js'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    runSequence = require('run-sequence')
    ;

var paths = {
    assetsDir: './assets/**/*.*',
    scssDir: './assets/sass/**/*.scss',
    kssScssDir: './kss-builder/kss-assets/*.scss',
    kssCssDir: './kss-builder/kss-assets',
    examplesDir: './examples/**/*.*',
    kssBuilderDir: './kss-builder/**/*.*',
    scss: './assets/sass/ui-kit.scss',
    js: './assets/js/ui-kit.js',
    markdown: './*.md',
    readme: './README.md',
    outputAssets: './build/latest',
    outputHTML: './build'
};

var options = {
    autoprefixer: {
        browsers: ['last 2 versions']
    }
};

gulp.task('lint', function () {
    return gulp.src([paths.scssDir, paths.kssScssDir, '!./assets/sass/vendor/**/*.scss'])
        .pipe(sassLint({
          configFile: '.sass-lint.yml'
        }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
});

gulp.task('ui-kit', function () {
    gulp.start(['ui-kit.scss', 'ui-kit.js']);
});

gulp.task('ui-kit.scss', function () {
    return gulp.src(paths.scss)
        .pipe(autoprefixer(options.autoprefixer))
        .pipe(sass().on('error', sass.logError))
        .pipe(gitVersion())
        .pipe(gulp.dest(paths.outputAssets));
});

gulp.task('ui-kit.js', function () {
    return gulp.src(paths.js)
        .pipe(gitVersion())
        .pipe(gulp.dest(paths.outputAssets));
});

gulp.task('ui-kit.scssmerge', function () {
    return gulp.src(paths.scss)
        .pipe(scssMerge('_ui-kit.scss'))
        .pipe(gulp.dest(paths.outputAssets));
});

gulp.task('ui-kit.min', function () {
    gulp.start(['ui-kit.min.scss', 'ui-kit.min.js']);
});

gulp.task('ui-kit.min.scss', function () {
    return gulp.src(paths.scss)
        .pipe(autoprefixer(options.autoprefixer))
        .pipe(sass().on('error', sass.logError))
        .pipe(cssnano())
        .pipe(gitVersion())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.outputAssets));
});

gulp.task('ui-kit.min.js', function () {
    return gulp.src(paths.js)
        .pipe(uglify())
        .pipe(gitVersion())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.outputAssets));
});

gulp.task('examples', function () {
    return gulp.src(paths.examplesDir)
        .pipe(gulp.dest(paths.outputHTML+'/examples'));
});

gulp.task('markdown', function () {
    return gulp.src(paths.markdown)
        .pipe(gulp.dest(paths.outputHTML));
});

gulp.task('nginx', function () {
    return gulp.src('nginx.conf')
        .pipe(gulp.dest(paths.outputHTML));
});

gulp.task('htmlvalidate', ['examples','styleguide'], function (cb) {
    try {
        var validator = require('gulp-html');
        return gulp.src(['build/*.html', 'build/**/*.html'])
            .pipe(validator({'verbose': true}));
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('WARNING: optional HTML validator not installed, to resolve run:');
            console.log('> npm install AusDTO/gulp-html');
            return cb;
        }
        else {
            throw err;
        }
    }
});

gulp.task('styleguide', ['styleguide.scss'], function () {
    return kss({
        source: 'assets/sass',
        destination: paths.outputHTML,
        homepage: '../../README.md',
        builder: 'kss-builder'
    });
});

gulp.task('styleguide.scss', function () {
    return gulp.src(paths.kssScssDir)
        .pipe(autoprefixer(options.autoprefixer))
        .pipe(sass().on('error', sass.logError))
        .pipe(gitVersion())
        .pipe(gulp.dest(paths.kssCssDir));
});

gulp.task('clean', function(done) {
    return del([paths.outputAssets,paths.outputHTML], done);
});

gulp.task('default', ['ui-kit']);

gulp.task('build', ['lint', 'ui-kit', 'markdown',  'examples', 'styleguide']);

gulp.task('build.prod', function(callback) {
    runSequence('clean',
        ['lint', 'nginx', 'ui-kit', 'ui-kit.min', 'ui-kit.scssmerge', 'markdown', 'htmlvalidate'],
        callback);
});

gulp.task('watch', function () {
    gulp.watch([paths.assetsDir, paths.examplesDir, paths.readme], ['ui-kit']);
});

gulp.task('watch.build', function () {
    gulp.watch([paths.assetsDir, paths.examplesDir, paths.kssBuilderDir, paths.readme], ['build']);
});
