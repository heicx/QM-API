const express = require("express");
const router = express.Router();
const xlsx = require('node-xlsx');
const fs = require('fs');
const login = require("./login");

let orderModel;

/**
 * 获取用户
 * @param req
 * @param res
 */
const exportOrderList = (req, res) => {
  // userModel = userModel || req.models.admin_user;

  // let params = { role_id: '1' };

  // userModel.getUser(params).then(users => {
  //   if(users) res.json({status: true, data: users});
  // }).catch(errMsg => {
  //   res.json({status: false, errMsg: errMsg});
  // });

  // const data = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']];
  // const range = ; // A1:A4
  // {
  //   s: {c: 0, r:0 },
  //   e: {c:0, r:3}
  // },

  const header = [
    // 第一行
    {
      s: {c: 0, r: 0 },
      e: {c: 0, r: 2}
    },
    {
      s: {c: 1, r: 0},
      e: {c: 5, r: 0}
    },
    {
      s: {c: 6, r: 0 },
      e: {c: 47, r: 0}
    }
  ]

  // 第二行
  for(let i = 1; i <= 47; ++i) {
    header.push({
      s: {c: i, r: 1},
      e: {c: i, r: 2}
    });
  }

  const data = [
    ['用户订单号', '收件方信息', null, null, null, null, '运单其它信息'],
    [null, '收件公司', '联系人', '联系电话', '手机号码', '收件详细地址', '付款方式', '第三方付月结卡号', '托寄物内容', '托寄物数量', '件数', 
     '实际重量（KG）', '计费重量（KG）', '业务类型', '是否代收货款', '代收货款金额', '代收卡号', '是否保价', '保价金额', '标准化包装（元）',
     '其它费用（元）', '个性化包装（元）', '是否自取', '是否签回单', '是否定时派送', '派送日期', '派送时段', '是否电子验收', '拍照类型',
     '是否保单配送', '是否拍照验证', '是否保鲜服务', '是否易碎件', '是否票据专送', '是否超长超重服务', '超长超重服务费', '收件员', '寄方签名',
     '寄件日期', '签收短信通知(MSG)', '派件短信通知(SMS)', '寄方客户备注', '长(cm)', '宽(cm)', '高(cm)', '扩展字段1', '扩展字段2', '扩展字段3']
  ];

  const colsWidth = [{wpx: 170}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 110}, {wpx: 750},
    {wpx: 100}, {wpx: 100}, {wpx: 270}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, 
    {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, 
    {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 50}, {wpx: 100}, {wpx: 100}, {wpx: 100}, 
    {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 160}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100},
    {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, {wpx: 100}, 
    {wpx: 100}, {wpx: 100}, {wpx: 100}];
  const option = {'!merges': header, '!cols': colsWidth};
  var buffer = xlsx.build([{name: "qmy-data", data: data}], option);

  fs.writeFile(`${__dirname}/abc.xlsx`, buffer, err => {
    if(!err) {
      res.download(`${__dirname}/abc.xlsx`);
      // res.json({status: true});
    }else {
      res.json({status: false, errMsg: '下载失败'})
    }
  });
}

router.use(login.islogin);

router.get("/export", exportOrderList);
module.exports = router;
