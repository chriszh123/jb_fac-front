// 小程序开发api接口工具包，https://github.com/gooking/wxapi
const CONFIG = require('./config.js')
// const API_BASE_URL = 'https://api.it120.cc'
// const API_BASE_URL = 'http://192.168.0.5:80'
const API_BASE_URL = 'https://www.jbfac.xyz'

const request = (url, needSubDomain, method, data) => {
    let _url = API_BASE_URL + (needSubDomain ? '/' + CONFIG.subDomain : '') + url;
    console.log("_url = " + _url)
    return new Promise((resolve, reject) => {
        wx.request({
            url: _url,
            method: method.toUpperCase(),
            data: data,
            header: {
                // 'Content-Type': 'application/x-www-form-urlencoded'
                // 'Content-Type': 'application/json;charset=utf-8'
            },
            success(request) {
                resolve(request.data)
            },
            fail(error) {
                reject(error)
            },
            complete(aaa) {
                // 加载完成
            }
        })
    })
}

/**
 * 小程序的promise没有finally方法，自己扩展下
 */
Promise.prototype.finally = function (callback) {
    var Promise = this.constructor;
    return this.then(
        function (value) {
            Promise.resolve(callback()).then(
                function () {
                    return value;
                }
            );
        },
        function (reason) {
            Promise.resolve(callback()).then(
                function () {
                    throw reason;
                }
            );
        }
    );
}

module.exports = {
    request,
    queryMobileLocation: (data) => {
        return request('/common/mobile-segment/location', true, 'post', data)
    },
    queryConfig: (data) => {
        return request('/config/get-value', true, 'post', data)
    },
    scoreRules: (data) => {
        return request('/score/send/rule', true, 'post', data)
    },
    scoreSign: (token) => {
        return request('/score/sign', true, 'post', {
            token
        })
    },
    scoreSignLogs: (data) => {
        return request('/score/sign/logs', true, 'post', data)
    },
    scoreTodaySignedInfo: (token) => {
        return request('/score/today-signed', true, 'post', {
            token
        })
    },
    scoreExchange: (number, token) => {
        return request('/score/exchange', true, 'post', {
            number,
            token
        })
    },
    scoreLogs: (data) => {
        return request('/user/score/logs', true, 'post', data)
    },
    amountLogs: (data) => {
        return request('/user/amount/logs', true, 'post', data)
    },
    kanjiaList: (data) => {
        return request('/shop/goods/kanjia/list', true, 'post', data)
    },
    kanjiaJoin: (kjid, token) => {
        return request('/shop/goods/kanjia/join', true, 'post', {
            kjid,
            token
        })
    },
    kanjiaDetail: (kjid, joiner) => {
        return request('/shop/goods/kanjia/info', true, 'post', {
            kjid,
            joiner
        })
    },
    kanjiaHelp: (kjid, joiner, token, remark) => {
        return request('/shop/goods/kanjia/help', true, 'post', {
            kjid,
            joinerUser: joiner,
            token,
            remark
        })
    },
    kanjiaHelpDetail: (kjid, joiner, token) => {
        return request('/shop/goods/kanjia/myHelp', true, 'post', {
            kjid,
            joinerUser: joiner,
            token
        })
    },
    checkToken: (token) => {
        return request('/user/check-token', true, 'post', {
            token
        })
    },
    addTempleMsgFormid: (data) => {
        return request('/template-msg/wxa/formId', true, 'post', data)
    },
    sendTempleMsg: (data) => {
        return request('/template-msg/put', true, 'post', data)
    },
    wxpay: (data) => {
        return request('/pay/wx/wxapp', true, 'post', data)
    },
    alipay: (data) => {
        return request('/pay/alipay/semiAutomatic/payurl', true, 'post', data)
    },
    login: (code) => {
        return request('/user/wxapp/login', true, 'post', {
            code,
            type: 2
        })
    },
    register: (data) => {
        return request('/user/wxapp/register/complex', true, 'post', data)
    },
    banners: (data) => {
        return request('/banner/list', true, 'post', data)
    },
    goodsCategory: () => {
        return request('/shop/goods/category/all', true, 'post')
    },
    goods: (data) => {
        return request('/shop/goods/list', true, 'post', data)
    },
    goodsDetail: (id) => {
        return request('/shop/goods/detail', true, 'post', {
            id
        })
    },
    wxaQrcode: (data) => {
        return request('/shop/wxaQrcode', true, 'post', data)
    },
    kanjiaSet: (goodsId) => {
        return request('/shop/goods/kanjia/set', true, 'post', { goodsId })
    },
    goodsPrice: (data) => {
        return request('/shop/goods/price', true, 'post', data)
    },
    goodsReputation: (data) => {
        return request('/shop/goods/reputation', true, 'post', data)
    },
    coupons: (data) => {
        return request('/discounts/coupons', true, 'post', data)
    },
    couponDetail: (id) => {
        return request('/discounts/detail', true, 'get', {
            id
        })
    },
    myCoupons: (data) => {
        return request('/discounts/my', true, 'post', data)
    },
    fetchCoupons: (data) => {
        return request('/discounts/fetch', true, 'post', data)
    },
    noticeList: (data) => {
        return request('/notice/list', true, 'post', data)
    },
    noticeDetail: (id) => {
        return request('/notice/detail', true, 'post', {
            id
        })
    },
    addAddress: (data) => {
        return request('/user/shipping-address/add', true, 'post', data)
    },
    updateAddress: (data) => {
        return request('/user/shipping-address/update', true, 'post', data)
    },
    deleteAddress: (id, token) => {
        return request('/user/shipping-address/delete', true, 'post', {
            id,
            token
        })
    },
    queryAddress: (token) => {
        return request('/user/shipping-address/list', true, 'post', {
            token
        })
    },
    defaultAddress: (token) => {
        return request('/user/shipping-address/default', true, 'post', {
            token
        })
    },
    addressDetail: (id, token) => {
        return request('/user/shipping-address/detail', true, 'post', {
            id,
            token
        })
    },
    pingtuanOpen: (goodsId, token) => {
        return request('/shop/goods/pingtuan/open', true, 'post', {
            goodsId,
            token
        })
    },
    pingtuanList: (goodsId) => {
        return request('/shop/goods/pingtuan/list', true, 'post', {
            goodsId
        })
    },
    videoDetail: (videoId) => {
        return request('/media/video/detail', true, 'post', {
            videoId
        })
    },
    bindMobile: (data) => {
        return request('/user/wxapp/bindMobile', true, 'post', data)
    },
    userDetail: (token) => {
        return request('/user/detail', true, 'post', {
            token
        })
    },
    userAmount: (token) => {
        return request('/user/amount', true, 'post', {
            token
        })
    },
    orderCreate: (data) => {
        return request('/order/create', true, 'post', data)
    },
    orderList: (data) => {
        return request('/order/listData', true, 'post', data)
    },
    orderDetail: (id, token) => {
        return request('/order/detail', true, 'post', {
            id,
            token
        })
    },
    orderDelivery: (orderId, token) => {
        return request('/order/delivery', true, 'post', {
            orderId,
            token
        })
    },
    orderReputation: (data) => {
        return request('/order/reputation', true, 'post', data)
    },
    orderClose: (orderNo, token) => {
        return request('/order/close', true, 'post', {
            orderNo,
            token
        })
    },
    orderPay: (orderId, token) => {
        return request('/order/pay', true, 'post', {
            orderId,
            token
        })
    },
    orderStatistics: (token) => {
        return request('/order/statistics', true, 'post', {
            token
        })
    },
    withDrawApply: (money, token) => {
        return request('/user/withDraw/apply', true, 'post', {
            money,
            token
        })
    },
    province: () => {
        return request('/common/region/v2/province', true, 'post')
    },
    nextRegion: (pid) => {
        return request('/common/region/v2/child', true, 'post', {
            pid
        })
    },
    cashLogs: (data) => {
        return request('/user/cashLog', true, 'post', data)
    },
    rechargeSendRules: () => {
        return request('/user/recharge/send/rule', true, 'get')
    },
    updateUserInfo: (userInfo) => {
        return request('/user/updateUserInfo', true, 'post', userInfo)
    },
    writeOffOrder: (orderNo, token, prodId) => {
        return request('/order/writeOffOrder', true, 'post', {
            orderNo,
            token,
            prodId
        })
    },
    userSign: (token) => {
        return request('/user/sign', true, 'post', {
            token
        })
    },
    userSignlogs: (token) => {
        return request('/user/sign/logs', true, 'post', {
            token
        })
    },
    userInfo: (token) => {
        return request('/user/userInfo', true, 'post', {
            token
        })
    },
}