const WXAPI = require('../../wxapi/main')

Page({
    data: {
        userInfo: {},
        subjectList: [],
        pageSize: 10,
        pageOffset: 0
    },
    onLoad: function() {},
    post: function(e) {
        var remark = e.detail.value.remark;
        if (!remark) {
            wx.showToast({
                title: '请输入留言内容',
                icon: "none"
            });
            return;
        }

        // 调用服务端 API
        wx.showLoading({
            title: '提交中', //提示的内容,
            mask: true, //显示透明蒙层，防止触摸穿透,
            success: res => {}
        });

        const token = wx.getStorageSync('token');
        WXAPI.addLeaveMessage(token, remark).then(function(res) {
            wx.hideLoading();
            if (res.code == 0) {
                // 展示 登录成功 提示框
                wx.showToast({
                    title: '发布成功', //提示的内容,
                    icon: 'success', //图标,
                    duration: 5000, //延迟时间,
                    mask: true, //显示透明蒙层，防止触摸穿透,
                    success: res => {
                        // 跳转到列表页
                        wx.redirectTo({
                            url: '/pages/leave-message/list'
                        });
                    }
                });
            } else {
                // 展示 错误信息
                wx.showToast({
                    title: response.message, //提示的内容,
                    icon: 'none', //图标,
                    duration: 2000, //延迟时间,
                    mask: true, //显示透明蒙层，防止触摸穿透,
                    success: res => {}
                });
            }
        }).catch(error => {
            console.log(error);
            wx.showToast({
                title: '提交失败', //提示的内容,
                icon: 'none', //图标,
                duration: 2000, //延迟时间,
                mask: true, //显示透明蒙层，防止触摸穿透,
                success: res => {}
            });
        });
    }
});