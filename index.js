var Buffer = require( 'buffer' ).Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

require('./string.extends.js');
var gettext  = require('./gettext.js');
var templateFactory = require('./art-template-factory.js');
var through  = require('through');

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-ziey-i18n';

module.exports = function( options ){
    // options
    //      .template    
    //          .options : template 设置
    //          .helpers : template 辅助函数
    //      .po          : po 文件内容
    //      .lang        : po 文件的语言标识
    //      .path        : po 文件路径

    var isDebug = options.debug;
    // ignore 设置
    // var ifIgnore = function( path ){
    //     var list = ifIgnore._list,
    //         ii = list.length;
    //     while( ii-- ){
    //         if( list[ ii ].test( path ) ){
    //             return true;
    //         }
    //     }
    // }
    // ifIgnore._list = options.ignores || [];
    var template = templateFactory( options.lang );
    if( fs.existsSync( options.path ) ){
        options.po = fs.readFileSync( options.path, 'utf-8' ) || options.po || '';
    }

    // template 设置
    var key, o;
    o = options && options.template && options.template.options || {};
    for( key in o ){
        template[ key ] = options.template.options[ key ];
    }
    o = options && options.template && options.template.helpers || {};
    for( key in o ){
        template.helper( key, options.template.helpers[ key ] );
    }
    template.onerror = function( e ){
        this.emit( 'error', new PluginError( PLUGIN_NAME, e ) );
    }

    // i18n 设置
    var poDict = template.poDict;
    if( !poDict ){
        // 每一个语言解析器挂一个版本的字典汇集
        poDict = template.poDict = {};
    }
    gettext.handlePoTxt( options.lang, options.po );

    template.helper( '_', function( str ){
        var outstr = gettext._( str, 1 );
        poDict[ str ] = outstr || '';
        return outstr || str;
    } );

    var getTmplErrorFuncByFile = function( path ){
        return function( e ){
            gutil.log( 
                gutil.colors.bgRed( 
                    'Template Error : %s : %s'.sprintf( path, e.name ) 
                ) 
            );
        }
    };

    return through(
        function( file ) {
            if (file.isNull()) {
                // nothing
            } else if (file.isStream()) {
                
                this.emit( 'error',
                    new PluginError( PLUGIN_NAME, 'Streaming not supported' )
                );
            } else {
                // if( ifIgnore( file.path ) ){
                //     isDebug && gutil.log(
                //         gutil.colors.bgBlue( 'Ignore : %s'.sprintf( file.path ) )
                //     );
                // } else {
                var contents = file.contents.toString();
                 gutil.log( 
                    'I18n Input : ',
                    gutil.colors.yellow( file.path || contents )
                 );
                 gettext.setLang( options.lang );
                 template.onerror = getTmplErrorFuncByFile( file.path );
                 file.contents = new Buffer(
                     template.compile( contents )(0)
                 );
                // }
            }
            this.emit( 'data', file )
        }, 
        function(){
            var poDict0 = gettext.getDictByLang( options.lang );
            if( !options.clean_po ){
                for( msgid in poDict0 ){
                    if( !poDict[ msgid ] ){
                        poDict[ msgid ] = poDict0[ msgid ];
                    }
                }
            }
            var poTxt = gettext.obj2po( poDict ),
                b = __dirname, 
                p = path.join( b, options.lang + '.po' );
            if( options.path ){
                b = path.dirname( options.path );
                p = options.path;
            }

            if( options.path ){
                fs.writeFile( options.path, poTxt, function( err ){
                    if( err ){
                        return gutil.log(
                            gutil.colors.bgRed(
                                'Update %s Failure'.sprintf( options.path )
                            )
                        );
                    }
                    gutil.log(
                        gutil.colors.yellow(
                            'Update Po %s'.sprintf( options.path )
                        )
                    );
                } );
            } else {
                var poOut = new gutil.File({
                    base     : b,
                    path     : p,
                    contents : new Buffer( poTxt )
                });
                this.emit( 'data',  poOut );
            }
            this.emit( 'end' );
        }
    );
};
