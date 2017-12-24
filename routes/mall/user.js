const express = require("express");
const router = express.Router();
const login = require("./login");

let userModel;

/**
 * 添加用户
 * @param req
 * @param res
 */
const addUser = async (req, res) => {
  userModel = userModel || req.models.mall_user;

  let params = {
    mobile: req.body.mobile,
    password: req.body.password
  };

  try {
    await userModel.findUserIsExist(params);

    res.json({status: true, data: await userModel.addUser(params)});
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}


/**
 * 修改密码
 * @param req
 * @param res
 */
const modifyUserPass = async (req, res) => {
  userModel = userModel || req.models.admin_user;

  let params = {
    mobile: req.body.mobile,
    password: req.body.password,
    password_old: req.body.password_old
  };

  try {
    await userModel.getUserValid(params);

    res.json({status: true, data: await userModel.modifyUserPass(params)});
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}



router.use(login.islogin);

router.post("/add", addUser);
router.post("/modify", modifyUserPass);

module.exports = router;
