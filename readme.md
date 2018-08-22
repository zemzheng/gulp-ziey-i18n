# gulp-ziey-i18n

[![Build Status](https://travis-ci.org/zemzheng/gulp-ziey-i18n.svg?branch=master)](https://travis-ci.org/zemzheng/gulp-ziey-i18n)

[![NPM version](https://img.shields.io/npm/v/gulp-ziey-i18n.svg)](https://nodei.co/npm/gulp-ziey-i18n)

[![NPM](https://nodei.co/npm/gulp-ziey-i18n.png)](https://nodei.co/npm/gulp-ziey-i18n/)

## usage

```javascript
    // gulp config
    // options
    //      .template    
    //          .options       : template 设置
    //              .openTag   : '{{', 默认值
    //              .closeTag  : '}}', 默认值
    //      .po                : po 文件内容
    //      .lang              : po 文件的语言标识
    //      .path              : po 文件路径，设置了路径会覆盖 po 的设置
    //      .keep_no_reference : 是否保留不再引用的词条，默认为 false
    //      .disableShowError  : 是否不显示错误信息
    //      .encodeSlash       : 编码分隔符如 ##
    //      .encodeCustom      : 自定义编码输出方式

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

    // in src/a.js
    console.log('{{ a }}');             // ==> console.log('a');

    // use encodeSlash 特殊编码分隔符
    console.log("{{ json ## "hey!"}}"); // ==> console.log("\"hey!\"");

    // use encodeCustom 自定义编码方式
    // 配置时：
        // ...
            .pipe( 
                i18n({
                    lang : 'en_US',
                    path : 'en_US.po',
                    encodeCustom: {
                        wrap : str => `wrap(${str})`,
                    }
                })
            )
        // ...

    // 效果:
    console.log("{{ wrap ## "hey!"}}"); // ==> console.log(wrap("hey!"));
    
```

## dependencies

* [ziey-gettext](https://github.com/zemzheng/ziey-gettext)
* [ziey-utils](https://github.com/zemzheng/ziey-gettext)
