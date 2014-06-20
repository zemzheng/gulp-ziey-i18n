var assert = require("should");

var Buffer = require('buffer').Buffer;
var fs     = require( 'fs' );
var path   = require( 'path' );

var gutil = require('gulp-util');

var gettext = require( '../gettext.js' );
var i18n    = require( '../' );

var check = function( tips, stream, input, output ){
    var inputFile = new gutil.File({ 
        contents : new Buffer( input )
    });

    stream.once( 'data', function( outputFile ){
        it( tips, function(){
            outputFile.contents
                .toString()
                .should.equal( output );
        } );
    } );

    stream.write( inputFile );
    // stream.end();
}

describe( 'gettext', function(){
    var opt = {
            lang : 'en',
            po   : gettext.obj2po({
                a : "A",
                b : 'B'
            })
        },
        stream = i18n( opt );

    check( '单个命中', stream,
        '{{= _("a") }}', 'A'
    );

    check( '多个命中', stream,
        '{{= _("b") }}{{= _("a") }}{{= _("b") }}', 'BAB'
    );
    check( '单个不命中', stream,
        '{{= _("c") }}', 'c'
    );
    check( '多个不命中', stream,
        '{{= _("c") }}{{= _("d") }}{{= _("c") }}', 'cdc'
    );
    check( '多个混合', stream,
        '{{= _("c") }}{{= _("b") }}{{= _("a") }}{{= _("d") }}{{= _("c") }}', 'cBAdc'
    );

    stream.once( 'end', function( outputFile ){
        it( 'xgettext', function(){
            var input = gettext.po2obj( outputFile.contents.toString() ),
                output = {
                    a : "A",
                    c : "",
                    d : "",
                    b : 'B'
                },
                key;
            for( key in input ){
                input[ key ].should.equal( output[ key ] );
            }
        } );
    } );

    stream.end();

    var tmp_file = opt.path = 'tmp_file.po';
    fs.writeFileSync( tmp_file, opt.po );
    stream = stream = i18n( opt );
} );

