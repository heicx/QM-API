const express = require("express");
const md5 = require('md5');
const https = require('https');
const xml2js = require('xml2js');
const qr = require('qr-image');
const router = express.Router();
const login = require("./login");
const utils = require('../../helper/utils');

const signKey = 'xxxxx';

/**
 * 微信统一下单
 * 
 * @param {*} req 
 * @param {*} res 
 */
const checkoutOrder = (req, res) => {
  let strSign = '';
  let obj = {
    appid: 'wx43d2348653cb2419',
    mch_id: '1486588442',
    device_info: 'WEB',
    nonce_str: utils.strMD5(utils.randomNums(4), 32),
    sign_type: 'MD5',
    body: '轻麦科技 Pro1',
    out_trade_no: utils.strMD5(utils.randomNums(8), 32),
    total_fee: 1,
    spbill_create_ip: '111.207.121.248',
    notify_url: 'http://www.qmy.cx/#/overview',
    trade_type: 'NATIVE',
    product_id: '100022201'
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
    path: '/pay/unifiedorder',
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Length': Buffer.byteLength(xml)
    }
  };

  utils.sendHttpsRequest(xml, options, (hRes, errMsg) => {
    let oRet = {
      status: false,
      message: '下单失败'
    };

    if(hRes) {
      let parser = new xml2js.Parser({trim: true});

      hRes.on('data', (chunk) => {
        parser.parseString(chunk, (err, result) => {
          let wechatResp = result.xml;

          if(wechatResp && wechatResp['return_code'][0] === 'SUCCESS') {
            req.session.wechatOrder = {
              status: true,
              appId: wechatResp['appid'][0],
              mchId: wechatResp['mch_id'][0],
              nonceStr: wechatResp['nonce_str'][0],
              prepayId: wechatResp['prepay_id'][0],
              codeUrl: wechatResp['code_url'][0],
              goodsId: obj['product_id'],
              orderId: obj['out_trade_no']
            }

            oRet.status = true;
            oRet.message = '下单成功';
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
  let oRet = { status: false };

  if(req.session.wechatOrder) {
    let strSign = '';
    let obj = {
      appid: 'wx43d2348653cb2419',
      mch_id: '1486588442',
      nonce_str: utils.strMD5(utils.randomNums(4), 32),
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
                  tradeDesc: wechatResp['trade_state_desc'][0]
                }

                if(wechatResp['trade_state'][0] === 'SUCCESS') {
                  oRet.data.orderId = wechatResp['out_trade_no'][0]
                }
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

router.use(login.islogin);
router.get("/", checkoutOrder);
router.get("/qr", createQRImg);
router.get("/search", searchOrder);

module.exports = router;
