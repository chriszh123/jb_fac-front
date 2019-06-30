const app = getApp();
const CONFIG = require('../../config.js');
const WXAPI = require('../../wxapi/main');

Page({
    data: {
        balance: 0.00,
        freeze: 0,
        score: 0,
        userId: -1,
        score_sign_continuous: 0,
        hiddenWriteoffProd: true
    },
    onLoad() {

    },
    onShow() {
        let that = this;
        let userInfo = wx.getStorageSync('userInfo');
        // 当前用户id(后端用户wid)
        var uid = wx.getStorageSync('uid');
        that.setData({
            userId: uid
        });
        if (!userInfo) {
            app.goLoginPageTimeOut()
        } else {
            that.setData({
                userInfo: userInfo,
                version: CONFIG.version
            })
        }
        this.getUserApiInfo();
        this.getUserAmount();
        this.userInfo();
    },
    userInfo: function () {
        var that = this;
        var token = wx.getStorageSync('token');
        WXAPI.userInfo(token).then(function (res) {
            // 用户类型：0-普通购买用户,1-商家
            var userType = res.data.userType;
            that.setData({
                hiddenWriteoffProd: (userType == 0)
            });
        });
    },
    aboutUs: function () {
        wx.showModal({
            title: '关于我们',
            content: '定期为您提供身边最优质的优惠套餐',
            showCancel: false
        })
    },
    //绑定手机号码
    getPhoneNumber: function (e) {
        console.log("getPhoneNumber e :" + JSON.stringify(e.detail));
        if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
            wx.showModal({
                title: '提示',
                content: '无法获取手机号码:' + e.detail.errMsg,
                showCancel: false
            })
            return;
        }
        var that = this;
        WXAPI.bindMobile({
            token: wx.getStorageSync('token'),
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv
        }).then(function (res) {
            if (res.code === 10002) {
                app.goLoginPageTimeOut()
                return
            }
            if (res.code == 0) {
                wx.showToast({
                    title: '绑定成功',
                    icon: 'success',
                    duration: 2000
                })
                that.getUserApiInfo();
            } else {
                wx.showModal({
                    title: '提示',
                    content: '绑定失败',
                    showCancel: false
                })
            }
        })
    },
    getUserApiInfo: function () {
        var that = this;
        WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                let _data = {}
                _data.apiUserInfoMap = res.data
                if (res.data.base.mobile) {
                    _data.userMobile = res.data.base.mobile
                }
                that.setData(_data);
            }
        })
    },
    getUserAmount: function () {
        var that = this;
        WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                that.setData({
                    balance: res.data.balance.toFixed(2),
                    freeze: res.data.freeze.toFixed(2),
                    score: res.data.score
                });
            }
        })
    },
    relogin: function () {
        app.goLoginPageTimeOut()
    },
    goAsset: function () {
        wx.navigateTo({
            url: "/pages/asset/index"
        })
    },
    goScore: function () {
        wx.navigateTo({
            url: "/pages/score/index"
        })
    },
    goOrder: function (e) {
        wx.navigateTo({
            url: "/pages/order-list/index?type=" + e.currentTarget.dataset.type
        })
    },
    scacnQrcode: function () {
        // 核销商品，扫描订单核销码
        // 允许从相机和相册扫码
        wx.scanCode({
            success: (res) => {
                var orderNoData = res.result;
                // 本来是打算跳转到一个新页面后做一些核销后的操作的
                // wx.navigateTo({
                //     url: "/pages/writeoff-qrcode/index?orderNoData=" + /orderNoData
                // });
                console.log('scacnQrcode -> orderNoData = ' + orderNoData);
                if (orderNoData) {
                    var orderNoArr = orderNoData.split(',');
                    // 校验：属于我们江北福利抢购小程序特有的二维码内容
                    if (orderNoArr.length < 2 || orderNoArr[0] != CONFIG.qrcodePrefix) {
                        // 核销码对应二维码内容为空
                        wx.showModal({
                            title: '提示', //提示的标题,
                            content: '订单核销码内容不正确，请联系管理员:' + orderNoData, //提示的内容,
                            showCancel: false, //是否显示取消按钮,
                            confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,
                            confirmColor: '#3CC51F' //确定按钮的文字颜色,
                        });
                        return;
                    }

                    wx.showModal({
                        title: '提示',
                        content: '确定要核销该订单吗？',
                        showCancel: true, //是否显示取消按钮,
                        cancelText: '取消', //取消按钮的文字，默认为取消，最多 4 个字符,
                        cancelColor: '#000000', //取消按钮的文字颜色,
                        confirmText: '确定', //确定按钮的文字，默认为取消，最多 4 个字符,
                        confirmColor: '#3CC51F', //确定按钮的文字颜色,
                        success: function (res) {
                            if (res.confirm) {
                                var orderNo = orderNoArr[1];
                                var prodId = '';
                                var token = wx.getStorageSync('token');
                                // 核销当前商品订单
                                WXAPI.writeOffOrder(orderNo, token, prodId).then(function (res) {
                                    if (res.code != 0) {
                                        wx.showModal({
                                            title: '核销失败', //提示的标题,
                                            content: res.msg, //提示的内容,
                                            showCancel: false, //是否显示取消按钮,
                                            confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,
                                            confirmColor: '#3CC51F', //确定按钮的文字颜色,
                                            success: res => {
                                                if (res.confirm) {
                                                    console.log('用户点击确定')
                                                } else if (res.cancel) {
                                                    console.log('用户点击取消')
                                                }
                                            }
                                        });
                                        return;
                                    }
                                    // 商品订单核销成功
                                    wx.showModal({
                                        title: '商品订单核销成功', //提示的标题,
                                        content: '', //提示的内容,
                                        showCancel: false, //是否显示取消按钮,
                                        confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,

                                    });
                                });
                            }
                        }
                    });

                } else {
                    // 订单核销码内容为空
                    wx.showModal({
                        title: '提示', //提示的标题,
                        content: '订单核销码内容为空，请联系管理员', //提示的内容,
                        showCancel: false, //是否显示取消按钮,
                        confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,
                        confirmColor: '#3CC51F' //确定按钮的文字颜色,
                    });
                }
            }
        });
    }
})