const express = require("express");
const router = express.Router();
const login = require("./login");
var userAddress;

/**
 * 获取指定省市区所有列表数据
 * @param {*} req 
 * @param {*} res 
 */
const saveUserAddress = async (req, res) => {
  userAddress = userAddress || req.models.mall_user_address;
  let addressId = req.body.addressId;
  let params = {
    user_id: req.session.mallUser.userId,
    name: req.body.userName,
    mobile: req.body.mobile,
    zip_code: req.body.zipCode || '',
    phone_number: req.body.phoneNumber || '',
    province_id: req.body.provinceId,
    city_id: req.body.cityId,
    district_id: req.body.districtId,
    province_name: req.body.provinceName,
    city_name: req.body.cityName,
    district_name: req.body.districtName,
    address_name: req.body.address,
    is_default: req.body.isDefault || 0
  };

  try {
    if(
      params['user_id'] && params['mobile'] && 
      params['province_id'] && params['city_id'] &&
      params['district_id'] && params['address_name']
    ) {
      res.json({status: true, data: await userAddress.saveUserAddress(addressId, params)});
    }else {
      res.json({status: false, errMsg: '数据保存失败'});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 用户收件地址列表
 * @param {*} req 
 * @param {*} res 
 */
const userAddressList = async (req, res) => {
  userAddress = userAddress || req.models.mall_user_address;
  let userId = req.session.mallUser.userId;
  let count = req.params.count || 3;

  try {
    if(userId) {
      res.json({status: true, data: await userAddress.getUserAddressList(userId, count)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 删除用户收件地址
 * @param {*} req 
 * @param {*} res 
 */
const delUserAddress = async (req, res) => {
  userAddress = userAddress || req.models.mall_user_address;
  let userId = req.session.mallUser.userId;
  let addressId = req.body.addressId;

  try {
    if(userId) {
      res.json({status: true, data: await userAddress.delUserAddress(userId, addressId)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

router.use(login.islogin);
router.post('/save', saveUserAddress);
router.get('/list', userAddressList);
router.post('/del', delUserAddress);

module.exports = router;
