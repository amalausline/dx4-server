var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var exec = require('child_process').exec;
var { google } = require("googleapis");
// import the Google drive module in google library
var drive = google.drive("v3");
var key = require("./private_key.json");
var path = require("path");
var fs = require("fs");
const { resolve, join } = require('path');

var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var http = require('http');
const { Http2ServerRequest } = require('http2');
const https = require('https');

/*-------------------------------------------

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

 -----------------------------------------*/



module.exports = function (app) {


  /*-------------------------------------------
  =============================================

   BANQUET HALL

 ===============================================
   -------------------------------------------*/

  //get banquethall
  app.get(apiUrl + '/banquethall', function (req, res) {
    db.executeQuery("SELECT *  FROM banquethall", function (banquethall) {
      return res.status(200).send(banquethall);
    })
  })


  // Post banquethall
  app.post(apiUrl + '/BanquetHall', function (req, res) {
    var sql = "INSERT INTO banquethall SET ?";
    db.executeQuery1(sql, { BanquetHallName: req.body.BanquetHallName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });


  //  Update banquethall
  app.put(apiUrl + '/BanquetHall/:BanquetHallID', function (req, res) {
    let BanquetHallID = req.params.BanquetHallID;
    let BanquetHallName = req.body.BanquetHallName;
    var sql = `UPDATE banquethall SET BanquetHallName = "${BanquetHallName}" WHERE BanquetHallID = "${BanquetHallID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
  });

  // Delete banquethall
  app.delete(apiUrl + '/BanquetHall/:BanquetHallID', function (req, res) {
    var sql = 'DELETE FROM banquethall WHERE BanquetHallID = "' + req.params.BanquetHallID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
=============================================

 EXPENSE CATEGORY

===============================================
 -------------------------------------------*/

  // Get expense Menu Category
  app.get(apiUrl + '/exCategory', function (req, res) {
    db.executeQuery('SELECT * FROM expense_catergorys', function (results) {
      return res.status(200).send(results);
    });
  });

  // Post expense Menu Category
  app.post(apiUrl + '/exCategory', function (req, res) {
    var sql = "INSERT INTO expense_catergorys SET ?";
    db.executeQuery1(sql, { exCatergoryName: req.body.exCatergoryName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });


  //  Update expense Menu Category with id
  app.put(apiUrl + '/exCategory/:exCatergoryID', function (req, res) {
    let exCatergoryID = req.params.exCatergoryID;
    let exCatergoryName = req.body.exCatergoryName;
    var sql = `UPDATE expense_catergorys SET exCatergoryName = "${exCatergoryName}" WHERE exCatergoryID = "${exCatergoryID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
  });

  // Delete expense Menu Category
  app.delete(apiUrl + '/exCategory/:exCatergoryID', function (req, res) {
    var sql = 'DELETE FROM expense_catergorys WHERE exCatergoryID = "' + req.params.exCatergoryID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
   =============================================

    FOOD AND BEVERAGE

  ===============================================
    -------------------------------------------*/

  // Get Food Menu Category
  app.get(apiUrl + '/fmCategory', function (req, res) {
    db.executeQuery('SELECT * FROM food_menu_catergorys', function (results) {
      return res.status(200).send(results);
    });
  });

  // Get Food Menu Category
  app.get(apiUrl + '/inventoryfood', function (req, res) {
    db.executeQuery('SELECT food_menu_catergorys.fmCatergoryName,food_menu_items.fmCatergoryID,food_menu_items.fmItemID,food_menu_items.fmItemQty,food_menu_items.fmItemName  FROM food_menu_catergorys INNER JOIN food_menu_items ON food_menu_catergorys.fmCatergoryID = food_menu_items.fmCatergoryID', function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update Food Menu Category with id
  app.put(apiUrl + '/fmCategory/:fmCatergoryID', function (req, res) {
    let fmCatergoryID = req.params.fmCatergoryID;
    let fmCatergoryName = req.body.fmCatergoryName;
    var sql = `UPDATE food_menu_catergorys SET fmCatergoryName = "${fmCatergoryName}" WHERE fmCatergoryID = "${fmCatergoryID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Post Food Menu Category
  app.post(apiUrl + '/fmCategory', function (req, res) {
    var sql = "INSERT INTO food_menu_catergorys SET ?";
    db.executeQuery1(sql, { fmCatergoryName: req.body.fmCatergoryName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });

  // Delete Food Menu Category
  app.delete(apiUrl + '/fmCategory/:fmCatergoryID', function (req, res) {
    var sql = 'DELETE FROM food_menu_catergorys WHERE fmCatergoryID = "' + req.params.fmCatergoryID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });
  // Get Food Menu items
  app.get(apiUrl + '/fmItem', function (req, res, next) {
    db.executeQuery("SELECT * FROM food_menu_items  WHERE status_flag=1", function (results) {
      return res.status(200).send(results);
    })
  })

  // Post Food Items
  app.post(apiUrl + '/fmItem', function (req, res) {
    var data = [req.body].map(function (item) {
      return { 'branch_id': item.branch_id, 'status_flag': item.status_flag, 'fmItemName': item.fmItemName, 'tax_sgst': item.tax_sgst, 'tax_cgst': item.tax_cgst, 'tax_status': item.tax_status, 'fmItemType': item.fmItemType, 'fmItemQty': item.fmItemQty, 'fmItemUnit': item.fmItemUnit, 'fmItemPrice': item.fmItemPrice, 'offerprice': item.offerprice, 'dealer_price': item.dealer_price, 'fmCatergoryID': item.fmCatergoryID }
    })
    var sql = "INSERT INTO food_menu_items SET ?";
    db.executeQuery1(sql, data[0], function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update Food Menu Category with id
  app.put(apiUrl + '/fmItem/:fmItemID', function (req, res) {
    console.log(req.body)
    let fmItemID = req.params.fmItemID;
    let fmItemName = req.body.fmItemName;
    let tax_cgst = req.body.tax_cgst;
    let tax_sgst = req.body.tax_sgst;
    let tax_status = req.body.tax_status;
    let fmItemType = req.body.fmItemType;
    let fmItemQty = req.body.fmItemQty;
    let fmItemUnit = req.body.fmItemUnit;
    let fmItemPrice = req.body.fmItemPrice;
    let offerprice = req.body.offerprice;
    let dealer_price = req.body.dealer_price;
    let fmCatergoryID = req.body.fmCatergoryID;
    let branch_id = req.body.branch_id;
    let status_flag = req.body.status_flag;
    var sql = `UPDATE food_menu_items SET fmItemName = "${fmItemName}",fmItemType = "${fmItemType}",fmItemQty = "${fmItemQty}",fmItemUnit = "${fmItemUnit}",fmItemPrice = "${fmItemPrice}",tax_status = "${tax_status}",tax_sgst = "${tax_sgst}",tax_cgst = "${tax_cgst}",offerprice = "${offerprice}", dealer_price = "${dealer_price}",status_flag= "${status_flag}",branch_id = "${branch_id}", fmCatergoryID = "${fmCatergoryID}" WHERE fmItemID = "${fmItemID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });
  // Delete Food Menu Item
  //----------------
  app.delete(apiUrl + '/fmItem/:fmItemID', function (req, res) {
    var status_flag = 0;
    var sql = 'UPDATE food_menu_items SET status_flag = "${status_flag}" WHERE fmItemID = "' + req.params.fmItemID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
 =============================================

   LOCALITY

===============================================
  -------------------------------------------*/

  //get locality
  app.get(apiUrl + '/locality', function (req, res) {
    db.executeQuery("SELECT *  FROM locality", function (locality) {
      return res.status(200).send(locality);
    })
  });

  // Post locality
  app.post(apiUrl + '/locality', function (req, res) {


    var sql = "INSERT INTO locality SET ?";
    db.executeQuery1(sql, { localityName: req.body.localityName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });

  });

  // Post locality
  app.post(apiUrl + '/dbdownload', function (req, res) {
    var date = req.body.Date;
    var mysqlDumpPath = req.body.mysqlDumpPath;
    var downloadPath = req.body.downloadPath;
    // var command = mysqlDumpPath + 'mysqldump -u root -pTechfooddy123$ techfooddy > ' + downloadPath + 'dbBackup_' + date + '.sql';
    var command = mysqlDumpPath + 'mysqldump -u root techfooddy-emptyv3 > ' + downloadPath + 'dbBackup_' + date + '.sql';
    exec(command, function (err, stdout, stderr) {
      //exec('wscript.exe', ['data/settings/run.vbs'], function(err, stdout, stderr) {
      if (err) throw err;
      return res.status(200).send();
    });

  });

  /* Storage online */
  app.get(apiUrl + '/gdrive/:folderID/:uploadPath', function (req, res) {
    var folderID = req.params.folderID;
    var uploadPath = req.params.uploadPath;


    var files = fs.readdirSync(resolve(uploadPath)); // directory
    var localfiles = [];

    if (files.length != 0) {
      files.forEach(function (file) {
        stats = fs.statSync(resolve(join(uploadPath, file)));
        localfiles.push({ "file": file, "time": stats.ctime });
      });

      // sort recent files
      var localrecentfile = localfiles.sort(function (a, b) {
        return b.time - a.time
      });
      var filepath = uploadPath + "/" + localrecentfile[0].file;

      if (localrecentfile[0].file) {

      }

      /***** make the request to retrieve an authorization allowing to works
          with the Google drive web service *****/
      // retrieve a JWT
      var jwToken = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key, ["https://www.googleapis.com/auth/drive"],
        null
      );
      jwToken.authorize((authErr) => {
        if (authErr) {
          console.log("error : " + authErr);
          return;
        } else {
          //console.log("Authorization accorded");
        }
      });

      var fileMetadata = {
        'name': localrecentfile[0].file,
        parents: [folderID]
      };
      var media = {
        mimeType: 'text/plain',
        body: fs.createReadStream(filepath)
        //body: fs.createReadStream(path.join(__dirname, './dbBackup_07-30-2019_18_29_43.gz'))
      };
      drive.files.create({
        auth: jwToken,
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          return res.status(400).send();
        } else {
          return res.status(200).send();
        };

      });

    } else {
      return res.status(400).send();
    }



  });
  /* end storage */
  //  Update locality with id
  app.put(apiUrl + '/locality/:localityID', function (req, res) {
    let localityID = req.params.localityID;
    let localityName = req.body.localityName;
    var sql = `UPDATE locality SET localityName = "${localityName}" WHERE localityID = "${localityID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
  });

  // Delete locality with id
  app.delete(apiUrl + '/locality/:localityID', function (req, res) {
    var sql = 'DELETE FROM locality WHERE localityID = "' + req.params.localityID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
  =============================================

    POINTS

 ===============================================
   -------------------------------------------*/

  //get points data from point table
  app.get(apiUrl + '/point', function (req, res, next) {
    db.executeQuery("SELECT * FROM points", function (results) {
      return res.status(200).send(results);
    })
  })

  // Post point data
  app.post(apiUrl + '/point', function (req, res) {
    var data = [req.body].map(function (item) {
      return { 'amount': item.amount, 'enablepoint': item.enablepoint, 'FirstTimePoint': item.FirstTimePoint, 'EnableFirstTime': item.EnableFirstTime, 'perpoint_amount': item.perpoint_amount, 'branch_id': item.branch_id }
    })
    var sql = "INSERT INTO points SET ?";
    db.executeQuery1(sql, data[0], function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update point with id
  app.put(apiUrl + '/point/:pointsID', function (req, res) {
    let pointsID = req.params.pointsID;
    let amount = req.body.amount;
    let enablepoint = req.body.enablepoint;
    let EnableFirstTime = req.body.EnableFirstTime;
    let FirstTimePoint = req.body.FirstTimePoint;
    let perpoint_amount = req.body.perpoint_amount;
    let autocalculate = req.body.autocalculate;
    var sql = `UPDATE points SET amount = "${amount}",FirstTimePoint = "${FirstTimePoint}",enablepoint = "${enablepoint == true ? 1 : 0}",EnableFirstTime = "${EnableFirstTime == true ? 1 : 0}",perpoint_amount="${perpoint_amount}" WHERE pointsID = "${pointsID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });
  // Delete point with id
  //----------------
  app.delete(apiUrl + '/fmItem/:fmItemID', function (req, res) {
    var status_flag = 0;
    var sql = 'UPDATE food_menu_items SET status_flag = "${status_flag}" WHERE fmItemID = "' + req.params.fmItemID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
   =============================================

     RAW MATERIAL

  ===============================================
    -------------------------------------------*/

  // Get raw Menu Category
  app.get(apiUrl + '/rmCategory', function (req, res) {
    db.executeQuery('SELECT * FROM raw_material_catergorys', function (results) {
      return res.status(200).send(results);
    });
  });

  // Post raw Menu Category
  app.post(apiUrl + '/rmCategory', function (req, res) {
    var sql = "INSERT INTO raw_material_catergorys SET ?";
    db.executeQuery1(sql, { rmCatergoryName: req.body.rmCatergoryName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update raw Menu Category with id
  app.put(apiUrl + '/rmCategory/:rmCatergoryID', function (req, res) {
    let rmCatergoryID = req.params.rmCatergoryID;
    let fmCatergoryName = req.body.rmCatergoryName;
    var sql = `UPDATE raw_material_catergorys SET rmCatergoryName = "${fmCatergoryName}" WHERE rmCatergoryID = "${rmCatergoryID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Delete raw Menu Category
  app.delete(apiUrl + '/rmCategory/:rmCatergoryID', function (req, res) {
    var sql = 'DELETE  FROM raw_material_catergorys WHERE rmCatergoryID = "' + req.params.rmCatergoryID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  // Get raw Menu Items
  app.get(apiUrl + '/rmItem', function (req, res) {
    db.executeQuery('SELECT * FROM raw_material_items WHERE status_flag=1', function (results) {
      return res.status(200).send(results);
    });
  });

  // Post raw Items

  app.post(apiUrl + '/rmItem', function (req, res) {
    var data = [req.body].map(function (item) {
      return { 'status_flag': 1, 'rmname': item.rmname, 'containQty': item.containQty, 'stock_quantity': item.stock_quantity, 'rmrate': item.rmrate, 'unit': item.unit, 'rmCatergoryID': item.rmCatergoryID, 'branch_id': item.branch_id }
    })
    var sql = "INSERT INTO raw_material_items SET ?";
    db.executeQuery1(sql, data[0], function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update raw Menu items with id
  app.put(apiUrl + '/rmItem/:rmItemID', function (req, res) {
    let rmItemID = req.params.rmItemID;
    let rmname = req.body.rmname;
    let stock_quantity = req.body.stock_quantity;
    let containQty = req.body.containQty;
    let rmrate = req.body.rmrate;
    let unit = req.body.unit;
    let rmCatergoryID = req.body.rmCatergoryID;
    var sql = `UPDATE raw_material_items SET rmname = "${rmname}",unit = "${unit}",containQty = "${containQty}",  stock_quantity = "${stock_quantity}",  rmrate = "${rmrate}", rmCatergoryID = "${rmCatergoryID}" WHERE rmItemID = "${rmItemID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Delete raw Menu Item
  //----------------
  app.delete(apiUrl + '/rmItem/:rmItemID', function (req, res) {
    var status_flag = 0;
    var sql = 'UPDATE raw_material_items SET status_flag = "${status_flag}" WHERE rmItemID = "' + req.params.rmItemID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
 =============================================

   SALE MATERIAL

===============================================
  -------------------------------------------*/

  //get sale material categories
  app.get(apiUrl + '/siCategory', function (req, res) {
    db.executeQuery('SELECT * FROM sale_material_catergorys', function (results) {
      return res.status(200).send(results);
    });
  });

  // Post sale Menu Category
  app.post(apiUrl + '/siCategory', function (req, res) {
    var sql = "INSERT INTO sale_material_catergorys SET ?";
    db.executeQuery1(sql, { siCatergoryName: req.body.siCatergoryName, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update sale Menu Category with id
  app.put(apiUrl + '/siCategory/:siCatergoryID', function (req, res) {
    let siCatergoryID = req.params.siCatergoryID;
    let siCatergoryName = req.body.siCatergoryName;
    var sql = `UPDATE sale_material_catergorys SET siCatergoryName = "${siCatergoryName}" WHERE siCatergoryID = "${siCatergoryID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Delete sale Menu Category
  app.delete(apiUrl + '/siCategory/:siCatergoryID', function (req, res) {
    var sql = 'DELETE FROM sale_material_catergorys WHERE siCatergoryID = "' + req.params.siCatergoryID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });


  // Get sale Menu Items
  app.get(apiUrl + '/siItem', function (req, res) {
    db.executeQuery('SELECT * FROM sale_material_items WHERE status_flag=1', function (results) {
      return res.status(200).send(results);
    });
  });

  // Get sale Menu Items with pagination, category and search
  app.get(apiUrl + '/siItemLimit', function (req, res, next) {
    var data = req.query;
    var filter = req.query.filter;
    var numRows;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page;
    var numPages;
    var skip = (page * numPerPage) - req.query.limit;
    // Pagination
    db.executeQuery("SELECT * FROM sale_material_items WHERE (status_flag=1 && branch_id=" + data.branch_id + ") And (siname LIKE '%" + filter + "%' or barcode LIKE '%" + filter + "%') And (siCatergoryID LIKE '%" + data.category + "%')", function (results) {
      // Get no of page and rows for pagination
      numRows = results.length;
      numPages = Math.ceil(numRows / numPerPage);
    })
    db.executeQuery("SELECT * FROM sale_material_items WHERE (status_flag=1 && branch_id=" + data.branch_id + ") And (siname LIKE '%" + filter + "%' or barcode LIKE '%" + filter + "%') And (siCatergoryID LIKE '%" + data.category + "%') ORDER BY siItemID DESC LIMIT " + skip + ", " + req.query.limit + "", function (results) {
      //store calculated values in to an array
      var responsePayload = [{
        results: results,
        paidexpense_count: numRows

      }];
      return res.status(200).send(responsePayload);
    });
  });

  //post sale material items
  app.post(apiUrl + '/siItem', function (req, res) {
    console.log(req.body.add_barcode_duplicate);
    var data = [req.body].map(function (item) {
      return { 'status_flag': 1, 'siname': item.siname, 'stock_quantity': item.stock_quantity, 'sirate': item.sirate, 'tax_sgst': item.tax_sgst, 'tax_cgst': item.tax_cgst, 'tax_status': item.tax_status, 'offerprice': item.offerprice, 'dealer_price': item.dealer_price, 'containQty': item.containQty, 'PurchasePrice': item.PurchasePrice, 'siCatergoryID': item.siCatergoryID, 'branch_id': item.branch_id, 'barcode': item.barcode }
    });
    if(req.body.add_barcode_duplicate) {
      var sql = "INSERT INTO sale_material_items SET ?";
          db.executeQuery1(sql, data[0], function (results) {
            return res.status(200).send(results);
          }); 
      
    } else {
      db.executeQuery(`SELECT * FROM sale_material_items WHERE (status_flag=1 AND barcode = "${data[0].barcode}")`, function (results) {
        // condition for check barcode is available
        if (results.length === 0) {
          // that barcode is not available when post the data
          var sql = "INSERT INTO sale_material_items SET ?";
          db.executeQuery1(sql, data[0], function (results) {
            return res.status(200).send(results);
          }); 
        } else {
          // that barcode already is available
          res.send({
            "code": 204,
            "success": "Barcode is already added",
            "data": results
          });
        }
      });

    }
  });


  //  Update sale material items with id
  app.put(apiUrl + '/siItem/:siItemID', function (req, res) {
    let siItemID = req.params.siItemID;
    let siname = req.body.siname;
    let tax_cgst = req.body.tax_cgst;
    let tax_sgst = req.body.tax_sgst;
    let tax_status = req.body.tax_status;
    let stock_quantity = req.body.stock_quantity;
    let sirate = req.body.sirate;
    let offerprice = req.body.offerprice;
    let dealer_price = req.body.dealer_price;
    let containQty = req.body.containQty;
    let PurchasePrice = req.body.PurchasePrice;
    let siCatergoryID = req.body.siCatergoryID;
    let barcode = req.body.barcode;

    var sql = `UPDATE sale_material_items SET siname = "${siname}",tax_cgst = "${tax_cgst}",tax_sgst = "${tax_sgst}",tax_status = "${tax_status}",offerprice = "${offerprice}", dealer_price = "${dealer_price}",stock_quantity = "${stock_quantity}",  sirate = "${sirate}",PurchasePrice = "${PurchasePrice}",containQty = "${containQty}", siCatergoryID = "${siCatergoryID}", barcode = "${barcode}" WHERE siItemID = "${siItemID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
    /*
    db.executeQuery(`SELECT * FROM sale_material_items WHERE (status_flag=1 AND barcode = "${barcode}")`, function (results) {
          var barcodeAvailable = [];
          results.filter(function(item) {
            if (item.barcode == barcode && item.siItemID != siItemID) {
              barcodeAvailable.push(parseInt(item.siItemID))
              return item
            }
          });
      // condition for check barcode is available  
      if (barcodeAvailable.length == 0) {
        // that barcode is not available when post the data
        var sql = `UPDATE sale_material_items SET siname = "${siname}",tax_cgst = "${tax_cgst}",tax_sgst = "${tax_sgst}",tax_status = "${tax_status}",offerprice = "${offerprice}",stock_quantity = "${stock_quantity}",  sirate = "${sirate}",PurchasePrice = "${PurchasePrice}",containQty = "${containQty}", siCatergoryID = "${siCatergoryID}", barcode = "${barcode}" WHERE siItemID = "${siItemID}"`;
        db.executeQuery(sql, function (err, rows) {
          res.sendStatus(200);
        });
      } 
      else {
        // that barcode already is available
        res.send({
          "code": 204,
          "success": "Barcode is already added",
          "data": results
        });
      } 
    }); */
  });


  // Delete sale material items
  //----------------
  app.delete(apiUrl + '/siItem/:siItemID', function (req, res) {
    var status_flag = 0;
    var sql = 'UPDATE sale_material_items SET status_flag = "${status_flag}" WHERE siItemID = "' + req.params.siItemID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });

  });


  /*-------------------------------------------
 =============================================

   STAFF

===============================================
  -------------------------------------------*/


  //Add user in post method
  app.post(apiUrl + '/adduser', function (req, res) {
    let roleID = req.body[0].roleID;
    let branch_id = req.body[0].branch_id;
    let name = req.body[0].name;
    let mobile = req.body[0].mobile;
    let mobile_secondary = req.body[0].mobile_secondary;
    let email = req.body[0].email;
    let Qualification = req.body[0].Qualification;
    let DOB = req.body[0].DOB;
    let address = req.body[0].address;
    let city = req.body[0].city;
    let state = req.body[0].state;
    let country = req.body[0].country;
    let JOD = req.body[0].JOD;
    let salarymode = req.body[0].salarymode;
    let permission = req.body[0].permission.toString();
    let status = 'active';
    let position = req.body[0].position;
    let salary = req.body[0].salary;
    let username = req.body[0].username;
    let password = req.body[0].password;

    // Username and branch id checking
    db.executeQuery1('SELECT * FROM staff  WHERE username = ? AND  branch_id=?', [username == undefined ? "xyz.com" : username, branch_id], function (results, fields, error) {
      // Results length is there username already exists
      if (results.length != 0) {
        return res.send({
          "code": 204,
          "success": "Email already exists try another one!"
        });
      }
      // Results length =0 is there username already
      else if (results.length == 0) {
        // Password encyred here
        bcrypt.hash(password, 10, function (err, hash) {
          db.executeQuery1("INSERT INTO staff SET ? ", {
            roleID: roleID,
            branch_id: branch_id,
            name: name,
            email: email,
            mobile: mobile,
            mobile_secondary: mobile_secondary,
            Qualification: Qualification,
            DOB: DOB,
            address: address,
            city: city,
            state: state,
            country: country,
            JOD: JOD,
            salarymode: salarymode,
            salary: salary,
            permissions: permission,
            position: position,
            status: status,
            username: username == undefined ? null : username,
            password: hash

          }, function (results) {
            return res.status(200).send(results);

          });
        })
      }
    });
  });

  //update staff to staff table
  app.put(apiUrl + '/adduser/:staffID', function (req, res) {

    db.executeQuery('SELECT * FROM staff', function (results, fields, error) {
      var update;
      for (var i = 0; i < results.length; i++) {
        // Checking  username if username has changed
        if (results[i].username == req.body[0].username && req.body[0].old_username) {
          // Cheking branch id after username condition matched with db data
          if (results[i].branch_id == req.body[0].branch_id) {
            // if branch id matched username is not updated
            update = 'failure'
            break;
          } else {
            // if Branch id is not matched username will update
            update = 'success'
            break;
          }
        }
        // After check username is not available in db, will update
        else {
          update = 'success'
        }
      }
      if (update == 'success') {
        let roleID = req.body[0].roleID;
        let branch_id = req.body[0].branch_id;
        let name = req.body[0].name;
        let mobile = req.body[0].mobile;
        let mobile_secondary = req.body[0].mobile_secondary;
        let email = req.body[0].email;
        let Qualification = req.body[0].Qualification;
        let DOB = req.body[0].DOB;
        let address = req.body[0].address;
        let city = req.body[0].city;
        let state = req.body[0].state;
        let country = req.body[0].country;
        let JOD = req.body[0].JOD;
        let position = req.body[0].position;
        let salarymode = req.body[0].salarymode;
        let permission = req.body[0].permission.toString()
        let salary = req.body[0].salary;
        let username = req.body[0].username;
        if (req.body[0].password == 'old_password') {
          // password is not changed
          var password = 'update_oldOne';
        } else {
          // password is changed
          var password = req.body[0].password;
        }


        bcrypt.hash(password, 10, function (err, hash) {
          db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function (results) {
            db.executeQuery1('UPDATE staff SET ? WHERE staffID = "' + req.params.staffID + '"', {
              roleID: roleID,
              branch_id: branch_id,
              name: name,
              email: email,
              mobile: mobile,
              mobile_secondary: mobile_secondary,
              Qualification: Qualification,
              DOB: DOB,
              address: address,
              city: city,
              state: state,
              country: country,
              JOD: JOD,
              position: position,
              salarymode: salarymode,
              salary: salary,
              permissions: permission,
              username: username,
              password: password == 'update_oldOne' ? results[0].password : hash

            }, function (results) {
              return res.status(200).send(results);

            });
          })
        });
      }
      // Branch id and username is already available in db
      else if (update == 'failure') {
        return res.send({
          "code": 204,
          "data": "userexit",
          "success": "Email already exists try another one!"
        });
      }
    })
  });

  //update staff account inactive or active
  app.put(apiUrl + '/getInactive/:staffID', function (req, res) {
    var staffID = req.params.staffID;
    var sql = `UPDATE staff  SET status = "${req.body.data}" WHERE staffID = "${staffID}"`;

    db.executeQuery(sql, function (results) {
      return res.status(200).send(results);


    });

  })

  // Get staffroles
  app.get(apiUrl + '/userRole', function (req, res) {
    db.executeQuery('SELECT * FROM staff_role', function (results) {
      return res.status(200).send(results);
    });
  });


  // Get staff with id
  app.get(apiUrl + '/getstaff/:staffID', function (req, res) {
    db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function (results) {
      return res.status(200).send(results);
    });
  });
  // Get all staff in staff table
  app.get(apiUrl + '/getstaffdata/:staffID', function (req, res) {
    db.executeQuery('SELECT * FROM staff', function (results) {
      return res.status(200).send(results);
    });
  });
  // Post staff role data
  app.post(apiUrl + '/add_userrole', function (req, res) {
    var data = req.body;
    var sql = "INSERT INTO staff_role SET ?";
    db.executeQuery1(sql, data, function (results) {
      return res.status(200).send(results);
    });
  });


  //  Update staff role data with id
  app.put(apiUrl + '/add_userrole/:roleID', function (req, res) {
    let roleID = req.params.roleID;
    let role_name = req.body.role_name;
    //var sql = "UPDATE table_no SET table_nos = ? WHERE table_id = ?";
    var sql = `UPDATE staff_role SET role_name = "${role_name}" WHERE roleID = "${roleID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Delete staff role data with id
  app.delete(apiUrl + '/add_userrole/:roleID', function (req, res) {
    var sql = 'DELETE FROM staff_role WHERE roleID = "' + req.params.roleID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  // staff_role for raw category&items in admin settings (get,add)
  // Get profile_service with id in profile

  app.get(apiUrl + '/profile_service/:staffID', function (req, res) {

    db.executeQuery('SELECT * FROM staff  WHERE staffID = "' + req.params.staffID + '"', function (results) {

      return res.status(200).send(results);
    });

  });
  //update staff profile data
  app.put(apiUrl + '/update_profile/:staffID', function (req, res) {
    let name = req.body[0].name;
    let mobile = req.body[0].mobile;
    let email = req.body[0].email;
    if (req.body[0].password == 'old_password') {
      var password = 'update_oldOne';
    } else {
      var password = req.body[0].password;
    }


    bcrypt.hash(password, 10, function (err, hash) {

      db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function (results) {
        db.executeQuery1('UPDATE staff SET ? WHERE staffID = "' + req.params.staffID + '"', {

          name: name,
          email: email,
          mobile: mobile,
          password: password == 'update_oldOne' ? results[0].password : hash

        }, function (results) {
          return res.status(200).send(results);

        });
      })

    });
  })


  /*-------------------------------------------
  =============================================

    TABLE NO

 ===============================================
   -------------------------------------------*/
/*
  // Get Table NO
  app.get(apiUrl + '/getTableNo', function (req, res) {
    db.executeQuery('SELECT * FROM table_no', function (results) {
      return res.status(200).send(results);
    });
  });
 */
  // Post Table no
  app.post(apiUrl + '/getTableNo', function (req, res) {
    var sql = "INSERT INTO table_no SET ?";
    db.executeQuery1(sql, { table_no: req.body.table_no, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });
  //  Update table with id
  app.put(apiUrl + '/getTableNo/:table_id', function (req, res) {
    let table_id = req.params.table_id;
    let table_no = req.body.table_no;
    var sql = `UPDATE table_no SET table_no = "${table_no}" WHERE table_id = "${table_id}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
  });



  // Delete Table no
  app.delete(apiUrl + '/getTableNo/:table_id', function (req, res) {
    var sql = 'DELETE FROM table_no WHERE table_id = "' + req.params.table_id + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });


  /*-------------------------------------------
 =============================================

   TAX

===============================================
  -------------------------------------------*/

  // Get Taxs
  //----------------
  app.get(apiUrl + '/tax', function (req, res) {
    db.executeQuery('SELECT * FROM tax', function (results) {
      return res.status(200).send(results);
    });
  });

  // Post Taxs
  //----------------
  app.post(apiUrl + '/tax', function (req, res) {
    var data = req.body;
    var sql = "INSERT INTO tax SET ?";
    db.executeQuery1(sql, data, function (results) {
      return res.status(200).send(results);
    });
  });
  // Update Taxs
  //----------------
  app.put(apiUrl + '/tax/:taxID', function (req, res) {
    let taxID = req.params.taxID;
    let taxName = req.body.taxName;
    let taxRate = req.body.taxRate;
    var sql = `UPDATE tax SET taxName = "${taxName}", taxRate = "${taxRate}" WHERE taxID = "${taxID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });
  // Delete Tax
  //----------------
  app.delete(apiUrl + '/tax/:taxID', function (req, res) {
    var sql = 'DELETE FROM tax WHERE taxID = "' + req.params.taxID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
 =============================================

   THIRD PARTY INTEGRATION

===============================================
  -------------------------------------------*/


  //get ThirdParty
  app.get(apiUrl + '/ThirdParty', function (req, res) {
    db.executeQuery("SELECT *  FROM third_party_integration", function (third_party_integration) {
      return res.status(200).send(third_party_integration);
    })
  })

  // Post ThirdParty
  app.post(apiUrl + '/ThirdParty', function (req, res) {
    var sql = "INSERT INTO third_party_integration SET ?";
    db.executeQuery1(sql, { thirdparty_name: req.body.thirdparty_name, branch_id: req.body.branch_id }, function (results) {
      return res.status(200).send(results);
    });
  });


  //  Update ThirdParty with id
  app.put(apiUrl + '/ThirdParty/:thirdparty_id', function (req, res) {
    let thirdparty_id = req.params.thirdparty_id;
    let thirdparty_name = req.body.thirdparty_name;
    var sql = `UPDATE third_party_integration SET thirdparty_name = "${thirdparty_name}" WHERE thirdparty_id = "${thirdparty_id}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });
  });

  // Delete ThirdParty with id
  app.delete(apiUrl + '/ThirdParty/:thirdparty_id', function (req, res) {
    var sql = 'DELETE FROM third_party_integration WHERE thirdparty_id = "' + req.params.thirdparty_id + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });


  /*-------------------------------------------
 =============================================

   VENDOR

===============================================
  -------------------------------------------*/

  // Get vendor
  app.get(apiUrl + '/vendor', function (req, res) {
    db.executeQuery('SELECT * FROM vendors', function (results) {
      return res.status(200).send(results);
    });
  });
  // Post vendors
  app.post(apiUrl + '/vendor', function (req, res) {
    var data = req.body;
    var sql = "INSERT INTO vendors SET ?";
    db.executeQuery1(sql, data, function (results) {
      return res.status(200).send(results);
    });
  });

  //  Update vendors with id
  app.put(apiUrl + '/vendor/:vendorID', function (req, res) {
    let vendorID = req.params.vendorID;
    let company_name = req.body.company_name;
    let name = req.body.name;
    let mobile = req.body.mobile;
    let phone = req.body.phone;
    let email = req.body.email;
    let address = req.body.address;
    let gst_no = req.body.gst_no;
    let vendor_type = req.body.vendor_type


    var sql = `UPDATE vendors SET company_name = "${company_name}",vendor_type = "${vendor_type}", name = "${name}", gst_no = "${gst_no}", mobile = "${mobile}", phone = "${phone}", email = "${email}", address = "${address}" WHERE vendorID = "${vendorID}"`;
    db.executeQuery(sql, function (err, rows) {
      res.sendStatus(200);
    });

  });

  // Delete vendors
  //----------------
  app.delete(apiUrl + '/vendor/:vendorID', function (req, res) {
    var sql = 'DELETE FROM vendors WHERE vendorID = "' + req.params.vendorID + '"';
    db.executeQuery(sql, function (err, rows, fields) {
      res.sendStatus(200);
    });
  });

  /*-------------------------------------------
 =============================================

   LOGIN

===============================================
  -------------------------------------------*/


  //while login it will hit live database and update expiry date to local database of branch table
  app.get(apiUrl + '/branch_datas/:branch_id/:host/:path', function (req, res) {
    var branch_id = req.params.branch_id;
    console.log(req.params);
    //options to send query to server
    var options = {
      "method": "POST",
      "hostname": req.params.host,
      "port": 21,
      //"path": req.params.path
      "path": "/dlr/api/product/corporateread.php"
    };
    //request to server and get back results through res
    var req = http.request(options, function (res) {
     
      var chunks = [];
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
      res.on("end", function () {
        console.log(chunks);
        var body = Buffer.concat(chunks);
        var data = body.toString();
        var output = JSON.parse(data);
        //output.message is return error meaasge from server
        //here if server returns output.records then below conditions will work 
        //if server returns output.message  then error handling function will be work
        if (!output.message) {
          var server_data = output.records.map(function (item) {
            return { 'corporate_id': item.corporate_id, 'branch_id': item.branch_id, 'expiry_date': item.expiry_date }
          })
        }
        var sql = 'SELECT * FROM branch WHERE branch_id = "' + branch_id + '"';
        db.executeQuery(sql, function (branchresults) {
          if (!output.message) {
            //get expiry date
            var GetExpiryDate = server_data.filter(function (o1) {
              return branchresults.some(function (o2) {
                return o1.corporate_id == o2.corporate_id && o1.branch_id == o2.branch_id
              })
            })
            if (GetExpiryDate.length) {
              //update expiry date
              var UpdateExpiryDate = `UPDATE branch SET expiry_date = "${GetExpiryDate[0].expiry_date}" WHERE branch_id = "${branch_id}"`;
              db.executeQuery(UpdateExpiryDate, function (err, rows) { })
              success(GetExpiryDate, branchresults);
            } else {
              success([], branchresults);
            }
          }
          if (output.message) {
            success([], branchresults);
          }
        });

      });
    });
    req.on('error', function (err) {
      console.log(err);
      // Handle error if system not have internet
      var sql = 'SELECT * FROM branch WHERE branch_id = "' + branch_id + '"';
      db.executeQuery(sql, function (branchresults) {
        success([], branchresults);
      })
    });
    req.end()
//console.log(corporatedetail);
//console.log(branchresults);

    function success(corporatedetail, branchresults) {
      console.log('corporate')
      console.log(corporatedetail)
      console.log('branch')
      console.log(branchresults)
      return res.status(200).send([{ 'corporatedetail': corporatedetail, 'branchresult': branchresults }]);
    }

  });




  //Check login credentials when staff hit login button
  app.post(apiUrl + '/login', function (req, res) {
    //password-123->$2b$10$ZdOhKGZfDS/RORCBj.kC6OX4CZiMo72rCDyvLeEh/23GIic1lGpDm
    let username = req.body[0].username;
    let password = req.body[0].password;
    //checking username from database
    db.executeQuery1('SELECT * FROM staff  WHERE username = ?', username, function (results, fields, error) {
      if (error) throw error;
      else {
        if (results.length > 0) {
          bcrypt.compare(password, results[0].password, function (err, ress) {

            if (ress) {
              res.send({
                "code": 200,
                "success": "login sucessfull",
                "data": results,
                'token': 'fake-jwt-token'
              });
            } else {
              res.send({
                "code": 204,
                "success": "Email and password does not match"
              });
            }
          });
        } else {
          res.send({
            "code": 204,
            "success": "Email does not exits"
          });
        }
      }

    });
  });

  /*-------------------------------------------
   =============================================

     BRANCH

  ===============================================
  -------------------------------------------*/


  //get branch name from branch table
  app.get(apiUrl + '/branchname_service/:branchID', function (req, res) {
    db.executeQuery('SELECT * FROM branch  WHERE branch_id = "' + req.params.branchID + '"', function (results) {
      return res.status(200).send(results);
    });

  });

  //post admin to staff table
  app.post(apiUrl + '/addAdmin', function (req, res) {
    let branch_id = req.body[0].branch_id;
    let name = req.body[0].name;
    let username = req.body[0].username;
    let password = req.body[0].password;
    let position = req.body[0].position;
    let status = req.body[0].status;
    let mobile = req.body[0].mobile;
    let address = req.body[0].address;
    let city = req.body[0].city;
    let state = req.body[0].state;
    let permissions = req.body[0].permissions;
    //checking username in staff table
    db.executeQuery1('SELECT * FROM staff  WHERE username = ?', '', function (results, fields, error) {
      if (results.length != 0) {
        return res.send({
          "code": 204,
          "success": "Email already exists try another one!"
        });
      } else if (results.length == 0) {

        bcrypt.hash(password, 10, function (err, hash) {
          db.executeQuery1("INSERT INTO staff SET ? ", {
            branch_id: branch_id,
            name: name,
            permissions: permissions,
            position: position,
            status: status,
            username: username,
            mobile: mobile,
            address: address,
            city: city,
            state: state,
            password: hash

          }, function (results) {

            return res.status(200).send(results);

          });
        })
      }
    });
  });


  /*
    ----------------------------------------------
    Super Admin
    ----------------------------------------------
    */
  //update staff to staff table
  app.put(apiUrl + '/updateuser/:staffID', function (req, res) {
    db.executeQuery('SELECT * FROM staff', function (results, fields, error) {
      var update;

      for (var i = 0; i < results.length; i++) {
        // Checking  username if username has changed
        if (results[i].username == req.body[0].username && req.body[0].old_username) {
          // Cheking branch id after username condition matched with db data
          if (results[i].branch_id == req.body[0].branch_id) {
            // if branch id matched username is not updated
            update = 'failure'
            break;
          } else {
            // if Branch id is not matched username will update
            update = 'success'
            break;
          }
        }
        // After check username is not available in db, will update
        else {
          update = 'success'
        }
      }
      // Branch id and username is not available in db can update
      if (update == 'success') {
        let name = req.body[0].name;
        let mobile = req.body[0].mobile;
        let email = req.body[0].email;
        let address = req.body[0].address;
        let city = req.body[0].city;
        let state = req.body[0].state;
        let permission = req.body[0].permission.toString()
        let username = req.body[0].username;
        if (req.body[0].password == 'old_password') {
          // password is not changed
          var password = 'update_oldOne';
        } else {
          // password is changed
          var password = req.body[0].password;
        }
        bcrypt.hash(password, 10, function (err, hash) {
          db.executeQuery('SELECT * FROM staff WHERE staffID = "' + req.params.staffID + '"', function (results) {
            db.executeQuery1('UPDATE staff SET ? WHERE staffID = "' + req.params.staffID + '"', {
              name: name,
              email: email,
              mobile: mobile,
              address: address,
              city: city,
              state: state,
              permissions: permission,
              username: username,
              password: password == 'update_oldOne' ? results[0].password : hash
            }, function (results) {
              return res.status(200).send(results);

            });
          })
        });
      }
      // Branch id and username is already available in db
      else if (update == 'failure') {
        return res.send({
          "code": 204,
          "data": "userexit",
          "success": "Email already exists try another one!"
        });
      }
    })
  })

  //save function to branch table
  //post salesorder_id
  app.post(apiUrl + '/addBranch', function (req, res) {

    let data = req.body;
    var sql = "INSERT INTO branch SET ?";
    db.executeQuery1(sql, data, function (results) {
      return res.status(200).send(results);
    });

  });




  // Get all branch data in branch table
  app.get(apiUrl + '/branch_data', function (req, res) {
    db.executeQuery('SELECT * FROM branch', function (results) {
      return res.status(200).send(results);
    });
  });


  //get branch data with particular branch id
  app.get(apiUrl + '/branch_data/:branch_id', function (req, res) {
    console.log(req)
    var sql = 'SELECT * FROM branch WHERE branch_id = "' + req.params.branch_id + '"';
    db.executeQuery(sql, function (results) {
      return res.status(200).send(results);
    });

  });

  //update branch data to branch table
  app.put(apiUrl + '/update_branch_data/:branch_id', function (req, res) {
    var branch_id = req.params.branch_id;

    //this if condition for update staffID in branch table
    if (req.body.length == 2) {
      var sql = `UPDATE branch SET staffID = "${req.body[0].staffID}" WHERE branch_id = "${branch_id}"`;
      db.executeQuery(sql, function (err, rows) {
        res.sendStatus(200);
      });
    } else if (req.body.length == 1 && req.body[0].uploadDBTime) { // upload db timing update
      var sql = `UPDATE branch SET uploadDBTime = "${req.body[0].uploadDBTime}" WHERE branch_id = "${branch_id}"`;
      db.executeQuery(sql, function (err, rows) {
        res.sendStatus(200);
      });
      //res.sendStatus(200);
    }
    //this else condition for update Branch datas in branch table
    else {
      var sql = `UPDATE branch SET corporate_name = "${req.body[0].corporate_name}",corporate_id = "${req.body[0].corporate_id}",expiry_date = "${req.body[0].expiry_date == null ? '' : req.body[0].expiry_date}",branch_name = "${req.body[0].branch_name}",staffID = "${req.body[0].staffID}",domain_category = "${req.body[0].domain_category}",permissions = "${req.body[0].permissions}",print_footer = "${req.body[0].print_footer}",printsize = "${req.body[0].printsize}",authKey = "${req.body[0].authKey}",sender_id = "${req.body[0].sender_id}",user_id = "${req.body[0].user_id}",address = "${req.body[0].address}",GstNo = "${req.body[0].GstNo}",city = "${req.body[0].city}",pincode = "${req.body[0].pincode}",state = "${req.body[0].state}",contact_number = "${req.body[0].contact_number}", barcode_enable = "${req.body[0].barcode_enable}" WHERE branch_id = "${branch_id}"`;
      db.executeQuery(sql, function (err, rows) {
        res.sendStatus(200);
      });
    }
  });


  /*-------------------------------------------
   =============================================

     CORPORATE SETTINGS

  ===============================================
  -------------------------------------------*/


  app.get(apiUrl + '/getCompanyDet', function (req, res) {
    db.executeQuery('SELECT * FROM company_details', function (results) {
      return res.status(200).send(results);
    });
  });

  app.get(apiUrl + '/getLevels', function (req, res) {
    db.executeQuery('SELECT * FROM company_level', function (results) {
      return res.status(200).send(results);
    });
  });

  app.get(apiUrl + '/getCompanyById', function (req, res) {
    var comp_id = req.query.comp_id;
    var queryString = 'SELECT * FROM company_details WHERE company_id=' + comp_id;
    //console.log(queryString)
    db.executeQuery(queryString, function (results) {
      return res.status(200).send(results);
    });
  });

  app.get(apiUrl + '/getUserByCompanyId', function (req, res) {
    var comp_id = req.query.comp_id;
    var queryString = 'SELECT personal_name, email_id, user_type FROM company_credentials WHERE company_id = ' + comp_id;
    //console.log(queryString)
    db.executeQuery(queryString, function (results) {
      return res.status(200).send(results);
    });
  });



  app.post(apiUrl + '/write', function (req, res) {
    var data = req.body.data;
    var cols = "(",
      vals = "(",
      tableName;
    for (var key in data) {
      if (key == "type") {
        tableName = data[key];
      } else {
        cols += key + ",";
        if (key == "password") {
          vals += "'" + crypto.createHash('md5').update(data[key]).digest("hex") + "',";
        } else {
          vals += "'" + data[key] + "',";
        }
      }
    }

    cols = cols.substring(0, cols.length - 1);
    vals = vals.substring(0, vals.length - 1);
    cols += ")";
    vals += ")";

    var queryString = "INSERT INTO " + tableName + " " + cols + " VALUES " + vals + ";"

    db.executeQuery(queryString, function (results) {
      //  console.log(results.insertId);
      var sendRes = { status: "success", insertId: results.insertId }
      return res.status(200).send(sendRes);
    });
  });


  app.post(apiUrl + '/update', function (req, res) {
    var data = req.body.data;
    //console.log(data)
    var params = "",
      whereClause,
      tableName;
    for (var key in data) {
      //console.log(data["whereclause"], key)
      if (key == "type") {
        tableName = data[key];
      } else if (key == data["whereclause"]) {
        whereClause = key + "=" + data[key];
      } else if (key == "whereclause") {
        //do nothing
      } else {
        if (key == "password") {
          params += key + "='" + crypto.createHash('md5').update(data[key]).digest("hex") + "',";
        } else {
          params += key + "='" + data[key] + "',"
        }


      }
    }

    params = params.substring(0, params.length - 1);
    //  console.log(params)

    var queryString = "UPDATE " + tableName + " SET " + params + " WHERE " + whereClause;
    console.log(queryString);
    //return res.status(200).send("success");
    db.executeQuery(queryString, function (results) {
      //console.log(results.insertId);
      var sendRes = { status: "success" }
      return res.status(200).send(sendRes);
    });
  });

  /*-------------------------------------------
    =============================================
 
      LOCAL JSON CORPORATE SETTINGS
 
   ===============================================
   -------------------------------------------*/
  //update branch data to branch table

  app.post(apiUrl + '/update_local_json', function (req, res) {
    var domain_category = req.body.domain_category;
   // let data = req.body;
   // console.log(data);
    var data = JSON.parse(fs.readFileSync('../app/corporate/' + domain_category + '/general.json', 'utf8')); 
   // console.log(data);
    return res.status(200).send(data);   

  });





}