var DB = require('../../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var mysql = require('mysql');
var bodyParser = require('body-parser');

module.exports = function(app) {

  // Get finished events data from sales order table
  app.get(apiUrl + '/paidodc_service', function(req, res, next) {
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


     // Get no of page and rows for pagination
    var limit = skip - numPerPage + ',' + parseInt(skip + numPerPage);
    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.payment_mode,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_payment.additional_charge,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')", function(results) {

      var paid = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) < new Date() && new Date(item.odc_deliveryDate).toDateString() != new Date().toDateString())
          return item
      })
      // store no of page and rows for pagination
      numRows = paid.length;
      numPages = Math.ceil(numRows / numPerPage);
    })

    db.executeQuery("SELECT sales_order.salesorder_id,sales_order.status,sales_payment.paid_date,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.discount,sales_order.modifiedID,sales_order.last_modified,sales_payment.additional_charge,sales_payment.payment_mode,sales_order.odc_categoryID,sales_order.customer_id,sales_order.odc_deliveryDate,sales_order.sales_deliveryTime,sales_order.staffID,sales_payment.payment_status,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.payment_received,sales_payment.payment_total  FROM sales_order INNER JOIN sales_payment ON sales_order.salesorder_id = sales_payment.salesorder_id WHERE ((sales_dietType='ODC' OR sales_dietType='Banquet') && (YEAR(sales_payment.paid_date) LIKE '%" + req.query.year + "%' and MONTH(sales_payment.paid_date) LIKE '%" + req.query.month + "%') && (sales_payment.payment_status LIKE '%" + payment_statuss + "%' || sales_payment.payment_status LIKE '%" + payment_status + "%') && sales_payment.payment_status LIKE '%" + fullypayment_status + "%' && staffID LIKE '%" + staffID + "%' && branch_id LIKE '%" + req.query.branch_id + "%') And (sales_order.salesorder_id LIKE '%" + filter + "%' or sales_payment.payment_total LIKE '%" + filter + "%' OR sales_order.staffID LIKE '%" + filter + "%')  GROUP BY salesorder_id DESC ", function(results) {
      //filter only finished events by date wise
      var paidodcs = results.filter(function(item) {
        if (new Date(item.odc_deliveryDate) < new Date() && new Date(item.odc_deliveryDate).toDateString() != new Date().toDateString())
          return item
      })
      //map upcoming events data for our convenient
      var paidodc = paidodcs.map(function(item) {
        var date_time = new Date(item.sales_deliveryTime).toString(); //get like wed apr with time
        var ordertiming = (date_time.split(' ')[4]).split(':'); //only get time and split it as array
        var hours = (ordertiming[0] % 12) || 12; // convert to 12-hour style
        var time = hours + ":" + ordertiming[1] + " " + (ordertiming[0] < 12 ? 'AM' : 'PM') //find whether the hour is AM or PM
        return { 'salesorder_id': item.salesorder_id, 'paid_date': new Date(item.paid_date), 'modifiedID': item.modifiedID, 'last_modified': new Date(item.last_modified), 'additional_charge': item.additional_charge, 'tax_rate': item.tax_rate, 'tax_sgst': item.tax_sgst, 'discount': item.discount, 'payment_total': item.payment_total, 'payment_received': item.payment_received, 'customer_id': item.customer_id, 'payment_status': item.payment_status, 'odc_categoryID': item.odc_categoryID, 'odc_deliveryDate': item.odc_deliveryDate, 'payment_mode': item.payment_mode, 'sales_deliveryTime': time, 'staffID': item.staffID }
      });
      /*------------------
      Total amount
      ---------------*/
        //filter only  total amount & fully paid
      var total_purchase = []
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      var total_cash = []
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
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
      paidodcs.filter(function(item) {
        if (item.payment_status == 'advance paid' || item.payment_status == 'fully paid') {
          paid_count.push(parseInt(item.payment_total))
          return item
        }
      })

      //filter only  get advance count length
      var total_advance = []
      paidodcs.filter(function(item) {
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
        results: paidodc,
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

  })


}
