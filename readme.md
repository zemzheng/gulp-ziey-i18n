# gulp-ziey-i18n

[![Build Status](https://travis-ci.org/zemzheng/gulp-ziey-i18n.svg?branch=master)](https://travis-ci.org/zemzheng/gulp-ziey-i18n)
[![NPM version][npm-image]][npm-url] 

[![NPM][nodei-image]][nodei-url]

## usage

    // options
    //      .template    
    //          .options : template 设置
    //      .po          : po 文件内容
    //      .lang        : po 文件的语言标识
    //      .path        : po 文件路径
    //  * 1.先尝试读取 path 的文件内容
    //  * 2.不存在 path 则使用 po 的文本内容
    //  * 3 po 为空使用空字符串
    var gulp = require('gulp');
    var i18n = require('../gulp-ziey-i18n/index.js');

    gulp.task('default', function(cb){
        gulp.src( 'src/*' )
            .pipe( 
                i18n({
                    lang : 'en_US',
                    path : 'en_US.po'
                })
            )
            .pipe(
                gulp.dest( 'dest' ) 
            );
    });

## dependencies

* [ziey-gettext](https://github.com/zemzheng/ziey-gettext)
* [ziey-utils](https://github.com/zemzheng/ziey-gettext)
