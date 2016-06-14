var gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    cssnano = require('gulp-cssnano'),
    kss = require('kss'),
    scsslint = require('gulp-scss-lint'),
    autoprefixer = require('gulp-autoprefixer'),
    gitVersion = require('gulp-gitversion')
    ;

var paths = {
    scssDir: './assets/sass/**/*.scss',
    scss: './assets/sass/style.scss',
    output: './build/'
};

var options = {
  autoprefixer: {
    browsers: ['last 2 versions']
  }
};

gulp.task('lint', function () {
    return gulp.src(['./assets/sass/**/*.scss', '!./assets/sass/vendor/**/*.scss'])
        .pipe(scsslint({
            'config': '.scss-lint.yml',
            'reporterOutputFormat': 'Checkstyle',
            'filePipeOutput': 'scssReport.xml'
        }))
        .pipe(gulp.dest(
            (typeof process.env.CIRCLE_TEST_REPORTS != 'undefined') ?
                process.env.CIRCLE_TEST_REPORTS : paths.output))
        .pipe(scsslint.failReporter('E'))
});

gulp.task('styles', function () {
    return gulp.src(paths.scss)
        .pipe(autoprefixer())
        .pipe(sass().on('error', sass.logError))
        .pipe(gitVersion())
        .pipe(gulp.dest(paths.output));
});

gulp.task('styles.min', function () {
    return gulp.src(paths.scss)
        .pipe(autoprefixer())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssnano())
        .pipe(gitVersion())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.output));
});
gulp.task('examples', function () {
    return gulp.src('examples/*')
        .pipe(gulp.dest(paths.output));
});
gulp.task('nginx', function () {
    return gulp.src('nginx.conf')
        .pipe(gulp.dest(paths.output));
});
gulp.task('htmlvalidate', function () {
    validator = require('gulp-html')
    return gulp.src(['build/*.html','build/**/*.html'])
        .pipe(validator({'verbose':true}));
});
gulp.task('styleguide', function () {
    return kss({
        source: 'assets/sass',
        css: '../style.css',
        destination: paths.output+'/kss',
        homepage: '../../README.md',
        builder: 'kss-builder'
    });
});

gulp.task('default', function () {
    gulp.start('styles');
});

gulp.task('build', function () {
    gulp.start(['lint', 'styles', 'examples', 'styleguide']);
});

gulp.task('build.prod', function () {
    gulp.start(['lint', 'nginx', 'styles', 'styles.min', 'examples', 'styleguide', 'htmlvalidate']);
});

gulp.task('watch', function () {
    gulp.watch(paths.scssDir, ['styles']);
});

gulp.task('watch.build', function () {
    gulp.watch(paths.scssDir, ['build']);
});
