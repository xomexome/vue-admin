//sql
var db = require('../lib/sql');
//md5
var md5 = require('md5');
//jwt
var jwt = require('jsonwebtoken');
//jwt验证(指定密钥)
var jwt_secret='ddff0a63e06816ddd7b7d2e2ebc1e40205';

var checkLogin =async (req,res,next) => {
    // req.session.user='1';
    if(!req.session || !req.session.user) {
        await res.redirect('/signin');
        return false;
    }
}

var checkToken = (req,res) => {
    //返回指定的HTTP头
    var token = req.get('token');
    // var token=req.body.token || req.query.token || req.headers['authorization'];
    // var data = ctx.require.body;    //这个是kor2写法
    var data = req.body;               //这个是express写法
    //解构赋值
    let {userName} = data;
    console.log('第二个token:'+token);
    console.log('userName:'+userName);
    return new Promise((reslove,reject)=>{
        //验证token
        jwt.verify(token, jwt_secret, (err, decoded) => {
            if (err) {
                console.log(err.name, err.message)
                if (err.message == 'jwt expired'){
                    reject({
                        code: 404,
                        message: '用户权限过期'
                    })
                } else {
                    reject({
                        code: 404,
                        message: '无效的用户权限，请重新登录'
                    })
                }
                /*
                    err = {
                    name: 'TokenExpiredError',
                    message: 'jwt expired',
                    expiredAt: 1408621000
                    }
                */
            } else {
                console.log('token success', decoded)
                if (userName === decoded.userName){
                    reslove({
                        code:200,
                        message:'验证成功'
                    })
                }else{
                    reject({
                        code: 404,
                        message: '用户身份不一致'
                    })
                }
                
            }
        });
    })
}

module.exports={
    checkLogin,
    checkToken
}
