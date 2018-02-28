# 在 webpack 打包流中替换内容

在 webpack 打包过程的 emit 和 done 阶段，对指定后缀名的文件，进行文本替换

## 安装

```shell
npm i yt-webpack-content-replace-plugin --save-dev
```

### in webpack.config.js

**Require `yt-webpack-content-replace-plugin`**

```javascript
var ytWebpackContentReplacePlugin = require('yt-webpack-content-replace-plugin')
```

添加这个插件到你的插件列表

#### 不指定path选项，默认是 emit 触发

```javascript
var config = {
  plugins: [
    new ytWebpackContentReplacePlugin({
      test: /\/assets/g,
      use: 'assets',
      exts: ['html', 'js', 'json']
    })
  ]
}
// or
var config = {
  plugins: [
    new ytWebpackContentReplacePlugin({
      rules:[{
        test: /\/assets/g,
        use: 'assets'
      }],
      exts: ['html', 'js', 'json']
    })
  ]
}
```

#### 指定path选项，默认是 done 触发

```javascript
var config = {
  plugins: [
    new ytWebpackContentReplacePlugin({
      test: /\/assets/g,
      use: 'assets',
      exts: ['html', 'js', 'json'],
      path: path.resolve(__dirname, './dist')
    })
  ]
}
```

### 配置项

#### test

- Type: `String` || `RegExp`
- Default: 没有默认值
- Required: false，当使用rules时，可以不用省略，如果配置也回被加入rules
- note: test和rules选其一

用于指定被替换的部分

#### use

- Type: `String`
- Default: 没有默认值
- Required: false，当使用rules时，可以不用省略，如果配置也回被加入rules
- note: use和rules选其一

用于指定用来替换的内容

#### rules

- Type: `Array`
- Default: `[{test:...,use:...}]`
- Required: false，需要替换多个内容时采用此配置是最好的选择，如果不配置rules，那么test和use是必须的

由多个对象，包含test和use属性数组形式

#### exts

- Type: `Array<String>`
- Default: 没有默认值
- Required: true

#### path

- Type: `String`
- Default: ''
- Required: false

用于指定要替换某文件下指定的文件， 如果设置了path, 则在 done 时触发
