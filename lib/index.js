const path = require('path')
const {src,dest,series,parallel,watch} = require('gulp')
//自动加载插件
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
//热更新模块，创建服务器
const browserSync = require('browser-sync')
const bs = browserSync.create()
let config = {
  //路径配置
  build:{
    src:'src',
    dist:'dist',
    temp:'.temp',
    public:'public',
    path:{
      styles:'assets/styles/*.scss',
      scripts:'assets/scripts/*.js',
      pages:'*.html',
      images:'assets/images/**',
      fonts:'assets/fonts/**'
    }
  }
}
const cwd = process.cwd()
try{
  const loadConfig = require(path.join(cwd,'pages.config.js'))
  config = Object.assign({},config,loadConfig)
}catch(e){
}

//清理文件夹
const del = require('del')
const clean = ()=>{
    return del([config.build.dist,config.build.temp])
}
//样式编译
const style = ()=>{
    return src(config.build.path.styles,{base:config.build.src,cwd:config.build.src})
        .pipe(plugins.sass({outputStyle:'expanded'}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))
}
//脚本编译
const scripts = ()=>{
    return src(config.build.path.scripts,{base:config.build.src,cwd:config.build.src})
        .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))
}
//页面模版编译
const pages = ()=>{
    return src(config.build.path.pages,{base:config.build.src,cwd:config.build.src})
        .pipe(plugins.swig({data:config.data,defaults:{cache:false}}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({stream:true}))
}
//图片和字体编译
const images = ()=>{
    return src(config.build.path.images,{base:config.build.src,cwd:config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}
const fonts = ()=>{
    return src(config.build.path.fonts,{base:config.build.src,cwd:config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}
//其他文件 public 下的文件不需要编译
const extra = ()=>{
    return src('**',{base:config.build.public,cwd:config.build.public})
        .pipe(dest(config.build.dist))
}
//将编译过的文件(html css js )放入临时文件夹中
//服务器监听临时文件夹.temp，在通过useref任务，将文件合并整理压缩，写入到dist文件夹中
const useref = ()=>{
    return src(config.build.path.pages,{base:config.build.temp,cwd:config.build.temp})
        //文件合并 gulp-useref 将html中引用的文件进行合并
            //searchPath，在.temp文件夹下找到assets文件夹，在根目录下找node_modules文件夹
        .pipe(plugins.useref({searchPath:[config.build.temp,'.']}))
        //文件压缩
        //安装并使用 gulp-htmlmin gulp-clean-css gulp-uglify gulp-if 进行html css js 文件压缩
        .pipe(plugins.if(/\.js$/,plugins.uglify()))
        .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/,plugins.htmlmin({
            collapseWhitespace:true,
            minifyCSS:true,
            minifyJS:true
        })))
        .pipe(dest(config.build.dist))
}
//
//热更新开发服务器设置
const serve = ()=>{
    //监听文件通配符路径，如果文件发生变化，重新执行对应的任务
    watch(config.build.path.styles,{cwd:config.build.src},style)
    watch(config.build.path.scripts,{cwd:config.build.src},scripts)
    watch(config.build.path.pages,{cwd:config.build.src},pages)
    //watch ，当下面文件发生变化时，服务器重新请求，拿到最新的文件
    watch([config.build.path.images,config.build.path.fonts],{cwd:config.build.src},bs.reload)
    watch('**',{cwd:config.build.public},bs.reload)
    

    //初始化服务器
    bs.init({
        port:8888,
        server:{
            //网站的根目录
            baseDir:[config.build.temp,config.build.public,config.build.src],
            //配置路由，routes中的配置优先于baseDir中的
            routes:{
                //给html文件中引用的'/node_modules'路径指定根目录下的'node_modules'文件夹（相对项目根目录）
                '/node_modules':'node_modules'
            }
        }
    })
}
const compile = parallel(style,scripts,pages)
const develop = series(compile,serve)
const build = series(clean,parallel(compile,images,fonts,extra),useref)
module.exports={
    develop,
    clean,
    build
}