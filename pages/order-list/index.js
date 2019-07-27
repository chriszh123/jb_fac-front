//订单列表
const wxpay = require('../../utils/pay.js');
const QR = require("../../utils/qrcode.js");
const app = getApp();
const WXAPI = require('../../wxapi/main');
const CONFIG = require('../../config.js');

Page({
    data: {
        // statusType: ["待付款", "待发货", "待收货", "待评价", "已完成"],
        // statusType: ["待付款", "去核销", "待评价", "已完成", "待核销"], // 这里的待核销是给商家用的
        statusType: ["待付款", "去核销", "待评价", "已完成", "已取消"],
        currentType: 0,
        userType: 0, // 用户类型：0-普通购买用户,1-商家
        // tabClass: ["", "", "", "", ""]
        tabClass: ["", "", "", "", ""],
        showModal: false,
        qrCodeOrderNo: ''
    },
    // 订单种类tab点击事件
    statusTap: function (e) {
        const curType = e.currentTarget.dataset.index;
        this.data.currentType = curType
        this.setData({
            currentType: curType
        });
        this.onShow();
    },
    // 当条订单
    orderDetail: function (e) {
        var orderId = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: "/pages/order-details/index?id=" + orderId
        })
    },
    //取消订单
    cancelOrderTap: function (e) {
        var that = this;
        var orderNo = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确定要取消该订单吗？',
            content: '',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.orderClose(orderNo, wx.getStorageSync('token')).then(function (res) {
                        if (res.code == 0) {
                            that.onShow();
                            wx.showToast({
                                title: '订单取消成功', //提示的内容,
                                icon: 'success', //图标,
                                duration: 2000, //延迟时间,
                                mask: true, //显示透明蒙层，防止触摸穿透,
                                success: res => {}
                            });
                        } else {
                            wx.showToast({
                                title: '系统繁忙，请待会再尝试', //提示的内容,
                                icon: 'success', //图标,
                                duration: 3000, //延迟时间,
                                mask: true, //显示透明蒙层，防止触摸穿透,
                                success: res => {}
                            });
                        }
                    })
                }
            }
        })
    },

    // 马上付款
    toPayTap: function (e) {
        const that = this;
        // orderId为订单号
        const orderId = e.currentTarget.dataset.id;
        let money = e.currentTarget.dataset.money;
        const needScore = e.currentTarget.dataset.score;
        WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                // 用户余额
                if (res.data.score < needScore) {
                    wx.showModal({
                        title: '您的积分不足，无法支付',
                        icon: 'none'
                    })
                    return;
                }
                //用户余额大于或等于当前订单费用
                // if (money <= 0) {
                //     // 直接使用余额支付 :zgf
                //     WXAPI.orderPay(orderId, wx.getStorageSync('token')).then(function (res) {
                //         that.onShow();
                //     })
                // } else {
                //     wxpay.wxpay(app, money, orderId, "/pages/order-list/index");
                // }

                let _msg = '商品金额: ' + money + ' 元';
                if (res.data.balance > 0) {
                    _msg += ',可用余额为 ' + res.data.balance + ' 元';
                    if (money - res.data.balance > 0) {
                        _msg += ',仍需微信支付 ' + (money - res.data.balance) + ' 元';
                    }
                }
                if (needScore > 0) {
                    _msg += '，系统将扣除 ' + needScore + ' 积分'
                }
                // money = money - res.data.balance;
                // 这里后台直接按照订单金额从余额里扣除相应部分费用
                console.log("扣完余额剩余后的钱money = " + money);
                wx.showModal({
                    title: '请确认支付',
                    content: _msg,
                    confirmText: "确认支付",
                    cancelText: "取消支付",
                    success: function (res) {
                        if (res.confirm) {
                            that._toPayTap(orderId, money)
                        } else {
                            console.log('用户点击取消支付')
                        }
                    }
                });
            } else {
                wx.showModal({
                    title: '',
                    content: '无法获取用户资金信息',
                    showCancel: false
                });
            }
        })
    },
    _toPayTap: function (orderId, money) {
        const _this = this
        if (money <= 0) {
            // 直接使用余额支付
            // console.log("马上付款：直接使用余额支付");
            // WXAPI.orderPay(orderId, wx.getStorageSync('token')).then(function (res) {
            //     _this.onShow();
            // })
            wx.showModal({
                title: '',
                content: '订单金额为0，无需支付',
                showCancel: false
            });
        } else {
            console.log("马上付款：直接付款");
            wxpay.wxpay(app, money, orderId, "/pages/order-list/index");
        }
    },
    onLoad: function (options) {
        if (options && options.type) {
            this.setData({
                currentType: options.type
            });
        }
    },
    onReady: function () {
        // 生命周期函数--监听页面初次渲染完成

    },
    getOrderStatistics: function () {
        var that = this;
        WXAPI.orderStatistics(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                var tabClass = that.data.tabClass;
                // 待付款
                if (res.data.paying > 0) {

                    tabClass[0] = "red-dot"
                } else {
                    tabClass[0] = ""
                }
                // 去核销
                if (res.data.toWriteoff > 0) {
                    tabClass[1] = "red-dot"
                } else {
                    tabClass[1] = ""
                }
                // 待评价
                if (res.data.toEvaluate > 0) {
                    tabClass[2] = "red-dot"
                } else {
                    tabClass[2] = ""
                }
                // 已完成
                if (res.data.complete > 0) {
                    tabClass[3] = "red-dot"
                } else {
                    tabClass[3] = ""
                }
                // 已取消
                if (res.data.cancel > 0) {
                    tabClass[4] = "red-dot"
                } else {
                    tabClass[4] = ""
                }
                // 待核销：商家要核销的自己的商品
                if (res.data.writeoffing > 0) {
                    tabClass[5] = "red-dot"
                } else {
                    tabClass[5] = ""
                }
                // 用户类型：0-普通购买用户,1-商家
                var statusType = ["待付款", "去核销", "待评价", "已完成", "已取消"];
                if (res.data.userType == 1) {
                    statusType = ["待付款", "去核销", "待评价", "已完成", "已取消", "待核销"];
                }

                that.setData({
                    statusType: statusType,
                    tabClass: tabClass,
                    userType: res.data.userType
                });
            }
        })
    },
    onShow: function () {
        // 获取订单列表
        var that = this;
        var postData = {
            token: wx.getStorageSync('token')
        };
        postData.status = that.data.currentType;
        // 存在订单的tab标红点
        this.getOrderStatistics();
        WXAPI.orderList(postData).then(function (res) {
            if (res.code == 0) {
                var orderList = res.data.orderList;
                that.setData({
                    orderList: orderList,
                    //   logisticsMap: res.data.logisticsMap,
                    goodsMap: {}
                });
            } else {
                that.setData({
                    orderList: null,
                    //   logisticsMap: {},
                    goodsMap: {}
                });
            }
        })
    },
    onHide: function () {
        // 生命周期函数--监听页面隐藏

    },
    onUnload: function () {
        // 生命周期函数--监听页面卸载

    },
    onPullDownRefresh: function () {
        // 页面相关事件处理函数--监听用户下拉动作

    },
    onReachBottom: function () {
        // 页面上拉触底事件的处理函数

    },
    ejectQrcode: function (e) {
        // 弹出当前商品对应的核销二维码
        var that = this;
        var orderNo = e.currentTarget.dataset.id;
        var prodId = e.currentTarget.dataset.prodid;
        that.setData({
            showModal: true,
            qrCodeOrderNo: orderNo
        });
        wx.showToast({
            title: '生成中...', //提示的内容,
            icon: 'loading', //图标,
            duration: 3000, //延迟时间,
            //mask: true, //显示透明蒙层，防止触摸穿透,
            success: res => {}
        });
        // 核销码内容
        var qrcodeData = CONFIG.qrcodePrefix + ',' + orderNo;
        var st = setTimeout(() => {
            wx.hideToast();
            // var size = that.setCanvasSize();
            //绘制二维码
            that.createQrCode(qrcodeData, 'qrcode', 292, 264);
            that.setData({
                maskHidden: true
            });
            clearTimeout(st);
        }, 2000);
    },
    hideQrcode: function () {
        // 隐藏当前商品对应的核销二维码弹框
        var that = this;
        that.setData({
            showModal: false
        });
    },
    createQrCode: function (url, canvasId, cavW, cavH) {
        //调用插件中的draw方法，绘制二维码图片
        QR.qrApi.draw(url, canvasId, cavW, cavH);
        var that = this;
        //二维码生成之后调用canvasToTempImage();延迟3s，否则获取图片路径为空
        var st = setTimeout(() => {
            that.canvasToTempImage();
            clearTimeout(st);
        }, 3000);
    },
    canvasToTempImage: function () {
        //获取临时缓存照片路径，存入data中
        var that = this;
        wx.canvasToTempFilePath({
            canvasId: 'qrcode',
            success: function (res) {
                var tempFilePath = res.tempFilePath;
                console.log('tempFilePath = ' + tempFilePath);
                that.setData({
                    imagePath: tempFilePath
                });
            },
            fail: function (res) {
                console.log(res);
            }
        });
    },
    setCanvasSize: function () {
        //适配不同屏幕大小的canvas
        var size = {};
        try {
            var res = wx.getSystemInfoSync();
            var scale = 750 / 686; //不同屏幕下canvas的适配比例；设计稿是750宽
            var width = res.windowWidth / scale;
            var height = width; //canvas画布为正方形
            size.w = width;
            size.h = height;
        } catch (e) {
            // Do something when catch error
            console.log('获取设备信息失败' + e);
        }

        return size;
    },
    //核销订单商品
    writeOffOrder: function (e) {
        var that = this;
        var orderNo = e.currentTarget.dataset.id;
        var prodId = e.currentTarget.dataset.prodid;
        wx.showModal({
            title: '确定要核销该订单吗？',
            content: '',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.writeOffOrder(orderNo, wx.getStorageSync('token'), prodId).then(function (res) {
                        if (res.code == 0) {
                            that.onShow();
                            wx.showToast({
                                title: '订单核销成功', //提示的内容,
                                icon: 'success', //图标,
                                duration: 2000, //延迟时间,
                                mask: true, //显示透明蒙层，防止触摸穿透,
                                success: res => {}
                            });
                        } else {
                            wx.showModal({
                                title: '', //提示的标题,
                                content: res.msg, //提示的内容,
                                showCancel: true, //是否显示取消按钮,
                                cancelText: '取消', //取消按钮的文字，默认为取消，最多 4 个字符,
                                cancelColor: '#000000', //取消按钮的文字颜色,
                                confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,
                                confirmColor: '#3CC51F', //确定按钮的文字颜色,
                                success: res => {
                                    if (res.confirm) {

                                    } else if (res.cancel) {

                                    }
                                }
                            });
                        }
                    });
                }
            }
        })
    },
})