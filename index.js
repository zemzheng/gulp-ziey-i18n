const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

const { Transform } = require('stream');
const Vinyl = require('vinyl');
const colors = require('ansi-colors');
const PluginError = require('plugin-error');
const log = require('fancy-log');

require('./string.extends.js');
const gettext = require('ziey-gettext');
const { pick } = require('ziey-utils');

const PLUGIN_NAME = 'gulp-ziey-i18n';

module.exports = function (options) {
    // options
    //      .template
    //          .options       : template 设置
    //      .po                : po 文件内容
    //      .lang              : po 文件的语言标识
    //      .path              : po 文件路径
    //      .keep_no_reference : 是否保留不再引用的词条，默认为 false
    //      .disableShowError  : 是否不显示错误信息
    //      .cleanCache        : 是否清理缓存
    //      .encodeSlash       : 编码分隔符

    if (fs.existsSync(options.path)) {
        options.po = fs.readFileSync(options.path, 'utf-8') || options.po || '';
    }


    const { encodeSlash, encodeCustom } = options;
    var parse = encodeSlash
        ? (input, _) => {
            let [ method, ...str ] = input.split(encodeSlash);
            if (method !== input) {
                input = str.join('').trim()
                str = _(input);
                method = method.trim();
                switch (true) {
                    case 'JSON' === method.toUpperCase():
                        str = JSON.stringify(str);
                        str = str.substr(1, str.length - 2);
                        break;
                    case method in encodeCustom:
                        str = encodeCustom[ method ](str);
                }
            } else {
                str = _(input);
            }
            return { input, output: str };
        }
        : (input, _) => ({ input, output: _(input.trim()) });

    gettext.handlePoTxt(options.lang, options.po);
    gettext.setLang(options.lang);
    // 需要先清空引用关系
    const { cleanCache = true } = options;
    if (cleanCache) {
        gettext.cleanCurrentDictReference();
    }

    const transformStream = new Transform({
        objectMode: true,
        transform(file, encoding, callback) {
            if (file.isNull()) {
                // nothing
            } else if (file.isStream()) {

                return callback(
                    new PluginError(PLUGIN_NAME, 'Streaming not supported')
                );
            } else {

                var lang = options.lang,
                    pickOpts = (options.template || {}).options || {},
                    po_path = options.path,
                    file_path = file.path;

                gettext.setLang(lang);

                try {
                    file.contents = Buffer.from(
                        pick(file.contents.toString(), {
                            openTag: pickOpts.openTag || '{{',
                            closeTag: pickOpts.closeTag || '}}',
                            inputAdjust: function (str) {
                                return str
                                    .replace(/^=\s*_\s*\(\s*["']/g, '')
                                    .replace(/["']\s*\)[;\s]*$/g, '')
                                    .trim();
                            },
                            outputAdjust: function (str) {
                                var { input, output: result } = parse(str, gettext._);
                                const reference = path.relative(
                                    po_path ? path.dirname(po_path) : __dirname,
                                    file_path || __dirname
                                ) || '<memory>';
                                gettext.updateCurrentDict(
                                    input, { reference }
                                );
                                return result || input;
                            },
                        }).result.join('')
                    );
                } catch (e) {
                    if (!options.disableShowError) {
                        log(
                            colors.bgRed('Template Error : %s : %s'.sprintf(path, e.name)),
                            e
                        );
                    }
                    throw e;
                }

            }
            callback(null, file);
        },
        flush(callback) {
            const { lang } = options;
            if (!options.keep_no_reference) {
                gettext.clearDict({ lang, reference: true });
            }
            var poDict = gettext.getDictByLang(lang);

            var poTxt = gettext.obj2po(poDict),
                b = __dirname,
                p = path.join(b, lang + '.po');
            if (options.path) {
                b = path.dirname(options.path);
                p = options.path;
            }

            if (options.path) {
                fs.writeFileSync(options.path, poTxt);
                log(
                    colors.yellow(
                        'Update Po %s'.sprintf(options.path)
                    )
                );
                callback();
            } else {
                callback(
                    null,
                    new Vinyl({
                        base: b,
                        path: p,
                        contents: Buffer.from(poTxt)
                    }),
                );
            }
        }
    });

    return transformStream;


};
