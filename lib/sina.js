var querystring = require('querystring');
var underscore = require("underscore");
var request = require('request');

var Weibo = function (options) {
    this.options = {
        app_key:null,
        app_secret:null,
        access_token:null,
        user_id:0,
        refresh_token:null,
        redirect_uri:"",
        api_group:[],
        scope:""
    };
    underscore.extend(this.options, options);
    this.oauth = this.oauth();
    this.users = this.users();
}

Weibo.prototype.request = function (options, callback) {
    var self = this;

    var post_body = querystring.stringify(options);
    var opts = {
        host:"https://api.weibo.com/",
        path:'2/' + options.path + ".json",
        method:'POST',
        headers:{
            'content-type':'application/x-www-form-urlencoded'
        }
    };

    request({
        url:opts.host + opts.path + ((options.method == "GET") ? ("?" + post_body) : ""),
        method:options.method || "POST",
        headers:{
            'content-type':'application/x-www-form-urlencoded'
        },
        body:((options.method == "GET") ? "" : post_body)
    }, function (e, r, body) {
        if (!e) {
            try {
                body = JSON.parse(body);
                if (body.error) {
                    e = new Error(body.error);
                }
            }
            catch (error) {
                e = error;
            }
        }
        callback && callback(e, body);
    });

};

Weibo.prototype.oauth = function () {
    var self = this;
    return {
        authorize:function (options) {
            return  'https://api.weibo.com/oauth2/authorize?' + querystring.stringify(options);
        },
        accesstoken:function (code, callback) {
            var options = {
                grant_type:"authorization_code",
                code:code,
                client_id:self.options.app_key,
                client_secret:self.options.app_secret,
                redirect_uri:self.options.redirect_uri
            };
            var post_body = querystring.stringify(options);

            var opts = {
                url:'https://api.weibo.com/oauth2/access_token',
                method:'post',
                headers:{
                    "Content-Type":'application/x-www-form-urlencoded',
                    "Content-length":post_body ? post_body.length : 0
                },
                body:post_body
            };
            request(opts, function (e, r, body) {
                try {
                    body = JSON.parse(body);
                }
                catch (error) {
                    e = error;
                }

                if (body.error) {
                    e = new Error(body.error);
                }
                callback && callback(e, body);
            });
        }
    }
};

Weibo.prototype.users = function () {
    var users = {};
    var self = this;
    var users_methods = ["show", "domain_show", "counts", "show_rank", "get_top_status", "set_top_status", "cancel_top_status"];

    users_methods.forEach(function (method) {
        users[method] = function (options, callback) {
            options.path = "users/" + method;
            self.request(options, callback);
        }
    });
    return users;
};

module.exports = Weibo;