var Buffer = require('buffer').Buffer;
var fs     = require('fs');

var gettext  = require('./gettext.js');
var template = require('art-template');
var through  = require('through2');

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-ziey-i18n';

module.exports = function (options) {
    // i18n 设置
    var poDict = {};
    gettext.handlePo( options.lang, options.po );
    gettext.setLang( options.lang );

    // template 设置
    template.onerror = function( e ){
        this.emit(
            'error',
            new PluginError( PLUGIN_NAME, 'Streaming not supported' )
        );
    }
    template.helper( '_', function( str ){
        var outstr = gettext._( str );
        poDict[ str ] = outstr === str ? '' : outstr;
        return outstr;
    } );

    var stream = through.obj(
        function( file, encoding, callback ) {
            if (file.isNull()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                this.emit(
                    'error',
                    new PluginError( PLUGIN_NAME, 'Streaming not supported' )
                );
                return callback(null, file);
            }
            var result = template.compile(
                file.contents.toString(), options.params 
            )(0);
            file.contents = new Buffer( result );
            return callback( null, file );
        } )
        .on( 'end', function(){
            // 更新 po 文件
            var poDict0 = gettext.getDictByLang( options.lang );
            for( msgid in poDict ){
                if( !poDict[ msgid ] ){
                    poDict[ msgid ] = poDict0[ msgid ];
                }
            }
            var poTxt = gettext.obj2po( poDict );
            fs.writeFile( options.po, poTxt );
        } );
    return stream;
};
