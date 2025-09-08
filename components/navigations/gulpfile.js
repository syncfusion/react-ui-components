var gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const glob = require('glob');
const fs = (global.fs = global.fs || require("fs"));

/**
 * Compile ts files
 */
gulp.task('scripts', function(done) {
    var ts = require('gulp-typescript');
    var tsProject = ts.createProject('./tsconfig.json', { 
        typescript: require('typescript'),
        declaration: true 
    });
    var tsResult = gulp.src(['./src/**/*.ts','./src/**/*.tsx', '!./node_modules/**/*.ts','!./node_modules/**/*.tsx'], { base: '.' })
        .pipe(tsProject());
    tsResult.js.pipe(gulp.dest('./'))
        .on('end', function() {
            tsResult.dts.pipe(gulp.dest('./'))
                .on('end', function() {
                    done();
                });
        });
});

/**
 * Compile styles
 */
let isCompiled = true;
gulp.task('styles', function (done) {
  var styles = './styles/**/*.scss';
  return gulp.src(styles, { base: './' })
      .pipe(sass({
          outputStyle: 'expanded',
          includePaths: "./node_modules/@syncfusion/"
      }).on('error', function (error) {
          isCompiled = false;
          console.log(error);
          this.emit('end');
      }))
      .pipe(gulp.dest('.'))
      .on('end', function () {
          if (!isCompiled) {
              process.exit(1);
          }
          done();
      });
});

/** 
* Remove css variables for CSS files
*/
gulp.task('remove-css', function (done) {
    var getCss = glob.sync('./styles/**/*.css');
    for (var i = 0; i < getCss.length; i++) {
        var cssContent = fs.readFileSync(getCss[i], 'utf8');
        cssContent = cssContent.replace(/(:root\s*{[^}]*})|(\:root, .sf-light-mode\s*{[^}]*})|(\.sf-dark-mode\s*{[^}]*})/g, '');
        cssContent = cssContent.replace(/^\s*[\r\n]/gm, '');
        fs.writeFileSync(getCss[i], cssContent, 'utf8');
    }
    done();
});

/**
 * Build ts and scss files
 */
gulp.task('build', gulp.series('scripts', 'styles', 'remove-css'));

