//订单列表
const wxpay = require('../../utils/pay.js')
const app = getApp()
const WXAPI = require('../../wxapi/main')
Page({
    data: {
        statusType: ["待付款", "待发货", "待收货", "待评价", "已完成"],
        currentType: 0,
        tabClass: ["", "", "", "", ""]
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
        var orderId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '确定要取消该订单吗？',
            content: '',
            success: function (res) {
                if (res.confirm) {
                    WXAPI.orderClose(orderId, wx.getStorageSync('token')).then(function (res) {
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
        const orderId = e.currentTarget.dataset.id;
        let money = e.currentTarget.dataset.money;
        const needScore = e.currentTarget.dataset.score;
        WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                // res.data.data.balance
                // 用户余额，这里逻辑可能会要变化，我们这里暂时只要直接调用微信支付去付款就可以了：zgf
                money = money - res.data.balance;
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

                let _msg = '订单金额: ' + money + ' 元'
                if (res.data.balance > 0) {
                    _msg += ',可用余额为 ' + res.data.balance + ' 元'
                    if (money - res.data.balance > 0) {
                        _msg += ',仍需微信支付 ' + (money - res.data.balance) + ' 元'
                    }
                }
                if (needScore > 0) {
                    _msg += ',并扣除 ' + money + ' 积分'
                }
                money = money - res.data.balance;
                console.log("money = " + money);
                wx.showModal({
                    title: '请确认支付',
                    content: _msg,
                    confirmText: "确认支付",
                    cancelText: "取消支付",
                    success: function (res) {
                        console.log(res);
                        if (res.confirm) {
                            that._toPayTap(orderId, money)
                        } else {
                            console.log('用户点击取消支付')
                        }
                    }
                });
            } else {
                wx.showModal({
                    title: '错误',
                    content: '无法获取用户资金信息',
                    showCancel: false
                })
            }
        })
    },
    _toPayTap: function (orderId, money) {
        const _this = this
        if (money <= 0) {
            // 直接使用余额支付
            console.log("马上付款：直接使用余额支付");
            WXAPI.orderPay(orderId, wx.getStorageSync('token')).then(function (res) {
                _this.onShow();
            })
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
                if (res.data.count_id_no_pay > 0) {
                    tabClass[0] = "red-dot"
                } else {
                    tabClass[0] = ""
                }
                if (res.data.count_id_no_transfer > 0) {
                    tabClass[1] = "red-dot"
                } else {
                    tabClass[1] = ""
                }
                if (res.data.count_id_no_confirm > 0) {
                    tabClass[2] = "red-dot"
                } else {
                    tabClass[2] = ""
                }
                if (res.data.count_id_no_reputation > 0) {
                    tabClass[3] = "red-dot"
                } else {
                    tabClass[3] = ""
                }
                if (res.data.count_id_success > 0) {
                    //tabClass[4] = "red-dot"
                } else {
                    //tabClass[4] = ""
                }

                that.setData({
                    tabClass: tabClass,
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
                that.setData({
                    orderList: res.data.orderList,
                    //   logisticsMap: res.data.logisticsMap,
                    goodsMap: res.data.goodsMap
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

    }
})