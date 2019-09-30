//router
var express = require('express');
var router = express.Router();

var path = require('path');
//md5
var md5 = require('md5');
//jwt
var jwt = require('jsonwebtoken');
var checkToken = require('../middlewares/check.js').checkToken;
//sql
var db = require('../lib/sql.js')
//jwt验证(指定密钥)
var jwt_secret='ddff0a63e06816ddd7b7d2e2ebc1e40205';
var fs = require('fs')
//获取时间
var moment = require('moment')

//储存手机端用户信息
router.post('/signin',async (req,res,next)=>{
    var data=req.body;
    data=typeof data=='string' ?JSON.parse(data):data;
    var name=data.userName;
    var pass=data.password;
    var token=jwt.sign({
        userName:name
    },jwt_secret,{
        expiresIn:'30 days'
    });
    await db.findMobileUserByName(name).then(data=>{
        if(data[0]['userName']===name&&data[0]['password']===pass){
            res.json({
                code:200,
                avator:data[0]['avator'],
                token:token,
                message: '登录成功'
            })
        }else{
            res.json({
                code:500,
                message: '用户名或密码错误'
            })
        }
    }).catch(err=>{
        res.json({
            code:201,
            message:'注册成功'
        })
        db.addMobileUser([name, pass, moment().format('YYYY-MM-DD HH:mm')])
    })
})

//获取三个列表的数据
router.get('/list',async function(req,res,next){
    // var data;
    await Promise.all([
        db.findDataByCls('电影'),
        db.findDataByCls('电视剧'),
        db.findDataByCls('综艺'),
        db.findData('videos')
    ]).then(data=>{
        // data=res;
        res.json({
            code:200,
            data:data,
            message:'获取成功'
        })
    }).catch(err=>{
        res.json({
            code:500,
            message:'获取失败'
        })
    })
    // await res.json({
    //     code: 200,
    //     data: data,
    //     message:'获取列表成功'
    // })
})

// 获取单个id的信息
router.post('/getVideoById',async (req,res,next) => {
    var id = req.body.videoId
    // console.log('id',id)
    await Promise.all([
        db.getDataById(id),
        db.getLikeStar(1,id),
        db.getUidLikeLength(id)
    ]).then(data => {
        res.json({
            code: 200,
            data: data,
            message: '获取详情成功'
        })
    }).catch(err=>{
        res.json({
            code: 500,
            message: '获取详情失败'
        })
    })
})

// 获取文章的评论
router.post('/getVideoComment',async (req,res,next) => {
    // console.log(ctx.request.body)
    await db.getCommentById(req.body.videoId).then(data => {
        res.json({
            code:200,
            data:data,
            message:'获取评论成功'
        })
    }).catch(err=>{
        res.json({
            code: 500,
            message: '获取评论失败'
        })
    })
})

// 获取用户的评论
router.post('/getUserComment',async (req,res,next) => {
    await db.getCommentByUser(req.body.userName).then(data => {
        res.json({
            code: 200,
            data: data,
            message: '获取用户的评论成功'
        })
    }).catch(err=>{
        res.json({
            code: 500,
            message: '获取用户的评论失败'
        })
    })
})

// 评论
router.post('/postComment',async (req,res,next) => {
    var {userName,content,videoName,avator,videoId} = req.body
    var date = moment().format('YYYY-MM-DD HH:mm:ss');
    await checkToken(req,res).then(async data=>{
        // console.log(res)
        await db.addComment([userName, date, content, videoName, videoId, avator]).then(data => {
            // console.log(res)
            res.json({
                code: 200,
                message: '评论成功'
            })
        }).catch(err=>{
            res.json({
                code: 500,
                message: '评论失败'
            })
        })
    }).catch(err=>{
        // console.log(err)
        res.json({
            err
        })
        return
    })
})

// 删除评论
router.post('/deleteComment',async (req,res,next) => {
    await checkToken(req,res).then(async data => {
        // console.log(res)
        await db.deleteComment(req.body.commentId).then(data => {
            // console.log(res, '删除成功')
            res.json({
                code: 200,
                message: '删除成功'
            })
        }).catch(err=>{
            res.json({
                code: 500,
                message: '删除失败'
            })
        })
    }).catch(err => {
        // console.log(err)
        res.json({
            err
        })
    })
})

// 点击喜欢
router.post('/postUserLike',async (req,res,next) => {
    var {userName,like,videoName,videoId,videoImg,star} = req.body;
    var newStar;
    await checkToken(req,res).then(async data => {
        // let newStar
        await db.addLike([like, userName, videoName, videoImg, star, videoId])
        // 修改评分
        await Promise.all([
            db.getLikeStar(1, videoId),
            db.getUidLikeLength(videoId)
        ]).then(async data => {
            console.log(data)
            newStar = (data[0][0]['count(*)'] / data[1][0]['count(*)'] * 10).toFixed(1)
            console.log('newStar', newStar)
        })
        await Promise.all([
            db.updateVideoStar([newStar, videoId]),
            db.updateLikeStar([newStar, videoId])
        ]).then(data=>{
            res.json({
                code: 200,
                message: '评分成功'
            })
        }).catch(err=>{
            res.json({
                code: 500,
                message: '评分失败'
            })
        })
    }).catch(err => {
        // console.log(err)
        res.json({
            message: err
        })
    })
})

// 获取单个video的like信息
router.post('/getUserSingleLike',async (req,res,next) => {
    //解构赋值
    var {userName,videoId} = req.body
    await db.getLike(userName, videoId).then(data => {
        res.json({
            code: 200,
            data:data,
            message:'获取单个video成功'
        })
    }).catch(err=>{
        res.json({
            code: 500,
            message: '获取单个video失败'
        })
    })
})

//获取个人like列表
router.post('/getUserLikeData',async (req,res,next)=>{
    var user=req.body.userName;
    await Promise.all([
        db.getLikeList(user,'1'),
        db.getLikeList(user,'2')
    ]).then(data=>[
        res.json({
            code:200,
            data:data,
            message:'获取个人like列表成功'
        })
    ]).catch(err=>{
        res.json({
            message:err
        })
        console.log(err);
    })
})

//修改用户名
router.post('/editUserName',async (req,res,next)=>{
    var userName=req.body.userName;
    var newName=req.body.newName;
    var userExist=false;
    await checkToken(req,res).then(async (res)=>{
        await db.findMobileUserByName(newName).then(data=>{
            if(data.length==0){
                userExist=false;
            }else{
                userExist=true;
            }
        })
        if(!userExist){
            var password='';
            await Promise.all([
                db.findMobileUserByName(userName),
                db.updateMobileName([newName, userName]),
                db.updateMobileCommentName([newName, userName]),
                db.updateMobileLikeName([newName, userName])
            ]).then(data=>{
                password=Object.assign(data[0][0]).password;
                var nowToken=jwt.sign({
                    userName:newName
                },jwt_secret,{
                    expiresIn:'30 days'
                });
                res.json({
                    code: 200,
                    token: nowToken,
                    message: '用户名修改成功'
                })
            }).catch(err=>{
                res.json({
                    code:500,
                    message:'用户名修改失败'
                })
            })
        }else{
            res.json({
                coda:500,
                message:'用户名存在'
            })
        }
    }).catch(err=>{
        res.json({
            err
        });
        return;
    })
})

//获取头像
router.post('/getUserAvator',async (req,res,next)=>{
    await db.findMobileUserByName(req.body.userName).then(data=>{
        if(data.length>=1){
            res.json({
                code:200,
                //克隆对象
                avator:Object.assign({},data[0]).avator,
                message:'获取头像成功'
            })
        }else{
            res.json({
                code:200,
                avator:'',
                message:'还没上传头像'
            })
        }
    }).catch(err=>{
        res.json({
            message:err
        })
    })
})

//增加头像
router.post('/uploadAvator',async (req,res,next)=>{
    var userName=req.body.userName;
    var avator=req.body.avator;
    //换一个与正则表达式匹配的子串
    var base64Data=avator.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer=Buffer.from(base64Data,'base64');
    var getName=Number(Math.random().toString().substr(3)).toString(36)+Date.now();
    console.log('第一个token:'+req.get('token'))
    await checkToken(req,res).then(async (data)=>{
        var uploadDone=await new Promise((reslove,reject)=>{
            fs.writeFile('./public/images/'+getName+'.png',dataBuffer,(err)=>{
                if(err){
                    console.log(err)
                    reject(false)
                }
                reslove(true)
            })
        })
        if(uploadDone){
            await Promise.all([
                db.updateMobileAvator([getName,userName]),
                db.updateMobileCommentAvator([getName,userName])
            ]).then(data=>{
                res.json({
                    code:200,
                    avator:getName,
                    message:'上传成功'
                })
            }).catch(err=>{
                res.json({
                    code:500,
                    message:'上传失败'
                })
            })
        }
    }).catch(err=>{
        res.json({
            message:err
        })
        // console.log(err)
    })
})

//验证码
router.get('/getYzm',async(req,res,next)=>{
    var captcha = require('trek-captcha');
    var {token,buffer}=await captcha({size:4});
    var getYzm=null;
    getYzm=await new Promise((reslove,reject)=>{
        fs.createWriteStream('./public/images/yzm.jpg').on('finish',()=>{
            console.log(token);
            reslove(true);
        }).end(buffer);
    })
    if(getYzm){
        res.json({
            code:200,
            data:token,
            message:'获取验证码成功'
        })
    }else{
        res.json({
            code:200,
            data:token,
            message:'获取验证码失败'
        })
    }
})

// 搜索
router.post('/search', async(req,res,next)=>{
    var val = req.body.val;
    // console.log(val)
    await db.search(val).then(data=>{
        console.log(data);
        res.json({
            coda:200,
            data:data,
            message:'获取搜索成功',
            total:data.length
        })
    }).catch(err=>{
        console.log(err);
        res.json({
            code:500,
            message:'获取失败',
            err:err
        })
    })
})

module.exports = router;