const app = getApp();
const WXAPI = require('../../wxapi/main');

Page({
    data: {
        orderNoAndProdId: ''
    },
    onLoad(options) {
        // 生命周期函数--监听页面加载
        var orderNoAndProdId = options.orderNoAndProdId;
        console.log('orderNoAndProdId = ' + orderNoAndProdId);
        if (orderNoAndProdId) {
            var orderNoAndProdIdArr = orderNoAndProdId.split(',');
            if (orderNoAndProdIdArr.length < 2) {
                return;
            }
            var orderNo = orderNoAndProdIdArr[0];
            var prodId = orderNoAndProdIdArr[1];
            var token = wx.getStorageSync('token');
            // 核销当前商品订单
            WXAPI.writeOffOrder(orderNo, token, prodId).then(function (res) {
                if (res.code != 0) {
                    wx.showModal({
                        title: '核销失败', //提示的标题,
                        content: res.msg, //提示的内容,
                        showCancel: false, //是否显示取消按钮,
                        confirmText: '确定', //确定按钮的文字，默认为取消，最多 4 个字符,
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
                
            });

        }
    },
    onShow() {

    }
})