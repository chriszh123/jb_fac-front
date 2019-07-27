const WXAPI = require('../wxapi/main')

function wxpay(app, money, orderId, redirectUrl) {
    let remark = "在线充值";
    let nextAction = {};
    // 订单号
    if (orderId != '') {
        remark = "支付订单 ：" + orderId;
        nextAction = {
            type: 0,
            id: orderId
        };
    }
    // 微信预支付接口
    WXAPI.wxpay({
        token: wx.getStorageSync('token'),
        money: money,
        remark: remark,
        payName: "在线支付",
        nextAction: nextAction
    }).then(function (res) {
        if (res.code == 0) {
            // 发起支付
            wx.requestPayment({
                timeStamp: res.data.timeStamp,
                nonceStr: res.data.nonceStr,
                package: res.data.prepayId,
                signType: 'MD5',
                paySign: res.data.sign,
                fail: function (error) {
                    if (error && error.errMsg && error.errMsg.toLowerCase().indexOf('cancel') >= 0) {
                        wx.showToast({
                            title: '支付取消成功', //提示的内容,
                            icon: 'success', //图标,
                            duration: 3000, //延迟时间,
                            mask: true, //显示透明蒙层，防止触摸穿透,
                            success: res => {}
                        });
                    } else {
                        if (error && error.errMsg) {
                            wx.showModal({
                                title: '支付失败', //提示的标题,
                                content: error.errMsg, //提示的内容,
                                showCancel: false, //是否显示取消按钮,
                                confirmText: '知道了', //确定按钮的文字，默认为取消，最多 4 个字符,
                                confirmColor: '#3CC51F', //确定按钮的文字颜色,
                                success: res => {}
                            });
                        } else {
                            wx.showToast({
                                title: '支付失败:' + error
                            });
                        }
                    }
                },
                success: function () {
                    // 保存 formid
                    //   WXAPI.addTempleMsgFormid({
                    //     token: wx.getStorageSync('token'),
                    //     type: 'pay',
                    //     formId: res.data.prepayId
                    //   })
                    // 提示支付成功
                    wx.showToast({
                        title: '支付成功'
                    })
                    wx.redirectTo({
                        url: redirectUrl
                    });
                }
            })
        } else {
            wx.showModal({
                title: '',
                content: res.msg,
                showCancel: false,
                success: function (res) {

                }
            })
        }
    })
}

module.exports = {
    wxpay: wxpay
}