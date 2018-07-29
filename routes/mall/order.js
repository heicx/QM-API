const express = require("express");
const router = express.Router();
const login = require("./login");
const md5 = require('md5');
const utils = require('../../helper/utils');
let userOrder;

/**
 * 创建订单
 * @param {*} req 
 * @param {*} res 
 */
const checkoutOrder = async (req, res) => {
  userOrder = userOrder || req.models.mall_order;
  let orderId = req.body.orderId;
  let userId = req.session.mallUser.userId;
  let params = {
    id: utils.strMD5((userId + utils.randomNums(6) + orderId), 30),
    user_id: userId,
    address_id: req.body.addressId,
    price: req.body.price,
    goods_info: req.body.goodsInfo,
    invoice_type: req.body.invoiceType,
    invoice_title: req.body.invoiceTitle,
    invoice_code: req.body.invoiceCode
  };

  try {
    if(
      params['address_id'] && params['price']
       && params['goods_info'] && params['invoice_type']
    ) {
      res.json({status: true, data: await userOrder.saveOrder(params)});
    }else {
      res.json({status: false, errMsg: '数据保存失败'});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 获取用户订单列表
 * @param {*} req 
 * @param {*} res 
 */
const userOrderList = async (req, res) => {
  userOrder = userOrder || req.models.mall_order;
  let params = {
    user_id: req.session.mallUser.userId
  }
  
  // let orderStatus = req.query.orderStatus;
  // let payStatus   = req.query.payStatus;

  try {
    res.json({status: true, data: await userOrder.getUserOrderList(params)});
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 查询指定用户订单
 * @param {*} req 
 * @param {*} res 
 */
const checkOrder = async (req, res) => {
  userOrder = userOrder || req.models.mall_order;
  let userId = req.session.mallUser.userId;
  let orderId = req.query.orderId;

  try {
    if(userId) {
      res.json({status: true, data: await userOrder.checkUserOrder(userId, orderId)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 取消用户订单
 * @param {*} req 
 * @param {*} res 
 */
const cannelOrder = async (req, res) => {
  userOrder = userOrder || req.models.mall_order;
  let userId = req.session.mallUser.userId;
  let orderId = req.body.orderId;

  try {
    if(userId) {
      res.json({status: true, data: await userOrder.cancelUserOrder(userId, orderId)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

router.use(login.islogin);
router.post('/checkout', checkoutOrder);
router.post('/cancel', cannelOrder);
router.get('/list', userOrderList);
router.get('/check', checkOrder);

module.exports = router;
