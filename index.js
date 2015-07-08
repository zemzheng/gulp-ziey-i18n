var Buffer = require( 'buffer' ).Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

require('./string.extends.js');
var gettext = require( 'ziey-gettext' );
var templateFactory = require('./art-template-factory.js');
var through  = require('through');

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-ziey-i18n';

function getTmplErrorFuncByPath( path ){
    return function( e ){
        gutil.log( 
            gutil.colors.bgRed( 
                'Template Error : %s : %s'.sprintf( path, e.name ) 
            ) 
        );
    }
};
function getGettextFuncByPath( po_path, file_path ){
    var reference = path.relative(
            po_path ? path.dirname( po_path ) : __dirname,
            file_path || __dirname
        );
    return function( str ){
        var result = gettext._( str );
        gettext.updateCurrentDict( str, { reference : reference } );
        return result || str;
    }
};

module.exports = function( options ){
    // options
    //      .template    
    //          .options : template 设置
    //          .helpers : template 辅助函数
    //      .po          : po 文件内容
    //      .lang        : po 文件的语言标识
    //      .path        : po 文件路径

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

    gettext.handlePoTxt( options.lang, options.po );

    return through(
        function( file ) {
            if (file.isNull()) {
                // nothing
            } else if (file.isStream()) {
                
                this.emit( 'error',
                    new PluginError( PLUGIN_NAME, 'Streaming not supported' )
                );
            } else {
                var contents = file.contents.toString();
                 
                gettext.setLang( options.lang );
                template.helper( '_', getGettextFuncByPath( options.path, file.path ) );
                template.onerror = getTmplErrorFuncByPath( file.path );
                file.contents = new Buffer( template.compile( contents )(0) );
            }
            this.emit( 'data', file )
        }, 
        function(){
            var poDict = gettext.getDictByLang( options.lang );

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
