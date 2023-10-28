var DB = require('../../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var mysql = require('mysql');
var bodyParser = require('body-parser');

module.exports = function(app) {

  //update odc primary table
  app.put(apiUrl + '/updateOdcorder/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = `UPDATE sales_order SET odc_deliveryDate = "${req.body[0].odc_deliveryDate}",sales_dietType = "${req.body[0].sales_dietType}",hall_no = "${req.body[0].hall_no}",odc_type = "${req.body[0].odc_type}",status = "${req.body[0].status}",customer_id = "${req.body[0].customer_id}",sales_deliveryTime = "${req.body[0].sales_deliveryTime}",odc_categoryID = "${req.body[0].odc_categoryID}",modifiedID = "${req.body[0].modifiedID}" WHERE salesorder_id = "${salesorder_id}"`;
    db.executeQuery(sql, function(err, rows) {
      res.sendStatus(200);
    });
  });

  //update odc sales item data
  app.put(apiUrl + '/odcitems/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var editadditem = req.body.filter(function(addnewitem) {
      if (!addnewitem.odc_salesorderitem_id) {
        return addnewitem
      }
    })

    var editdbitem = req.body.filter(function(editexistitem) {
      if (editexistitem.odc_salesorderitem_id) {
        return editexistitem
      }
    })

    //update sales_items
    for (var i = 0; i < editdbitem.length; i++) {
      var fmItemID = editdbitem[i].sales_items.fmItemID ? editdbitem[i].sales_items.fmItemID : editdbitem[i].fmItemID
      var fmCatergoryID = editdbitem[i].sales_items.fmCatergoryID ? editdbitem[i].sales_items.fmCatergoryID : editdbitem[i].fmCatergoryID
      var sql = `UPDATE odc_salesorderitem SET sales_items = "${editdbitem[i].searchText}", sales_quantity = "${editdbitem[i].sales_quantity}",salesitem_rate = "${editdbitem[i].salesitem_rate}",item_subrate= "${editdbitem[i].item_subrate}",subitemtotal = "${editdbitem[i].subitemtotal}",fmItemID = "${fmItemID}",fmCatergoryID = "${fmCatergoryID}"  WHERE odc_salesorderitem_id = "${editdbitem[i].odc_salesorderitem_id}"`;
      db.executeQuery(sql, function(err, rows) {});
    }

    if (editadditem.length > 0) {
      //post newly added item
      var items = editadditem.map(function(item) {
        return [item.searchText, item.sales_quantity, item.salesitem_rate, item.subitemtotal, item.sales_items.fmItemID, item.sales_items.fmCatergoryID, salesorder_id]
      });
      var sql = "INSERT INTO odc_salesorderitem (sales_items,sales_quantity,salesitem_rate,subitemtotal,fmItemID,fmCatergoryID,salesorder_id)  VALUES ? ";
      db.executeQuery1(sql, [items], function(results) {

      });
    }
    return res.sendStatus(200);

  });


  // Get upcoming odc events data from database
  app.get(apiUrl + '/currentodc_service', function(req, res, next) {

    var data = req.query;
    var filter = req.query.filter;
    var numRows;
    var queryPagination;
    var numPerPage = parseInt(req.query.limit, 10) || 1;
    var page = req.query.page == undefined ? 1 : req.query.page
    var numPages;
    var doordelivery;
    var skip = page * numPerPage

    if (req.query.staffID == "admin") {
      var staffID = ''
    } else {
      var staffID = req.query.staffID;
    }

    if (req.query.amount_type == 'All') {
      var payment_status = ''
      var payment_statuss = ''
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'balance') {
      var payment_status = 'unpaid'
      var payment_statuss = 'advance paid'
      var fullypayment_status = ''
    } else if (req.query.amount_type == 'fully paid') {
      var fullypayment_status = req.query.amount_type
      var payment_status = '';
      var payment_statuss = ''
    }

    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    // Get no of page and rows for pagination
    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.payment_mode,sales_order.odc_categoryID,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')", function(results) {
      var current = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) > new Date() || new Date(item.odc_deliveryDate).toDateString() == new Date().toDateString())
          return item
      })
      // store no of page and rows for pagination
      numRows = current.length;
      numPages = Math.ceil(numRows / numPerPage);
    })

    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_payment.payment_mode,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_order.modifiedID,sales_order.last_modified,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')  GROUP BY salesorder_id DESC", function(results) {
      //filter only upcoming events by date wise
      var currentodcs = results.filter(function(odcFullData) {
        if (new Date(odcFullData.odc_deliveryDate) > new Date() || new Date(odcFullData.odc_deliveryDate).toDateString() == new Date().toDateString())
          return odcFullData
      })
      //map upcoming events data for our convenient
      var currentodc = currentodcs.map(function(item) {
        if (new Date(item.odc_deliveryDate).toDateString() == new Date().toDateString()) {
          var status = 'Today'
        } else if (new Date(item.odc_deliveryDate) > new Date()) {
          var status = 'Upcoming Event'
        }

        var date_time = new Date(item.sales_deliveryTime).toString(); //get like wed apr with time
        var ordertiming = (date_time.split(' ')[4]).split(':'); //only get time and split it as array
        var hours = (ordertiming[0] % 12) || 12; // convert to 12-hour style
        var time = hours + ":" + ordertiming[1] + " " + (ordertiming[0] < 12 ? 'AM' : 'PM') //find whether the hour is AM or PM
        return { 'salesorder_id': item.salesorder_id, 'paid_date': new Date(item.paid_date), 'modifiedID': item.modifiedID, 'last_modified': new Date(item.last_modified), 'staffID': item.staffID, 'payment_total': item.payment_total, 'payment_mode': item.payment_mode, 'payment_status': item.payment_status, 'additional_charge': item.additional_charge, 'tax_rate': item.tax_rate, 'tax_sgst': item.tax_sgst, 'discount': item.discount, 'customer_id': item.customer_id, 'odc_categoryID': item.odc_categoryID, 'odc_deliveryDate': item.odc_deliveryDate, 'payment_received': item.payment_received, 'sales_deliveryTime': time, 'status': status }
      });
      /*------------------
      Total amount for all type in dropdown
      ---------------*/
      //filter only  total amount & fully paid
      var total_purchase = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid') {
          total_purchase.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_purchase.length > 0) {
        var total_purchases = total_purchase.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  full total amount
      var full_total = []
      currentodcs.filter(function(item) {
        full_total.push(parseInt(item.payment_total))
        return item
      })
      //calculate sum of cashes
      if (full_total.length > 0) {
        var full_totals = full_total.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  tax cgst
      var tax_cgst = []
      currentodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_cgst.push(parseInt(item.tax_rate))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_cgst.length > 0) {
        var tax_info_cgst = tax_cgst.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  tax sgst
      var tax_sgst = []
      currentodcs.filter(function(item) {
        if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
          tax_sgst.push(parseInt(item.tax_sgst))
          return item
        }
      })
      //calculate sum of cashes
      if (tax_sgst.length > 0) {
        var tax_info_sgst = tax_sgst.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only cash & fully paid
      var total_cash = [];
      currentodcs.filter(function(item) {
        if ((item.payment_status == 'fully paid') && item.payment_mode == 'cash') {
          total_cash.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cash.length > 0) {
        var total_cashs = total_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only card & fully paid
      var total_card = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'card') {
          total_card.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_card.length > 0) {
        var total_cards = total_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  cheque & fully paid
      var total_cheque = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'cheque') {
          total_cheque.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_cheque.length > 0) {
        var total_cheques = total_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  online & fully paid
      var total_online = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'fully paid' && item.payment_mode == 'onlineTranscation') {
          total_online.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_online.length > 0) {
        var total_onlines = total_online.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only  advance paid & cash
      var advance_cash = []
      currentodcs.filter(function(item) {
        if ((item.payment_status == 'advance paid') && item.payment_mode == 'cash') {
          advance_cash.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cash.length > 0) {
        var advance_cashs = advance_cash.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only   advance paid & card
      var advance_card = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'card') {
          advance_card.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_card.length > 0) {
        var advance_cards = advance_card.reduce(function(a, b) {
          return a + b;
        });
      }


      //filter only   advance paid & cheque
      var advance_cheque = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'cheque') {
          advance_cheque.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_cheque.length > 0) {
        var advance_cheques = advance_cheque.reduce(function(a, b) {
          return a + b;
        });
      }
      //filter only  advance paid & online
      var advance_online = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' && item.payment_mode == 'onlineTranscation') {
          advance_online.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (advance_online.length > 0) {
        var advance_onlines = advance_online.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only   advance paid & unpaid
      var total_advanceAmount = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advanceAmount.push(parseInt(item.payment_total))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advanceAmount.length > 0) {
        var total_advanceAmounts = total_advanceAmount.reduce(function(a, b) {
          return a + b;
        });
      }

      //filter only  get paid count length
      var paid_count = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.payment_total))
          return item
        }
      })

      //filter only  get advance count length
      var total_advance = []
      currentodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'unpaid') {
          total_advance.push(parseInt(item.payment_received))
          return item
        }
      })
      //calculate sum of cashes
      if (total_advance.length > 0) {
        var total_advances = total_advance.reduce(function(a, b) {
          return a + b;
        });
      }
      //assign advance purchse total  amounts in advance or unpaid status
      var total_purchased1 = total_advanceAmounts == undefined ? 0 : total_advanceAmounts;
      //assign fully paid total  amount
      var total_purchased2 = total_purchases == undefined ? 0 : total_purchases;
      //Assign total amount of all status, calculate total((advancepaid+unpaaid) + fullypaid)
      var total = total_purchased1 + total_purchased2;
      //assign advance amount(reveiced) purchase received amount in advance status
      var total_purchased3 = total_advances == undefined ? 0 : total_advances
      //calculate only Total paid amount(totalamount+receivedamount)
      var total_paid = total_purchased2 + total_purchased3;
      //calculate total balance=(fullypaid+advancepaid+unpaaid)-(totalamount+receivedamount)
      var balance = total - total_paid;
      //store calculated values in to an array
      var responsePayload = [{
        results: currentodc,
        total_purchase: total,
        full_total: full_totals == undefined ? 0 : full_totals,
        total_paid: total_paid,
        balance: balance,
        tax_info_sgst: tax_info_sgst,
        tax_info_cgst: tax_info_cgst,
        balance_count: total_advance.length,
        paid_count: paid_count.length,
        total_cash: (total_cashs == undefined ? 0 : total_cashs) + (advance_cashs == undefined ? 0 : advance_cashs),
        total_card: (total_cards == undefined ? 0 : total_cards) + (advance_cards == undefined ? 0 : advance_cards),
        total_cheque: (total_cheques == undefined ? 0 : total_cheques) + (advance_cheques == undefined ? 0 : advance_cheques),
        total_online: (total_onlines == undefined ? 0 : total_onlines) + (advance_onlines == undefined ? 0 : advance_onlines),
        paidexpense_count: numRows

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
      return res.status(200).send(responsePayload);

    });

  });

  //delete odc sale items
  app.delete(apiUrl + '/currentodc_service/:salesorder_id', function(req, res) {
    let salesorder_id = req.params.salesorder_id;
    var sql = 'DELETE FROM odc_salesorderitem WHERE salesorder_id = "' + req.params.salesorder_id + '"';
    db.executeQuery(sql, function(err, rows, fields) {
      var sql = 'DELETE FROM sales_payment WHERE salesorder_id = "' + req.params.salesorder_id + '"';
      db.executeQuery(sql, function(err, rows, fields) {
        var sql = 'DELETE FROM sales_order WHERE salesorder_id = "' + req.params.salesorder_id + '"';
        db.executeQuery(sql, function(err, rows, fields) {
          res.sendStatus(200);
        });
      })
    })
  });


}
