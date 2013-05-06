var querystring = require('querystring');
var underscore = require("underscore");
var request = require('request');

var QQ = function (options) {
    this.options = {
        app_key:null,
        app_secret:null,
        access_token:null,
        user_id:0,
        refresh_token:null,
        format:"JSON",
        redirect_uri:"",
        api_group:[],
        scope:""
    };
    underscore.extend(this.options, options);

    this.oauth = this.oauth();
    this.user = this.user();
}

QQ.prototype.request = function (options, callback) {
    var self = this;
    var post_body = querystring.stringify(options);
    request({
        url:'https://graph.qq.com' + options.path + ((options.method == "GET") ? ("?" + post_body) : ""),
        method:options.method || "POST",
        headers:{
            "Content-Type":'application/x-www-form-urlencoded'
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

QQ.prototype.oauth = function () {
    var self = this;
    return {
        authorize:function (options) {
            return  'https://graph.qq.com/oauth2.0/authorize?' + querystring.stringify(options);
        },
        accesstoken:function (code, callback) {
            var options = {
                grant_type:"authorization_code",
                code:code,
                client_id:self.options.client_id,
                client_secret:self.options.app_key,
                redirect_uri:self.options.redirect_uri
            };

            var post_body = querystring.stringify(options);
            var opts = {
                url:"https://graph.qq.com/oauth2.0/token",
                method:'POST',
                headers:{
                    "Content-Type":'application/x-www-form-urlencoded'
                },
                body:post_body
            };
            request(opts, function (e, r, body) {
                callback && callback(e, body);
            });
        },
        openid:function (token, callback) {
            var options = {
                access_token:token
            };

            var opts = {
                url:"https://graph.qq.com/oauth2.0/me",
                method:'POST',
                headers:{
                    "Content-Type":'application/x-www-form-urlencoded'
                },
                body:querystring.stringify(options)
            };
            request(opts, function (e, r, body) {//MIND body is: callback( {"client_id":"YOUR_APPID","openid":"YOUR_OPENID"} );
                if (!e) {
                    try {
                        body = JSON.parse(body.substring(body.lastIndexOf('{'), body.lastIndexOf('}') + 1));
                    }
                    catch (error) {
                        e = error;
                    }
                }
                callback && callback(e, body);
            })
        }
    }
};

QQ.prototype.user = function () {
    var user = {};
    var self = this;
    var user_methods = ['get_user_info', 'get_info'];

    user_methods.forEach(function (m) {
        user[m] = function (options, callback) {
            options.path = "/user/" + m;
            self.request(options, callback);
        }
    });
    return user;
};

module.exports = QQ;


