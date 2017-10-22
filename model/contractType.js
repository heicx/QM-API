var when = require("when");

module.exports = function(orm, db) {
	var contractType = db.define("contract_type", {
		id: {type: "serial", key: true},
		contract_type_name: String
	});

    /**
     * 获取合同类型列表
     * @param params(contract_type_name: 合同类型名称)
     * @param callback
     */
	contractType.getContractTypeList = function(params) {
        var contractTypeName = params.contractTypeName || "";
        var def = when.defer();

        contractType.find().where("contract_type_name like ?", ["%" + contractTypeName +"%"]).all(function(err, resultData) {
            if(!err) {
                def.resolve(resultData);
            }else {
                def.reject("获取合同类型列表失败");
            }
		});

        return def.promise;
	}

    // 合同类型名称查重
    contractType.findContractTypeIsExists = function(params) {
        var def = when.defer();

        contractType.find(params, function(err, item) {
            if(!err) {
                if(item.length > 0)
                    def.reject("合同类型名称已存在");
                else
                    def.resolve();
            }else {
                def.reject("合同类型查重失败");
            }
        });

        return def.promise;
    }

    // 添加合同类型
    contractType.createContractType = function(params) {
        var def = when.defer();

        contractType.create(params, function(err, items) {
            if(!err) {
                if(items)
                    def.resolve(items);
                else
                    def.reject("添加合同类型失败");
            }else {
                def.reject("添加合同类型失败");
            }
        });

        return def.promise;
    }

    // 获取新增合同类型的信息
    contractType.getContractTypeByName = function(items) {
        var def = when.defer();

        contractType.getContractTypeList({contractTypeName: items.contract_type_name}).then(function(newItem) {
            def.resolve(newItem);
        }).catch(function() {
            def.reject("获取新增合同类型的信息失败");
        });

        return def.promise;
    }
}