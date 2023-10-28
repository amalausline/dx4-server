var express = require('express');
var app = express();
var fs = require('fs')
//var https = require('https');
var bodyParser = require('body-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql')
var DB = require('./dbQueries')
var bcrypt = require('bcryptjs');
var Upload = express.Router({ mergeParams: true });
var momentTz = require('moment-timezone');
var exec = require('child_process').exec;
const https = require('https');

const options = {
  key: fs.readFileSync('/etc/ssl/private/private.key'),
  cert: fs.readFileSync('/etc/ssl/certificate.crt')
};

//
/*"path": "/api/sendhttp.php?country=91&sender=MSGIND&route=4&mobiles=&authkey=&encrypt=&message=Hello!%20This%20is%20a%20test%20message&flash=&unicode=&schtime=&afterminutes=&response=&campaign=",*/
//require('./app/routes.js')(app);
//connection.query('UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?', ['a', 'b', 'c', userId], function(err, results) {
// ...
//});
//AUTO_INCREMENT=5001
//ALTER TABLE tbl AUTO_INCREMENT = 100;
var db = new DB();

var crypto = require('crypto');

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(allowCrossDomain);



var apiUrl = "/api"
const port = 1101



/*==========================================================================
                          ANALYTICS
========================================================================== */

/*-------------------------------------------

LIST

- BILLING ANALYTICS
- EXPENSE ANALYTICS
- INVENTORY ANALYTICS
- ODC ANALYTICS
- SMS ANALYTICS

 -----------------------------------------*/
require('./data/analytics/analytics')(app);

/*==========================================================================
                          SETTINGS
========================================================================== */

/*
-----------------------------------
LIST

- BANQUET HALL
- EXPENSE CATEGORY
- FOOD AND BEVERAGE
- LOCALITY
- POINTS
- RAW MATERIAL
- SALE MATERIAL
- STAFF
- TABLENO
- STAFF
- TAX
- THIRD PARTY INTEGRATION
- VENDOR
- LOGIN
- BRANCH
- CORPORATE SETTINGS

---------------------------------
*/
require('./data/settings/settings')(app);

/*==========================================================================
                         SALE BILLINGS
========================================================================== */

/*-------------------------------------------

LIST

- NEW BILL
- CURRENT BILL
- PAID BILL
- CURRENT ODC
- PAID ODC

 -----------------------------------------*/
require('./data/salesbill/bill')(app);

/*==========================================================================
                         EXPENSE BILLINGS
========================================================================== */

/*-------------------------------------------

LIST

- NEW EXPENSES
- BALANCE EXPENSES
- PAID EXPENSES

 -----------------------------------------*/

require('./data/expensebill/expensebill')(app);

/*==========================================================================
                         INVENTORY 
========================================================================== */
/*-------------------------------------------
LIST

- SALES ORDER
- PURCHASE ORDER
- DELIVERY TO KITCHEN
- STOCK RAW MATERIAL
- STOCK SALE MATERIAL
 -----------------------------------------*/

require('./data/inventory/inventory')(app);

/*==========================================================================
                         CUSTOMER
========================================================================== */
/*-------------------------------------------
LIST

- CUSTOMER INFO

 -----------------------------------------*/

require('./data/customer_info/customer')(app);

//Configuration
/*
app.set('port', 1101);
app.listen(app.get('port'));
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
*/
/*app.get('/', function(req, res) {
  res.writeHead(200);
  res.end('hello world\n');
  }); */


  app.get('/', function(req, res) {
    db.executeQuery('SELECT * FROM table_no', function(results) {
      return res.status(200).send(results);
    });
  });


https.createServer(options, app).listen(1100);