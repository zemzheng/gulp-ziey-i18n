/**
 * @author zemzheng@gmail.com (http://www.ziey.info)
 * Copyright (c) 2012 Zem Zheng
 *
 */

var fs = require('fs');

var dict = {}, 
    c_dict = null,
    c_lang,
    _ = function( str, canEmpty ) {
        var r = ( c_dict || {} )[str] || '';
        return r || ( canEmpty ? r : str );
    },

    po2obj = function(text) {
        text = text.split( /[\r\n]/g );
        var line, m, obj = {}, c, result = {},
            getObj = function(){
                obj.msgid && ( result[ obj.msgid ] = obj.msgstr );
                obj.msgid = obj.msgstr = '';
            };
        while( text.length ){
            line = text.shift().replace( /^\s*|\s*$/g, '' );

            if( m = line.match( /^(msgid|msgstr)\s+(".*")$/ ) ){
                if( 'msgid' == m[1] && 'msgstr' == c ) getObj();
                obj[ m[1] ] =  eval( m[2] );
                c = m[1];
            } else if( m = line.match( /^(".+")$/ ) ){
               c && ( obj[ c ] += eval( m[1] ) );
            } else {
                getObj();
            }
        }
        getObj();
        return result;
    },
    obj2po = function(obj, header) {
        var potxt = [
                'msgid ""',
                'msgstr ""',
                '"MIME-Version: 1.0\\n"',
                '"Content-Type: text/plain; charset=UTF-8\\n"',
                '"Content-Transfer-Encoding: 8bit\\n"'
            ].concat( header || [] ).join('\n'),
            pobody = [],
            key;
        for (key in obj) {
            pobody.push(
                'msgid "' + key.replace(/(["\\])/g, '\\$1') + '"\n' +
                'msgstr "' + ( obj[key] || '' ).replace(/(["\\])/g, '\\$1') + '"\n'
            );
        }
        pobody.sort();

        return potxt + '\n' + pobody.join( '\n' );
    },

    handlePo = function(name, path) {
        return handlePoTxt(
            name,
            fs.readFileSync(path, 'utf-8')
        );
    },
    handlePoTxt = function(name, text) {
        if (!name) return;
        return dict[name] = po2obj(text);
    },
    
    getLang = function(){ return c_lang; },
    setLang = function(lang) {
        var dict = getDictByLang(lang);
        if( dict ){
            c_lang = lang;
        } else {
            dict = c_dict;
        }
        return c_dict = dict;
    },
    getDictByLang = function(lang) {
        return dict[lang];
    };

module.exports = {
    handlePo: handlePo,
    handlePoTxt: handlePoTxt,

    _: _,
    gettext: _,

    setLang       : setLang,
    getDictByLang : getDictByLang,

    clear: function() {
        dict = {};
        c_dict = null;
    },

    po2obj: po2obj,
    obj2po: obj2po
}
