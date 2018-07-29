const express = require("express");
const router = express.Router();

/**
 * 中间件 - 校验用户登陆
 * @param req
 * @param res
 * @param next
 */
const isLogin = function(req, res, next) {
  let params = req.query;

  if(params.async) {
    if(!req.session || !req.session.adminUser) {
      res.json({status: false, errMsg: "未登录"});
    }else {
      res.json({status: true, data: req.session.adminUser});
    }
  }else {
    if(!req.session || !req.session.adminUser) {
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
  let userModel = req.models.admin_user;
  let params = {
    name: req.body.name,
    password: req.body.password
  }

  userModel.getUserByParams(params).then(user => {
    if(user.length > 0) {
      req.session.adminUser = {
        name: user[0]['name'],
        roleId: user[0]['role_id'],
        roleName: user[0]['role_id'] == 1 ? '超级管理员': '管理员',
        status: user[0]['status'] == 1,
        createTime: user[0]['create_time']
      };
      res.json({status: true, data: req.session.adminUser});
    }else {
      res.json({status: false, errMsg: "用户名密码有误"});
    }
  }).catch(errMsg => {
    res.json({status: false, errMsg: "未登录"});
  });
}

const userLogout = function(req, res) {
  req.session.destroy();
  res.json({status: true, data: '已注销'})
}

router.post("/login", userLogin);
router.get('/isLogin', isLogin);
router.get("/logout", userLogout);

exports.islogin = isLogin;
exports.routes = router;
