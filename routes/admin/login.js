const express = require("express");
const router = express.Router();

/**
 * 中间件 - 校验用户登陆
 * @param req
 * @param res
 * @param next
 */
const isLogin = function(req, res, next) {
  console.log(req.cookies.sessionid)
  if(!req.session || !req.session.adminUser) {
    res.json({status: false, errMsg: "未登录"});
  }else {
    next();
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
      req.session.adminUser = JSON.stringify(user[0]);
      res.json({status: true, data: user[0]});
    }else {
      res.json({status: false, errMsg: "未登录"});
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
router.get("/logout", userLogout);

exports.islogin = isLogin;
exports.routes = router;
