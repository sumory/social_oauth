var express = require('express');
var http = require('http');
var path = require('path');
var querystring = require('querystring');
var config = require('./config.js');
var Sina = require('./lib/sina.js');
var Renren = require('./lib/renren.js');
var QQ = require('./lib/qq.js');

var app = express();
var sina = new Sina(config.sina);
var renren = new Renren(config.renren);
var qq = new QQ(config.qq);

app.configure(function(){
  app.set('port', process.env.PORT || 80);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', function(req, res){
    var sina_options = {
        client_id: config.sina.client_id,
        redirect_uri: config.sina.redirect_uri,
        response_type: 'code' 
    };

    var renren_options = {
        client_id: config.renren.client_id,
        redirect_uri: config.renren.redirect_uri,
        response_type: 'code' 
    };

    var qq_options = {
        client_id: config.qq.client_id,
        redirect_uri: config.qq.redirect_uri,
        response_type: 'code' 
    };

    var sina_url = sina.oauth.authorize(sina_options);
    var renren_url = renren.oauth.authorize(renren_options);
    var qq_url = qq.oauth.authorize(qq_options);

    //console.log('sina_url is: ',sina_url);
    //console.log('renren_url is: ',renren_url);
    //console.log('qq_url is: ',qq_url);

    res.render('index', { 
        sina_url: sina_url,
        renren_url: renren_url,
        qq_url: qq_url
    });
});

app.get('/sina_auth_cb', function (req, res, next) {
    sina.oauth.accesstoken(req.query.code , function (error, data){
        if(!error){
            access_token = data.access_token; 
            sina.users.show({
                source:config.sina.app_key,
                uid:data.uid,
                access_token:access_token,
                method:"GET"
            }, function(error, data){
                if(error){
                    res.render('ok', { 
                        result: 'ERROR'
                    });
                }
                else {
                    res.render('ok', { 
                        result: JSON.stringify(data)
                    });
                }
            });
        }
        else{
            console.log(error);
            res.render('ok', { 
                result: 'ERROR'
            });
        }
    });
});

app.get('/renren_auth_cb', function (req, res, next) {
    renren.oauth.accesstoken(req.query.code , function (error, data){
        if(!error){
            renren.users.getInfo({
                access_token: data.access_token
            }, function(error, data){
                if(error){
                    res.render('ok', { 
                        result: 'ERROR'
                    });
                }
                else {
                    res.render('ok', { 
                        result: JSON.stringify(data[0])
                    });
                }
            });
        }
        else{
            console.log(error);
            res.render('ok', { 
                result: 'ERROR'
            });
        }
    });
});

app.get('/qq_auth_cb', function (req, res, next) {
    qq.oauth.accesstoken(req.query.code , function (error, token){//{access_token:YOUR_ACCESS_TOKEN, expires_in:7776000}
        if(error){
            console.log(error);
            res.render('ok', { 
                result: 'ERROR'
            });
        }
        else{
            var access_token = querystring.parse(token)['access_token'];
            qq.oauth.openid(access_token, function(err, data){//{"client_id":"YOUR_APPID","openid":"YOUR_OPENID"}
                if(err){                   
                    res.render('ok', { 
                        result: 'ERROR'
                    });
                }
                else{
                    qq.user.get_user_info({
                        openid: data.openid,
                        access_token: access_token,
                        oauth_consumer_key: config.qq.client_id,
                        method: "GET"
                    }, function(error, data){
                        if(error){
                            res.render('ok', { 
                                result: 'ERROR'
                            });
                        }
                        else {
                            res.render('ok', { 
                                result: JSON.stringify(data)
                            });
                        }
                    });
                }
            });
        }
        
    });
});


http.createServer(app).listen(app.get('port'), function(){
    console.log("OAuth server listening on port " + app.get('port'));
});
