const express = require("express");
const router = express.Router();
const md5 = require('md5');
const PWD_KEY = 'xxx';

/**
 * 中间件 - 校验用户登陆
 * @param req
 * @param res
 * @param next
 */
const isLogin = function(req, res, next) {
  let params = req.query;

  if(params.async) {
    if(!req.session || !req.session.mallUser) {
      res.json({status: false, errMsg: "未登录"});
    }else {
      res.json({status: true, data: req.session.mallUser});
    }
  }else {
    if(!req.session || !req.session.mallUser) {
      res.json({status: false, errMsg: "未登录"});
    }else {
      next();
    }
  }
}

/**
 * 用户登陆
 * @param req
 * @param res
 */
const userLogin = function(req, res) {
  let userModel = req.models.mall_user;
  let params = {
    mobile: req.body.mobile,
    password: md5(req.body.password + PWD_KEY)
  }

  userModel.getUserByParams(params).then(user => {
    if(user.length > 0) {
      req.session.mallUser = {
        nickName: user[0]['nick_name'],
        email: user[0]['email'],
        mobile: user[0]['mobile'],
        createTime: user[0]['create_time'],
        updateTime: user[0]['update_time']
      };
      res.json({status: true, data: req.session.mallUser});
    }else {
      res.json({status: false, errMsg: "用户名密码有误"});
    }
  }).catch(errMsg => {
    res.json({status: false, errMsg: "未登录"});
  });
}

const userLogout = function(req, res) {
  req.session.mallUser = null;
  res.json({status: true, data: '已注销'})
}

router.post("/login", userLogin);
router.get('/isLogin', isLogin);
router.get("/logout", userLogout);

exports.islogin = isLogin;
exports.routes = router;
