const express = require("express");
const md5 = require('md5');
const https = require('https');
const xml2js = require('xml2js');
const qr = require('qr-image');
const router = express.Router();
const login = require("./login");
const utils = require('../../helper/utils');
const signKey = '223C983298C1DC3A3FE2DBF33CB018BC';
let userOrder;

/**
 * 微信统一下单，生成支付码
 * 
 * @param {*} req 
 * @param {*} res 
 */
const payOrder = (req, res) => {
  let orderId = req.body.orderId || '';
  let title = req.body.orderTitle;
  let totalFee = req.body.totalPrice;
  let userId = req.session.mallUser.userId;
  let strSign = '';
  let wxParams = {
    appid: 'wx43d2348653cb2419',
    mch_id: '1486588442',
    device_info: 'WEB',
    nonce_str: utils.strMD5(utils.randomNums(4), 30),
    sign_type: 'MD5',
    body: title,
    out_trade_no: orderId,
    total_fee: 1,
    // total_fee: totalFee * 100,
    spbill_create_ip: '111.207.121.248',
    notify_url: 'http://api.qmy.cx/mall/payment/result',
    trade_type: 'NATIVE',
    product_id: 'SWAN'
  }

  wxParams = utils.objKeySort(wxParams);
  
  for(let key in wxParams) {
    strSign += `${key}=${wxParams[key]}&`;
  }

  // sign 验签
  strSign += `key=${signKey}`;
  wxParams.sign = md5(strSign).toUpperCase();

  const builder = new xml2js.Builder({rootName: 'xml', cdata: true});
  const xml = builder.buildObject(wxParams);

  const options = {
    hostname: 'api.mch.weixin.qq.com',
    path: '/pay/unifiedorder',
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(xml)
    }
  };

  utils.sendHttpsRequest(xml, options, (hRes, errMsg) => {
    let oRet = { status: false };

    if(hRes) {
      let parser = new xml2js.Parser({trim: true});

      hRes.on('data', (chunk) => {
        parser.parseString(chunk, (err, result) => {
          let wechatResp = result.xml;

          if(wechatResp && wechatResp['return_code'][0] === 'SUCCESS') {

            if(wechatResp['result_code'][0] === 'SUCCESS') {
              req.session.wechatOrder = {
                status: true,
                appId: wechatResp['appid'][0],
                mchId: wechatResp['mch_id'][0],
                nonceStr: wechatResp['nonce_str'][0],
                prepayId: wechatResp['prepay_id'][0],
                codeUrl: wechatResp['code_url'][0],
                goodsId: wxParams['product_id'],
                orderId: wxParams['out_trade_no']
              }
  
              oRet.status = true;
            }else {
              oRet.errMsg = `${wechatResp['err_code'][0]} | ${wechatResp['err_code_des'][0]}`;
            }
          }

          res.json(oRet);
        });
      });
    }else {
      res.json(oRet);
    }
  });
}

/**
 * 生成微信支付二维码
 * 
 * @param {*} req 
 * @param {*} res 
 */
const createQRImg = (req, res) => {
  if(req.session.wechatOrder) {
    if(req.session.wechatOrder.codeUrl) {
      let code = qr.image(req.session.wechatOrder.codeUrl, {type: 'png'});

      res.setHeader('content-type', 'image/png');
      code.pipe(res);
    }
  }
}

/**
 * 微信支付订单查询
 * 
 * @param {*} req 
 * @param {*} res 
 */
const searchOrder = (req, res) => {
  let oRet = {
    status: false,
    message: '查询失败'
  };

  if(req.session.wechatOrder) {
    let strSign = '';
    let obj = {
      appid: 'wx43d2348653cb2419',
      mch_id: '1486588442',
      nonce_str: utils.strMD5(utils.randomNums(4), 30),
      sign_type: 'MD5',
      out_trade_no: req.session.wechatOrder.orderId
    }

    obj = utils.objKeySort(obj);
    
    for(let key in obj) {
      strSign += `${key}=${obj[key]}&`;
    }

    // sign 验签
    strSign += `key=${signKey}`;
    obj.sign = md5(strSign).toUpperCase();

    const builder = new xml2js.Builder({rootName: 'xml', cdata: true});
    const xml = builder.buildObject(obj);
    const options = {
      hostname: 'api.mch.weixin.qq.com',
      path: '/pay/orderquery',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(xml)
      }
    };

    utils.sendHttpsRequest(xml, options, (hRes, errMsg) => {
      if(hRes) {
        let parser = new xml2js.Parser({trim: true});

        hRes.on('data', (chunk) => {
          parser.parseString(chunk, (err, result) => {
            let wechatResp = result.xml;

            if(wechatResp && wechatResp['return_code'][0] === 'SUCCESS') {
              oRet.status = true;
              
              if(wechatResp['result_code'][0] !== 'SUCCESS') {
                oRet.status = false;
                oRet.message = `${wechatResp['err_code'][0]} | ${wechatResp['err_code_des'][0]}`;
              }else {
                oRet.data = {
                  tradeState: wechatResp['trade_state'][0],
                  tradeDesc: wechatResp['trade_state_desc'] ? wechatResp['trade_state_desc'][0] : ''
                }

                if(wechatResp['trade_state'][0] === 'SUCCESS') {
                  oRet.data.orderId = wechatResp['out_trade_no'][0]
                }

                oRet.message = wechatResp['return_msg'];
              }
            }else {
              oRet.message = wechatResp['return_msg'];
            }

            res.json(oRet);
          });
        });
      }else {
        res.json(oRet);
      }
    });
  }else {
    res.json(oRet);
  }
}

/**
 * 查询微信支付回调结果
 * @param {*} req 
 * @param {*} res 
 */
const checkPaymentStatus = (req, res) => {
  let oRet = { status: false };

  console.log('------');
  console.log(req.session.wechatOrder);
  if(req.session.wechatOrder) {
    req.redisClient.get(req.session.wechatOrder.orderId, (err, cache) => {
      cache && (oRet.status = true);

      res.json(oRet);
    });
  } else {
    res.json(oRet);
  }
}

/**
 * 微信支付结果回调
 */
const checkOrderResult = async (req, res) => {
  userOrder = userOrder || req.models.mall_order;
  let payInfo = req.body.xml || {};
  let attach  = payInfo.attach;
  let oRet = { status: false };

  if(payInfo['result_code'] === 'SUCCESS') {
    req.redisClient.get(payInfo['out_trade_no'], async (err, cache) => {
      if(!cache) {
        oRet.status = true;
        oRet.data = attach;
        
        let params = {
          orderId: payInfo['out_trade_no'],
          payType: 'wechat'
        };
    
        // 更新订单信息
        try {
          // 订单信息 redis 缓存 15 分钟
          req.redisClient.set(payInfo['out_trade_no'], 'SUCCESS', 'EX', 900);
    
          res.json({status: true, data: await userOrder.updateUserOrder(params)});
        }catch(errMsg) {
          res.json({status: false, errMsg: errMsg});
        }
      }
    });
  }else {
    oRet.message = '微信订单未支付';
  }

  res.json(oRet);
}

router.post("/", login.islogin, payOrder);
router.get("/qr", login.islogin, createQRImg);
// router.post("/search", login.islogin, searchOrder);
router.post("/check", login.islogin, checkPaymentStatus);
router.post("/result", checkOrderResult);

module.exports = router;
