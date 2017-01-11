var assert = require("should");
var path = require( 'path' );

var Buffer = require('buffer').Buffer;

var gutil  = require('gulp-util');
var gettext = require( 'ziey-gettext' );
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
};
describe( __filename, function(){
    var opt = {
            lang : 'en',
            po   : gettext.obj2po({
                a : { str : "A" },
                b : { str : 'B' },

                // #2 - case 
                "测试更多" : { str : "Test \"More\"" },
                "这是[更多]按钮" : { str : "It's the Button of \"More\"" },

                // #3 - 这个词条将被去掉
                'empty-item' : { str : '' },
                
            })
        },
        stream = i18n( opt );

    var po_txt;
    stream.on( 'data', function( file ){
        if( `${ opt.lang }.po` == path.basename( file.path ) ){
            po_txt = file.contents.toString();
        }
    } );
    stream.on( 'end', function(){
        it( '没有使用的词条将被去掉', function(){
            var po_obj = gettext.po2obj( po_txt );
            ( 'empty-item' in po_obj ).should.equal( false );
            ( 'a' in po_obj ).should.equal( true );
            ( '测试更多' in po_obj ).should.equal( true );
        } );
    } );

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

    check( '单竖线导致报错', stream,
        '{{= _("音乐及榜单管理 | %s") }}', '音乐及榜单管理 | %s'
    );

    check( '输出文本中单双引号带转义 - base', stream,
        '{{= _("\'") }}' + "{{= _('\"') }}", "\\'" + '\\"'
    );

    check( '输出文本中单双引号带转义 - case', stream,
        "{{= _( '测试更多' ) }}" + '{{= _( \'这是[更多]按钮\' ) }}',
        'Test \\"More\\"' + 'It\\\'s the Button of \\"More\\"'
    );

    

    stream.once( 'data', function( outputFile ){
        it( 'xgettext', function(){
            var input = gettext.po2obj( outputFile.contents.toString() ),
                output = {
                    a : "A",
                    c : "",
                    d : "",
                    b : 'B',
                    "音乐及榜单管理 | %s" : "",
                    '"' : '',
                    "'" : '',
                    "测试更多"       : "Test \"More\"",
                    "这是[更多]按钮" : "It's the Button of \"More\"",
                },
                key;
            for( key in input ){
                input[ key ].str.should.equal( output[ key ] );
            }
        } );
    } );

    stream.end();
    
} );

/**/
