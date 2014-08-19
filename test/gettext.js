var assert = require("should");
var gettext = require( '../gettext.js' );

describe( 'gettext', function(){
    var obj = {
            a : "A",
            b : 'B',
            z : '\\z'
        },
        po = [
            'msgid ""',
            'msgstr ""',
            '"MIME-Version: 1.0\\n"',
            '"Content-Type: text/plain; charset=UTF-8\\n"',
            '"Content-Transfer-Encoding: 8bit\\n"',
            'msgid "a"',
            'msgstr "A"',
            '',
            'msgid "b"',
            'msgstr "B"',
            '',
            'msgid "z"',
            'msgstr "\\\\z"',
            ''
        ].join( '\n' );
    
    it( 'obj2po', function(){
        po.should.equal( gettext.obj2po( obj ) );
    } );
    it( 'po2obj', function(){
        JSON.stringify( obj ).should.equal(
            JSON.stringify( 
                gettext.po2obj( po )
            )
        );
    } );

    it( 'po2obj - 末尾无换行', function(){
        var obj = { a : 'A', b : 'B' },
            po = [
                'msgid "a"',
                'msgstr "A"',
                '','',
                'msgid "b"',
                'msgstr "B"',
            ].join( '\n' );
        JSON.stringify( obj ).should.equal(
            JSON.stringify( 
                gettext.po2obj( po )
            )
        );
    } );

    it( 'po2obj - 多行无间隔', function(){
        var obj = { a : 'A', b : 'B' },
            po = [
                'msgid "a"',
                'msgstr "A"',
                'msgid "b"',
                'msgstr "B"',
            ].join( '\n' );
        JSON.stringify( obj ).should.equal(
            JSON.stringify( 
                gettext.po2obj( po )
            )
        );
    } );
} );
