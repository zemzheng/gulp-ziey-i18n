/**
 * @author zemzheng@gmail.com (http://www.ziey.info)
 * Copyright (c) 2012 Zem Zheng
 *
 */

var fs = require('fs');

var reg = /^\s*(msgid|msgstr)\s*"(.*)"\s*$/g,
    dict = {}, c_dict = null,
    _ = function(str, noempty) {
        var m_dict = c_dict || {},
            result = c_dict[str] || str;
        return result;
    },

    po2obj = function(text) {
        var text = text.replace(/[\t\r\s\n]*(msgid|msgstr)[\t\r\s\n]*/g, '\n$1 '),
            reg = /^\s*(msgid|msgstr)\s*"(.*)"\s*\n{0,1}/gm,
            m_dict = {}, item_s, item_t, s_str, t_str;
        while (
            (item_s = reg.exec(text)) && (item_t = reg.exec(text))
        ) {
            item_s[2] && ( m_dict[item_s[2]] = item_t[2] );
        }
        return m_dict;
    },
    obj2po = function(obj, header) {
        var potxt = [
            'msgid ""',
            'msgstr ""',
            '"MIME-Version: 1.0\\n"',
            '"Content-Type: text/plain; charset=UTF-8\\n"',
            '"Content-Transfer-Encoding: 8bit\\n"'
        ].concat( header || [] ).join('\n'),
            key;
        for (key in obj) {
            potxt += [
                '','',
                'msgid "' + key.replace(/(["\\])/g, '\\$1') + '"',
                'msgstr "' + ( obj[key] || '' ).replace(/(["\\])/g, '\\$1') + '"',
            ].join('\n');
        }

        return potxt;
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
    
    setLang = function(lang) {
        return c_dict = getDictByLang(lang) || c_dict;
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
