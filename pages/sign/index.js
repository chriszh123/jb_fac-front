import initCalendar from '../../template/calendar/index';
import {
    setTodoLabels
} from '../../template/calendar/index';
const WXAPI = require('../../wxapi/main')

Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // 初始化日历组件
        initCalendar({
            afterTapDay: (currentSelect, allSelectedDays) => {
                // 不是今天，直接 return 
                const myDate = new Date();
                // console.log('y:', myDate.getFullYear())
                // console.log('m:', myDate.getMonth() + 1)
                // console.log('d:', myDate.getDate())
                if (myDate.getFullYear() != currentSelect.year ||
                    (myDate.getMonth() + 1) != currentSelect.month ||
                    myDate.getDate() != currentSelect.day) {
                    return
                }
                if (currentSelect.hasTodo) {
                    wx.showToast({
                        title: '今天已签到',
                        icon: 'none'
                    });
                    return;
                }
                var token = wx.getStorageSync('token');
                WXAPI.userSign(token).then(res => {
                    if (res.code == 0) {
                        wx.showToast({
                            title: '签到成功',
                            icon: 'none'
                        });
                        setTodoLabels({
                            pos: 'bottom',
                            dotColor: '#40',
                            days: [{
                                year: currentSelect.year,
                                month: currentSelect.month,
                                day: currentSelect.day,
                                todoText: '已签到:' + res.data
                            }],
                        });
                    } else {
                        // 签到操作发生异常
                        wx.showModal({
                            title: '提示', //提示的标题,
                            content: res.msg, //提示的内容,
                            confirmText: '确定', //确定按钮的文字，默认为取消，最多 4 个字符,
                            confirmColor: '#3CC51F', //确定按钮的文字颜色,
                            success: res => {
                                if (res.confirm) {
                                    // 用户点击确定
                                } else if (res.cancel) {
                                    // 用户点击取消
                                }
                            }
                        });
                    }
                });
            }
        });

        // 当前用户对应的签到记录数据
        var token = wx.getStorageSync('token');
        WXAPI.userSignlogs(token).then(res => {
            if (res.code == 0) {
                res.data.result.forEach(ele => {
                    const _data = ele.dateAdd.split(" ")[0]
                    setTodoLabels({
                        pos: 'bottom',
                        dotColor: '#40',
                        days: [{
                            year: parseInt(_data.split("-")[0]),
                            month: parseInt(_data.split("-")[1]),
                            day: parseInt(_data.split("-")[2]),
                            todoText: '已签到:' + ele.point
                        }],
                    });
                })
            } else {
                // 查询接口发生异常
                wx.showModal({
                    title: '提示', //提示的标题,
                    content: res.msg, //提示的内容,
                    confirmText: '确定', //确定按钮的文字，默认为取消，最多 4 个字符,
                    confirmColor: '#3CC51F', //确定按钮的文字颜色,
                    success: res => {
                        if (res.confirm) {
                            // 用户点击确定
                        } else if (res.cancel) {
                            // 用户点击取消
                        }
                    }
                });
            }
        })
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})