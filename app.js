var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql')
var DB = require('./dbQueries')
var bcrypt = require('bcryptjs');
var Upload = express.Router({ mergeParams: true });
var momentTz = require('moment-timezone');
var exec = require('child_process').exec;
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

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
}

app.use(express.urlencoded({
  extended: true
}));

app.use(express.json());
app.use(allowCrossDomain);

const fs = require('fs');

const { Client } = require('whatsapp-web.js');
const { MessageMedia } = require('whatsapp-web.js');

var apiUrl = "/api"
const port = 1100

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

/*
// newbill in casier settings (get,add)
require('./data/salesbill/newbill/newbill')(app);


// currentbill in casier settings (get,add,edit)
require('./data/salesbill/currentbill/currentbill')(app);


// paidbill in casier settings (get)
require('./data/salesbill/paidbill/paidbill')(app);
*/

/*==========================================================================
                         ODC BILLINGS
========================================================================== */


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
                    corporate_settings
========================================================================== */
/*
// corporate_settings (get,add,edit,delete)
require('./data/corporate_settings/corporate_settings')(app);

*/

/*==========================================================================
                         CUSTOMER
========================================================================== */
/*-------------------------------------------
LIST

- CUSTOMER INFO

 -----------------------------------------*/

require('./data/customer_info/customer')(app);



//post campaign data to campaign table
app.post(apiUrl + '/whatsappQRscan', function (req, res) {
  let browserDetails = req.body[0]
  const SESSION_FILE_PATH = './session.json';
  let sessionData;
  if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
  }
  const client = new Client({
    puppeteer:
    {
      executablePath: browserDetails.browserurl,
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ] 
    },
    session: sessionData
  });
  client.initialize();
  // You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.
  // This object must include WABrowserId, WASecretBundle, WAToken1 and WAToken2.
  client.on('authenticated', (session) => {
      //console.log(session);
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {

        } else {
          setTimeout(() => {
            client.destroy();
          }, 500);
          return res.status(200).send('1');
        }
      });
  });



});

//post campaign data to campaign table
app.post(apiUrl + '/whatsappcampaign', function (req, res) {
  let customerdata = req.body.messagedetails;
  let campaigndata = req.body.campaingdetails[0];
  let browserDetails = req.body.browserDetails[0]
  const SESSION_FILE_PATH = './session.json';
  let sessionData;
  if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
  } else {

  }

  const client = new Client({
    puppeteer:
    {
      headless: browserDetails.showbrowser,
      executablePath: browserDetails.browserurl,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ] 
    },
    session: sessionData
  });
  client.initialize();
  // You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.
  // This object must include WABrowserId, WASecretBundle, WAToken1 and WAToken2.
  client.on('authenticated', (session) => {
    if (fs.existsSync(SESSION_FILE_PATH)) {

    } else {
      // console.log(session);
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        return res.status(200).send('1');
        if (err) {
          //console.error(err);
        }
      });
    }

  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    //console.error('AUTHENTICATION FAILURE', msg);
    fs.unlink(SESSION_FILE_PATH, (err) => {
      if (err) {
        //console.error(err);
      }
      setTimeout(() => {
        client.destroy();
      }, 500);
    });
    return res.status(200).send('0');
  });

  client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
  });


  //var data =['hello', 'hello2']
  //do some operations
  function wasendMessage(callback) {
    var sendno = [];
    client.on('ready', async () => {
      var i;
      for (i = 0; i < customerdata.length; i++) {
        var customer_id_data = customerdata[i];
        var contact_no = '+' + customerdata[i].customer_mobile;
        var message = customerdata[i].message;
        //console.log('Client is ready!');
        const chatId = contact_no.substring(1) + "@c.us";

        if (customerdata[0].img) {
          var allImgUrl = customerdata[0].img;
          var myImgUrl = allImgUrl.split(',');
          setTimeout(() => {
            for (i = 0; i < myImgUrl.length; i++) {
              const media = MessageMedia.fromFilePath(myImgUrl[i]);
              client.sendMessage(chatId, media);
            }
          }, 500);
        }
        //const media = MessageMedia.fromFilePath('333.jpg','2.jpg');
        //client.sendMessage(chatId, media);
        client.sendMessage(chatId, message);
        sendno.push(customer_id_data);
      }

      setTimeout(() => {
        callback(sendno);
        client.destroy();
      }, 5000);

    });

  }

  wasendMessage(function (result) {
    var sentno = result;
    if (sentno.length > 0) {
      var sql = "INSERT INTO campaign SET ?";
      db.executeQuery1(sql, campaigndata, function (results) {
        var insertId = results.insertId;
        var deliveryDateData = momentTz(new Date()).format('MMMM Do YYYY, h:mm:ss a');
        // Bulk update the data
        if (sentno.length == customerdata.length) {
          var campaigndetailsdata = customerdata.map(function (item) {
            return [item.customer_mobile, item.customer_id, insertId, 'DELIVERED', deliveryDateData]
          });
          var sql = "INSERT INTO campaigndetails (customerMobile,customerID,campaignID, status, deliverydate)  VALUES ? ";
          db.executeQuery1(sql, [campaigndetailsdata], function (results) {
            return res.status(200).send('2');
          });
        }
        // Checking the data sent and unsent
        else {
          let sentdddata = [];
          let unsentdddata = [];
          customerdata.filter(function (elem) {
            sentno.filter(function (sent) {
              if (elem.customer_id == sent.customer_id) {
                sentdddata.push(elem);
              } else {
                unsentdddata.push(elem);
              }
            });
          });

          var campaignentsentdetailsdata = sentdddata.map(function (item) {
            return [item.customer_mobile, item.customer_id, insertId, 'DELIVERED', deliveryDateData]
          });
          var campaignentunsentdetailsdata = unsentdddata.map(function (item) {
            return [item.customer_mobile, item.customer_id, insertId, 'FAILED', deliveryDateData]
          });
          var fulldatadetails = campaignentsentdetailsdata.concat(campaignentunsentdetailsdata);
          var sql = "INSERT INTO campaigndetails (customerMobile,customerID,campaignID, status, deliverydate)  VALUES ? ";
          db.executeQuery1(sql, [fulldatadetails], function (results) {
            return res.status(200).send('3');
          });


        }

      });


    } else {
      return res.status(200).send('4');
    }
  });
  //console.log('yes'+sendno); 
  client.on('change_state', state => {
    console.log('CHANGE STATE', state);
  });

  client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
  });


});

  // Get Table NO
  app.get(apiUrl + '/getTableNo', function (req, res) {
    db.executeQuery('SELECT * FROM table_no', function (results) {
      return res.status(200).send(results);
    });
  });


//Configuration
/*
app.set('port', 1100);
app.listen(app.get('port')); */
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))