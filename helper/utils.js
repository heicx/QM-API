let http = require("http");
let https = require('https');
let extend = require("extend");
let _ = require("underscore");
let md5 = require("md5");

let ex_options = {
	method: "POST",
  headers: {
      "Content-Type": "application/x-www-form-urlencoded"
  }
}

exports.strMD5 = (str, len = 16) => {
  let strTmp = '';

  if(typeof str === 'string') {
    strTmp = md5(str);
    len = strTmp.length > len ? len : strTmp.length;

    return strTmp.substring(0, len).toUpperCase();
  }else {
    return strTmp;
  }
}

exports.randomNums = (count) => {
  let strRet = '',
      nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for(let i=0; i < count; i++) {
    strRet += Math.floor(Math.random() * 10);
  }

  return strRet;
}

exports.objKeySort = (obj) => {
  let newObj = {};
  let keys = Object.keys(obj);

  if(keys.length > 0) {
    keys = keys.sort();

    for(let i = 0; i < keys.length; ++i) {
      newObj[keys[i]] = obj[keys[i]];
    }
  }
  
  return newObj;
}

exports.sendHttpRequest = function (data, options, callback) {
	var req;

	options = extend(true, ex_options, options);
	req = http.request(options, callback);

  req.on("error", function(e) {
    callback(null, e.message);
  });

  req.end(data);
}

exports.sendHttpsRequest = function (data, options, callback) {
	var req;

	options = extend(true, ex_options, options);
	req = https.request(options, callback);

  req.on("error", function(e) {
    callback(null, e.message);
  });

  req.end(data);
}

exports.arrToJSON = function(arr) {
    var obj = {};

    if(arr instanceof Array && arr.length > 0) {
        var i = 0;

        for(; i<arr.length; i++) {
            obj[i] = arr[i];
        }
    }

    return obj;
}


/**
 * 过滤查询字段,返回联表或orm查询所需的拼接字符串.
 * @param origin 用户传入的基本条件字段及参数
 * @param basic 基准数据,用于数据过滤,数据格式为Object.
 * @param cb {strCondition, arrArgs}, strCondition: 用于orm查询的条件拼接字符串, value: 参数数组.
 *
 * 补充说明:
 * basic {key: value}, key: 表示字段名称, value: String || Object.
 * 若数据类型为String时表示关联表的缩写前缀,如果为空不表不需要表关联前缀.
 * 若数据类型为KV形式Object时,prefix为表关联前缀标示,keyword为运算符.
 *
 * 例子:
 * var origin = {
 *     name: robin,
 *     age: 30,
 *     score: 80
 * }
 *
 * basic = {
 *     name: {keyword: "like", prefix: "user", sign: ["%", "%"]},
 *     age: "user",
 *     score: {keyword: "<", prefix: "class"}
 * }
 *
 * 返回值:
 * strCondition: name like ? and user.age>? and class.score < ?
 * arrVal: ["robin", 30, 80]
 */
exports.ormFilter = function(origin, basic, cb) {
    var prefix, i, j, arrCondition = [], arrArgs = [], strL, strR;
    var keywords = [">", "<", "<>", "in", "not in", "like"];

    for (i in basic) {
        for (j in origin) {
            if (typeof basic === "object" && Object.prototype.toString.call(basic).toLowerCase() === "[object object]" && !basic.length) {
                if(j === i) {
                    strL = "", strR = "";

                    // 拼装查询字段名称
                    if(typeof basic[i] === "string") {
                        prefix = basic[i] ? (basic[i] + "." + i) : i;
                    }else {
                        if(basic[i].mapsTo) {
                            prefix =  basic[i].prefix ? (basic[i].prefix + "." + basic[i].mapsTo) : basic[i].mapsTo;
                        }else {
                            prefix =  basic[i].prefix ? (basic[i].prefix + "." + i) : i;
                        }
                    }

                    // 拼装orm查询需要的字段值的通配符
                    if(basic[i].sign) {
                        if(basic[i].sign instanceof Array) {
                            strL =  basic[i].sign[0] || "";
                            strR = basic[i].sign[1] || "";
                        }else if(typeof basic[i].sign === "string") {
                            strL = basic[i].sign;
                        }
                    }

                    // 验证value的keyword属性值是否在存在于keywords.
                    if(_.indexOf(keywords, basic[i].keyword) > -1) {
                        arrCondition.push(prefix + " " + basic[i].keyword + " ?");
                    }else {
                        arrCondition.push(prefix + " = ?");
                    }

                    arrArgs.push(strL + origin[j] + strR);
                }
            }
        }
    }

    return cb(arrCondition.join(" and "), arrArgs);
}

exports.paramsFilter = function(arrBasic, params) {
    var outputParams = {};

    for(var name in arrBasic) {
        if(params[name] !== undefined) {
            outputParams[name] = params[name];
        }
    }

    return outputParams;
}

/**
 * 指定表内字段按条件批量更新
 * @param {Object} oFields 
 * @param {Object} oParams 
 * 
 * 例子：
 * var oFields = {
 *  arrCondition: ['val1', 'val2'],
 *  tableName: 'mall_order',
 *  caseName: 'id',
 *  setFieldsName: ['express_id', 'express_name', 'order_status']
 * }
 * 
 * oParams = {
 *  val1: {
 *    id: 'eo10001',
 *    epress_id: 'xxxxx001',
 *    express_name: 'SF',
 *    order_status: 1
 *  }
 * }
 */
exports.batchUpdateFilter = function(oFields, oParams, callback) {
  let sql = '';

  if (
    oFields 
    && oFields.arrCondition
    && oFields.tableName 
    && oFields.setFieldsName
    && oFields.caseName
    && oParams
  ) {
    sql = `UPDATE ${oFields.tableName} SET `;

    for (let key of oFields.setFieldsName) {

      sql += `${key} = CASE ${oFields.caseName} `;

      for (let val of oFields.arrCondition) {
        sql += `WHEN '${val}' THEN '${oParams[val][key]}' `
      }

      sql += 'END,'
    }

    sql = sql.substring(0, sql.length -1);

    sql += ` WHERE ${oFields.caseName} IN (`

    for (let id of oFields.arrCondition) {
      sql += `'${id}',`
    }

    sql = sql.substring(0, sql.length -1) + ')';
  }

  callback(sql);
}

exports.paginationMath = function(pageNo, count) {
    var curPageNo = parseInt(pageNo);
    var totalPageNo = parseInt(count);
    var oPagination = {
        isFirst: curPageNo == 1 ? true : false,
        isLast: curPageNo == totalPageNo ? true : false
    };
    var arrTemp = [];
    var i = 1;
    var intPaginationSize = 5;
    var intPageNo = curPageNo <= 0 ? 1 : curPageNo;

    if(totalPageNo <= intPaginationSize || intPageNo > totalPageNo) {
        totalPageNo = totalPageNo > intPaginationSize ? intPaginationSize : (totalPageNo <= 0 ? 1 : totalPageNo);

        for(; i <= totalPageNo; i++) {
            arrTemp.push(i);
        }

        oPagination.count = arrTemp;
        oPagination.pageNo = (intPageNo > intPaginationSize || intPageNo > totalPageNo) ? 1 : intPageNo;
    }else {
        if(intPageNo > (totalPageNo - intPaginationSize)) {
            for(; i <= intPaginationSize; i++) {
                arrTemp.unshift(totalPageNo--);
            }

            oPagination.count = arrTemp;
            oPagination.pageNo = intPageNo;
        }else {
            var arrNumeric = (intPaginationSize / 2).toString().split(".");
            var booDecimals = arrNumeric.length == 2 ? true : false;
            var intPageNoRemained = parseInt((intPaginationSize/2).toString().split(".")[0]) + (booDecimals ? 1 : 0) || 1;
            var intTempPageNo = intPageNo;
            var intRemained;

            for(; i<= intPageNoRemained; i++) {
                if(intTempPageNo > 0)
                    arrTemp.unshift(intTempPageNo--);
                else
                    break;
            }

            intRemained = intPaginationSize - arrTemp.length;
            for(var j = 1; j <= intRemained; j++) {
                arrTemp.push(arrTemp[arrTemp.length-1] + 1);
            }

            oPagination.count = arrTemp;
            oPagination.pageNo = intPageNo;
        }
    }

    return oPagination;
}

exports.Math = {
    accDiv: function(arg1, arg2) {
        var t1 = 0, t2 = 0, r1, r2, result;

        try{
            t1 = arg1.toString().split(".")[1].length;
        }catch(e){}

        try{
            t2 = arg2.toString().split(".")[1].length;
        }catch(e){}

        with(Math){
            var strSplit;

            r1 = Number(arg1.toString().replace(".",""));
            r2 = Number(arg2.toString().replace(".",""));

            result = ((r1/r2) * pow(10, t2 - t1)) + "";
            strSplit = result.split(".");

            if(strSplit[1] && strSplit[1].length > 2)
                return Number(strSplit[0] + "." + strSplit[1].substring(0, 2));
            else
                return Number(result);
        }
    },
    accMul: function(arg1, arg2) {
        var m = 0, s1 = arg1.toString(), s2 = arg2.toString();

        try{
            m += s1.split(".")[1].length;
        }catch(e){}

        try{
            m+=s2.split(".")[1].length;
        }catch(e){}

        return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
    },
    accAdd: function(arg1, arg2) {
        var r1, r2, m;

        try{
            r1 = arg1.toString().split(".")[1].length;
        }catch(e){
            r1 = 0;
        }

        try{
            r2 = arg2.toString().split(".")[1].length;
        }catch(e){
            r2 = 0;
        }

        m = Math.pow(10, Math.max(r1, r2));

        return (arg1 * m + arg2 * m) / m;
    },
    accSub: function(arg1, arg2) {
        var r1, r2, m, n;

        try{
            r1 = arg1.toString().split(".")[1].length;
        }catch(e){
            r1 = 0;
        }

        try{
            r2 = arg2.toString().split(".")[1].length;
        }catch(e){
            r2 = 0;
        }

        m = Math.pow(10, Math.max(r1, r2));

        n = (r1 >= r2) ? r1: r2;

        return ((arg1 * m - arg2 * m) / m).toFixed(n);
    }
}
