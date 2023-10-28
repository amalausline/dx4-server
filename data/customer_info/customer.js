var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var mysql = require('mysql');
var http = require("http");
var bodyParser = require('body-parser');
var multer = require('multer');
const fs = require('fs');
/*const puppeteer = require('puppeteer');
const findChrome = require('../puppeteer/find_chrome');
const path = require('path');
const config = require('../puppeteer/config.js');
const selector = require('../puppeteer/selector.js'); 
var fs = require('fs');
var $ = require('jquery');*/
/*puppeter 
const executablePath = findChrome().pop() || null;
const tmpPath = path.resolve(__dirname, config.data_dir);
const networkIdleTimeout = 5000;
const stdin = process.stdin;
const headless = !config.window;*/
/* Selector defined 
const applogin = '.app';
const messagesumbitBtn = '._3M-N-';
const messagesumbitBt = '_3M-N-';
const attachBtn = '#main ._3j8Pd:nth-child(2) div';
const topInputFile = '.KSY4t li:nth-child(1) input[type="file"]';
const bottomInputFile = '._2rI9W input[type="file"]';
const imageSumbitBtn = 'NOJWi';
*/
/* end selector */
module.exports = function(app) {

  /*-------------------------
    Upload file for all module for post
    -------------------------*/
  var storage1 = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
      cb(null, '../assets/uploads/whatsapp/');
    },
    filename: function(req, file, cb) {
      var datetimestamp = Date.now();
      cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }

  });

  var upload1 = multer({ //multer settings
    storage: storage1
  }).single('file');

  /* /** API path that will upload the files for expense bill */
  app.post('/whatsappimgupload', function(req, res) {
    upload1(req, res, function(err) {
      var data = req.file.filename;
      // var sql = "INSERT INTO expense_bill SET ?";
      //db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(data);
      // });

    });
  });

  

  //delete campaign data and update status flag as 0
  app.delete(apiUrl + '/deleteCampaign/:campaignID', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE campaign SET status_flag = 0  WHERE campaignID = "${req.params.campaignID}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    })
  });
  //update campaign details 
  app.put(apiUrl + '/updatecampaignlist/:campaignID', function(req, res) {
    var campaignlist = req.body;
    if (campaignlist.length > 0) { //if staff sends new campaign then it will check the pending status and update delivery status and time
      for (var i = 0; i < campaignlist.length; i++) {
        var sql = `UPDATE campaigndetails SET status = "${campaignlist[i].description=='Submitted' ? 'SUBMITTED' : campaignlist[i].description}", deliverydate = "${campaignlist[i].deliverydate}"  WHERE requestID = "${campaignlist[i].request_id}"`;
        db.executeQuery(sql, function(err, rows) {});
      }
    }
    return res.sendStatus(200);
  })
  //get full campaign data
  app.get(apiUrl + '/campaignn', function(req, res) {
    db.executeQuery('SELECT * from campaign', function(campaign) {
      return res.status(200).send(campaign);
    })
  })

  //get locality
  app.get(apiUrl + '/campaigndetailss', function(req, res) {
    db.executeQuery("SELECT *  FROM campaigndetails", function(campaigndetails) {
      return res.status(200).send(campaigndetails);
    })
  })


  //get promotional and transcational message balance from server
  app.get(apiUrl + '/getmsgPromotional/:branch_id', function(req, res) {
    //Get Balance for given Route.
    var branch_ids = req.params.branch_id;
    db.executeQuery('SELECT *  FROM branch WHERE branch_id = "' + req.params.branch_id + '"', function(branch) {
      if (branch[0].authKey) { //while get remaining message count need to check first authkey is have or not in branch table
        var msg91 = require("msg91")(branch[0].authKey, "dx4", "1");
        msg91.getBalance("1", function(err, msgCount) {
          // Promotional count update in local db
          var sql = `UPDATE branch SET promotionalCount = "${msgCount}" WHERE branch_id = "${branch_ids}"`;
          db.executeQuery(sql, function(err, rows) {});
        });
        var msgtrans = require("msg91")(branch[0].authKey, "dx4", "4");
        msgtrans.getBalance("4", function(err, msgCount) {
          // Transcational count update in local db
          var sql = `UPDATE branch SET transcationalCount = "${msgCount}" WHERE branch_id = "${branch_ids}"`;
          db.executeQuery(sql, function(err, rows) {});
        });
      }
    })
    return res.status(200).send([{}]);;
  })
  //get campaign data with particular id
  app.get(apiUrl + '/getcampaign/:campaignID', function(req, res) {
    db.executeQuery('SELECT *  FROM campaign WHERE campaignID = "' + req.params.campaignID + '"', function(campaign) {
      return res.status(200).send(campaign);
    })
  })

  //get campaign details from live database
  app.get(apiUrl + '/getcampaignlist/:campaignID/:host/:path', function(req, res) {
    var campaignID = req.params.campaignID;
    //options for sent live and get back live url data
    var options = {
      "method": "POST",
      "hostname": req.params.host,
      "port": null,
      "path": req.params.path
    };
    var req = http.request(options, function(res) { //http request to live url for get sms status
      var chunks = [];
      res.on("data", function(chunk) {
        chunks.push(chunk);
      });
      res.on("end", function() {
        var body = Buffer.concat(chunks);
        var data = body.toString();
        var output = JSON.parse(data);
        var server_data = output.records.map(function(item) {
          return { 'request_id': item.request_id, 'user_id': item.user_id, 'description': item.description, 'sender_id': item.sender_id, 'receiver': item.receiver, 'status': item.status, 'deliverydate': item.date }
        })
        success(server_data); //pass to out side of the function
      });
    });
    req.on('error', function(err) {
      success([]); //error handling for if internet is not avaiable
    });

    function success(msgreports) {

      if (campaignID != 0) { //get sync time whenever it hits live url
        //update last sync to database
        var sql = `UPDATE campaign SET lastsync = "${new Date()}" WHERE campaignID = "${campaignID}"`;
        db.executeQuery(sql, function(err, rows) {});
      }
      return res.status(200).send([{ 'msgreports': msgreports, 'synctime': new Date() }]);
    }
    req.end()
  })



  //post campaign data to campaign table
  app.post(apiUrl + '/campaign', function(req, res) {
    let data = req.body[0];
    var sql = "INSERT INTO campaign SET ?";
    db.executeQuery1(sql, data, function(results) {
      return res.status(200).send(results);
    });

  });


  //post campaign details table
  app.post(apiUrl + '/campaigndetails', function(req, res) {

    var mobileNo = [];
    req.body.map(function(item) {
      mobileNo.push({ 'mobile': item.customer_mobile, 'message': encodeURIComponent(item.message), 'campaignName': encodeURIComponent(item.campaignName), 'msgtype': item.msgtype, 'customer_id': item.customer_id, 'campaignID': item.campaignID })
    })

    var date = req.body[0].date;
    var time = req.body[0].time;
    var campaignName = req.body[0].campaignName;
    var senderID = req.body[0].senderId;
    var senderID = req.body[0].senderId;
    var authKey = req.body[0].authKey;
    var msgroute = req.body[0].msgroute;

    //Data structure build for msg91
    mobileNo.forEach(function(mobile) {
      if (mobile.msgtype == 'Schedule') { //check status of campaign whether its schedule
        var options = {
          "method": "POST",
          "hostname": "api.msg91.com",
          "port": null,
          "path": "/api/sendhttp.php?country=91&sender=" + senderID + "&route=" + msgroute + "&mobiles=" + mobile.mobile + "&authkey=" + authKey + "&campaign=" + mobile.campaignName + "&message=" + mobile.message + "&schtime=" + date + '%20' + time + "",
          "headers": {}
        };
      }
      if (mobile.msgtype == 'Immediate') { //check status of campaign whether its immediate
        var options = {
          "method": "POST",
          "hostname": "api.msg91.com",
          "port": null,
          "path": "/api/sendhttp.php?country=91&sender=" + senderID + "&route=" + msgroute + "&mobiles=" + mobile.mobile + "&authkey=" + authKey + "&campaign=" + mobile.campaignName + "&message=" + mobile.message + "",
          "headers": {}
        };
      }
      //Data send to msg91
      var req = http.request(options, function(res) {
        var chunks = [];

        res.on("data", function(chunk) {
          chunks.push(chunk);
        });

        res.on("end", function() {
          var body = Buffer.concat(chunks);
          //get requested id for each numbers and update remaining campaign details to campaign details table
          var server_data = []
          server_data.push({ 'customerMobile': mobile.mobile, 'requestID': body.toString(), 'customerID': mobile.customer_id, 'status': 'SUBMITTED', 'campaignID': mobile.campaignID })
          var campaigndetailsdata = server_data.map(function(item) {
            return [item.customerMobile, item.requestID, item.customerID, item.status, item.campaignID]
          });
          // we post data with requested id for customer id
          var sql = "INSERT INTO campaigndetails (customerMobile,requestID,customerID,status,campaignID)  VALUES ? ";
          db.executeQuery1(sql, [campaigndetailsdata], function(results) {});
        });
      });
      req.end();
    })
    return res.sendStatus(200);

  });



  // Get customer list by using left join and retrieve only pos customers
  // This data for customer table list, view customer (overview and ordered type) and new bill
  app.get(apiUrl + '/customerlist_service', function(req, res, next) {
    var data = req.query; //get here all sent data's from client side
    var filter = req.query.filter; //assigned here search filter value
    var numRows;
    var filter_data = [] //assign empty array to get query results
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage;
//console.log(req.query.customer_id);
    var customer_id = req.query.customer_id == undefined ? '' : req.query.customer_id; 
    
    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage)
    //This query is used when staff search something in search box from client side then this query of results will be returned to table
   
    db.executeQuery("SELECT customer_info.customer_id,customer_info.localityID,customer_info.customer_name,customer_info.customer_address,customer_info.customer_email,customer_info.customer_mobile, customer_info.whatsapp,customer_info.customer_city,customer_info.customer_locality,sales_order.customer_id as salesCustomer_id,salesorder_item.ordertime,customer_info.branch_id,customer_info.pointsEarned,customer_info.branch_id,sales_order.salesorder_id,salesorder_item.sales_items,sales_payment.payment_total,salesorder_item.fmItemType,sales_order.sales_dietType,salesorder_item.fmItemID FROM customer_info  LEFT JOIN sales_order ON (sales_order.customer_id = customer_info.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%') And (customer_info.customer_id LIKE '%" + customer_id + "%')  And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')", function(results) {
      results.map(function(item) {
          // Filter for without sales order id customer because customer page want to show all the customer
          if (item.salesorder_id == null) {
            filter_data.push(item)
          }
        })
        //filter only unique id for analysis about customer orders   
        var food_idss = []
        results.map(function(item) {
          if (food_idss.indexOf(item.customer_id) === -1) {
            food_idss.push(item.customer_id)

          }
        })
        numRows = food_idss.length; //for pagination willbe changed when staff search in searchbox 
        numPages = Math.ceil(numRows / numPerPage);
      })
  
    
    //This query is used when staff want about the customers or change something in dropdown box from client side then this query of results will be returned to table
    db.executeQuery("SELECT customer_info.customer_id,customer_info.localityID,customer_info.pointsEarned,customer_info.customer_name,customer_info.customer_address,customer_info.customer_email,customer_info.customer_mobile, customer_info.whatsapp, customer_info.customer_city,customer_info.customer_locality,sales_order.customer_id as salesCustomer_id,salesorder_item.ordertime,customer_info.branch_id,customer_info.pointsEarned,customer_info.branch_id,sales_order.salesorder_id,sales_order.sales_dietType,salesorder_item.sales_items,sales_payment.payment_total,salesorder_item.fmItemType,sales_order.sales_dietType,salesorder_item.fmItemID FROM customer_info  LEFT JOIN sales_order ON (sales_order.customer_id = customer_info.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%') And (customer_info.customer_id LIKE '%" + customer_id + "%') And (sales_order.sales_dietType!='ODC') And (sales_order.sales_dietType!='Banquet')  And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%') GROUP BY salesorder_id", function(results) {
      //console.log(results.length);
      //get ordertime as decending order
      results.sort(function(a, b) {
        var c = new Date(a.ordertime);
        var d = new Date(b.ordertime);
        return c - d;
      });

      var full = results.concat(filter_data); //merge data of without sales order id  added customer and already items ordered customers
      var food_ids = [];
      // Filter duplicated customer id
      full.map(function(customers) {
        if (food_ids.indexOf(customers.customer_id) === -1) {
          food_ids.push(customers.customer_id)

        }
      });
      var customer_details = full; //assign all customer details
      // Make a map for get about the particular customer's ordered information
      //here map is a call back function.it will be do manipulated customer details return  to store selectedNames
      var tagMap = customer_details.reduce(function(map, tag) { //here tag is contain all customer details as customer objects
        var endTime = new Date(); //store today date
        var ms = (endTime - new Date(tag.ordertime)); // get  difference of customers orderdate to compare this date of all customers 
        var days = Math.round(ms / 86400000); //so get all differences of how many days back they last ordered
        if (days == 1) { //if only one visit then the customers of last visit is one
          var finalCountdown = (days + "day ago");
        } else {
          var finalCountdown = (days + "days ago"); //if more than one visit then the customers
        }
        var remainingtime = days == 0 ? "today" : finalCountdown //here finalCountdown means last visit of how many dayas of back they last ordered
        var customervisit_total = []; //to store how many times they ordered
        var vegcustomer = []; //filter whether customer is veg 
        var nonvegcustomer = []; //filter whether customer is non veg 
        var dinein = []; //to store how many times they ordered in dinein
        var takeaway = []; //to store how many times they ordered in takeaway
        var doordelivery = []; //to store how many times they ordered in doordelivery
        var total_amount = 0;
        var current_customer = []; //here store all  customers again by the loop for get customers fav_food_count and favorits food
        for (var i = 0; i < customer_details.length; i++) {
          if (customer_details[i].customer_id == tag.salesCustomer_id) {
            current_customer.push(customer_details[i]) //push all the customers
            total_amount += parseInt(customer_details[i].payment_total) //push all payments for particular customers
            customervisit_total.push(customer_details[i].salesCustomer_id) //push all ids to get number of times particular customer visited
            if (customer_details[i].fmItemType == 'veg') {
              vegcustomer.push(customer_details[i].fmItemType) //here push veg customers
            }
            if (customer_details[i].sales_dietType == 'dinein') {
              dinein.push(customer_details[i].sales_dietType) //here push dinein customers
            }
            if (customer_details[i].sales_dietType == 'takeaway') {
              takeaway.push(customer_details[i].sales_dietType) //here push takeaway customers
            }
            if (customer_details[i].sales_dietType == 'doordelivery') {
              doordelivery.push(customer_details[i].sales_dietType) //here push doordelivery customers
            }
            if (customer_details[i].fmItemType == 'non-veg') {
              nonvegcustomer.push(customer_details[i].fmItemType) //here push non veg customers
            }
          }

        }
        //here  to find whether particular customer veg type or nonveg type or both veg,nonveg types
        if (vegcustomer.length == 0 && nonvegcustomer.length > 0) {
          var customerFoodType = 'non-veg';
        } else if (nonvegcustomer.length == 0 && vegcustomer.length > 0) {
          var customerFoodType = 'veg';
        } else if (nonvegcustomer.length > 0 && vegcustomer.length > 0) {
          var customerFoodType = 'veg/non-veg';
        }
        var fav_food_count = [];
        var fav_food_name = [];

        for (var i = 0; i < current_customer.length; i++) {
          if (current_customer[i].fmItemID == tag.fmItemID) {
            fav_food_count.push(current_customer[i].fmItemID) //here push all customer ate food items count
            fav_food_name.push(current_customer[i].sales_items) //here push all customer ate food names
          }
        }
        //here call back functon here all customers of particular information mapped and return to store selectnames varibales as an array.
        map[tag.customer_id] = { 'salesorder_id': tag.salesorder_id, 'fav_food_count': fav_food_count, 'fav_food_name': fav_food_name, 'pointsEarned': tag.pointsEarned, 'dinein': dinein.length, 'takeaway': takeaway.length, 'doordelivery': doordelivery.length, 'total': total_amount, 'avgtotal': total_amount / customervisit_total.length, 'lastvisit': remainingtime, 'customerFoodType': customerFoodType, 'total_visit': customervisit_total.length, 'ordertime': new Date(tag.ordertime), "customer_id": tag.customer_id, 'customer_mobile': tag.customer_mobile, 'whatsapp': tag.whatsapp, 'localityID': tag.localityID, 'customer_email': tag.customer_email, 'pointsEarned': tag.pointsEarned, 'customer_address': tag.customer_address, 'customer_locality': tag.customer_locality, 'customer_city': tag.customer_city, 'customer_name': tag.customer_name }
        return map // return callback
      }, {});

      // unique id's will be execute like loop which is customer id will run one by one 
      //the customer id will be return to tagmap function
      //then that tagmap function will be perform some manipulations with that customer id like get particular customer of payment totals,last vists
      var selectedNames = food_ids.map(function(id) {
        return tagMap[id] //pass id to another function
      });

      //here all filtered customers will be on decending order for table view depending on order time
      var food_fulldata = selectedNames.sort(function(a, b) {
        return (new Date(a.ordertime)) - (new Date(b.ordertime));
      });

      //store all manipulations in array
      var responsePayload = [{
        results: food_fulldata.reverse(),
        purchaseorder_count: numRows // unknown code

      }];
      // unknown pagination code
      //  var responsePayload=results 
      if (page < numPages) {
        responsePayload.pagination = [{
          current: page,
          perPage: numPerPage,
          previous: page > 0 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined
        }]

      } else responsePayload.pagination = {
        err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
      }
      return res.status(200).send(responsePayload); //return  to client side

    });

  })




  /*
  ---------------------------------
  New Bill and Edit bill updated point to customer
  ---------------------------------
  */

  // update customer earned point to customer table
  app.put(apiUrl + '/update_earnpoint/:customer_id', function(req, res) {
    let customer_id = req.params.customer_id;
    var sql = `UPDATE customer_info SET pointsEarned = "${req.body[0].pointsEarned}" WHERE customer_id = "${customer_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });
  /*
  ---------------------------------
  View customer Feedback section for particular customer
  ---------------------------------
  */

  // Get customer feedback data analytics
  app.get(apiUrl + '/customeranalyticfeedback_service', function(req, res, next) {
    var data = req.query; //get here all sent data's from client side
    var filter = req.query.filter; //assigned here search filter value
    // unknown code pagination
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage

    // Here we compute the LIMIT parameter for MySQL query
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage)
    //This query is used when staff search something in search box from client side then this query of results will be returned to table
    db.executeQuery("SELECT *  FROM customer_info  LEFT JOIN sales_order ON (sales_order.customer_id  = customer_info.customer_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  LEFT JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id)   WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%')  And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')", function(results) {
      var food_idss = []
      results.map(function(customers) {
        if (food_idss.indexOf(customers.customer_id) === -1) {
          food_idss.push(customers.customer_id)

        }
      })
      numRows = food_idss.length; //for pagination willbe changed when staff search in searchbox 
      numPages = Math.ceil(numRows / numPerPage);
    })
    // Getting individual customer feedback data
    db.executeQuery("SELECT *  FROM customer_info  LEFT JOIN sales_order ON (customer_info.customer_id = sales_order.customer_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  LEFT JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id)  WHERE (customer_info.customer_id LIKE '%" + req.query.customer_id + "%')  And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')  ORDER BY sales_order.salesorder_id  DESC LIMIT  " + limit, function(results) {

      //FEEDBACK SERVICE
      var feedback_serviceGREAT = []
      var feedback_serviceG00D = []
      var feedback_serviceOK = []
      var feedback_serviceBAD = []
      var feedback_servicePOOR = []


      results.filter(function(item) {
        if (item.feedback_service == 5) {
          feedback_serviceGREAT.push(item.feedback_service)
        } else if (item.feedback_service == 4) {
          feedback_serviceG00D.push(item.feedback_service)
        } else if (item.feedback_service == 3) {
          feedback_serviceOK.push(item.feedback_service)
        } else if (item.feedback_service == 2) {
          feedback_serviceBAD.push(item.feedback_service)
        } else if (item.feedback_service == 1) {
          feedback_servicePOOR.push(item.feedback_service)
        }
        return item
      })

      var Feedback_service = [{
        'GREAT': feedback_serviceGREAT.length,
        'GOOD': feedback_serviceG00D.length,
        'OK': feedback_serviceOK.length,
        'BAD': feedback_serviceBAD.length,
        'POOR': feedback_servicePOOR.length
      }]

      //FEEDBACK STAFF
      var feedback_staffGREAT = []
      var feedback_staffG00D = []
      var feedback_staffOK = []
      var feedback_staffBAD = []
      var feedback_staffPOOR = []


      results.filter(function(item) {
        if (item.feedback_staff == 5) {
          feedback_staffGREAT.push(item.feedback_staff)
        } else if (item.feedback_staff == 4) {
          feedback_staffG00D.push(item.feedback_staff)
        } else if (item.feedback_staff == 3) {
          feedback_staffOK.push(item.feedback_staff)
        } else if (item.feedback_staff == 2) {
          feedback_staffBAD.push(item.feedback_staff)
        } else if (item.feedback_staff == 1) {
          feedback_staffPOOR.push(item.feedback_staff)
        }
        return item
      })

      var Feedback_staff = [{
        'GREAT': feedback_staffGREAT.length,
        'GOOD': feedback_staffG00D.length,
        'OK': feedback_staffOK.length,
        'BAD': feedback_staffBAD.length,
        'POOR': feedback_staffPOOR.length
      }]

      //FEEDBACK FOOD
      var feedback_foodGREAT = []
      var feedback_foodG00D = []
      var feedback_foodOK = []
      var feedback_foodBAD = []
      var feedback_foodPOOR = []


      results.filter(function(item) {
        if (item.feedback_food == 5) {
          feedback_foodGREAT.push(item.feedback_food)
        } else if (item.feedback_food == 4) {
          feedback_foodG00D.push(item.feedback_food)
        } else if (item.feedback_food == 3) {
          feedback_foodOK.push(item.feedback_food)
        } else if (item.feedback_food == 2) {
          feedback_foodBAD.push(item.feedback_food)
        } else if (item.feedback_food == 1) {
          feedback_foodPOOR.push(item.feedback_food)
        }
        return item
      })


      var Feedback_food = [{
        'GREAT': feedback_foodGREAT.length,
        'GOOD': feedback_foodG00D.length,
        'OK': feedback_foodOK.length,
        'BAD': feedback_foodBAD.length,
        'POOR': feedback_foodPOOR.length
      }]

      //FEEDBACK MONEY
      var feedback_moneyGREAT = []
      var feedback_moneyG00D = []
      var feedback_moneyOK = []
      var feedback_moneyBAD = []
      var feedback_moneyPOOR = []


      results.filter(function(item) {
        if (item.feedback_money == 5) {
          feedback_moneyGREAT.push(item.feedback_money)
        } else if (item.feedback_money == 4) {
          feedback_moneyG00D.push(item.feedback_money)
        } else if (item.feedback_money == 3) {
          feedback_moneyOK.push(item.feedback_money)
        } else if (item.feedback_money == 2) {
          feedback_moneyBAD.push(item.feedback_money)
        } else if (item.feedback_money == 1) {
          feedback_moneyPOOR.push(item.feedback_money)
        }
        return item
      })

      var Feedback_money = [{
        'GREAT': feedback_moneyGREAT.length,
        'GOOD': feedback_moneyG00D.length,
        'OK': feedback_moneyOK.length,
        'BAD': feedback_moneyBAD.length,
        'POOR': feedback_moneyPOOR.length
      }]

      var responsePayload = [{
        Feedback_money: Feedback_money,
        Feedback_staff: Feedback_staff,
        Feedback_service: Feedback_service,
        Feedback_food: Feedback_food,
      }];
      //  var responsePayload=results
      // Unknown code for pagination
      if (page < numPages) {
        responsePayload.pagination = [{
          current: page,
          perPage: numPerPage,
          previous: page > 0 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined
        }]

      } else responsePayload.pagination = {
        err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
      }
      return res.status(200).send(responsePayload);

    });

  })
  /*
  ---------------------------------
  View customer last 10 visit and favourite item
  ---------------------------------
  */
  // Get customer food analytic food data
  app.get(apiUrl + '/customeranalyticfood_service', function(req, res, next) {
    var data = req.query; //get here all sent data's from client side
    var filter = req.query.filter; //assigned here search filter value
    // unknown code pagination
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage;
    var customer_id = req.query.customer_id;
    

    // Here we compute the LIMIT parameter for MySQL query
    //var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    var limit = 1000;
    // Getting data length and rows length.
    
    // Getting food data and last visit data
    //db.executeQuery("SELECT * FROM customer_info LEFT JOIN sales_order ON (" + customer_id + " = sales_order.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  LEFT JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%' && customer_info.customer_id LIKE '%" + req.query.customer_id + "%') And (sales_order.sales_dietType!='ODC') And (sales_order.sales_dietType!='Banquet') And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')  ORDER BY sales_order.salesorder_id  DESC LIMIT  " + limit, function(results) {
   

      db.executeQuery("SELECT customer_info.customer_id, salesorder_item.ordertime,sales_order.salesorder_id,sales_order.sales_dietType, salesorder_item.sales_items,salesorder_item.fmItemType,salesorder_item.fmItemID, salesorder_item.sales_quantity, sales_feedback.feedbackID, sales_feedback.feedbackID, sales_feedback.feedback_service, sales_feedback.feedback_staff, sales_feedback.feedback_food, sales_feedback.feedback_money, sales_feedback.feedback_reason, sales_payment.payment_total, sales_payment.payment_mode FROM customer_info LEFT JOIN sales_order ON (" + customer_id + " = sales_order.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  LEFT JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%' && customer_info.customer_id LIKE '%" + req.query.customer_id + "%') And (sales_order.sales_dietType!='ODC') And (sales_order.sales_dietType!='Banquet') And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')  ORDER BY sales_order.salesorder_id  DESC LIMIT  " + limit, function(results) {
          //  db.executeQuery("SELECT customer_info.customer_id,customer_info.localityID,customer_info.customer_name,customer_info.customer_address,customer_info.customer_email,customer_info.customer_mobile, customer_info.whatsapp,customer_info.customer_city,customer_info.customer_locality,sales_order.customer_id as salesCustomer_id,salesorder_item.ordertime,customer_info.branch_id,customer_info.pointsEarned,customer_info.branch_id,sales_order.salesorder_id,salesorder_item.sales_items,sales_payment.payment_total,salesorder_item.fmItemType,sales_order.sales_dietType,salesorder_item.fmItemID FROM customer_info  LEFT JOIN sales_order ON (sales_order.customer_id = customer_info.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%') And (customer_info.customer_id LIKE '%" + customer_id + "%')  And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')", function(results) {

    //db.executeQuery("SELECT * FROM customer_info LEFT JOIN sales_order ON (" + customer_id + " = sales_order.customer_id) LEFT JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) LEFT JOIN  sales_payment ON  (sales_order.salesorder_id = sales_payment.salesorder_id)  LEFT JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id)  WHERE (customer_info.branch_id LIKE '%" + req.query.branch_id + "%' && customer_info.customer_id LIKE '%" + req.query.customer_id + "%') And (sales_order.sales_dietType!='ODC') And (sales_order.sales_dietType!='Banquet') And (customer_name LIKE '%" + filter + "%' or customer_mobile LIKE '%" + filter + "%'  or customer_locality LIKE '%" + filter + "%')  ORDER BY sales_order.salesorder_id  DESC LIMIT  " + limit, function(results) {


     var salesorder_id = []
      results.map(function(item) {
        if (salesorder_id.indexOf(item.salesorder_id) === -1) {
          salesorder_id.push(item.salesorder_id)

        }
      })
     
      //get unique food item id
      var food_ids = []
      //TO FILTER dupllicate customer ids
      results.map(function(fulldata) {
        if (food_ids.indexOf(fulldata.fmItemID) === -1) {
          food_ids.push(fulldata.fmItemID)

        }
      });
      //console.log(food_ids);
      //TO FILTER dupllcate salesorder ids for used in tagmap function for last visit
      var customer_visits = [];
      results.map(function(fulldata) {
        if (customer_visits.indexOf(fulldata.salesorder_id) === -1) {
          customer_visits.push(fulldata.salesorder_id)
        }
      })
      //console.log('visit' + customer_visits);
      var food_ids = []
      //TO FILTER dupllicate customer ids
      results.map(function(fulldata) {
        if (food_ids.indexOf(fulldata.fmItemID) === -1) {
          food_ids.push(fulldata.fmItemID)

        }
      });

      var uniqFmId = results.filter(function({ fmItemID }) {
        return !this[fmItemID] && (this[fmItemID] = fmItemID)
      }, {})
      var Fm_details_data = uniqFmId.reverse();
      var customer_details = results.reverse(); //reverse array for decending order for last visit
      // Make a map for get about the particular customer's ordered information
      //here map is a call back function.it will be do manipulated customer details return  to store CustomerFoods
      var tagMapfm = Fm_details_data.reduce(function(map, tag) {
        var fav_food_count = 0; //get fav food count
        var fav_food_name = [] //get fav foods
      //  var total_amounts = 0;

        for (var i = 0; i < customer_details.length; i++) {
          if (customer_details[i].fmItemID == tag.fmItemID) {
            fav_food_count += parseInt(customer_details[i].sales_quantity); //push fav food count
            fav_food_name.push(customer_details[i].sales_items); //push fav foods
          }
        }
        //here call back functon here all customers of particular information mapped and return to store CustomerFoods varibales as an array.
        map[tag.fmItemID] = { "x": fav_food_name[0], "y": fav_food_count, 'fav_food_count': fav_food_count, 'fav_food_name': fav_food_name[0], "customer_id": tag.customer_id }
        return map // return callback
      }, {});

      // unique id's will be execute like loop which is food id will run one by one 
      //the customer id will be return to tagmap function
      //then that tagmap function will be perform some manipulations with that customer id like get particular customer of payment totals,last vists
      var CustomerFoods = food_ids.map(function(id) {
        return tagMapfm[id] //pass id to another function
      });
      // Higher Ordered items sorting here
      var foodItemResult = CustomerFoods.sort(function(a, b) {
        return a.fav_food_count - b.fav_food_count;
      });

      var uniqId = results.filter(function({ salesorder_id }) {
        return !this[salesorder_id] && (this[salesorder_id] = salesorder_id)
      }, {})
      var customer_details_data = uniqId.reverse();

      // Make a map for get about the particular customer's ordered information, tag is full data
      //here map is a call back function.it will be do manipulated customer details return  to store CusromerVisits
      var tagMaps = customer_details_data.reduce(function(maps, tag) {
        var total_amount = 0;
        for (var i = 0; i < customer_details_data.length; i++) {
          if (customer_details_data[i].salesorder_id == tag.salesorder_id) {
            var endTime = new Date(); //store today date
            var ms = (endTime - new Date(tag.ordertime)); // get  difference of customers orderdate to compare this date of all customers
            var days = Math.round(ms / 86400000); //so get all differences of how many days back they last ordered
            if (days == 1) { //if only one visit then the customers of last visit is one
              var finalCountdown = (days + "day ago");
            } else {
              var finalCountdown = (days + "days ago"); //if more than one visit then the customers
            }
            var remainingtime = days == 0 ? "today" : finalCountdown //not have sales order id means today ordered. or have salesordered means like 5 days ago last ordered
            if (customer_visits.length == 1) {
              var total = customer_details_data[i].payment_total //if one time visit customer only push one total amount
            }
            total_amount += parseInt(customer_details_data[i].payment_total) //if more than one time visit customer means loop will be run for all payment total amount
          }
        }
        //here call back functon here all customers of particular information mapped and return to store CusromerVisits varibales as an array.
        maps[tag.salesorder_id] = { 'x': tag.ordertime, "y": total ? total : total_amount, "customer_id": tag.customer_id, "billno": tag.salesorder_id}
        return maps // return callback
      }, {});

      // unique id's will be execute like loop which is salesorder id will run one by one 
      //the customer id will be return to tagmap function
      //then that tagmap function will be perform some manipulations with that salesorder id like get particular customer of food details
      var CusromerVisits = customer_visits.map(function(id) {
        return tagMaps[id] //pass id to another function
      });

      // Last visit date wise ascending
      var CustomerVisitResult = CusromerVisits.sort(function(a, b) {
        return new Date(a.x) - new Date(b.x);
      });
      var numRows = 1;
      //store manipulated customers
      var responsePayload = [{
        results: foodItemResult,
        cus_fulldata: CustomerVisitResult,
        purchaseorder_count: numRows,
      }];
      //  var responsePayload=results
      if (page < numPages) {
        responsePayload.pagination = [{
          current: page,
          perPage: numPerPage,
          previous: page > 0 ? page - 1 : undefined,
          next: page < numPages - 1 ? page + 1 : undefined
        }]

      } else responsePayload.pagination = {
        err: 'queried page ' + page + ' is >= to maximum page number ' + numPages
      }
      return res.status(200).send(responsePayload); //return to client side

    });

  });





}
