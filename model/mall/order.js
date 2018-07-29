const utils = require('../../helper/utils');

let moment = require('moment');

module.exports = function(orm, db) {
  let order = db.define("mall_order", {
    id: String,
    user_id: Number,
    address_id: Number,
    price: Number,
    goods_info: String,
    order_status: {type: "number", defaultValue: 0},
    express_id: {type: "text", defaultValue: ''},
    express_name: {type: "text", defaultValue: ''},
    pay_status: {type: "number", defaultValue: 0},
    pay_type: {type: "text", defaultValue: ''},
    invoice_type: Number,
    invoice_title: String,
    invoice_code: String,
    create_time: {type: "date", defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")},
    update_time: {type: "date", defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")}
  });

  // 保存用户订单
  order.saveOrder = (params) => {
    return new Promise((resolve, reject) => {
      order.create(params, (err, oOrder) => {
        if(!err) {
          resolve({
            id: oOrder.id,
            createTime: oOrder['create_time'],
            orderStatus: oOrder['order_status'],
            payStatus: oOrder['pay_status']
          });
        }else {
          reject(err);
        }
      });
    });
  }

  // 保存用户订单
  order.updateOrder = (arrIds, params) => {
    return new Promise((resolve, reject) => {
      if(params) {
        let sql = '';
        let oFields = {
          arrCondition: arrIds,
          tableName: 'mall_order',
          caseName: 'id',
          setFieldsName: ['express_id', 'express_name', 'order_status']
        }

        utils.batchUpdateFilter(oFields, params, (str) => {
          sql = str;
        });

        try {
          db.driver.execQuery(sql, [], (err, result) => {
            if(!err) {
              resolve({result: result});
            }else {
              resolve({});
            }
          });
        } catch(err) {
          console.log(err)
        }
      }else {
        resovle({})
      }
    });
  }

  /**
   * 获取当前用户所有订单
   * eg: 待支付 | 已支付 ；待发货 | 已发货 | 已取消 | 已完成 | 全部
   * @param {*} obj 
   */
  order.getUserOrderList = (params) => {
    return new Promise((resolve, reject) => {
      if(params['user_id']) {
        order.find(params, ['create_time', 'Z'], (err, arrOrderList) => {
          if(!err) {
            resolve(arrOrderList.map(item => {
              item['create_time'] = moment(item['create_time']).format("YYYY-MM-DD");
              item['update_time'] = moment(item['update_time']).format("YYYY-MM-DD");
              item['goods_info'] = JSON.parse(item['goods_info']);

              return item;
            }));
          }else {
            reject(err);
          }
        });
      }else {
        reject('用户不存在');
      }
    });
  }

    /**
   * 查询指定用户订单
   * @param {*} userId  用户Id
   * @param {*} orderId 订单Id
   */
  order.checkUserOrder = (userId, orderId) => {
    return new Promise((resolve, reject) => {
      if(userId) {
        let params = {
          user_id: userId,
          id: orderId
        };
        let arrOutput = {
          user_id: 'a',
          id: 'a'
        }

        let strCondition = '', arrArgs = [];
        let sql = '';

        utils.ormFilter(params, arrOutput, (str, arr) => {
          strCondition = str ? " where " + str : "";
          arrArgs = arr;
        });

        sql = 'SELECT a.*, b.name as user_name, b.mobile, b.province_name, '
           + 'b.city_name, b.district_name, b.address_name from mall_order a '
           + 'LEFT JOIN mall_user_address b ON a.user_id = b.user_id '
           + strCondition + ' GROUP BY a.id';

        db.driver.execQuery(sql, arrArgs, (err, result) => {
          if(!err && result.length > 0) {
            result[0]['create_time'] = moment(result[0]['create_time']).format("YYYY-MM-DD");
            result[0]['update_time'] = moment(result[0]['update_time']).format("YYYY-MM-DD");
            result[0]['goods_info'] = JSON.parse(result[0]['goods_info']);
            
            resolve(result[0]);
          }else {
            reject('订单不存在');
          }
        });
      }else {
        reject('用户不存在');
      }
    });
  }

  /**
   * 用户订单查询
   * @param {*} params 
   */
  order.checkUserOrderForAdmin = (params = {}) => {
    let { orderId, beginTime, endTime, orderStatus, payStatus } = params;
    let oParams = {};

    return new Promise((resolve, reject) => {
      if (beginTime && endTime) {
        oParams = {
          create_begin_time: beginTime,
          create_end_time: endTime
        };
      }

      if(orderId) {
        oParams.id = orderId;
      }
      
      if(orderStatus !== undefined && orderStatus >= -1) {
        oParams['order_status'] = orderStatus;
      }

      if(payStatus !== undefined && payStatus >= -1) {
        oParams['pay_status'] = payStatus;
      }

      let arrOutput = {
        id: 'a',
        create_begin_time: {
          keyword: ">",
          prefix: "a",
          mapsTo: 'create_time'
        },
        create_end_time: {
          keyword: "<",
          prefix: "a",
          mapsTo: 'create_time'
        },
        order_status: 'a',
        pay_status: 'a'
      }

      let strCondition = '', arrArgs = [];
      let sql = '';

      utils.ormFilter(oParams, arrOutput, (str, arr) => {
        strCondition = str ? " where " + str : "";
        arrArgs = arr;
      });

      sql = 'SELECT a.*, b.name as user_name, b.mobile, b.province_name, '
          + 'b.city_name, b.district_name, b.address_name, b.phone_number, b.zip_code from mall_order a '
          + 'LEFT JOIN mall_user_address b ON a.user_id = b.user_id and a.address_id = b.id '
          + strCondition + ' GROUP BY a.id ORDER BY a.create_time ASC';

      db.driver.execQuery(sql, arrArgs, (err, result) => {
        if (!err && result.length > 0) {
          let arrRes = [];

          for(let order of result) {
            let oRet = {
              id: order.id,
              userName: order['user_name'],
              mobile: order['mobile'],
              phoneNumber: order['phone_number'],
              address: `${order['city_name']} ${order['district_name']} ${order['address_name']}`,
              zipCode: order['zip_code'],
              price: order['price'],
              expressId: order['express_id'] || '暂无',
              expressName: order['express_name'] || '暂无',
              createTime: moment(order['create_time']).format("YYYY-MM-DD HH:mm:ss"),
              updateTime: moment(order['update_time']).format("YYYY-MM-DD HH:mm:ss"),
              goodsCount: 0
            }
            
            switch (order['order_status']) {
              case -1:
                oRet.orderStatus = '取消订单';
                break;
              case 0:
                oRet.orderStatus = '未发货';
                break;
              case 1:
                oRet.orderStatus = '已发货';
                break;
              case 2:
                oRet.orderStatus = '已完成';
                break;
              case 3:
                oRet.orderStatus = '已退货';
                break;
            }

            switch (order['pay_status']) {
              case 0:
                oRet.payStatus = '未支付';
                break;
              case 1:
                oRet.payStatus = '已支付';
                break;
              case 2:
                oRet.payStatus = '已退款';
                break;
            }

            switch (order['pay_type']) {
              case 'wechat':
                oRet.payType = '微信支付';
                break;
              case 'alipay':
                oRet.payType = '支付宝';
                break;
              default:
                oRet.payType = '暂无';
            }

            let goods = JSON.parse(order['goods_info']);
            for(let sku of goods) {
              oRet.goodsCount += Number(sku.num);
            }

            oRet.goodsName = `平衡车 x ${oRet.goodsCount}`;

            arrRes.push(oRet);
          }

          resolve(arrRes);
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * 更新用户订单状态
   * @param {*} params 
   */
  order.updateUserOrder = (params) => {
    return new Promise((resolve, reject) => {
      order.find({ id: params.orderId }, (err, arrOrder) => {
        if(!err && arrOrder.length > 0) {
          arrOrder[0]['pay_status'] = 1;
          arrOrder[0]['pay_type'] = params.payType;
          arrOrder[0]['update_time'] = moment().format("YYYY-MM-DD HH:mm:ss");

          arrOrder[0].save(err => {
            if(!err) {
              resolve({
                id: arrOrder[0].id,
                payType: arrOrder[0]['pay_type'],
                payStatus: arrOrder[0]['pay_status'],
                updateTime: arrOrder[0]['update_time']
              });
            }else {
              reject('订单更新失败');
            }
          });
        }else {
          reject('订单不存在');
        }
      });
    });
  }

  /**
   * 取消订单
   * @param {*} params 
   */
  order.cancelUserOrder = (userId, orderId) => {
    return new Promise((resolve, reject) => {
      order.find({ id: orderId, user_id: userId }, (err, arrOrder) => {
        if(!err && arrOrder.length > 0) {
          arrOrder[0]['order_status'] = -1;
          arrOrder[0]['update_time'] = moment().format("YYYY-MM-DD HH:mm:ss");

          arrOrder[0].save(err => {
            if(!err) {
              resolve({
                orderId: arrOrder[0]['id']
              });
            }else {
              reject('订单取消失败');
            }
          });
        }else {
          reject('订单不存在');
        }
      });
    });
  }
}
