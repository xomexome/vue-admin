//router
var express = require('express');
var router = express.Router();

//mysql
// var mysql = require('mysql');

//sql
var db = require('../lib/sql');
var checkLogin = require('../middlewares/check').checkLogin;
var path = require('path');

//formidable
var formidable=require('formidable');

//fs
var fs=require('fs');

// //查询(和下面一样效果，第一次写的方法)
// router.get('/',function(req,res,next){
//     db.query('select * from users',function(err,result){
//         if(err){
//             //json响应
//             res.json({
//                 status:"1",
//                 error:err.message,
//                 result:""
//             })
//             //http响应
//             // res.send('error:'+err.message);
//         }else{
//             // res.json({
//             //     status:"0",
//             //     msg:"",
//             //     result:result,
//             //     // cartlists:JSON.parse(result.recordset[0].cartlist)
//             // })
//             res.send(result);
//         }
//         console.log('/');
//     })
// })

//查询（上面个代码是最基础写法，没复用sql语句，但一样好用）
router.get('/ceshi',function(req,res,next){
    // // 这个写法是比较好
    // await db.findData("users").then(res => {
    //     // data = JSON.parse(JSON.stringify(res))
    //     data=res;
    // })
    // await res.json({
    //     status:"0",
    //     msg:"",
    //     result:data
    // })
    
    //和上面一样效果，不过更加贴近平常写法
    db.findData("users",function(err,result){
        if(err){
            //json响应
            res.json({
                status:"1",
                error:err.message,
                result:""
            })
            //http响应
            // res.send('error:'+err.message);
        }else{
            res.json({
                status:"0",
                msg:"",
                result:result,
                // cartlists:JSON.parse(result.recordset[0].cartlist)
            })
        }
        console.log('/');
    })
})

//这个不错，可以一个接口把需要的数据全放出去
router.get('/ceshi/likes',async function(req,res,next){
    //和上面一样效果，不过更加贴近平常写法
    await db.findData("users").then(res => {
        // data = JSON.parse(JSON.stringify(res))
        data=res;
    })
    //ctx=res
    // res.send('error:'+err.message);
    await res.json({
        session:req.session,
        status:"0",
        msg:"",
        result:data
    })
})

//初始化
router.get('/', async function(req,res,next){
    var page;
    let dataLength = '';
    console.log(req.query.page)
    if (req.query.page==undefined) {
        page = 1;
    }else{
        //如果出现0甚至出现负数会挂掉
        page = req.query.page>0?req.query.page:1;
    };
    // //和下面差不多
    // await checkLogin(req,res).then(res=>{
    //     console.log(res);
    //     if(!res) return;
    // }).catch(err=>{
    //     console.log(err);
    // })
    //这个写法可以，但已经在app.jss写了路由拦截
    // if(await !checkLogin(req,res)){
    //     console.log('ture')
    // }else{
    //     console.log('false')
    //     return
    // }
    // if(checkLogin(req,res)){return}; 
    // 查询所有数据
    await db.findData('videos').then(data => {
        dataLength = data.length
    })
    // 分页数据查找
    await db.findPageData('videos', page, 7).then(res => {
        data = res
    })
    // req.session.user='测试';
    // console.log(req.session);
    // console.log(data)
    await res.type('html');
    await res.render('list', {
        title:'测试',
        videos: data,
        session: req.session,
        dataLength: Math.ceil(dataLength / 7),
        nowPage:  parseInt(page)
    })
})

// 获取登录页面   有错误，改写在了app.js(登录拦截)
router.get('/signin',async function(req,res,next){
    // await res.type('html');
    // await res.render('index', {title: 'users member'});
    // console.log("1");
    // await res.render('index')
    // console.log(req.session)
    // // req.session.user='1';
    // if (req.session.user) {
    //     console.log('/')
    //     //重定向(位置是views里面的html页面)
    //     await res.redirect('/');
    // } else {
    //     console.log('signin')
    //     //转发(位置是views里面的html页面)
    //     await res.type('html');
    //     await res.render('signin');
    // }
    await res.type('html');
    await res.render('signin');
})

// 登录 post
router.post('/signin', async(req,res,next) => {
    //创建formidable
    var form = new formidable.IncomingForm();
    form.parse(req,async function(error, fields, files) {
        var {userName,password} = fields;
        await db.findUser(userName).then(data => {
            console.log('找到');
            if(password!=data[0].password){
                console.log('密码不一样');
                res.json({
                    code:'false',
                    message:'账号或者密码有错'
                });
            }else{
                console.log('密码一样');
                req.session.user = userName;
                req.session.pass = password;
                res.json({
                    code:'true'
                });
            }
        }).catch(() => {
            console.log('找不到');
            req.session.user = userName;
            req.session.pass = password;
            db.addUser([userName, password]);
            res.json({
                code:'true'
            });
        })
    })
})

// 登出
router.get('/signout', async(req,res,next) => {
    console.log('第一个session');
    console.log(req.session);
    //这个没效果，要改浏览器里面的cookies
    req.session = null;
    console.log('第二个session');
    console.log(req.session);
    await res.redirect('/');
})

// 上传数据
router.get('/upload', async(req,res,next) => {
    await checkLogin(req,res)
    console.log(req.session)
    await res.type('html')
    await res.render('upload', {
        session: req.session
    })
})

// 上传数据 post
router.post('/upload', async(req,res,next) => {
    //随机字符串
    var  x="0123456789qwertyuioplkjhgfdsazxcvbnm";
    var  tmp="";
    for(var  i=0;i<20;i++)  {
        tmp  +=  x.charAt(Math.ceil(Math.random()*100000000)%x.length);
    }
    //创建formidable
    var form = new formidable.IncomingForm();
    //图片路径(临时文件)
    form.uploadDir='\public/temporaryImg';
    form.parse(req,async function(error, fields, files) {
        //数据
        console.log(fields);
        //图片
        console.log(files);
        var {
            videoName,
            videoCountry,
            videoClassify,
            videoTime,
            videoStar,
            videoTimeLong,
            videoType,
            videoActors,
            videoDetail
        } = fields;
        img=tmp;
        //储存图片
        fs.writeFileSync("public/images/"+tmp+".png", fs.readFileSync(files.upload.path));
        //删除临时文件（遍历清空）
        fs.readdir('./public/temporaryImg',function(err,files){
            for(var i=0;i<files.length;i++){
                fs.unlink('./public/temporaryImg/'+files[i],function(err){
                    if(err){
                        console.log(err)
                    }
                })
            }
        });
        var data = [videoName, videoCountry, videoClassify, videoTime,
            img, videoStar, videoTimeLong,
            videoType, videoActors, videoDetail];
        console.log(data);
        //上传数据
        await db.insertData(data).then((resp) => {
            console.log(resp)
            res.json({
                code:200,
                message:'添加成功'
            })
        }).catch(err=>{
            console.log(err)
            res.json({
                code: 500,
                message: '添加失败'
            })
        })
    });
})

// 编辑页面
router.get('/edit/:id', async function(req,res,next){
    await db.findDataById(req.params.id).then(res => {
        // data = JSON.parse(JSON.stringify(res));
        data=res
        console.log(res);
    })
    console.log(req.session);
    await res.type('html')
    await res.render('edit', {
        video: data[0],
        session: req.session
    })
})

// 编辑 post
router.post('/edit/:id',function(req,res,next){
    //随机字符串
    var  x="0123456789qwertyuioplkjhgfdsazxcvbnm";
    var  tmp="";
    for(var  i=0;i<20;i++)  {
        tmp  +=  x.charAt(Math.ceil(Math.random()*100000000)%x.length);
    }
    //创建formidable
    var form = new formidable.IncomingForm();
    //图片路径(临时文件)
    form.uploadDir='\public/temporaryImg';
    form.parse(req,async function(error, fields, files) {
        //数据
        console.log(fields);
        //图片
        console.log(files);
        var {
            file,
            videoName,
            videoCountry,
            videoClassify,
            videoTime,
            videoStar,
            videoTimeLong,
            videoType,
            videoActors,
            videoDetail
        } = fields;
        var img='';
        if(fields.upload=='undefined'){
            img=file;
        }else{
            img=tmp;
            //储存图片
            fs.writeFileSync("public/images/"+tmp+".png", fs.readFileSync(files.upload.path));
            //删除临时文件（遍历清空）
            fs.readdir('./public/temporaryImg',function(err,files){
                for(var i=0;i<files.length;i++){
                    fs.unlink('./public/temporaryImg/'+files[i],function(err){
                        if(err){
                            console.log(err)
                        }
                    })
                }
            });
            //删除之前的图片
            fs.unlink('./public/images/'+file+'.png',function(err){
                if(err){
                    console.log(err)
                }
            })
        };
        var data = [videoName, videoCountry, videoClassify, videoTime,
            img, videoStar, videoTimeLong,
            videoType, videoActors, videoDetail,req.params.id];
        console.log(data);
        // 更改影片信息，喜欢和评论的列表也要相应更新，比如videName
        await db.updateLikeName([videoName,req.params.id])
        await db.updateCommentName([videoName,req.params.id])
        await Promise.all([
            db.updateDataHasImg(data),
            db.updateLikesImg([img,req.params.id])
        ]).then(() => {
            console.log('更新成功')
            res.json({
                code:200,
                message:'修改成功'
            })
        }).catch(e=>{
            res.json({
                code: 500,
                message: '修改失败'
            })
        })
    });
})

// 删除
router.post('/delete/:id',async (req,res,next)=>{
    await db.deleteVideo(req.params.id).then(() => {
        res.json({
            code:200
        })
    }).catch((err) => {
        code:err
    })    
})

// 后台管理员列表
router.get('/adminUser',async(req,res,next)=>{
    var page, dataLength = '';
    if (req.query.page==undefined) {
        page = 1;
    }else{
        //如果出现0甚至出现负数会挂掉
        page = req.query.page>0?req.query.page:1;
    }
    await db.findData('users').then(data => {
        dataLength = data.length;
    })
    await db.findPageData('users', page, 15).then(res => {
        data = res;
    })
    console.log(data);
    await res.type('html');
    await res.render('adminUser', {
        users: data,
        session: req.session,
        dataLength: Math.ceil(dataLength / 15),
        nowPage:  parseInt(page)
    })
})

// 手机端用户列表
router.get('/mobileUser',async(req,res,next)=>{
    var page, dataLength = '';
    if (req.query.page==undefined) {
        page = 1;
    }else{
        //如果出现0甚至出现负数会挂掉
        page = req.query.page>0?req.query.page:1;
    }
    await db.findData('mobileusers').then(data => {
        dataLength = data.length;
    })
    await db.findPageData('mobileusers',page,10).then(res=>{
        data = res;
    })
    // console.log(data)
    await res.type('html');
    await res.render('mobileUser',{
        users:data,
        session:req.session,
        dataLength: Math.ceil(dataLength / 10),
        nowPage:  parseInt(page)
    })
})

// 手机端评论列表
router.get('/comment',async(req,res,next)=>{
    var page, dataLength = '';
    if (req.query.page==undefined) {
        page = 1;
    }else{
        //如果出现0甚至出现负数会挂掉
        page = req.query.page>0?req.query.page:1;
    }
    await db.findData('comments').then(res => {
        dataLength = res.length
    })
    await db.findPageData('comments', page, 7).then(res => {
        data = res
    })
    // console.log(dataLength)
    await res.type('html');
    await res.render('comment', {
        comments: data,
        session: req.session,
        dataLength: Math.ceil(dataLength / 7),
        nowPage:  parseInt(page)
    })
})

// 手机端like列表
router.get('/like',async(req,res,next)=>{
    var page, dataLength = '';
    if (req.query.page==undefined) {
        page = 1;
    }else{
        //如果出现0甚至出现负数会挂掉
        page = req.query.page>0?req.query.page:1;
    }
    await db.findData('likes').then(res => {
        dataLength = res.length
    })
    await db.findPageData('likes', page, 7).then(res => {
        data = res;
    })
    console.log(data)
    await res.type('html');
    await res.render('likes', {
        likes: data,
        session: req.session,
        dataLength: Math.ceil(dataLength / 15),
        nowPage: parseInt(page)
    })
})


module.exports = router;