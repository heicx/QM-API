const express = require("express");
const router = express.Router();
var areaModel;

/**
 * 获取指定城市的列表数据
 * @param {*} req 
 * @param {*} res 
 */
const getCityList = async (req, res) => {
  areaModel = areaModel || req.models.mall_area;
  let provinceId = req.query.p;
  let cityId = req.query.c;

  try {
    if(!provinceId && !cityId) {
      res.json({status: true, data: await areaModel.getProvinceList()});
    }else if(provinceId ) {
      res.json({status: true, data: await areaModel.getCityList(provinceId)});
    }else {
      res.json({status: true, data: await areaModel.getDistrictList(cityId)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 获取指定省市区所有列表数据
 * @param {*} req 
 * @param {*} res 
 */
const getAreaList = async (req, res) => {
  areaModel = areaModel || req.models.mall_area;
  let provinceId = req.query.p;
  let cityId = req.query.c;

  try {
    if(provinceId && cityId) {
      let provinceList = await areaModel.getProvinceList();
      let cityList = await areaModel.getCityList(provinceId);
      let districtList = await areaModel.getDistrictList(cityId);

      res.json({status: true, data: {
        province: provinceList,
        city: cityList,
        district: districtList
      }});
    }else {
      res.json({status: false, errMsg: '数据查询失败'});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }

  res.json({status: true, data: {p: provinceList}});
}

router.get('/city', getCityList);
router.get('/', getAreaList);

module.exports = router;
