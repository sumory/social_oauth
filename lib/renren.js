var querystring = require('querystring');
var underscore = require("underscore");
var request = require('request');

var RenRen = function (options) {
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
    this.users = this.users();
};

RenRen.prototype.request = function (options, callback) {
    var self = this;

    if (self.options.access_token) {
        options['access_token'] = self.options.access_token;
    }
    options['format'] = "JSON";
    options['v'] = "1.0";

    request.post({
        url:'https://api.renren.com/restserver.do',
        headers:{
            'content-type':'application/x-www-form-urlencoded'
        },
        body:querystring.stringify(options)
    }, function (e, r, body) {
        if (!e) {
            try {
                body = JSON.parse(body);
                if (body.error_code) {
                    e = new Error(body.error_description);
                }
            }
            catch (error) {
                e = error;
            }
        }
        callback && callback(e, body);
    });

};

RenRen.prototype.oauth = function () {
    var self = this;
    return {
        authorize:function (options) {
            return  'https://graph.renren.com/oauth/authorize?' + querystring.stringify(options);
        },
        accesstoken:function (code, callback) {
            var options = {
                grant_type:"authorization_code",
                code:code,
                client_id:self.options.app_key,
                client_secret:self.options.app_secret,
                redirect_uri:self.options.redirect_uri
            };

            var opts = {
                url:"https://graph.renren.com/oauth/token",
                path:'',
                method:'POST',
                headers:{
                    "Content-Type":'application/x-www-form-urlencoded'
                },
                body:querystring.stringify(options)
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
    };
};

RenRen.prototype.users = function () {
    var users = {};
    var self = this;
    var users_methods = ["getInfo", "getLoggedInUser", "hasAppPermission", "isAppUser", "getProfileInfo", "getVisitors"];

    users_methods.forEach(function (m) {
        users[m] = function (options, callback) {
            options.method = "users." + m;
            if (m === 'getInfo') {
                options['fields'] = "uid,name,sex,birthday,email_hash,tinyurl";
            }
            self.request(options, callback);
        }
    });
    return users;
};

module.exports = RenRen;
