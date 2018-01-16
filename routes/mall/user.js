const express = require("express");
const md5 = require('md5');
const router = express.Router();
const login = require("./login");
const SMSClient = require('@alicloud/sms-sdk');
const PWD_KEY = 'xxxx'
const accessKeyId = 'xxxx'
const secretAccessKey = 'xxxx'

let userModel;
let smsClient = new SMSClient({accessKeyId, secretAccessKey});

/**
 * 添加用户
 * @param req
 * @param res
 */
const registerUser = (req, res) => {
  userModel = userModel || req.models.mall_user;

  req.redisClient.get(req.body.mobile, async (err, cache) => {
    if(!cache) {
      res.json({status: false, errMsg: '请重新获取验证码'});
    }else {
      if(req.body.captcha == cache) {
        let params = {
          mobile: req.body.mobile,
          password: md5(req.body.password + PWD_KEY)
        };
      
        // 363596
        try {
          await userModel.findUserIsExist(params);

          const user = await userModel.registerUser(params);
          req.session.mallUser = {
            nickName: user.nickName,
            email: user.email,
            mobile: user.mobile,
            createTime: user.createTime,
            updateTime: user.updateTime
          };
          res.json({status: true, data: user});
        }catch(errMsg) {
          res.json({status: false, errMsg: errMsg});
        }
      }else {
        res.json({status: false, errMsg: '验证码有误，请重新输入'});
      }
    }
  })
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

/**
 * 发送验证码
 * @param req
 * @param res
 */
const sendCaptcha = async (req, res) => {
  let mobile = req.body.mobile;
  let captcha = '';
  
  if(req.body.mobile) {
    req.redisClient.get(req.body.mobile, (err, cache) => {
      if(!cache) {
        captcha = generateCaptcha(6);
        req.redisClient.set(req.body.mobile, captcha, 'EX', 1200);
      }else {
        captcha = cache;
      }

      // //发送短信
      smsClient.sendSMS({
        PhoneNumbers: mobile,
        SignName: '轻麦qmy',
        TemplateCode: 'SMS_86920094',
        TemplateParam: `{"code": ${captcha}}`
      }).then(retMsg => {
        let {Code} = retMsg;

        if (Code === 'OK') {
          //处理返回参数
          res.json({status: true, data: Code});
        }
      }, errMsg => {
        res.json({status: false, errMsg: '请求过于频繁，请您稍后再试'});
      });
    });
  }
}

// 生成验证码
const generateCaptcha = (count) => {
  let captcha = [];
  
  for(let i = 0; i < count; ++i) {
    captcha.push(Math.ceil(Math.random()*9));
  }

  return captcha.join('');
}

router.post("/register", registerUser);
router.post("/modify", login.islogin, modifyUserPass);
router.post("/sendCaptcha", sendCaptcha);

module.exports = router;
