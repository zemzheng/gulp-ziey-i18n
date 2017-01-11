var Buffer = require( 'buffer' ).Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

require('./string.extends.js');
var gettext = require( 'ziey-gettext' );
var through  = require('through');
var pick = require( 'ziey-utils' ).pick;

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-ziey-i18n';


module.exports = function( options ){
    // options
    //      .template    
    //          .options       : template 设置
    //      .po                : po 文件内容
    //      .lang              : po 文件的语言标识
    //      .path              : po 文件路径
    //      .keep_no_reference : 是否保留不再引用的词条，默认为 false

    if( fs.existsSync( options.path ) ){
        options.po = fs.readFileSync( options.path, 'utf-8' ) || options.po || '';
    }

    gettext.handlePoTxt( options.lang, options.po );
    gettext.setLang( options.lang );
    options.keep_no_reference || gettext.clearCurrentDictEmptyItem();

    return through(
        function( file ) {
            if (file.isNull()) {
                // nothing
            } else if (file.isStream()) {
                
                this.emit( 'error',
                    new PluginError( PLUGIN_NAME, 'Streaming not supported' )
                );
            } else {

                var lang      = options.lang,
                    pickOpts  = ( options.template || {} ).options || {},
                    po_path   = options.path,
                    file_path = file.path;

                gettext.setLang( lang );

                try{
                    file.contents = new Buffer( 
                        pick( file.contents.toString(), {
                            openTag  : pickOpts.openTag  || '{{',
                            closeTag : pickOpts.closeTag || '}}',
                            inputAdjust : function( str ){
                                return str
                                    .replace( /^=\s*\_\s*\(\s*["']/g, '' )
                                    .replace( /["']\s*\)[;\s]*$/g, '' )
                                    .trim();
                            },
                            outputAdjust : function( str ){
                                var result = gettext._( str ).replace( /(["'])/g, '\\$1' );
                                gettext.updateCurrentDict(
                                    str,
                                    {
                                        reference : path.relative(
                                            po_path ? path.dirname( po_path ) : __dirname,
                                            file_path || __dirname
                                        )
                                    }
                                );
                                return result || str;
                            },
                        } ).result.join( '' )
                    );
                } catch(e){
                    gutil.log( 
                        gutil.colors.bgRed( 'Template Error : %s : %s'.sprintf( path, e.name ) ),
                        e 
                    );
                    throw e;
                }

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
