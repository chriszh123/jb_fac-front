const WXAPI = require('../../wxapi/main')

Page({
    data: {
        showModal: false,
        list: [],
        size: 10,
        page: 0,
        remark: '',
        mngtRemark: ''
    },
    onLoad: function() {
        console.log("onLoad");
        // this.list();
    },
    onShow: function(e) {
        console.log("onShow");
        this.clearList();
        // this.onLoad();
        this.list();
    },
    post: function() {
        // 跳转至提问页面
        wx.navigateTo({
            url: 'post'
        });
    },
    clearList: function() {
        this.setData({
            page: 0,
            list: []
        });
    },
    onReachBottom: function() {
        //当页面滑动到底部，加载下一页
        console.log("onReachBottom");
        this.list();
    },
    onPullDownRefresh: function() {
        // 下拉刷新动作
        console.log("onPullDownRefresh");
        this.clearList();
        this.list();
        wx.stopPullDownRefresh();
    },
    clickQuestion: function() {

    },
    viewQuestion: function(e) {
        // 查看留言内容
        var remark = e.currentTarget.dataset.remark;
        var mngtRemark = e.currentTarget.dataset.mngtRemark;
        // wx.showModal({
        //     title: '',
        //     content: remark,
        //     showCancel: false
        // });

        this.setData({
            showModal: true,
            remark: remark,
            mngtRemark: mngtRemark
        });
    },
    hideModal: function() {
        this.setData({
            showModal: false

        });
    },
    onConfirm: function() {
        this.hideModal();
    },
    preventTouchMove: function() {
        // 空方法：阻断事件向下传递，避免在弹窗后还可以点击或者滑动蒙层下的界面
    },
    list: function() {
        var that = this;
        const page = that.data.page;
        const size = that.data.size;
        wx.showLoading({
            title: '加载中', //提示的内容,
            mask: true, //显示透明蒙层，防止触摸穿透,
            success: res => {}
        });

        // 拉取留言列表
        const token = wx.getStorageSync('token');
        WXAPI.listLeaveMessage(token, page, size).then(function(res) {
            if (res.code == 0) {
                wx.hideLoading();
                var leaveMesages = that.data.list.concat(res.data);
                leaveMesages.forEach((item, index) => {
                    if (item.remark && item.remark.length > 16) {
                        // item.remark = item.remark.substring(0, 16) + "...";
                    }
                });

                that.setData({
                    list: leaveMesages,
                    page: page + 1
                });

                if (res.data.length != 0) {
                    // wx.showToast({
                    //     title: '加载第' + (page + 1) + '页成功', //提示的内容,
                    //     icon: 'success', //图标,
                    //     duration: 3000, //延迟时间,
                    //     mask: true, //显示透明蒙层，防止触摸穿透,
                    //     success: res => {}
                    // });
                } else {
                    wx.showToast({
                        title: '暂时没有您的留言信息,欢迎给我们留下您的需求哦~', //提示的内容
                        icon: 'none', //图标,
                        duration: 5000, //延迟时间,
                        mask: true, //显示透明蒙层，防止触摸穿透,
                        success: res => {}
                    });
                }
            }
        }).catch(error => {
            console.log("请求列表失败", error);
        });
    },
    withdrawMessage: function(e) {
        var that = this;
        // 用户撤回留言
        var id = e.currentTarget.dataset.id;
        var token = wx.getStorageSync('token');
        wx.showModal({
            title: '',
            content: '确定要撤回当前这条留言记录吗？',
            confirmColor: '#3CC51F',
            success: function(res) {
                if (res.confirm) {
                    WXAPI.removeLeaveMessage(token, id).then(function(res) {
                        if (res.code == 0) {
                            // 刷新留言列表
                            var leaveMesages = that.data.list;
                            leaveMesages.forEach((item, index) => {
                                if (item.id == id) {
                                    leaveMesages.splice(index, 1);
                                }
                            });
                            that.setData({
                                list: leaveMesages
                            });

                            wx.showToast({
                                title: '留言撤回成功~', //提示的内容
                                icon: 'none', //图标,
                                duration: 3000, //延迟时间,
                                mask: true, //显示透明蒙层，防止触摸穿透,
                                success: res => {}
                            });
                        } else {
                            wx.showToast({
                                title: '', //提示的内容
                                icon: 'none', //图标,
                                content: res.msg,
                                duration: 3000, //延迟时间,
                                mask: true, //显示透明蒙层，防止触摸穿透,
                                success: res => {}
                            });
                        }
                    });
                } else {
                    console.log('用户点击取消')
                }
            }
        });
    }
})