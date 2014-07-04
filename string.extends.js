(function(document, $){
    var padding = function( s, len, chr ){
            chr = ( chr || '0' ) + '';
            len = len || 0;
            while( s.length < len ){
                s = chr + s;
            }
            return s.substr( 0, len );
        },
        format = function( s ){
            arr = Array.prototype.slice.call( arguments, 1 );
            var i = 1;
            s = s.replace( /%s/g, function(){
                return '{%' + i++ + '%}';
            });
            var ii = arr.length;
            i = 0;
            while( i < ii ){
                s = s.replace( 
                    new RegExp( '{%' + (i+1) + '%}', 'g' ),
                    arr[ i++ ] 
                );
            }
            return s.replace( /\{%\d%\}/g, '' );
        };

    [
        [ 'padding'    , padding    ],
        [ 'sprintf'    , format     ],
        [ 'format'     , format     ]
    ].forEach( function( items, index ){
        var method = items[0],
            func   = items[1];
        String.prototype[ method ] || ( 
            String.prototype[ method ] = function(){
                return func.apply(
                    null, 
                    [ this ].concat( 
                        Array.prototype.slice.call( arguments, 0  )
                    ) 
                );
            } 
        );
    } );
})();

