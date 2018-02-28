const fs = require('fs');
const path = require('path');

module.exports = class YtContentReplaceWebpackPlugin {
  constructor(options) {
    if (!YtContentReplaceWebpackPlugin.hasValidOptions(options)) {
      return;
    }
    this.modificationSrc = options.test;
    this.modificationDes = options.use;
    this.modificationExts = options.exts;
    this.rules = options.rules || [];
    this.path = options.path || '';
    this.compilerType = this.path !== '' ? 'done' : 'emit';
    this.includes = options.includes || [];
    this.excludes = options.excludes || [];

    // 将单个匹配添加到rules数组中，方便统一操作
    this.initOption();
  }

  /**
   * 判断是否传了必要的参数
   *
   * @static
   * @param {any} options
   * @returns
   */
  static hasRequiredParameters(options) {
    return (Object.hasOwnProperty.call(options, 'test') &&
      Object.hasOwnProperty.call(options, 'use') || Object.hasOwnProperty.call(options, 'rules')) &&
      Object.hasOwnProperty.call(options, 'exts');
  }


  /**
   * 检验传入的参数是否有效
   *
   * @static
   * @param {any} options
   * @returns
   */
  static hasValidOptions(options) {
    if (typeof options !== 'object') return false;

    return YtContentReplaceWebpackPlugin.hasRequiredParameters(options) && Array.isArray(options.exts) && options.exts.length > 0;
  }

  /**
   * 将单个匹配添加到rules数组中，方便统一操作
   *
   * @static
   */
  initOption() {
    if (!this.modificationSrc || !this.modificationDes) return;
    this.rules.push({
      test: this.modificationSrc,
      use: this.modificationDes
    });
  }


  /**
   * 替换字符串中指定内容
   *
   * @param {any} src
   * @returns
   */
  replaceContent(src) {
    for (let item of this.rules) {
      src = src.replace(new RegExp(item.test), item.use);
    }
    return src;
  }

  /**
   * 处理ArrayBuffer类的文件流
   *
   * @param {any} src
   * @returns
   */
  arrayBufferSourceHandle(src) {
    let str = String.fromCharCode.call(null, src);
    str = this.replaceContent(str);
    return Uint8Array.from(Array.from(str).map(o => o.charCodeAt(0)));
  }

  /**
   * 创建webpack需要的Assets文件对象
   *
   * @param {any} out
   * @returns
   */
  createAssetsFileObject(out) {
    return {
      source: function () {
        return out;
      },
      size: function () {
        return out.length;
      }
    };
  }

  /**
   * 文件流替换
   *
   * @param {any} compilation
   */
  replace(compilation) {
    let assetsKeys = Object.keys(compilation.assets).filter(key => {
      let arr = key.split('.');
      if (arr.length < 2) {
        return false;
      }
      return this.modificationExts.indexOf(arr.pop()) !== -1 ? true : false;
    });
    console.log('filter assets by ext name: ', assetsKeys);
    assetsKeys.forEach(key => {
      let source = compilation.assets[key].source();
      let out;
      if (typeof source === 'string') {
        out = this.replaceContent(source);
      }
      if (typeof source === 'object') {
        out = this.arrayBufferSourceHandle(source);
      }
      if (out) {
        compilation.assets[key] = this.createAssetsFileObject(out);
      }
    });

  }

  /**
   * 获取指定目录下指定后缀名的文件名
   *
   * @param {any} buildPath
   * @returns
   */
  getFileList(buildPath) {
    let ret = [];
    let files = fs.readdirSync(buildPath);
    files.forEach((item) => {
      let tempPath = buildPath + path.sep + item;
      let stat = fs.statSync(tempPath);
      if (stat.isDirectory()) {
        ret = ret.concat(this.getFileList(tempPath));
        return;
      }
      let ext = path.extname(tempPath);
      if (!ext) return;
      ext = ext.substr(1);
      if (this.modificationExts.indexOf(ext) !== -1) {
        ret.push(tempPath);
      }
    });
    return ret;
  }

  /**
   * 获取包含文件列表
   *
   * @returns 包含文件数组
   */
  getIncludeList() {
    let list = [];
    for (let item of this.includes) {
      list.push(this.path + path.sep + item);
    }
    return list;
  }

  /**
   * 判断文件是否在包含文件里
   *
   * @param {String} file 文件路径字符串
   * @param {Array} list 包含文件数组
   * @returns 布尔值，是否包含在允许列表中
   */
  isIncludeFile(file, list) {
    if (list.length === 0) {
      return true;
    }
    let flag = false;
    for (let item of list) {
      if (file.indexOf(item) !== -1) {
        flag = true;
        break;
      }
    }
    return flag;
  }

  /**
   * 获取排除文件列表
   *
   * @returns 排除文件列表
   */
  getExcludeList() {
    let list = [];
    for (let item of this.excludes) {
      item = item.split('/').join(path.sep);
      list.push(this.path + path.sep + item);
    }
    return list;
  }

  /**
  * 判断文件是否在排除文件里
  *
  * @param {String} file 文件路径字符串
  * @param {Array} list 排除文件数组
  * @returns 布尔值，是否包含在排除列表中
  */
  isExcludeFile(file, list) {
    if (list.length === 0) {
      return false;
    }
    let flag = false;
    for (let item of list) {
      if (file.indexOf(item) !== -1) {
        flag = true;
        break;
      }
    }
    return flag;
  }

  /**
   * 替换本地文件
   *
   */
  replaceFile() {
    let files = this.getFileList(this.path);
    let includeList = this.getIncludeList();
    let excludeList = this.getExcludeList();
    files.forEach((file) => {
      if (!this.isIncludeFile(file, includeList) || this.isExcludeFile(file, excludeList)) return;
      const str = fs.readFileSync(file, 'utf8');
      const out = this.replaceContent(str);
      fs.writeFileSync(file, out);
    });
  }

  apply(compiler) {
    if (this.compilerType === 'emit') {
      compiler.plugin('emit', (compilation, callback) => {
        this.replace(compilation);
        callback && callback();
      });
      return;
    }
    if (this.compilerType === 'done') {
      compiler.plugin('done', (compilation, callback) => {
        this.replaceFile();
        callback && callback();
      });
      return;
    }
  }
};