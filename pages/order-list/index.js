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
  statusTap: function(e) {
    const curType = e.currentTarget.dataset.index;
    this.data.currentType = curType
    this.setData({
      currentType: curType
    });
    this.onShow();
  },
  // 当条订单
  orderDetail: function(e) {
    var orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/order-details/index?id=" + orderId
    })
  },
  //取消订单
  cancelOrderTap: function(e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确定要取消该订单吗？',
      content: '',
      success: function(res) {
        if (res.confirm) {
          WXAPI.orderClose(orderId, wx.getStorageSync('token')).then(function(res) {
            if (res.code == 0) {
              that.onShow();
            }
          })
        }
      }
    })
  },

  // 马上付款
  toPayTap: function(e) {
    var that = this;
    var orderId = e.currentTarget.dataset.id;
    var money = e.currentTarget.dataset.money;
    var needScore = e.currentTarget.dataset.score;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function(res) {
      if (res.code == 0) {
        // res.data.data.balance
        // 用户余额，这里逻辑可能会要变化，我们这里暂时只要直接调用微信支付去付款就可以了：zgf
        money = money - res.data.balance;
        if (res.data.score < needScore) {
          wx.showModal({
            title: '错误',
            content: '您的积分不足，无法支付',
            showCancel: false
          })
          return;
        }
        //用户余额大于或等于当前订单费用
        console.log("money = " + money);
        if (money <= 0) {
          // 直接使用余额支付 :zgf
          WXAPI.orderPay(orderId, wx.getStorageSync('token')).then(function(res) {
            that.onShow();
          })
        } else {
          wxpay.wxpay(app, money, orderId, "/pages/order-list/index");
        }
      } else {
        wx.showModal({
          title: '错误',
          content: '无法获取用户资金信息',
          showCancel: false
        })
      }
    })
  },
  onLoad: function(options) {
    if (options && options.type) {
      this.setData({
        currentType: options.type
      });
    }
  },
  onReady: function() {
    // 生命周期函数--监听页面初次渲染完成

  },
  getOrderStatistics: function() {
    var that = this;
    WXAPI.orderStatistics(wx.getStorageSync('token')).then(function(res) {
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
  onShow: function() {
    // 获取订单列表
    var that = this;
    var postData = {
      token: wx.getStorageSync('token')
    };
    postData.status = that.data.currentType;
    // 存在订单的tab标红点
    this.getOrderStatistics();
    WXAPI.orderList(postData).then(function(res) {
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
  onHide: function() {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function() {
    // 生命周期函数--监听页面卸载

  },
  onPullDownRefresh: function() {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function() {
    // 页面上拉触底事件的处理函数

  }
})