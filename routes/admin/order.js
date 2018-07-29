const express = require("express");
const router = express.Router();
const xlsx = require('node-xlsx');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/../../uploadFiles`)
  },
  filename: function (req, file, cb) {
    cb(null, 'file.xlsx')
  }
});
const upload = multer({ storage: storage });
const fs = require('fs');
const login = require("./login");
const moment = require('moment');

let orderModel;

/**
 * 订单查询
 * @param {*} req 
 * @param {*} res 
 */
const searchOrderList = async (req, res) => {
  orderModel = orderModel || req.models.mall_order;

  let { orderId, beginTime, endTime, sendType, payType } = req.query;
  let oParams = {
    orderId: orderId,
    beginTime: beginTime,
    endTime: endTime,
    orderStatus: sendType,
    payStatus: payType
  };

  try {
    if(req.session.adminUser) {
      res.json({status: true, data: await orderModel.checkUserOrderForAdmin(oParams)});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 订单导出
 * @param req
 * @param res
 */
const exportOrderList = async (req, res) => {
  orderModel = orderModel || req.models.mall_order;
  
  const header = [];
  const colsWidth = [];
  let { orderId, beginTime, endTime, sendType, payType } = req.query;
  let oParams = {
    orderId: orderId,
    beginTime: beginTime,
    endTime: endTime,
    orderStatus: sendType,
    payStatus: payType
  };

  // 第一行
  for(let i = 0; i < 26; ++i) {
    header.push({
      s: {c: i, r: 0},
      e: {c: i, r: 0}
    });

    if (i == 0 || i == 5) {
      colsWidth.push({wpx: 240});
    }else {
      colsWidth.push({wpx: 160});
    }
  }

  const data = [
    ['用户订单号', '收件公司', '收件人', '收件电话', '收件手机', '收件详细地址', '托寄物内容', '托寄物数量', '包裹重量', '寄方备注', '运费付款方式', '业务类型', '件数', '代收金额', '保价金额', '标准化包装', '个性化包装', '签回单', '自取件', '易碎件', '电子验收', '超长超重服务费', '是否定时派送', '派送日期', '派送时段', '扩展字段']
  ];

  try {
    if(req.session.adminUser) {
      // res.json({status: true, data: });
      let arrList = await orderModel.checkUserOrderForAdmin(oParams);
      let arrTmp = [];

      for (let item of arrList) {
        data.push([
          item.id, '', item.userName, item.mobile, item.mobile, item.address, 
          '平衡车', item.goodsCount, '', '', '寄付月结', '顺丰次日', item.goodsCount,
          '', '', '', '', '否', '否', '是', '否', '否', '否', '', '', ''
        ]);
      }
      
      const option = {'!merges': header, '!cols': colsWidth, 'cellStyles': true};
      var buffer = xlsx.build([{name: "qmy-data", data: data}], option);

      fs.writeFile(`${__dirname}/../../download/file.xlsx`, buffer, err => {

        console.log('err', err)
        if(!err) {
          let timestamp = moment().format("YY-M-DD hh:mm:ss");
          res.download(`${__dirname}/../../download/file.xlsx`, `qmy-${timestamp}.xlsx`);
        }else {
          res.json({status: false, errMsg: '下载失败'})
        }
      });
    }else {
      res.json({status: false});
    }
  }catch(errMsg) {
    res.json({status: false, errMsg: errMsg});
  }
}

/**
 * 订单导入
 * @param req
 * @param res
 */
const importOrderList = async (req, res) => {
  orderModel = orderModel || req.models.mall_order;
  
  try {
    let arrData = xlsx.parse(`${__dirname}/../../uploadFiles/file.xlsx`);
    let oOrder = null;
    let arrOrderIds = [];

    if (arrData && arrData.length > 0) {
      let tmp = arrData[0];

      if(tmp && tmp.data.length > 0) {
        tmp.data.splice(0, 1);

        for (let line of tmp.data) {
          if (!oOrder)
            oOrder = {}

          if (line[0]) {
            oOrder[line[0]] = {
              id: line[0],
              express_id: line[1],
              express_name: '顺丰快递',
              order_status: 1
            }

            arrOrderIds.push(line[0]);
          }
        }
      }

      try {
        if(req.session.adminUser && oOrder) {
          res.json({status: true, data: await orderModel.updateOrder(arrOrderIds, oOrder)});
          // res.json({status: true})
        } else {
          res.json({status: false, errMsg: '数据导入失败'});
        }
      }catch(errMsg) {
        res.json({status: false, errMsg: errMsg});
      }
    }else {
      res.json({status: false, errMsg: '数据导入失败'});
    }
  } catch(err) {
    console.log('error------->', err);
  }
}

// router.use(login.islogin);

router.get("/export", exportOrderList);
router.get("/search", searchOrderList);
router.post("/import", upload.single('orderFile'), importOrderList);

module.exports = router;
