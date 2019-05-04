const commonCityData = require('../../utils/city.js')
const WXAPI = require('../../wxapi/main')
//获取应用实例
var app = getApp()
Page({
    data: {
        provinces: [],
        citys: [],
        districts: [],
        selProvince: '请选择',
        selCity: '请选择',
        selDistrict: '请选择',
        selProvinceIndex: 0,
        selCityIndex: 0,
        selDistrictIndex: 0
    },
    // 取消按钮
    bindCancel: function () {
        wx.navigateBack({})
    },
    // 保存地址
    bindSave: function (e) {
        var that = this;
        var linkMan = e.detail.value.linkMan;
        var address = e.detail.value.address;
        var mobile = e.detail.value.mobile;
        var code = e.detail.value.code;

        if (linkMan == "") {
            wx.showModal({
                title: '提示',
                content: '请填写联系人姓名',
                showCancel: false
            })
            return
        }
        if (mobile == "") {
            wx.showModal({
                title: '提示',
                content: '请填写手机号码',
                showCancel: false
            })
            return
        }
        if (this.data.selProvince == "请选择") {
            wx.showModal({
                title: '提示',
                content: '请选择地区',
                showCancel: false
            })
            return
        }
        if (this.data.selCity == "请选择") {
            wx.showModal({
                title: '提示',
                content: '请选择地区',
                showCancel: false
            })
            return
        }
        var cityId = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].id;
        var districtId;
        if (this.data.selDistrict == "请选择" || !this.data.selDistrict) {
            districtId = '';
        } else {
            districtId = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].districtList[this.data.selDistrictIndex].id;
        }
        if (address == "") {
            wx.showModal({
                title: '提示',
                content: '请填写详细地址',
                showCancel: false
            })
            return;
        }
        if (code == "") {
            wx.showModal({
                title: '提示',
                content: '请填写邮编',
                showCancel: false
            })
            return
        }
        let apiResult
        // 更新地址
        if (that.data.id) {
            const updateData = {
                token: wx.getStorageSync('token'),
                id: that.data.id,
                provinceId: commonCityData.cityData[this.data.selProvinceIndex].id,
                provinceStr: that.data.selProvince,
                cityId: cityId,
                cityStr: that.data.selCity,
                districtId: districtId,
                areaStr: that.data.selDistrict,
                linkMan: linkMan,
                address: address,
                mobile: mobile,
                code: code,
                isDefault: 'true'
            };

            apiResult = WXAPI.updateAddress(updateData)
        } else {
            // 新增地址
            const addData = {
                token: wx.getStorageSync('token'),
                provinceId: commonCityData.cityData[this.data.selProvinceIndex].id,
                provinceStr: that.data.selProvince,
                cityId: cityId,
                cityStr: that.data.selCity,
                districtId: districtId,
                areaStr: that.data.selDistrict,
                linkMan: linkMan,
                address: address,
                mobile: mobile,
                code: code,
                isDefault: 'true'
            };

            apiResult = WXAPI.addAddress(addData);
        }
        apiResult.then(function (res) {
            if (res.code != 0) {
                // 登录错误 
                wx.hideLoading();
                wx.showModal({
                    title: '操作失败',
                    content: res.msg,
                    showCancel: false
                })
                return;
            } else {
                wx.showToast({
                    title: '操作成功', //提示的内容,
                    icon: 'success', //图标,
                    duration: 2000, //延迟时间,
                    mask: true, //显示透明蒙层，防止触摸穿透,
                    success: res => {}
                });
            }
            // 跳转到结算页面
            wx.navigateBack({})
        })
    },
    initCityData: function (level, obj) {
        if (level == 1) {
            // 地址页面数据初始化：初始化省份数据
            var pinkArray = [];
            for (var i = 0; i < commonCityData.cityData.length; i++) {
                pinkArray.push(commonCityData.cityData[i].name);
            }
            this.setData({
                provinces: pinkArray
            });
        } else if (level == 2) {
            // 确定指定省份下的城市
            var pinkArray = [];
            var dataArray = obj.cityList
            for (var i = 0; i < dataArray.length; i++) {
                pinkArray.push(dataArray[i].name);
            }
            this.setData({
                citys: pinkArray
            });
        } else if (level == 3) {
            // 确定指定城市下的区域
            var pinkArray = [];
            var dataArray = obj.districtList
            for (var i = 0; i < dataArray.length; i++) {
                pinkArray.push(dataArray[i].name);
            }
            this.setData({
                districts: pinkArray
            });
        }
    },
    bindPickerProvinceChange: function (event) {
        // 选择省份
        var selIterm = commonCityData.cityData[event.detail.value];
        this.setData({
            selProvince: selIterm.name,
            selProvinceIndex: event.detail.value,
            selCity: '请选择',
            selCityIndex: 0,
            selDistrict: '请选择',
            selDistrictIndex: 0
        })
        this.initCityData(2, selIterm)
    },
    bindPickerCityChange: function (event) {
        // 选择城市
        var selIterm = commonCityData.cityData[this.data.selProvinceIndex].cityList[event.detail.value];
        this.setData({
            selCity: selIterm.name,
            selCityIndex: event.detail.value,
            selDistrict: '请选择',
            selDistrictIndex: 0
        })
        this.initCityData(3, selIterm)
    },
    bindPickerChange: function (event) {
        // 选择区域
        var selIterm = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].districtList[event.detail.value];
        if (selIterm && selIterm.name && event.detail.value) {
            this.setData({
                selDistrict: selIterm.name,
                selDistrictIndex: event.detail.value
            })
        }
    },
    onLoad: function (e) {
        var that = this;
        this.initCityData(1);
        var id = e.id;
        if (id) {
            // 初始化原数据
            WXAPI.addressDetail(id, wx.getStorageSync('token')).then(function (res) {
                if (res.code == 0) {
                    that.setData({
                        id: id,
                        addressData: res.data,
                        selProvince: res.data.provinceStr,
                        selCity: res.data.cityStr,
                        selDistrict: res.data.areaStr
                    });
                    that.setDBSaveAddressId(res.data);
                    return;
                } else {
                    wx.showModal({
                        title: '提示',
                        content: '无法获取快递地址数据',
                        showCancel: false
                    })
                }
            })
        }
    },
    setDBSaveAddressId: function (data) {
        // 根据数据库里的数据初始化 地区数据：省份、城市、区域
        var retSelIdx = 0;
        for (var i = 0; i < commonCityData.cityData.length; i++) {
            if (data.provinceId == commonCityData.cityData[i].id) {
                this.data.selProvinceIndex = i;
                for (var j = 0; j < commonCityData.cityData[i].cityList.length; j++) {
                    if (data.cityId == commonCityData.cityData[i].cityList[j].id) {
                        this.data.selCityIndex = j;
                        for (var k = 0; k < commonCityData.cityData[i].cityList[j].districtList.length; k++) {
                            if (data.districtId == commonCityData.cityData[i].cityList[j].districtList[k].id) {
                                this.data.selDistrictIndex = k;
                            }
                        }
                    }
                }
            }
        }
    },
    selectCity: function () {

    },
    deleteAddress: function (e) {
        var that = this;
        var id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '提示',
            content: '确定要删除该收货地址吗？',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.deleteAddress(id, wx.getStorageSync('token')).then(function () {
                        wx.navigateBack({})
                    })
                } else {
                    console.log('用户点击取消')
                }
            }
        })
    },
    readFromWx: function () {
        // 从微信中读取响应用户地址
        let that = this;
        wx.chooseAddress({
            success: function (res) {
                let provinceName = res.provinceName;
                let cityName = res.cityName;
                let diatrictName = res.countyName;
                let retSelIdx = 0;

                for (var i = 0; i < commonCityData.cityData.length; i++) {
                    if (provinceName == commonCityData.cityData[i].name) {
                        let eventJ = {
                            detail: {
                                value: i
                            }
                        };
                        that.bindPickerProvinceChange(eventJ);
                        that.data.selProvinceIndex = i;
                        for (var j = 0; j < commonCityData.cityData[i].cityList.length; j++) {
                            if (cityName == commonCityData.cityData[i].cityList[j].name) {
                                //that.data.selCityIndex = j;
                                eventJ = {
                                    detail: {
                                        value: j
                                    }
                                };
                                that.bindPickerCityChange(eventJ);
                                for (var k = 0; k < commonCityData.cityData[i].cityList[j].districtList.length; k++) {
                                    if (diatrictName == commonCityData.cityData[i].cityList[j].districtList[k].name) {
                                        //that.data.selDistrictIndex = k;
                                        eventJ = {
                                            detail: {
                                                value: k
                                            }
                                        };
                                        that.bindPickerChange(eventJ);
                                    }
                                }
                            }
                        }

                    }
                }

                that.setData({
                    wxaddress: res,
                });
            }
        })
    }
})