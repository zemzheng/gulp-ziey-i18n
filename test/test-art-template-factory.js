var assert = require("should");

var factory = require( '../art-template-factory.js' );

describe( 'art-template-factory', function(){
    it( 'global template should be equal', function(){
        var a = factory(),
            b = factory();
        a.should.equal( b );
    } );
    it( 'new template should be different', function(){
        var a = factory( 1 ),
            b = factory( 1 );
        a.should.not.equal( b );
    } );
} );
