var moment = require("moment");
var utils = require("../../helper/utils");

module.exports = function(orm, db) {
	var User = db.define("admin_user", {
		id: {type: "serial", key: true},
		name: String,
		password: String,
		role_id: {type: "integer", defaultValue: 2},
		status: {type: "integer", defaultValue: 1},
		create_time: {type: "date", defaultValue: new Date()},
		update_time: {type: "date", defaultValue: new Date()}
	});

  /**
   * 用户查重
   * @param params
   */
  User.findUserIsExist = async function (params) {
    return new Promise((resolve, reject) => {
      User.find({name: params.name}, (err, user) => {
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
   * 获取用户
   * @param params
   * @returns {promise}
   */
  User.getUser = function(params) {
    var strCondition  = "", arrArgs = [];
    var sql;
    var arrOutput = {
      role_id: {
        keyword: ">"
      }
    }

    utils.ormFilter(params, arrOutput, function(str, arr) {
      strCondition = str ? " where " + str : "";
      arrArgs = arr;
    });

    sql = "select id, name as userName, role_id as roleId, status, DATE_FORMAT(create_time, '%Y-%m-%d') as createTime from admin_user " + strCondition;

    return new Promise((resolve, reject) => {
      db.driver.execQuery(sql, arrArgs, function(err, users) {
        if(!err)
          resolve(users);
        else
          reject("获取用户列表失败");
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
      User.find({name: params.name, password: params.password}, function(err, userData) {
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
            roleId: user['role_id'],
            roleName: user['role_id'] == 1 ? '超级管理员': '管理员',
            status: user['status'] == 1,
            createTime: user['create_time']
          });
        }else
          reject("用户添加失败");
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
        name: params.name
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
          name: params.name,
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
