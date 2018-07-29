module.exports = function(orm, db) {
  var address = db.define("mall_user_address", {
    id: {type: "serial", key: true},
    user_id: Number,
    name: String,
    mobile: String,
    zip_code: String,
    phone_number: String,
    province_id: Number,
    province_name: String,
    city_id: Number,
    city_name: String,
    district_id: Number,
    district_name: String,
    address_name: String,
    is_default: Number,
    status: {type: "number", defaultValue: 0}
  });

  // 保存用户地址
  address.saveUserAddress = (id, params) => {
    return new Promise((resolve, reject) => {
      if(params['is_default'] != 0) {
        address.find({
          user_id: params['user_id'],
          is_default: 1
        }).each(address => {
          address['is_default'] = 0;
        }).save(err => {
          if(err) {
            reject(err);
          }else {
            if(id) { 
              address.find({id: id}).each(address => {
                address['name'] = params['name'];
                address['mobile'] = params['mobile'];
                address['zip_code'] = params['zip_code'];
                address['phone_number'] = params['phone_number'];
                address['province_id'] = params['province_id'];
                address['city_id'] = params['city_id'];
                address['district_id'] = params['district_id'];
                address['province_name'] = params['province_name'];
                address['city_name'] = params['city_name'];
                address['district_name'] = params['district_name'];
                address['address_name'] = params['address_name'];
                address['is_default'] = params['is_default'];
              }).save(err => {
                if(!err) {
                  resolve('用户收件地址修改成功');
                }else {
                  reject('用户收件地址修改失败');
                }
              });
            }else {
              address.create(params, (err, oAddress) => {
                if(!err) {
                  resolve(oAddress);
                }else {
                  reject(err);
                }
              });
            }
          }
        });
      }else {
        if(id) {
          address.find({id: id}).each(address => {
            address['name'] = params['name'];
            address['mobile'] = params['mobile'];
            address['zip_code'] = params['zip_code'];
            address['phone_number'] = params['phone_number'];
            address['province_id'] = params['province_id'];
            address['city_id'] = params['city_id'];
            address['district_id'] = params['district_id'];
            address['province_name'] = params['province_name'];
            address['city_name'] = params['city_name'];
            address['district_name'] = params['district_name'];
            address['address_name'] = params['address_name'];
            address['is_default'] = params['is_default'];
          }).save(err => {
            if(!err) {
              resolve('用户收件地址修改成功');
            }else {
              reject('用户收件地址修改失败');
            }
          });
        }else {
          address.create(params, (err, oAddress) => {
            if(!err) {
              resolve(oAddress);
            }else {
              reject(err);
            }
          });
        }
      }
    });
  }

  /**
   * 获取指定用户的所有收件地址
   * @param {*} userId 
   */
  address.getUserAddressList = (userId, count) => {
    return new Promise((resolve, reject) => {
      if(userId) {
        address.find({user_id: userId, status: 0}, ['is_default', 'Z'], count, (err, arrAddress) => {
          if(!err) {
            resolve(arrAddress);
          }else {
            reject('err');
          }
        });
      }else {
        reject('用户不存在');
      }
    });
  }

  /**
   * 删除指定用户收件地址
   * @param {*} userId 用户 Id
   * @param {*} addressId 用户收件地址 Id
   */
  address.delUserAddress = (userId, addressId) => {
    return new Promise((resolve, reject) => {
      address.find({user_id: userId, id: addressId}, (err, arrAddress) => {
        if(!err && arrAddress.length > 0) {
          arrAddress[0].status = 1;
          arrAddress[0].save(err => {
            if(!err) {
              resolve(addressId);
            }
          });
        }else {
          reject('用户收件地址删除失败');
        }
      });
    });
  }
}
