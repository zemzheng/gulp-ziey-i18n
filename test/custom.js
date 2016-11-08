var assert = require("should");

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
                "这是[更多]按钮" : { str : "It's the Button of \"More\"" }
                
            }),
            template : {
                options : {
                    openTag  : '{%',
                    closeTag : ']]',
                },
            },
        },
        stream = i18n( opt );

    check( '单个命中', stream,
        '{%= _("a") ]]', 'A'
    );

    check( '多个命中', stream,
        '{% b ]]{%= _("a") ]]{% b           ]]', 'BAB'
    );
    check( '单个不命中', stream,
        '{%= _("c") ]]', 'c'
    );
    try{
        check( '匹配失败', stream,
            '{%= _("c") ', 'c'
        );
    } catch( e ){
        console.log( e );
    }
    check( '多个不命中', stream,
        '{% c ]]{%= _("d") ]]{%= _("c") ]]', 'cdc'
    );
    check( '多个混合', stream,
        '{%= _("c") ]]{%= _("b") ]]{%    a     ]]{%= _("d") ]]{%=           _("c") ]]', 'cBAdc'
    );

    check( '单竖线导致报错', stream,
        '{%= _("音乐及榜单管理 | %s") ]]', '音乐及榜单管理 | %s'
    );

    check( '输出文本中单双引号带转义 - base', stream,
        '{% \' ]]' + "{%                  \" ]]", "\\'" + '\\"'
    );

    check( '输出文本中单双引号带转义 - case', stream,
        "{%= _( '测试更多' ) ]]" + '{%= _( \'这是[更多]按钮\' ) ]]',
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

