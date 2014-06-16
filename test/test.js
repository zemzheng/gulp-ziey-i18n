var assert = require("assert");

var Buffer = require('buffer').Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

var gutil = require('gulp-util');

var gettext = require( '../gettext.js' );

describe( '[gettext]', function(){
    var lang = 'demo';
    var tmp_po_file  = path.join( __dirname, 'tmp_lang.po' );
    gettext.handlePoTxt( lang, tmp_po_file );
    gettext.setLang( lang );
    

    var check = function( input, output, done ){
        var file = new gutil.File({
            contents: new Buffer( input )
        });
        var i18n = require( '../index.js' );

        var b = i18n({
            lang : lang,
            po   : tmp_po_file,
        });
        b.write( file );
        b.once( 'data',function( file ) {
            assert( file.isBuffer() );
            assert.equal( file.contents.toString('utf8'), output );
            done();
        });
    }

    it( 'Wording inside pofile', function( done ){
        fs.writeFileSync(
            tmp_po_file, 
            gettext.obj2po({
                a : "A",
                b : "B",
                c : "C"
            })
        );
        check( 
            '{{= _("a") }}{{= _("b") }}{{= _("c") }}',
            'ABC',
            done
        )
    } );

    it( 'Some wording not inside pofile', function( done ){
        fs.writeFileSync(
            tmp_po_file, 
            gettext.obj2po({
                a : "A",
                b : "B",
                c : "C"
            })
        );
        check( 
            '{{= _("a") }}{{= _("d") }}{{= _("c") }}',
            'AdC',
            done
        )
    } );

    // it( 'Wording outof pofile', function(){
    //     var i18n = require( '../index.js' );
    // } );
} );

// describe('Array', function(){
//     describe('#indexOf()', function(){
//         it('should return -1 when the value is not present', function(){
//             assert.equal(-10, [1,2,3].indexOf(5));
//             assert.equal(-1, [1,2,3].indexOf(0));
//         })
//     })
// });
 
