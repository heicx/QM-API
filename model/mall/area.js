module.exports = function(orm, db) {
    var area = db.define("mall_area", {
        id: Number,
        name: String,
        pid: Number
    });

    // 省
    area.getProvinceList = () => {
      return new Promise((resolve, reject) => {
        area.find({pid: 0, id: orm.gt(0)}, (err, provinceList) => {
          if(!err) {
            resolve(provinceList);
          }else {
            reject('省份数据查询失败');
          }
        });
      });
    }

    // 市
    area.getCityList = (provinceId) => {
      return new Promise((resolve, reject) => {
        area.find({pid: provinceId, id: orm.gt(0)}, (err, cityList) => {
          if(!err) {
            resolve(cityList);
          }else {
            reject('市区数据查询失败');
          }
        });
      });
    }

    // 区县
    area.getDistrictList = (cityId) => {
      return new Promise((resolve, reject) => {
        area.find({pid: cityId, id: orm.gt(0)}, (err, districtList) => {
          if(!err) {
            resolve(districtList);
          }else {
            reject('区县数据查询失败');
          }
        });
      });
    }
}
