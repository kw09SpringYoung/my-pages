#!/usr/bin/env node
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) //require.resolve()找到模块对应的绝对路径
require('gulp/bin/gulp')