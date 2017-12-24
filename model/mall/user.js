var moment = require("moment");
var utils = require("../../helper/utils");

module.exports = function(orm, db) {
	var User = db.define("mall_user", {
		id: {type: "serial", key: true},
		name: String,
		password: String,
    nick_name: String,
    email: String,
		mobile: String,
		create_time: {type: "date", defaultValue: new Date()},
		update_time: {type: "date", defaultValue: new Date()}
	});

  /**
   * 用户查重
   * @param params
   */
  User.findUserIsExist = async function (params) {
    return new Promise((resolve, reject) => {
      User.find({mobile: params.mobile}, (err, user) => {
        if(!err) {
          if(user.length > 0) {
            reject('用户已存在');
          }else {
            resolve(user);
          }
        }else {
          reject('用户查询失败');
        }
      });
    });
  }

  /**
   * 通过用户名密码获取用户信息
   * @param params
   * @returns {promise}
   */
  User.getUserByParams = function(params) {
    return new Promise((resolve, reject) => {
      User.find({mobile: params.mobile, password: params.password}, function(err, userData) {
        if(!err)
          resolve(userData);
        else
          reject("获取用户信息失败");
      });
    });
  }

  /**
   * 添加用户
   * @param params
   * @returns {promise}
   */
  User.addUser = function(params) {
    return new Promise((resolve, reject) => {
      User.create(params, function(err, user) {
        if(user) {
          user.create_time = moment(user.create_time).format("L");
          user.update_time = moment(user.update_time).format("L");
  
          resolve({
            name: user['name'],
            nickName: user['nick_name'],
            email: user['email'],
            mobile: user['mobile'],
            createTime: user['create_time'],
            updateTime: user['update_time']
          });
        }else
          reject("用户注册失败");
      });
    });
  }
    
    
  /**
   * 修改密码
   * @param params
   * @returns {promise}
   */
  User.modifyUserPass =function(params){
    return new Promise((resolve, reject) => {
      User.find({
        mobile: params.mobile
      }, function (err, user) {
        if (!err) {
          user[0].password = params.password;
          user[0].save(function (err) {
            if (!err){
              resolve("修改成功");
            }
            else
              reject("修改密码失败");
          });
        } else {
          reject("用户不存在");
        }
      });
    });
  }
    
  /**
   * 通过用户名密码返回旧密码输入是否正确
   * @param params
   * @returns {promise}
   */
	User.getUserValid = function (params) {
    return new Promise((resolve, reject) => {
      User.find({
          mobile: params.mobile,
          password: params.password_old
      }, function (err, user) {
          if (!err) {
            if(user.length > 0) {
              resolve();
            }else{ 
              reject("旧密码输入错误");
            }
          } else {
            reject("获取用户信息失败");
          }
      });
    });
	}
}
