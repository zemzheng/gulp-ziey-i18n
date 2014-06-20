var Buffer = require( 'buffer' ).Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

var gettext  = require('./gettext.js');
var template = require('art-template');
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
        var poDict = {};
        gettext.handlePoTxt( options.lang, options.po );
        gettext.setLang( options.lang );

    template.helper( '_', function( str ){
        var outstr = gettext._( str );
        poDict[ str ] = outstr === str ? '' : outstr;
        return outstr;
    } );

    return through(
        function( file ) {
            if (file.isNull()) {
                // nothing
            } else if (file.isStream()) {
                this.emit( 'error',
                    new PluginError( PLUGIN_NAME, 'Streaming not supported' )
                );
            } else {
                file.contents = new Buffer(
                    template.compile(
                        file.contents.toString()
                    )(0)
                );
            }
            this.emit( 'data', file )
        }, 
        function(){
            var poDict0 = gettext.getDictByLang( options.lang );
            for( msgid in poDict ){
                if( !poDict[ msgid ] ){
                    poDict[ msgid ] = poDict0[ msgid ];
                }
            }
            var poTxt = gettext.obj2po( poDict ),
                b = __dirname, 
                p = path.join( b, options.lang + '.po' );
            if( options.path ){
                b = path.dirname( options.path );
                p = options.path;
            }
            
            var poOut = new gutil.File({
                base     : b,
                path     : p,
                contents : new Buffer( poTxt )
            });
            this.emit( 'data', poOut );
            this.emit( 'end',  poOut );
        }
    );
};
