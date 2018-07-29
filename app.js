var express = require("express");
var logger = require("morgan");
var path = require("path");
var redis = require("redis");
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
require("body-parser-xml")(bodyParser);
// xmlparser = require('express-xml-bodyparser');
var favicon = require("serve-favicon");
var session = require('express-session');
var RedisStore = require("connect-redis")(session);
var compression = require('compression')

var port = process.env.PORT || 3000;
var app = express();
var models = require('./model/index');

const options = {
  host: "127.0.0.1",
  port: 6379,
  ttl: 10800
}
const client = redis.createClient();

client.on("error", function(err) {
  console.log("Redis Error" + err);
});

app.disable('x-powered-by');
app.use(logger("dev"));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  store: new RedisStore(options),
  secret: 'qmy and heicx_sudo',
  resave: false,
	saveUninitialized: true,
	name: "sessionid"
}));
// app.use(xmlparser());
app.use(bodyParser.xml({
  limit: "2MB",
  xmlParseOptions: {
    normalize: true,
    normalizeTags: true,
    explicitArray: false
  },
  verify: function(req, res, buf, encoding) {
    if(buf && buf.length) {
      req.rawBody = buf.toString(encoding || "utf8");
    }
  }
}));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header('Access-Control-Allow-Headers', 'x-requested-with, Content-Type');

  models(function(err, db) {
    if(err) return next(err);

    req.models = db.models;
    req.db = db;
    req.redisClient = client;

    console.log(db.settings.get('connection.reconnect'));
    
    return next();
  });
});

/**
 * 路由扩展
 */
const adminLogin = require("./routes/admin/login");
const adminUser = require("./routes/admin/user");
const adminOrder = require("./routes/admin/order");

app.use("/qmy-admin", adminLogin.routes);
app.use("/qmy-admin/user", adminUser);
app.use("/qmy-admin/order", adminOrder);

const mallLogin = require("./routes/mall/login");
const mallUser = require("./routes/mall/user");
const mallArea = require("./routes/mall/area");
const mallAddress = require("./routes/mall/address");
const payment = require("./routes/mall/payment");
const order = require("./routes/mall/order");

app.use("/mall", mallLogin.routes);
app.use("/mall/user", mallUser);
app.use("/mall/area", mallArea);
app.use("/mall/address", mallAddress);
app.use("/mall/payment", payment);
app.use("/mall/order", order);

app.get("*", function(req, res) {
    res.status(404).end("404");
});

app.listen(port);
