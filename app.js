var createError = require('http-errors');
//express框架库
var express = require('express');
//路径
var path = require('path');
//获取cookie
var cookieParser = require('cookie-parser');
//日志输出
var logger = require('morgan');
//ejs
var ejs = require("ejs");
//body-parser
var bodyparser = require("body-parser");
//compress   压缩
var compress = require('compression');
//express-session
var session = require('express-session');
//express-mysql-session
var store = require('express-mysql-session');
//mysqlconfig 和上面的中间件一起用
var mysqlconfig = {
  host:'localhost',
  user:'root',
  password:'123456',
  database:'vuesql',
  port:'3306'
};

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var admin = require('./routes/admin');
var video = require('./routes/video');

var app = express();

//设置视图指向views目录
// app.set('views',require('path').join(__dirname,'views')); //和下面那行一样
app.set('views', path.join(__dirname, 'views'));
app.engine(".html",ejs.__express);
//视图引擎后序
app.set('view engine', 'html');

app.use(logger('dev'));
//express-session
app.use(session({
  name:'USER_SID', //key参数
  secret:'xome',    //session cookie签名，防止篡改
  resave: false,  //强制保存 session 即使它并没有变化,
  saveUninitialized: true,   //强制将未初始化的 session 存储
  store:new store(mysqlconfig),    //session储存实例     负载均衡，保存到数据库
  rolling:true, //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
  // cookie: {
  //   maxAge: 1000 * 60 * 60 * 24   //有效期一天
  // }
}))

//compress 压缩
app.use(compress({threshold:2048}))   // 阀值，当数据超过1kb的时候，可以压缩
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//静态文件
app.use(express.static(path.join(__dirname, 'public')));
//bodyParser
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

//登录拦截
// app.use(function (req, res, next) {
//   var url = req.originalUrl;
//   console.log(url);
//   if(url=='/'){
//     console.log('首页')
//     console.log(req.session);
//     // if (!req.session || !req.session.user) {
//     //   console.log('先登录');
//     //   res.type('html');
//     //   return res.render("signin");
//     // }
//     if (req.session.user) {
//       console.log('/')
//       //重定向(位置是views里面的html页面)
//       res.redirect('/');
//   } else {
//       console.log('index')
//       //转发(位置是views里面的html页面)
//       res.type('html');
//       return res.render('index');
//   }
//   }
//   next();
// });

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-c');
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, access-control-request-headers, Origin, Accept, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, authorization, Access-Control-Allow-Credentials, X-Auth-Token, X-Accept-Charset,X-Accept,X-Requested-With,token,request,Content-Type,response");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  if (req.method === 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
})

//清除session
app.get('/signout', function(req, res, next){
  // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
  // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
  // 然后去查找对应的 session 文件，报错
  // session-file-store 本身的bug  
 
  req.session.destroy(function(err) {
    if(err){
      res.json({ret_code: 2, ret_msg: '退出登录失败'});
      return;
    }
     
    // req.session.loginUser = null;
    res.clearCookie('USER_SID');
    res.redirect('/');
  });
});

//登录拦截
app.use(async function (req, res, next) {
  var url = req.originalUrl;
  console.log(url);
  // req.session.user='1';
  if(url=='/' || url=='/upload'){
    // console.log('首页')
    console.log(req.session);
    if (!req.session || !req.session.user) {
      console.log('请登录');
      return res.redirect("/signin");
    }
  }
  next();
});

//这个是加载目录
app.use('/index', indexRouter);
app.use('/users', usersRouter);
//上面那个页面转为测试
app.use('/', admin);
app.use('/vi',video);

// 错误处理
app.use(function(req, res, next) {
  // var err = new Error('Not Found');
  // err.status = 404;
  // next(err);
  let currentTime = new Date();
  res.type('text/plain');
  res.status(404);
  res.send('404 - 你访问的页面可能去了火星\n' + currentTime);
});

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
