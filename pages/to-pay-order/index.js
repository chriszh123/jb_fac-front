const app = getApp()
const WXAPI = require('../../wxapi/main')

Page({
    data: {
        totalScoreToPay: 0,
        goodsList: [],
        isNeedLogistics: 0, // 是否需要物流信息
        allGoodsPrice: 0,
        yunPrice: 0,
        allGoodsAndYunPrice: 0,
        goodsJsonStr: "",
        orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车，
        pingtuanOpenId: undefined, //拼团的话记录团号
        userScore: 0, // 是否使用积分:0-不使用，1-使用

        hasNoCoupons: true,
        coupons: [],
        youhuijine: 0, //优惠券金额
        curCoupon: null, // 当前选择使用的优惠券
        youhuijine: 0, //优惠券金额
        curCoupon: null // 当前选择使用的优惠券
    },
    onShow: function () {
        var that = this;
        var shopList = [];
        var allGoodsRealPrice = 0;
        //立即购买下单
        if ("buyNow" == that.data.orderType) {
            var buyNowInfoMem = wx.getStorageSync('buyNowInfo');
            that.data.kjId = buyNowInfoMem.kjId;
            if (buyNowInfoMem && buyNowInfoMem.shopList) {
                shopList = buyNowInfoMem.shopList;
            }
        } else {
            //购物车下单
            var shopCarInfoMem = wx.getStorageSync('shopCarInfo');
            that.data.kjId = shopCarInfoMem.kjId;
            if (shopCarInfoMem && shopCarInfoMem.shopList) {
                // shopList = shopCarInfoMem.shopList
                shopList = shopCarInfoMem.shopList.filter(entity => {
                    return entity.active;
                });
            }
        }
        // 商品总待付款价格汇总
        if (shopList && shopList.length > 0) {
            for (var i = 0, size = shopList.length; i < size; i++) {
                var good = shopList[i];
                var prodId = good.goodsId;
                // 处理砍价活动对应的商品的最新价格
                var kjprodKey = "kjprod_" + prodId;
                var kjProdCurPrice = wx.getStorageSync(kjprodKey);
                if (kjProdCurPrice) {
                    allGoodsRealPrice = allGoodsRealPrice + that.accMul(good.number, kjProdCurPrice);
                    // 删除当前砍价商品活动对应的本地介个存储数据
                    wx.removeStorageSync(kjprodKey);
                } else {
                    allGoodsRealPrice = allGoodsRealPrice + that.accMul(good.number, good.price);
                }               
                allGoodsRealPrice = that.accMul(1, allGoodsRealPrice);
            }
        }

        // 
        that.setData({
            goodsList: shopList,
            allGoodsAndYunPrice: allGoodsRealPrice
        });
        // 初始化积分等信息
        that.initUserAmount();
        // 送货地址
        that.initShippingAddress();
    },

    onLoad: function (e) {
        if (!e.orderType) {
            e.orderType = "cart";
        }
        console.log("onLoad = " + JSON.stringify(e));
        this.setData({
            isNeedLogistics: 0, // 暂时不支持物流
            orderType: e.orderType
            // pingtuanOpenId: e.pingtuanOpenId
        });
    },

    getDistrictId: function (obj, aaa) {
        if (!obj) {
            return "";
        }
        if (!aaa) {
            return "";
        }
        return aaa;
    },
    useScoreChange: function (e) {
        console.log("userScore *************:" + e.detail.value);
        var that = this;
        that.setData({
            userScore: e.detail.value ? 1 : 0
        });
        console.log("that.data.userScore *************:" + that.data.userScore);
    },
    createOrder: function (e) {
        wx.showLoading();
        var that = this;
        var loginToken = wx.getStorageSync('token') // 用户登录 token
        var remark = ""; // 备注信息
        if (e) {
            remark = e.detail.value.remark; // 备注信息
        }

        var postData = {
            token: loginToken,
            goodsJsonStr: that.data.goodsJsonStr,
            remark: remark,
            userScore: that.data.userScore
        };
        if (that.data.kjId) {
            postData.kjid = that.data.kjId
        }
        if (that.data.pingtuanOpenId) {
            postData.pingtuanOpenId = that.data.pingtuanOpenId
        }
        // 暂时不需要物流
        if (that.data.isNeedLogistics > 0) {
            if (!that.data.curAddressData) {
                wx.hideLoading();
                wx.showModal({
                    title: '',
                    content: '请先设置您的收货地址！',
                    showCancel: false
                })
                return;
            }
            postData.provinceId = that.data.curAddressData.provinceId;
            postData.cityId = that.data.curAddressData.cityId;
            if (that.data.curAddressData.districtId) {
                postData.districtId = that.data.curAddressData.districtId;
            }
            postData.address = that.data.curAddressData.address;
            postData.linkMan = that.data.curAddressData.linkMan;
            postData.mobile = that.data.curAddressData.mobile;
            postData.code = that.data.curAddressData.code;
        }
        // 优惠券
        if (that.data.curCoupon) {
            postData.couponId = that.data.curCoupon.id;
        }
        if (!e) {
            postData.calculate = "true";
        }

        WXAPI.orderCreate(postData).then(function (res) {
            wx.hideLoading();
            if (res.code != 0) {
                wx.showModal({
                    title: '',
                    content: res.msg,
                    showCancel: false
                })
                return;
            } else {
                // 订单创建成功后需要清除相应商品对应的分享人缓存信息
                var goodsList = that.data.goodsList;
                for (let i = 0; i < goodsList.length; i++) {
                    var prod = goodsList[i];
                    // 商品id
                    var prodId = prod.goodsId;
                    // 每个商品对应的分享人 :{key:inviterid_ + 商品id, value:分享人id}
                    var inviterKey = 'inviterid_' + prodId;
                    var inviterId_storge = wx.getStorageSync(inviterKey);
                    // 当前商品有其他人分享信息时才会做删除分享人缓存操作
                    console.log('after create order success, remove inviter: inviterKey = ' + inviterKey + ", inviterId_storge = " + inviterId_storge);
                    if (inviterId_storge) {
                        try {
                            wx.removeStorageSync(inviterKey);
                            console.log('remove inviter success, inviterKey = ' + inviterKey);
                        } catch (e) {
                            console.log('remove inviter error, inviterKey = ' + inviterKey);
                        }
                    }
                }
            }

            if (e && "buyNow" != that.data.orderType) {
                // 清空购物车数据
                wx.removeStorageSync('shopCarInfo');
            }
            if (!e) {
                that.setData({
                    totalScoreToPay: res.data.score,
                    isNeedLogistics: res.data.needLogistics,
                    allGoodsPrice: res.data.amountTotle,
                    allGoodsAndYunPrice: res.data.amountLogistics + res.data.amountTotle,
                    yunPrice: res.data.amountLogistics
                });
                that.getMyCoupons();
                return;
            }
            // zgf
            WXAPI.addTempleMsgFormid({
                token: wx.getStorageSync('token'),
                type: 'form',
                formId: e.detail.formId
            });
            // 配置模板消息推送
            var postJsonString = {};
            postJsonString.keyword1 = {
                value: res.data.dateAdd,
                color: '#173177'
            }
            postJsonString.keyword2 = {
                value: res.data.amountReal + '元',
                color: '#173177'
            }
            postJsonString.keyword3 = {
                value: res.data.orderNumber,
                color: '#173177'
            }
            postJsonString.keyword4 = {
                value: '订单已关闭',
                color: '#173177'
            }
            postJsonString.keyword5 = {
                value: '您可以重新下单，请在30分钟内完成支付',
                color: '#173177'
            }
            // zgf
            WXAPI.sendTempleMsg({
                module: 'order',
                business_id: res.data.id,
                trigger: -1,
                postJsonString: JSON.stringify(postJsonString),
                template_id: 'mGVFc31MYNMoR9Z-A9yeVVYLIVGphUVcK2-S2UdZHmg',
                type: 0,
                token: wx.getStorageSync('token'),
                url: 'pages/index/index'
            })
            postJsonString = {};
            postJsonString.keyword1 = {
                value: '您的订单已发货，请注意查收',
                color: '#173177'
            }
            postJsonString.keyword2 = {
                value: res.data.orderNumber,
                color: '#173177'
            }
            postJsonString.keyword3 = {
                value: res.data.dateAdd,
                color: '#173177'
            }
            // zgf
            WXAPI.sendTempleMsg({
                module: 'order',
                business_id: res.data.id,
                trigger: 2,
                postJsonString: JSON.stringify(postJsonString),
                template_id: 'Arm2aS1rsklRuJSrfz-QVoyUzLVmU2vEMn_HgMxuegw',
                type: 0,
                token: wx.getStorageSync('token'),
                url: 'pages/order-details/index?id=' + res.data.id
            })
            // 下单成功，跳转到订单管理界面
            wx.redirectTo({
                url: "/pages/order-list/index"
            });
        })
    },
    initUserAmount: function () {
        var that = this;
        const token = wx.getStorageSync('token');
        WXAPI.userAmount(token).then(function (res) {
            if (res.code == 0) {
                that.setData({
                    totalScoreToPay: res.data.score
                });
            }
        });
    },
    initShippingAddress: function () {
        var that = this;
        console.log("aaa");
        WXAPI.defaultAddress(wx.getStorageSync('token')).then(function (res) {
            if (res.code == 0) {
                that.setData({
                    curAddressData: res.data
                });
            } else {
                that.setData({
                    curAddressData: null
                });
            }
            // 运费
            that.processYunfei();
        })
    },
    // 运费
    processYunfei: function () {
        var that = this;
        var goodsList = this.data.goodsList;
        var goodsJsonStr = "[";
        var isNeedLogistics = 0;
        var allGoodsPrice = 0;

        for (let i = 0; i < goodsList.length; i++) {
            let carShopBean = goodsList[i];
            if (carShopBean.logistics) {
                isNeedLogistics = 1;
            }
            // 商品总价
            allGoodsPrice += carShopBean.price * carShopBean.number;
            var goodsJsonStrTmp = '';
            if (i > 0) {
                goodsJsonStrTmp = ",";
            }
            // 商品id
            var prodId = carShopBean.goodsId;
            var inviter_id = 0;
            // 每个商品对应的分享人 :{key:inviterid_ + 商品id, value:分享人id}
            var inviterKey = 'inviterid_' + prodId;
            var inviterId_storge = wx.getStorageSync(inviterKey);
            if (inviterId_storge) {
                inviter_id = inviterId_storge;
            }
            console.log('inviterKey =' + inviterKey + ", inviter_id = " + inviter_id + ", inviterId_storge = " + inviterId_storge);

            // 每个商品对应的基本信息, 包括分享人
            goodsJsonStrTmp += '{"goodsId":' + prodId + ',"number":' + carShopBean.number + ',"propertyChildIds":"' + carShopBean.propertyChildIds + '","logisticsType":0, "inviter_id":' + inviter_id + '}';
            goodsJsonStr += goodsJsonStrTmp;
        }
        goodsJsonStr += "]";
        // console.log(goodsJsonStr);
        that.setData({
            isNeedLogistics: isNeedLogistics,
            goodsJsonStr: goodsJsonStr
        });
        // 这里导致订单重复提交，只有"提交订单"按钮触发创建订单请求
        //that.createOrder();
    },
    addAddress: function () {
        wx.navigateTo({
            url: "/pages/address-add/index"
        })
    },
    selectAddress: function () {
        wx.navigateTo({
            url: "/pages/select-address/index"
        })
    },
    getMyCoupons: function () {
        var that = this;
        WXAPI.myCoupons({
            token: wx.getStorageSync('token'),
            status: 0
        }).then(function (res) {
            if (res.code == 0) {
                var coupons = res.data.filter(entity => {
                    return entity.moneyHreshold <= that.data.allGoodsAndYunPrice;
                });
                if (coupons.length > 0) {
                    that.setData({
                        hasNoCoupons: false,
                        coupons: coupons
                    });
                }
            }
        })
    },
    bindChangeCoupon: function (e) {
        const selIndex = e.detail.value[0] - 1;
        if (selIndex == -1) {
            this.setData({
                youhuijine: 0,
                curCoupon: null
            });
            return;
        }
        //console.log("selIndex:" + selIndex);
        this.setData({
            youhuijine: this.data.coupons[selIndex].money,
            curCoupon: this.data.coupons[selIndex]
        });
    },
    accMul: function (arg1, arg2) {
        // 两数相乘，避免出现多位小数
        var m = 0,
            s1 = arg1.toString(),
            s2 = arg2.toString();
        try {
            m += s1.split(".")[1].length
        } catch (e) {}
        try {
            m += s2.split(".")[1].length
        } catch (e) {}
        return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
    }
})