var DB = require('../../dbQueries')
var db = new DB();
var apiUrl = "/api"
var bodyParser = require('body-parser');
var moment = require('moment-timezone');

/*-------------------------------------------

LIST

- BILLING ANALYTICS
- EXPENSE ANALYTICS
- INVENTORY ANALYTICS
- ODC ANALYTICS
- SMS ANALYTICS

 -----------------------------------------*/


module.exports = function(app) {

   /*-------------------------------------------
   =============================================

    BILLING ANALYTICS

  ===============================================
    -------------------------------------------*/


    //var sql = "SELECT DISTINCT sales_order.salesorder_id,sales_order.thirdparty_id,sales_order.thirdparty_name,sales_order.staffID,sales_order.status,sales_order.sales_deliveryDate,sales_order.sales_dietType,sales_order.orderTakenID,salesorder_item.ordertime,sales_order.staffID,sales_order.sales_deliveryStatus,sales_order.tableitem,sales_payment.payment_total,sales_payment.payment_received,sales_payment.payment_transferred,sales_order.manageBy,sales_order.sales_deliveryStatus,sales_payment.tax_rate,sales_payment.tax_sgst,sales_payment.additional_charge,sales_payment.discount,sales_payment.payment_mode,sales_payment.online_type,sales_order.sales_deliveryTime,sales_payment.payment_status,sales_payment.payment_mode,sales_feedback.feedback_service,sales_feedback.feedback_staff,sales_feedback.feedback_food,sales_feedback.feedback_money,sales_feedback.feedback_reason FROM sales_order INNER JOIN salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id) INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) INNER JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'";
  
  //get pos bill analytics data for both admin and user
  app.get(apiUrl + '/dashboard_analytics_date/:date/:toDate/:staffID/:branch_id/:month/:year', function(req, res) {
    //if params data of staffID is admin means staffID will be empty which means it will fetch all the datas in db
    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    var request_data = req.params.date; //get requested date

    //assign peroid days depending on filter and check admin permission
    if ((request_data == 'today' || request_data == 'LW' || request_data == 'LM' || request_data == '3MA' || request_data == '6MA')) {
      if (req.params.date == "LM") {
        var previous_time = 30;
      } else if (req.params.date == "today") {
        var previous_time = 0;
      } else if (req.params.date == "3MA") {
        var previous_time = 90;
      } else if (req.params.date == "6MA") {
        var previous_time = 180;
      } else if (req.params.date == "LW") {
        var previous_time = 7;
      }

      //admin side  analytics
      db.executeQuery("SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) INNER JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
          //console.log(results);
       var duplicate_results = results;
     //  console.log(duplicate_results);
      var uniq = results.filter(function({salesorder_id}) {
        return !this[salesorder_id] && (this[salesorder_id] = salesorder_id)
      }, {})
      var results = uniq;
      //  console.log(results);
        if (results.length != 0) {
          //filter only finished cash datas
          var cash_total = [];
          var cash = results.filter(function(item) {
            if (item.payment_mode == "cash" && item.status == 'finished') {
              cash_total.push(parseInt(item.payment_total))
              return item
            }
          })
          //filter only ordered card datas
          var card_total = [];
          var card = results.filter(function(item) {
            if (item.payment_mode == "card" && item.status == 'finished') {
              card_total.push(parseInt(item.payment_total))
              return item
            }
          })

          //filter only ordered cash datas
          var orderedcash_total = [];
          var orderedcash = results.filter(function(item) {
            if (item.payment_mode == "cash" && item.status == 'ordered') {
              orderedcash_total.push(parseInt(item.payment_received))
              return item
            }
          })
          //filter only ordered card datas
          var orderedcard_total = [];
          var orderedcard = results.filter(function(item) {
            if (item.payment_mode == "card" && item.status == 'ordered') {
              orderedcard_total.push(parseInt(item.payment_received))
              return item
            }
          })


          //filter only  tax_cgst datas
          var tax_cgst = [];
          results.filter(function(item) {
            tax_cgst.push(parseFloat(item.tax_rate))
            return item
          })
          //calculate sum of tax_cgst
          if (tax_cgst.length > 0) {
            var tax_info_cgst = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only  tax_sgst datas
          var tax_sgst = [];
          results.filter(function(item) {
            tax_sgst.push(parseFloat(item.tax_sgst))
            return item
          })
          //calculate sum of tax_sgst
          if (tax_sgst.length > 0) {
            var tax_info_sgst = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only  finished cash and online datas
          var received_cash = [];
          var received_card = [];
          var cash_card = results.filter(function(item) {
            if (item.payment_mode == "cash & card" && item.status == 'finished') {
              received_cash.push(item.payment_received)
              received_card.push(item.payment_transferred)
              return item
            }
          })

          //filter only  ordered cash and online datas
          var orderedreceived_cash = [];
          var orderedreceived_card = [];
          var orderedcash_card = results.filter(function(item) {
            if (item.payment_mode == "cash & card" && item.status == 'ordered') {
              orderedreceived_cash.push(item.payment_received)
              orderedreceived_card.push(item.payment_transferred)
              return item
            }
          })
          //calculate sum of cashes
          if (cash_total.length > 0) {
            var cash_sum = cash_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (card_total.length > 0) {
            var card_sum = card_total.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (received_card.length > 0) {
            var received_cards = received_card.reduce(function(a, b) {
              return a + b;
            });
          }
          if (received_cash.length > 0) {
            var received_cashs = received_cash.reduce(function(a, b) {
              return a + b;
            });
          }


          //calculate sum of cashes
          if (orderedcash_total.length > 0) {
            var orderedcash_sum = orderedcash_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (orderedcard_total.length > 0) {
            var orderedcard_sum = orderedcard_total.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate orderd sum of cashes & cards
          if (orderedreceived_card.length > 0) {
            var orderedreceived_cards = orderedreceived_card.reduce(function(a, b) {
              return a + b;
            });
          }
          if (orderedreceived_cash.length > 0) {
            var orderedreceived_cashs = orderedreceived_cash.reduce(function(a, b) {
              return a + b;
            });
          }

          //filter only sales_diet type datas for dinein,takeaway,doordlivery
          var dinein_count = results.filter(function(item) {
            if (item.sales_dietType == "dinein") {
              return item
            }
          })
          var takeaway_count = results.filter(function(item) {
            if (item.sales_dietType == "takeaway") {
              return item
            }
          })
          //filter only sales_diet type datas for dinein,takeaway,doordlivery
          var doordelivery_count = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery") {
              return item
            }
          })
          var dinein_amount = []; //get total dinein  amount
          var takeaway_amount = []; //get takeaway  amount
          var doordelivery_amount = []; //get doordelivery amount

          //filter only sales_diet type datas for dinein,takeaway,doordlivery
          var dinein = results.filter(function(item) {
            if (item.sales_dietType == "dinein")
              dinein_amount.push(parseInt(item.payment_total))
            return item
          })
          //filter take away data
          var takeaway = results.filter(function(item) {
            if (item.sales_dietType == "takeaway")
              takeaway_amount.push(parseInt(item.payment_total))
            return item
          })
          //filter doordelivery data
          var doordelivery = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery")
              doordelivery_amount.push(parseInt(item.payment_total))
            return item
          })

          if (dinein_amount.length > 0) {
            var dinein_amounts = dinein_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          if (takeaway_amount.length > 0) {
            var takeaway_amounts = takeaway_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          if (doordelivery_amount.length > 0) {
            var doordelivery_amounts = doordelivery_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          /* 
          online type amount calc */

          var onlinePaymentType0_amount = []; //get total of online payment type amount
          var onlinePaymentType1_amount = []; //get total of online payment type amount
          var onlinePaymentType2_amount = []; //get total of online payment type amount
          var onlinePaymentType3_amount = []; //get total of online payment type amount
          var onlinePaymentType4_amount = []; //get total of online payment type amount
          //filter only online types
          var onlineType0 = results.filter(function(item) {
            if (item.online_type == ("0" || "card transcation"))
              onlinePaymentType0_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType0_amount.length > 0) {
            var onlinePaymentType0_amounts = onlinePaymentType0_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType1 = results.filter(function(item) {
            if (item.online_type == ("1" || "paytm"))
              onlinePaymentType1_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType1_amount.length > 0) {
            var onlinePaymentType1_amounts = onlinePaymentType1_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType2 = results.filter(function(item) {
            if (item.online_type == "2")
              onlinePaymentType2_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType2_amount.length > 0) {
            var onlinePaymentType2_amounts = onlinePaymentType2_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType3 = results.filter(function(item) {
            if (item.online_type == ("3" || "online transcation"))
              onlinePaymentType3_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType3_amount.length > 0) {
            var onlinePaymentType3_amounts = onlinePaymentType3_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType4 = results.filter(function(item) {
            if (item.online_type == ("4" || "upi"))
              onlinePaymentType4_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType4_amount.length > 0) {
            var onlinePaymentType4_amounts = onlinePaymentType4_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          var onlinePayment0 = !onlinePaymentType0_amounts ? 0 : onlinePaymentType0_amounts;
          var onlinePayment1 = !onlinePaymentType1_amounts ? 0 : onlinePaymentType1_amounts;
          var onlinePayment2 = !onlinePaymentType2_amounts ? 0 : onlinePaymentType2_amounts;
          var onlinePayment3 = !onlinePaymentType3_amounts ? 0 : onlinePaymentType3_amounts;
          var onlinePayment4 = !onlinePaymentType4_amounts ? 0 : onlinePaymentType4_amounts;

          var onlinePaymentTypesAmount = [{
            "names": onlinePayment0,
            "values": 0
          }, {
            "names": onlinePayment1,
            "values": 1
          }, {
            "names": onlinePayment2,
            "values": 2
          }, {
            "names": onlinePayment3,
            "values": 3
          }, {
            "names": onlinePayment4,
            "values": 4
          }]
          /* 
         end online type amount calc */

          //filter only ordered datas for dinein,takeaway,doordlivery
          var dinein_Order = results.filter(function(item) {
            if (item.sales_dietType == "dinein" && item.status == 'ordered')
              return item
          })

          var takeaway_Order = results.filter(function(item) {
            if (item.sales_dietType == "takeaway" && item.status == 'ordered')
              return item
          })

          var doordelivery_Order = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery" && item.status == 'ordered')
              return item
          })
          //assign values to variable
          var Pos_orderTotal = dinein_Order.length + takeaway_Order.length + doordelivery_Order.length;
          var cash_summ = cash_sum == undefined ? 0 : cash_sum;
          var card_summ = card_sum == undefined ? 0 : card_sum
          var orderedcash_summ = orderedcash_sum == undefined ? 0 : orderedcash_sum;
          var orderedcard_summ = orderedcard_sum == undefined ? 0 : orderedcard_sum
          var received_cashss = received_cashs == undefined ? 0 : received_cashs;
          var received_cardss = received_cards == undefined ? 0 : received_cards;
          var orderedreceived_cashss = orderedreceived_cashs == undefined ? 0 : orderedreceived_cashs;
          var orderedreceived_cardss = orderedreceived_cards == undefined ? 0 : orderedreceived_cards;
          var dinein_amountss = dinein_amounts == undefined ? 0 : dinein_amounts;
          var takeaway_amountss = takeaway_amounts == undefined ? 0 : takeaway_amounts;
          var doordelivery_amountss = doordelivery_amounts == undefined ? 0 : doordelivery_amounts;
          //get unique id
          var food_ids = [];
          //filter duplicate food ids
          duplicate_results.map(function(item) {
            if (food_ids.indexOf(item.fmItemID) === -1) {
              food_ids.push(item.fmItemID)
            }
          })

          // Make a map for get about the today  food ordered information
          //here map is a call back function.it will be do manipulated food details return  to store selectedNames
          var tagMap = duplicate_results.reduce(function(map, tag) {
            var total = 0; //all payment total
            var count = []; //get total food count
            var sales_count = 0; //get quanty for each food saled
            for (var i = 0; i < duplicate_results.length; i++) {
              if (duplicate_results[i].fmItemID == tag.fmItemID)
                total += parseInt(duplicate_results[i].payment_total)
            }
            for (var i = 0; i < duplicate_results.length; i++) {
              if (duplicate_results[i].fmItemID == tag.fmItemID)
                sales_count += parseInt(duplicate_results[i].sales_quantity)
            }
            duplicate_results.filter(function(item) {
              if (item.fmItemID == tag.fmItemID)
                count.push(item.fmItemID)
            })
            map[tag.fmItemID] = { "sales_items": tag.sales_items, 'staffID': tag.staffID, 'fmItemID': tag.fmItemID, 'fmCatergoryID': tag.fmCatergoryID, 'count': sales_count, 'total': total / count.length }

            return map // return callback
          }, {});

          // unique id's will be execute like loop which is food id will run one by one 
          //the food id will be return to tagmap function
          //then that tagmap function will be perform some manipulations with that fmitemid 
          var selectedNames = food_ids.map(function(id) {
            return tagMap[id] //pass id to another function
          });

          // Higher top sales food sorting here
          var food_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.count) - parseFloat(b.count);
          });
          /*--------------
          Third party
          ---------------*/
          //get unique id
          var thirdparty_id = [];
          //filter duplicate food ids
          results.map(function(item) {
            if (thirdparty_id.indexOf(item.thirdparty_id) === -1 && item.thirdparty_id != '') {
              thirdparty_id.push(item.thirdparty_id)
            }
          })
          // Make a map for get about the today  third party information
          //here map is a call back function.it will be do manipulated thirdparty details return  to store thirdparty
          var tagMapthirdparty = results.reduce(function(map, tag) {
            var total = 0;
            var count = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].thirdparty_id == tag.thirdparty_id)
                total += parseInt(results[i].payment_total)
            }
            results.filter(function(item) {
              if (item.thirdparty_id == tag.thirdparty_id)
                count.push(item.thirdparty_id)
            })
            map[tag.thirdparty_id] = { "thirdparty_name": tag.thirdparty_name, 'count': count.length, 'total': total }

            return map // return callback
          }, {});

          // unique id's will be execute like loop which is thirdparty_id will run one by one 
          //the thirdparty_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that thirdparty_id

          var thirdparty = thirdparty_id.map(function(id) {
            return tagMapthirdparty[id] //pass id to another function
          });

          // Higher top visited thirdparties sorting here
          var thirdparty_fulldata = thirdparty.sort(function(a, b) {
            return parseFloat(a.count) - parseFloat(b.count);
          });

          /*--------------
          Feedback
          ---------------*/
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

          //filter feedback data depending on its star rate value
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
          /*--------------
          Order taken analytics
          ---------------*/
          //get order taken analytics
          //filter without duplicate id
          var ordertakenid = []
          results.map(function(item) {
            if ((ordertakenid.indexOf(item.orderTakenID) === -1) && item.orderTakenID != null) {
              ordertakenid.push(item.orderTakenID)
            }
          })
          // Make a map for get about the today  order taken information
          //here map is a call back function.it will be do manipulated ordertaken details return  to store ordertakenBy_Info
          var tagMaps = results.reduce(function(map, tag) {
            var orderTakenCount = [];
            //var ordertakenfeedback = [];
            var totals = 0;
            for (var i = 0; i < results.length; i++) {
              if (results[i].orderTakenID == tag.orderTakenID) {
             /*   ordertakenfeedback.push(results[i])
                var feedback_serviceGREATT = []
                var feedback_serviceG00DD = []
                var feedback_serviceOKK = []
                var feedback_serviceBADD = []
                var feedback_servicePOORR = []

                ordertakenfeedback.filter(function(item) {
                  if (item.feedback_service == 5) {
                    feedback_serviceGREATT.push(item.feedback_service)
                  } else if (item.feedback_service == 4) {
                    feedback_serviceG00DD.push(item.feedback_service)
                  } else if (item.feedback_service == 3) {
                    feedback_serviceOKK.push(item.feedback_service)
                  } else if (item.feedback_service == 2) {
                    feedback_serviceBADD.push(item.feedback_service)
                  } else if (item.feedback_service == 1) {
                    feedback_servicePOORR.push(item.feedback_service)
                  }
                })

                var feedback_servicee = [{
                  'GREAT': feedback_serviceGREATT.length,
                  'GOOD': feedback_serviceG00DD.length,
                  'OK': feedback_serviceOKK.length,
                  'BAD': feedback_serviceBADD.length,
                  'POOR': feedback_servicePOORR.length
                }]
                //FEEDBACK STAFF
                var feedback_staffGREATT = []
                var feedback_staffG00DD = []
                var feedback_staffOKK = []
                var feedback_staffBADD = []
                var feedback_staffPOORR = []


                ordertakenfeedback.filter(function(item) {
                  if (item.feedback_staff == 5) {
                    feedback_staffGREATT.push(item.feedback_staff)
                  } else if (item.feedback_staff == 4) {
                    feedback_staffG00DD.push(item.feedback_staff)
                  } else if (item.feedback_staff == 3) {
                    feedback_staffOKK.push(item.feedback_staff)
                  } else if (item.feedback_staff == 2) {
                    feedback_staffBADD.push(item.feedback_staff)
                  } else if (item.feedback_staff == 1) {
                    feedback_staffPOORR.push(item.feedback_staff)
                  }
                })
                var feedback_stafff = [{
                  'GREAT': feedback_staffGREATT.length,
                  'GOOD': feedback_staffG00DD.length,
                  'OK': feedback_staffOKK.length,
                  'BAD': feedback_staffBADD.length,
                  'POOR': feedback_staffPOORR.length
                }]
                var service = feedback_servicee[0].GREAT + feedback_servicee[0].GOOD + feedback_servicee[0].OK + feedback_servicee[0].BAD + feedback_servicee[0].POOR;
                var feedback_Service_review = (5 * feedback_servicee[0].GREAT + 4 * feedback_servicee[0].GOOD + 3 * feedback_servicee[0].OK + 2 * feedback_servicee[0].BAD + 1 * feedback_servicee[0].POOR) / service;
                var staff = feedback_stafff[0].GREAT + feedback_stafff[0].GOOD + feedback_stafff[0].OK + feedback_stafff[0].BAD + feedback_stafff[0].POOR;
                var feedback_Staff_review = (5 * feedback_stafff[0].GREAT + 4 * feedback_stafff[0].GOOD + 3 * feedback_stafff[0].OK + 2 * feedback_stafff[0].BAD + 1 * feedback_stafff[0].POOR) / staff;
                */orderTakenCount.push(results[i].orderTakenID)
                totals += parseInt(results[i].payment_total)
              }
            }
            map[tag.orderTakenID] = { "orderTakenCount": orderTakenCount.length,  "orderTakenBy": tag.manageBy, 'total': totals, "orderTakenID": tag.orderTakenID }
            return map // return callback
          }, {});
          // unique id's will be execute like loop which is ordertakenid will run one by one 
          //the ordertakenid will be return to tagmap function
          //then that tagMaps function will be perform some manipulations with that ordertakenid 
          var ordertakenBy_Info = ordertakenid.map(function(id) {
            return tagMaps[id] //pass id to another function
          });
          // Higher top number of times order taked sorting here
          var ordertakenBy_fulldata = ordertakenBy_Info.sort(function(a, b) {
            return parseFloat(a.orderTakenCount) - parseFloat(b.orderTakenCount);
          });

          //to store all calculate values 
          var dinein_total = dinein.length;
          var takeaway_total = takeaway.length;
          var doordelivery_total = doordelivery.length;
          var total_cash = parseInt(cash_summ + received_cashss) // total of cash
          var total_card = parseInt(card_summ + received_cardss) // total of card
          var orderedtotal_cash = parseInt(orderedcash_summ + orderedreceived_cashss) // total of cash
          var orderedtotal_card = parseInt(orderedcard_summ + orderedreceived_cardss) // total of card
          var total_payments = [{ 'posbill_fulldata': food_fulldata.reverse(), 'thirdparty_fulldata': thirdparty_fulldata, 'ordertakenBy_fulldata': ordertakenBy_fulldata, 'tax_cgst': tax_info_cgst == undefined ? 0 : tax_info_cgst, 'tax_sgst': tax_info_sgst == undefined ? 0 : tax_info_sgst, 'dinein_amount': dinein_amountss, 'takeaway_amount': takeaway_amountss, 'doordelivery_amount': doordelivery_amountss, 'Feedback_money': Feedback_money, 'Feedback_staff': Feedback_staff, 'Feedback_service': Feedback_service, 'Feedback_food': Feedback_food, 'total_posOrder': Pos_orderTotal, 'total_cash': total_cash, 'total_card': total_card, 'orderedtotal_cash': orderedtotal_cash, 'orderedtotal_card': orderedtotal_card, 'dinein_total': dinein_count.length, 'takeaway_total': takeaway_count.length, 'doordelivery_total': doordelivery_count.length, 'onlinePaymentTypeAmount': onlinePaymentTypesAmount }]
        }
        var feedback_empty = [{
          'GREAT': 0,
          'GOOD': 0,
          'OK': 0,
          'BAD': 0,
          'POOR': 0
        }]

        //send empty send to controller if table contains empty data
        var empty_payment = [{ 'posbill_fulldata': [], 'thirdparty_fulldata': [], 'ordertakenBy_fulldata': [{}], 'Feedback_money': feedback_empty, 'tax_cgst': 0, 'tax_sgst': 0, 'Feedback_staff': feedback_empty, 'Feedback_service': feedback_empty, 'Feedback_food': feedback_empty, 'total_posOrder': 0, 'total_cash': 0, 'dinein_amount': 0, 'takeaway_amount': 0, 'doordelivery_amount': 0, 'total_card': 0, 'orderedtotal_cash': 0, 'orderedtotal_card': 0, 'dinein_total': 0, 'takeaway_total': 0, 'doordelivery_total': 0, 'onlinePaymentTypeAmount': onlinePaymentTypesAmount }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });
    }
    /*-------------------

    User side analytics

    --------------------*/
    else {
      console.log('second')
      // req.params.date = '';
     if(req.params.month == 'month') {
      req.params.month = '';
      req.params.year = '';
      
     } else {
       req.params.date = '';
     }
     if(req.params.toDate != 'month') {
       // Period filter
      var sql ="SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) INNER JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id) WHERE (ordertime BETWEEN '" + req.params.date +  " 00:00:00' AND '" + req.params.toDate + "  23:59:59') && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'";
    } else {
      // Date and month filter
      var sql ="SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) INNER JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime)  LIKE '%" + req.params.date + "%' && (YEAR(ordertime) LIKE '%" + req.params.year + "%' and MONTH(ordertime) LIKE '%" + req.params.month + "%') && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'";
     }
     
      //user side analytics
      //db.executeQuery("SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) INNER JOIN sales_feedback ON (sales_feedback.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime)  LIKE '%" + req.params.date + "%' && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%' GROUP BY sales_order.salesorder_id", function(results) {
      db.executeQuery(sql, function(results) {
       // console.log(results);
       var duplicate_results = results;
     //  console.log(duplicate_results);
      var uniq = results.filter(function({salesorder_id}) {
        return !this[salesorder_id] && (this[salesorder_id] = salesorder_id)
      }, {})
      var results = uniq;

     // console.log(results);
  

        if (results.length != 0) {
          //filter only finished cash datas
          var cash_total = [];
          var cash = results.filter(function(item) {
            if (item.payment_mode == "cash" && item.status == 'finished') {
              cash_total.push(parseInt(item.payment_total))
              return item
            }
          })
          //filter only finished card datas
          var card_total = [];
          var card = results.filter(function(item) {
            if (item.payment_mode == "card" && item.status == 'finished') {
              card_total.push(parseInt(item.payment_total))
              return item
            }
          })
          //filter only orderd cash datas
          var orderedcash_total = [];
          var orderedcash = results.filter(function(item) {
            if (item.payment_mode == "cash" && item.status == 'ordered') {
              orderedcash_total.push(parseInt(item.payment_received))
              return item
            }
          })
          //filter only orderd  card datas
          var orderedcard_total = [];
          var orderedcard = results.filter(function(item) {
            if (item.payment_mode == "card" && item.status == 'ordered') {
              orderedcard_total.push(parseInt(item.payment_received))
              return item
            }
          })

          //filter only finished cash and online datas

          var received_cash = [];
          var received_card = [];
          var cash_card = results.filter(function(item) {
            if (item.payment_mode == "cash & card" && item.status == 'finished') {
              received_cash.push(item.payment_received)
              received_card.push(item.payment_transferred)
              return item
            }
          })

          //filter only orderd cash and online datas
          var orderedreceived_cash = [];
          var orderedreceived_card = [];
          var orderedcash_card = results.filter(function(item) {
            if (item.payment_mode == "cash & card" && item.status == 'ordered') {
              orderedreceived_cash.push(item.payment_received)
              orderedreceived_card.push(item.payment_transferred)
              return item
            }
          })
          //filter only sales_diet type datas for dinein
          var dinein_count = results.filter(function(item) {
            if (item.sales_dietType == "dinein") {
              return item
            }
          })
          //filter only sales_diet type datas for takeaway
          var takeaway_count = results.filter(function(item) {
            if (item.sales_dietType == "takeaway") {
              return item
            }
          })
          //filter only sales_diet type datas for doordlivery
          var doordelivery_count = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery") {
              return item
            }
          })

          //calculate sum of cashes
          if (cash_total.length > 0) {
            var cash_sum = cash_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (card_total.length > 0) {
            var card_sum = card_total.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (received_card.length > 0) {
            var received_cards = received_card.reduce(function(a, b) {
              return a + b;
            });
          }
          if (received_cash.length > 0) {
            var received_cashs = received_cash.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (orderedcash_total.length > 0) {
            var orderedcash_sum = orderedcash_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (orderedcard_total.length > 0) {
            var orderedcard_sum = orderedcard_total.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (orderedreceived_card.length > 0) {
            var orderedreceived_cards = orderedreceived_card.reduce(function(a, b) {
              return a + b;
            });
          }
          if (orderedreceived_cash.length > 0) {
            var orderedreceived_cashs = orderedreceived_cash.reduce(function(a, b) {
              return a + b;
            });
          }

          var dinein_amount = []; //get all dinein amount
          var takeaway_amount = []; //get all takeaway amount
          var doordelivery_amount = []; //get all doordelivery amount


          //filter only sales_diet type datas for dinein,takeaway,doordlivery
          var dinein = results.filter(function(item) {
            if (item.sales_dietType == "dinein"){
              dinein_amount.push(parseInt(item.payment_total))
              return item
           }
          })

          var takeaway = results.filter(function(item) {
            if (item.sales_dietType == "takeaway") {
              takeaway_amount.push(parseInt(item.payment_total))
            return item
            }
          })

          var doordelivery = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery") {
              doordelivery_amount.push(parseInt(item.payment_total))
            return item
            }
          })

          //filter only  tax_cgst datas
          var tax_cgst = [];
          results.filter(function(item) {
            tax_cgst.push(parseFloat(item.tax_rate))
            return item
          })
          //calculate sum of cashes
          if (tax_cgst.length > 0) {
            var tax_info_cgst = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only  tax_sgst datas
          var tax_sgst = []
          results.filter(function(item) {
            tax_sgst.push(parseFloat(item.tax_sgst))
            return item
          })
          //calculate sum of cashes
          if (tax_sgst.length > 0) {
            var tax_info_sgst = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }


          if (dinein_amount.length > 0) {
            var dinein_amounts = dinein_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          if (takeaway_amount.length > 0) {
            var takeaway_amounts = takeaway_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          if (doordelivery_amount.length > 0) {
            var doordelivery_amounts = doordelivery_amount.reduce(function(a, b) {
              return a + b;
            });
          }

          //filter only orderd sales_diet type datas for dinein,takeaway,doordlivery
          var dinein_Order = results.filter(function(item) {
            if (item.sales_dietType == "dinein" && item.status == 'ordered')
              return item
          })

          var takeaway_Order = results.filter(function(item) {
            if (item.sales_dietType == "takeaway" && item.status == 'ordered')
              return item
          })

          var doordelivery_Order = results.filter(function(item) {
            if (item.sales_dietType == "doordelivery" && item.status == 'ordered')
              return item
          });

          /*
          Online type amount calc */

          var onlinePaymentType0_amount = []; //get total of online payment type amount
          var onlinePaymentType1_amount = []; //get total of online payment type amount
          var onlinePaymentType2_amount = []; //get total of online payment type amount
          var onlinePaymentType3_amount = []; //get total of online payment type amount
          var onlinePaymentType4_amount = []; //get total of online payment type amount
          //filter only online types
          var onlineType0 = results.filter(function(item) {
            if (item.online_type == "0")
              onlinePaymentType0_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType0_amount.length > 0) {
            var onlinePaymentType0_amounts = onlinePaymentType0_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType1 = results.filter(function(item) {
            if (item.online_type == "1")
              onlinePaymentType1_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType1_amount.length > 0) {
            var onlinePaymentType1_amounts = onlinePaymentType1_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType2 = results.filter(function(item) {
            if (item.online_type == "2")
              onlinePaymentType2_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType2_amount.length > 0) {
            var onlinePaymentType2_amounts = onlinePaymentType2_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType3 = results.filter(function(item) {
            if (item.online_type == "3")
              onlinePaymentType3_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType3_amount.length > 0) {
            var onlinePaymentType3_amounts = onlinePaymentType3_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          //filter only online types
          var onlineType4 = results.filter(function(item) {
            if (item.online_type == "4")
              onlinePaymentType4_amount.push(parseInt(item.payment_total))
            return item
          })
          if (onlinePaymentType4_amount.length > 0) {
            var onlinePaymentType4_amounts = onlinePaymentType4_amount.reduce(function(a, b) {
              return a + b;
            });
          }
          var onlinePayment0 = !onlinePaymentType0_amounts ? 0 : onlinePaymentType0_amounts;
          var onlinePayment1 = !onlinePaymentType1_amounts ? 0 : onlinePaymentType1_amounts;
          var onlinePayment2 = !onlinePaymentType2_amounts ? 0 : onlinePaymentType2_amounts;
          var onlinePayment3 = !onlinePaymentType3_amounts ? 0 : onlinePaymentType3_amounts;
          var onlinePayment4 = !onlinePaymentType4_amounts ? 0 : onlinePaymentType4_amounts;

          var onlinePaymentTypesAmount = [{
            "names": onlinePayment0,
            "values": 0
          }, {
            "names": onlinePayment1,
            "values": 1
          }, {
            "names": onlinePayment2,
            "values": 2
          }, {
            "names": onlinePayment3,
            "values": 3
          }, {
            "names": onlinePayment4,
            "values": 4
          }]
          /*
          End online type amount calc */


          //assign data to variable
          var Pos_orderTotal = dinein_Order.length + takeaway_Order.length + doordelivery_Order.length;
          var cash_summ = cash_sum == undefined ? 0 : cash_sum;
          var card_summ = card_sum == undefined ? 0 : card_sum
          var orderedcash_summ = orderedcash_sum == undefined ? 0 : orderedcash_sum;
          var orderedcard_summ = orderedcard_sum == undefined ? 0 : orderedcard_sum
          var received_cashss = received_cashs == undefined ? 0 : received_cashs;
          var received_cardss = received_cards == undefined ? 0 : received_cards;
          var orderedreceived_cashss = orderedreceived_cashs == undefined ? 0 : orderedreceived_cashs;
          var orderedreceived_cardss = orderedreceived_cards == undefined ? 0 : orderedreceived_cards;
          var dinein_amountss = dinein_amounts == undefined ? 0 : dinein_amounts;
          var takeaway_amountss = takeaway_amounts == undefined ? 0 : takeaway_amounts;
          var doordelivery_amountss = doordelivery_amounts == undefined ? 0 : doordelivery_amounts;

          //get unique id  SELECT weekday(OrderDate) AS S from Orders WHERE "' + req.body.expense_bill_id + '"  '" + 0 + "'
          var food_ids = [] //&&  weekday(ordertime) BETWEEN " + weekday_start + " AND " + weekday_end + "
          duplicate_results.map(function(item) {
            if (food_ids.indexOf(item.fmItemID) === -1) {
              food_ids.push(item.fmItemID)

            }

          })
          // Make a map for get about the today  food ordered information
          //here map is a call back function.it will be do manipulated food details return  to store selectedNames
          var tagMap = duplicate_results.reduce(function(map, tag) {
            var total = 0;
            var count = []
            var sales_count = 0
            for (var i = 0; i < duplicate_results.length; i++) {
              if (duplicate_results[i].fmItemID == tag.fmItemID)
                total += parseInt(duplicate_results[i].payment_total)
            }
            for (var i = 0; i < duplicate_results.length; i++) {
              if (duplicate_results[i].fmItemID == tag.fmItemID)
                sales_count += parseInt(duplicate_results[i].sales_quantity)
            }
            duplicate_results.filter(function(item) {
              if (item.fmItemID == tag.fmItemID)
                count.push(item.fmItemID)

            })
            map[tag.fmItemID] = { "sales_items": tag.sales_items, 'staffID': tag.staffID, 'count': sales_count, 'fmItemID': tag.fmItemID, 'fmCatergoryID': tag.fmCatergoryID, 'total': total / count.length }
            return map // return callback
          }, {});

          // unique id's will be execute like loop which is food id will run one by one 
          //the food id will be return to tagmap function
          //then that tagmap function will be perform some manipulations with that fmitemid
          var selectedNames = food_ids.map(function(id) {
            return tagMap[id] //pass id to another function
          });

          //here sorting top saled foods
          var food_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.count) - parseFloat(b.count);
          });
          /*--------------
          Third party
          ---------------*/

          //get unique id
          var thirdparty_id = []
          results.map(function(item) {
            if (thirdparty_id.indexOf(item.thirdparty_id) === -1 && item.thirdparty_id != '') {
              thirdparty_id.push(item.thirdparty_id)
            }
          })
          // Make a map for get about the today  third party information
          //here map is a call back function.it will be do manipulated thirdparty details return  to store thirdparty
          var tagMapthirdparty = results.reduce(function(map, tag) {
            var total = 0;
            var count = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].thirdparty_id == tag.thirdparty_id)
                total += parseInt(results[i].payment_total)
            }
            results.filter(function(item) {
              if (item.thirdparty_id == tag.thirdparty_id)
                count.push(item.thirdparty_id)
            })
            map[tag.thirdparty_id] = { "thirdparty_name": tag.thirdparty_name, 'count': count.length, 'total': total }

            return map // return callback
          }, {});

          // unique id's will be execute like loop which is thirdparty_id will run one by one 
          //the thirdparty_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that thirdparty_id
          var thirdparty = thirdparty_id.map(function(id) {
            return tagMapthirdparty[id] //pass id to another function
          });

          //sorting top visited thirdpartys to top order
          var thirdparty_fulldata = thirdparty.sort(function(a, b) {
            return parseFloat(a.count) - parseFloat(b.count);
          });
          /*--------------
          Feedback
          ---------------*/

          //FEEDBACK SERVICE
          var feedback_serviceGREAT = []
          var feedback_serviceG00D = []
          var feedback_serviceOK = []
          var feedback_serviceBAD = []
          var feedback_servicePOOR = []

          //filter feedback data for its star rate value
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
          /*--------------
          Order taken
          ---------------*/

          var ordertakenid = []
          results.map(function(item) {
            if ((ordertakenid.indexOf(item.orderTakenID) === -1) && item.orderTakenID != null) {
              ordertakenid.push(item.orderTakenID)

            }
          })
          // Make a map for get about the today  order taken information
          //here map is a call back function.it will be do manipulated ordertaken details return  to store ordertakenBy_Info
          var tagMaps = results.reduce(function(map, tag) {
            var orderTakenCount = [];
           // var ordertakenfeedback = [];
            var totals = 0;
            for (var i = 0; i < results.length; i++) {
              if (results[i].orderTakenID == tag.orderTakenID) {
               /* ordertakenfeedback.push(results[i])
                var feedback_serviceGREATT = []
                var feedback_serviceG00DD = []
                var feedback_serviceOKK = []
                var feedback_serviceBADD = []
                var feedback_servicePOORR = []


                ordertakenfeedback.filter(function(item) {

                  if (item.feedback_service == 5) {
                    feedback_serviceGREATT.push(item.feedback_service)
                  } else if (item.feedback_service == 4) {
                    feedback_serviceG00DD.push(item.feedback_service)
                  } else if (item.feedback_service == 3) {
                    feedback_serviceOKK.push(item.feedback_service)
                  } else if (item.feedback_service == 2) {
                    feedback_serviceBADD.push(item.feedback_service)
                  } else if (item.feedback_service == 1) {
                    feedback_servicePOORR.push(item.feedback_service)
                  }

                })

                var feedback_servicee = [{
                  'GREAT': feedback_serviceGREATT.length,
                  'GOOD': feedback_serviceG00DD.length,
                  'OK': feedback_serviceOKK.length,
                  'BAD': feedback_serviceBADD.length,
                  'POOR': feedback_servicePOORR.length
                }]

                //FEEDBACK STAFF
                var feedback_staffGREATT = []
                var feedback_staffG00DD = []
                var feedback_staffOKK = []
                var feedback_staffBADD = []
                var feedback_staffPOORR = []

                ordertakenfeedback.filter(function(item) {
                  if (item.feedback_staff == 5) {
                    feedback_staffGREATT.push(item.feedback_staff)
                  } else if (item.feedback_staff == 4) {
                    feedback_staffG00DD.push(item.feedback_staff)
                  } else if (item.feedback_staff == 3) {
                    feedback_staffOKK.push(item.feedback_staff)
                  } else if (item.feedback_staff == 2) {
                    feedback_staffBADD.push(item.feedback_staff)
                  } else if (item.feedback_staff == 1) {
                    feedback_staffPOORR.push(item.feedback_staff)
                  }
                })
                var feedback_stafff = [{
                  'GREAT': feedback_staffGREATT.length,
                  'GOOD': feedback_staffG00DD.length,
                  'OK': feedback_staffOKK.length,
                  'BAD': feedback_staffBADD.length,
                  'POOR': feedback_staffPOORR.length
                }]
                var service = feedback_servicee[0].GREAT + feedback_servicee[0].GOOD + feedback_servicee[0].OK + feedback_servicee[0].BAD + feedback_servicee[0].POOR;
                var feedback_Service_review = (5 * feedback_servicee[0].GREAT + 4 * feedback_servicee[0].GOOD + 3 * feedback_servicee[0].OK + 2 * feedback_servicee[0].BAD + 1 * feedback_servicee[0].POOR) / service;

                var staff = feedback_stafff[0].GREAT + feedback_stafff[0].GOOD + feedback_stafff[0].OK + feedback_stafff[0].BAD + feedback_stafff[0].POOR;
                var feedback_Staff_review = (5 * feedback_stafff[0].GREAT + 4 * feedback_stafff[0].GOOD + 3 * feedback_stafff[0].OK + 2 * feedback_stafff[0].BAD + 1 * feedback_stafff[0].POOR) / staff;
               */ orderTakenCount.push(results[i].orderTakenID)
                totals += parseInt(results[i].payment_total)
              }
            }
            map[tag.orderTakenID] = { "orderTakenCount": orderTakenCount.length, "orderTakenBy": tag.manageBy, 'total': totals, "orderTakenID": tag.orderTakenID }
            return map // return callback
          }, {});

          // unique id's will be execute like loop which is ordertakenid will run one by one 
          //the ordertakenid will be return to tagmap function
          //then that tagMaps function will be perform some manipulations with that ordertakenid 
          var ordertakenBy_Info = ordertakenid.map(function(id) {
            return tagMaps[id] //pass id to another function
          });
          //sorting top order taken staffs
          var ordertakenBy_fulldata = ordertakenBy_Info.sort(function(a, b) {
            return parseFloat(a.orderTakenCount) - parseFloat(b.orderTakenCount);
          });
          //to store calculated values
          var dinein_total = dinein.length;
          var takeaway_total = takeaway.length;
          var doordelivery_total = doordelivery.length;
          var total_cash = parseInt(cash_summ + received_cashss) // total of cash
          var total_card = parseInt(card_summ + received_cardss) // total of card
          var orderedtotal_cash = parseInt(orderedcash_summ + orderedreceived_cashss) // total of cash
          var orderedtotal_card = parseInt(orderedcard_summ + orderedreceived_cardss) // total of card
          var total_payments = [{ 'posbill_fulldata': food_fulldata.reverse(), 'thirdparty_fulldata': thirdparty_fulldata, 'ordertakenBy_fulldata': ordertakenBy_fulldata, 'tax_cgst': tax_info_cgst == undefined ? 0 : tax_info_cgst, 'tax_sgst': tax_info_sgst == undefined ? 0 : tax_info_sgst, 'Feedback_money': Feedback_money, 'Feedback_staff': Feedback_staff, 'Feedback_service': Feedback_service, 'Feedback_food': Feedback_food, 'total_posOrder': Pos_orderTotal, 'total_cash': total_cash, 'total_card': total_card, 'orderedtotal_cash': orderedtotal_cash, 'orderedtotal_card': orderedtotal_card, 'dinein_amount': dinein_amountss, 'takeaway_amount': takeaway_amountss, 'doordelivery_amount': doordelivery_amountss, 'dinein_total': dinein_count.length, 'takeaway_total': takeaway_count.length, 'doordelivery_total': doordelivery_count.length, 'onlinePaymentTypeAmount': onlinePaymentTypesAmount }]
        }
        var feedback_empty = [{
          'GREAT': 0,
          'GOOD': 0,
          'OK': 0,
          'BAD': 0,
          'POOR': 0
        }]
        //send empty send to controller if table contains empty data
        var empty_payment = [{ 'posbill_fulldata': [], 'thirdparty_fulldata': [], 'ordertakenBy_fulldata': [{}], 'Feedback_money': feedback_empty, 'tax_cgst': 0, 'tax_sgst': 0, 'Feedback_staff': feedback_empty, 'Feedback_service': feedback_empty, 'Feedback_food': feedback_empty, 'total_posOrder': 0, 'total_cash': 0, 'total_card': 0, 'orderedtotal_cash': 0, 'orderedtotal_card': 0, 'dinein_total': 0, 'dinein_amount': 0, 'takeaway_amount': 0, 'doordelivery_amount': 0, 'takeaway_total': 0, 'doordelivery_total': 0, 'onlinePaymentTypeAmount': onlinePaymentTypesAmount }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });
    }
  });

   /*-------------------------------------------
   =============================================

    EXPENSE ANALYTICS

  ===============================================
    -------------------------------------------*/


  /*==========================================================================
                    General  expense_analytics
   ========================================================================== */

  //get expense analytics data from database for both admin and user
  app.get(apiUrl + '/expense_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'

    //if params data of staffID is admin means staffID will be empty which means it will fetch all the datas in db
    //console.log("staffID" + req.params.staffID)
    //console.log("date" + req.params.date)
    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    var request_data = req.params.date;

    if ((request_data == 'today' || request_data == 'LW' || request_data == 'LM' || request_data == '3MA' || request_data == '6MA')) {
      if (req.params.date == "LM") {
        var previous_time = 30;
      } else if (req.params.date == "today") {
        var previous_time = 0;
      } else if (req.params.date == "3MA") {
        var previous_time = 90;
      } else if (req.params.date == "6MA") {
        var previous_time = 180;
      } else if (req.params.date == "LW") {
        var previous_time = 7;
      }
      //admin side analytics
      db.executeQuery("SELECT *  FROM expense_bill INNER JOIN  expense_payment ON (expense_bill.expense_bill_id = expense_payment.expense_bill_id) WHERE DATE(paid_date) >= CURDATE() - INTERVAL " + previous_time + " DAY  && status='general' && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
        //console.log("exp")
       // console.log(results);
        if (results.length != 0) {
          //filter only  fully paid  datas 
          var paid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })


          //filter only  advance paid datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })


          //filter only  advance paid and unpaid datas
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })


          //filter only  paid cash datas
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })
          //filter only  paid card datas
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })

          //filter only  paid cheque datas
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })
          //filter only  paid online datas
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })

          //filter only  advance paid cash datas
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })
          //filter only  advance paid card datas
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })

          //filter only  advance paid cheque datas
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })
          //filter only  advance paid online datas
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate sum of cashes & cards
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate tax cgst value
          var tax_cgst = [];
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })
          //calculate tax sgst value
          var tax_sgst = [];
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of cashes
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //assign values to variables
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;
          /*---------------
          vendor 
          ---------------*/
          //get unique id 
          var vendor_ids = [];
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1 && item.vendor_id != '') {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = [];
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }
            var sum = data.reduce(function(a, b) {
              return a + b
            });
            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }
            return map //callback function
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sort top paid vendor for higner order
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });
           /*---------------
          catergory 
          ---------------*/

          //filter dupliacates
          var category_ids = []
          //filter duplicate ids
          results.map(function(item) {
            if (category_ids.indexOf(item.exCatergoryID) === -1) {
              category_ids.push(item.exCatergoryID)

            }
          })
          // Make a map for get about the today  expensecategory information
          //here map is a call back function.it will be do manipulated expensecategory details return  to store selectedCategories
          var tagMaps = results.reduce(function(map, tag) {
            var totals = 0;
            for (var i = 0; i < results.length; i++) {
              if (results[i].exCatergoryID == tag.exCatergoryID) {
                totals += parseInt(results[i].total_amount)
              }
            }
            map[tag.exCatergoryID] = { "x": tag.category_name, "y": totals, 'total': totals, "exCatergoryID": tag.exCatergoryID }
            return map // return callback
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedCategories = category_ids.map(function(id) {
            return tagMaps[id] //pass id to another function
          });

          //to sorting higher expense of category
          var category_fulldata = selectedCategories.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });

          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_categories': category_fulldata.slice(0, 10).reverse(), 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }
        var empty_payment = [{ 'total_results': [], 'taxCgst_info': 0, 'taxSgst_info': 0, 'total_categories': '', 'total_paid': 0, 'advance_paid': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    } else {
      /*---------------------------

      User side analytics 

      ----------------------------*/
      //user side analytics
      db.executeQuery("SELECT *  FROM expense_bill INNER JOIN  expense_payment ON (expense_bill.expense_bill_id = expense_payment.expense_bill_id) WHERE DATE(paid_date)  LIKE '%" + req.params.date + "%' && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
        if (results.length != 0) {
          //filter only  fully paid datas 
          var paid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })


          //filter only  advance paid datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })


          //filter only  advance paid and unpaid datas
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })


          //filter only  paid cash datas
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })

          //filter only  paid card datas
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })

          //filter only  paid cheque datas
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })

          //filter only  paid online datas
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })

          //filter only  advance paid cash datas
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })

          //filter only  advance paid card datas
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })

          //filter only  advance paid cheque datas
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })

          //filter only  advance paid online datas
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate tax cgst datas  
          var tax_cgst = [];
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })

          //calculate tax sgst datas  
          var tax_sgst = [];
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of cashes
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //assign values to variable
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;
           /*---------------
          vendor 
          ---------------*/
          //get unique id 
          var vendor_ids = []
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1 && item.vendor_id != '') {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }

            var sum = data.reduce(function(a, b) {
              return a + b
            });

            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }

            return map //callback function
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sort top paid vendor for higner order
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });
           /*---------------
          catergory 
          ---------------*/
          var category_ids = []
          //filter duplicate ids
          results.map(function(item) {
            if (category_ids.indexOf(item.exCatergoryID) === -1) {
              category_ids.push(item.exCatergoryID)

            }
          })
          // Make a map for get about the today  expensecategory information
          //here map is a call back function.it will be do manipulated expensecategory details return  to store selectedCategories
          var tagMaps = results.reduce(function(map, tag) {
            var totals = 0;
            for (var i = 0; i < results.length; i++) {
              if (results[i].exCatergoryID == tag.exCatergoryID) {
                totals += parseInt(results[i].total_amount)
              }
            }
            map[tag.exCatergoryID] = { "x": tag.category_name, "y": totals, 'total': totals, "exCatergoryID": tag.exCatergoryID }
            return map // return callback
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedCategories = category_ids.map(function(id) {
            return tagMaps[id] //pass id to another function
          });

          //to sorting higher expense of category
          var category_fulldata = selectedCategories.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });


          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_categories': category_fulldata.reverse().slice(0, 10), 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }

        //send empty data to controller when table has no data
        var empty_payment = [{ 'total_results': [], 'total_categories': '', 'total_paid': 0, 'taxCgst_info': 0, 'taxSgst_info': 0, 'advance_paid': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    }
  });


   /*-------------------------------------------
   =============================================

    INVENTORY ANALYTICS

  ===============================================
    -------------------------------------------*/

 //get inventory analytics data from database for both admin and user
  //it will get data from sales order table to update food and beverage items depending on day wise filter

  /*-----------------------

  Food and beverage items

  -------------------------*/
  app.get(apiUrl + '/inventory_analytics/:date/:weekday/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'

    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }

    if (req.params.date == "LY") {
      var previous_time = 360;
      var weekday_start = 0;
      var weekday_end = 6;
    } else if (req.params.date == "LM") {
      var previous_time = 30;
      weekday_start = 0;
      weekday_end = 6;
    } else if (req.params.date == "3MA") {
      var previous_time = 90;
      var weekday_start = 0;
      var weekday_end = 6;
    } else if (req.params.date == "6MA") {
      var previous_time = 180;
      var weekday_start = 0;
      var weekday_end = 6;
    } else if (req.params.date == "LW") {
      var previous_time = 7;
      var weekday_start = 0;
      var weekday_end = 6;
    }

    if (req.params.weekday == "Mon") {
      var weekday_start = 0;
      var weekday_end = 0;
    } else if (req.params.weekday == "Tue") {
      var weekday_start = 1;
      var weekday_end = 1;
    } else if (req.params.weekday == "Wed") {
      var weekday_start = 2;
      var weekday_end = 2;
    } else if (req.params.weekday == "Thu") {
      var weekday_start = 3;
      var weekday_end = 3;
    } else if (req.params.weekday == "Fri") {
      var weekday_start = 4;
      var weekday_end = 4;
    } else if (req.params.weekday == "Sat") {
      var weekday_start = 5;
      var weekday_end = 5;
    } else if (req.params.weekday == "Sun") {
      var weekday_start = 6;
      var weekday_end = 6;
    }

    db.executeQuery("SELECT *  FROM sales_order INNER JOIN  salesorder_item ON (sales_order.salesorder_id = salesorder_item.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime) >= CURDATE() - INTERVAL " + previous_time + " DAY &&  weekday(ordertime) BETWEEN " + weekday_start + " AND " + weekday_end + " && staffID LIKE '%" + staffIDs + "%'  && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {


      //get unique id  SELECT weekday(OrderDate) AS S from Orders WHERE "' + req.body.expense_bill_id + '"  '" + 0 + "'
      var food_ids = [] //&&  weekday(ordertime) BETWEEN " + weekday_start + " AND " + weekday_end + "
      results.map(function(item) {
        //filter duplicate ids for food
        if (food_ids.indexOf(item.fmItemID) === -1) {
          food_ids.push(item.fmItemID)
        }
      })
      // Make a map for get about the food information
      //here map is a call back function.it will be do manipulated food details return  to store selectedNames
      var tagMap = results.reduce(function(map, tag) {
        var total = 0;
        var count = []
        var countitem = 0;
        for (var i = 0; i < results.length; i++) {
          if (results[i].fmItemID == tag.fmItemID) {
            total += parseInt(results[i].item_subrate)
          }
        }
        results.filter(function(item) {
          if (item.fmItemID == tag.fmItemID) {
            count.push(item.fmItemID)
            countitem += parseInt(item.sales_quantity)
          }
        })
        map[tag.fmItemID] = { "sales_items": tag.sales_items, 'count': countitem, 'fmCatergoryID': tag.fmCatergoryID, 'total': total / count.length }

        return map // return callback
      }, {});

      // unique id's will be execute like loop which is food_ids will run one by one 
      //the food_ids will be return to tagmap function
      //then that tagMapthirdparty function will be perform some manipulations with that food_ids
      var selectedNames = food_ids.map(function(id) {
        return tagMap[id] //pass id to another function
      });

      //sorting higher ordered foods by total wise
      var food_fulldata = selectedNames.sort(function(a, b) {
        return parseFloat(a.total) - parseFloat(b.total);
      });
      return res.status(200).send(food_fulldata)
    });

  })
  //get inventory raw materialanalytics data from database for both admin and user
  //it will get data from sales order table to update food and beverage items depending on day wise filter
  /*-----------------------

  Raw Material items

  -------------------------*/
  app.get(apiUrl + '/rawmaterial_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'

    if (req.params.date == "LY") {
      var previous_time = 360;
    } else if (req.params.date == "LM") {
      var previous_time = 30;
    } else if (req.params.date == "3MA") {
      var previous_time = 90;
    } else if (req.params.date == "6MA") {
      var previous_time = 180;
    } else if (req.params.date == "LW") {
      var previous_time = 7;
    }

    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    db.executeQuery("SELECT purchase_items.rmname,purchase_items.rmItemID,purchase_items.item_subtotal,purchase_items.quantity,purchase_items.rmCatergoryID,purchase_order.created_on,expense_payment.total_amount as total_amount  FROM purchase_order INNER JOIN purchase_items  ON (purchase_order.purchase_order_id = purchase_items.purchase_order_id) INNER JOIN expense_payment ON (purchase_order.purchase_order_id = expense_payment.purchase_order_id) WHERE DATE(created_on) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
      //get unique id  
      var raw_ids = []
      //filter duplicate ids
      results.map(function(item) {
        if (raw_ids.indexOf(item.rmItemID) === -1) {
          raw_ids.push(item.rmItemID)
        }
      })

      /// Make a map for get about the raw material purchased information
      //here map is a call back function.it will be do manipulated raw material purchased details return  to store selectedNames
      var tagMap = results.reduce(function(map, tag) {
        var total = 0;
        var Qty = 0
        for (var i = 0; i < results.length; i++) {
          if (results[i].rmItemID == tag.rmItemID) {
            total += results[i].item_subtotal
            Qty += parseInt(results[i].quantity)
          }
        }
        map[tag.rmItemID] = { "rmname": tag.rmname, 'rmCatergoryID': tag.rmCatergoryID, 'total': total, 'Qty': Qty }
        return map // return callback
      }, {});

      // unique id's will be execute like loop which is raw_ids will run one by one 
      //the raw_ids will be return to tagmap function
      //then that tagMapthirdparty function will be perform some manipulations with that raw_ids
      var selectedNames = raw_ids.map(function(id) {
        return tagMap[id] //return id for another function
      });
      //sorting higher purchased items by total wise
      var raw_fulldata = selectedNames.sort(function(a, b) {
        return parseFloat(a.total) - parseFloat(b.total);
      });
      return res.status(200).send(raw_fulldata.reverse())
    });
  })
  /*-----------------------

  Sale Material items

  -------------------------*/

  //get sale material analytics data
  app.get(apiUrl + '/salematerial_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'

    if (req.params.date == "LY") {
      var previous_time = 360;
    } else if (req.params.date == "LM") {
      var previous_time = 30;
    } else if (req.params.date == "3MA") {
      var previous_time = 90;
    } else if (req.params.date == "6MA") {
      var previous_time = 180;
    } else if (req.params.date == "LW") {
      var previous_time = 7;
    } else if (req.params.date == "today") {
      var previous_time = 0;
    }


    //console.log(req.params.date);
    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    //get data admin and user side
    db.executeQuery("SELECT inventory_sales_order.created_on,inventory_sales_items.smname,inventory_sales_items.smItemID,inventory_sales_items.item_subtotal,inventory_sales_items.smCatergoryID,expense_payment.total_amount as total_amount,inventory_sales_items.quantity FROM inventory_sales_order INNER JOIN inventory_sales_items ON (inventory_sales_order.inventory_salesOrder_id = inventory_sales_items.inventory_salesOrder_id) INNER JOIN expense_payment ON (inventory_sales_order.inventory_salesOrder_id = expense_payment.inventory_salesOrder_id) WHERE DATE(created_on) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
      //get unique id  
      var raw_ids = []
      //filter duplicate ids
      results.map(function(item) {
        if (raw_ids.indexOf(item.smItemID) === -1) {
          raw_ids.push(item.smItemID)
        }
      })

      /// Make a map for get about the raw material purchased information
      //here map is a call back function.it will be do manipulated raw material purchased details return  to store selectedNames
      var tagMap = results.reduce(function(map, tag) {
        var total = 0;
        var Qty = 0
        for (var i = 0; i < results.length; i++) {
          if (results[i].smItemID == tag.smItemID) {
            total += results[i].item_subtotal
            Qty += parseInt(results[i].quantity)
          }
        }
        map[tag.smItemID] = { "smname": tag.smname, 'smCatergoryID': tag.smCatergoryID, 'total': total, 'Qty': Qty }
        return map // return callback
      }, {});

      // unique id's will be execute like loop which is raw_ids will run one by one 
      //the raw_ids will be return to tagmap function
      //then that tagMapthirdparty function will be perform some manipulations with that raw_ids
      var selectedNames = raw_ids.map(function(id) {
        return tagMap[id] //return id for another function
      });
      //sorting higher purchased items by total wise
      var raw_fulldata = selectedNames.sort(function(a, b) {
        return parseFloat(a.total) - parseFloat(b.total);
      });
      return res.status(200).send(raw_fulldata.reverse())
    });
  })

  /*-----------------------

 Purchase Raw Material payment

  -------------------------*/
  //get inventory purchase raw material expense analytic data
  app.get(apiUrl + '/purchaseexpense_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'
    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    var request_data = req.params.date;

    // Filter time and check permission
    if ((request_data == 'today' || request_data == 'LW' || request_data == 'LM' || request_data == '3MA' || request_data == '6MA') && req.params.staffID == "admin") {
      if (req.params.date == "LM") {
        var previous_time = 30;
      } else if (req.params.date == "today") {
        var previous_time = 0;
      } else if (req.params.date == "3MA") {
        var previous_time = 90;
      } else if (req.params.date == "6MA") {
        var previous_time = 180;
      } else if (req.params.date == "LW") {
        var previous_time = 7;
      }
      //get data in admin analytics 
      db.executeQuery("SELECT * FROM purchase_order INNER JOIN expense_payment ON purchase_order.purchase_order_id = expense_payment.purchase_order_id WHERE DATE(paid_date) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
        if (results.length != 0) {
          //filter only  cash datas 
          var paid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })


          //filter only  cash datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })


          //filter only  card datas
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })

          //filter only cgst datas
          var tax_cgst = [];
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })
          //get sgst datas
          var tax_sgst = [];
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of cashes
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }

          //get fully payment datas cash
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })
          //get fully payment datas card
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })
          //get fully payment datas cheque
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })
          //get fully payment datas onlineTranscation
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })

          //get advance payment datas cash
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })
          //get advance payment datas card
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })
          //get advance payment datas cheque
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })
          //get advance payment datas online
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate sum of cashes & cards
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cheque
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of online
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of paid_total
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //store calculated payemnts in variable
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;

          //get unique id 
          var vendor_ids = [];
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1) {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = [];
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }

            var sum = data.reduce(function(a, b) {
              return a + b
            });

            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }

            return map //callback function
          }, {});

          // unique id's will be execute like loop which is raw_ids will run one by one 
          //the raw_ids will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that raw_ids
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sorting higher expense by total wise
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });

          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }

        var empty_payment = [{ 'total_results': [], 'total_paid': 0, 'advance_paid': 0, 'taxCgst_info': 0, 'taxSgst_info': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    } else {
      /*---------------------------------------
      User side analytics
      --------------------------------------*/

      //get data in user analytics 
      db.executeQuery("SELECT *  FROM purchase_order INNER JOIN  expense_payment ON (purchase_order.purchase_order_id = expense_payment.purchase_order_id) WHERE DATE(created_on)  LIKE '%" + req.params.date + "%' && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
        if (results.length != 0) {
          //filter only fully datas 
          var paid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })

          //filter only advance payemnt  datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })

          //filter only advance payemnt and unpaid datas 
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })
          //get tax cgst data
          var tax_cgst = [];
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })
          //get tax sgst data
          var tax_sgst = [];
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of tax_cgst
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of tax_sgst
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }

          //get fully paymnent dats such cash
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })
          //get fully paymnent dats such card
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })
          //get fully paymnent dats such cheque
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })
          //get fully paymnent dats such online
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })

          //get advance paymnent dats such cash
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })
          //get advance paymnent dats such card
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })
          //get advance paymnent dats such cheque
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })
          //get advance paymnent dats such online
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate sum of cashes
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of  cards
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cheque
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of online
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }



          //calculate sum of paid_cash
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of paid_card
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of paid_cheque
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of paid_online
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }



          //calculate sum of paid_total
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //store calculated payemnts in variable
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;

          //get unique id 
          var vendor_ids = [];
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1) {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }

            var sum = data.reduce(function(a, b) {
              return a + b
            });

            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }

            return map //callback function
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sort top paid vendor for higner order
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });

          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }


        var empty_payment = [{ 'total_results': [], 'total_paid': 0, 'taxCgst_info': 0, 'taxSgst_info': 0, 'advance_paid': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    }
  });

  /*---------------------------------------

  Purchase sale material payment

  --------------------------------------*/
  //get inventory purchase sale material expense analytic data
  app.get(apiUrl + '/salesexpense_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'
    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    var request_data = req.params.date;


    if ((request_data == 'today' || request_data == 'LW' || request_data == 'LM' || request_data == '3MA' || request_data == '6MA') && req.params.staffID == "admin") {
      if (req.params.date == "LM") {
        var previous_time = 30;
      } else if (req.params.date == "today") {
        var previous_time = 0;
      } else if (req.params.date == "3MA") {
        var previous_time = 90;
      } else if (req.params.date == "6MA") {
        var previous_time = 180;
      } else if (req.params.date == "LW") {
        var previous_time = 7;
      }
      //get data from admin analtics
      db.executeQuery("SELECT * FROM inventory_sales_order INNER JOIN expense_payment ON inventory_sales_order.inventory_salesOrder_id = expense_payment.inventory_salesOrder_id WHERE DATE(paid_date) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
        if (results.length != 0) {

          //filter only  fully paid datas 
          var paid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })


          //filter only  advance paid datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })


          //filter only  advance paid and unpaid datas
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })


          //filter only fully payemnt for cash
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })
          //filter only fully payemnt for card
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })
          //filter only fully payemnt for cheque
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })
          //filter only fully payemnt for online
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })
          //get tax cgst data
          var tax_cgst = [];
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })
          //get tax sgst data
          var tax_sgst = [];
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of cashes
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //get advance payment of cash
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })
          //get advance payment of cash
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })
          //get advance payment of cheque
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })
          //get advance payment of online
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate sum of cashes 
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of  cards
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cheque
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of online
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }



          //calculate sum of paid_cash
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of paid_card
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of paid_cheque
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of paid_online
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }



          //calculate sum of paid_total
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //store calculated payments in variable
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;
          /*---------------
          vender
          ----------------*/
          //get unique id 
          var vendor_ids = []
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1) {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }

            var sum = data.reduce(function(a, b) {
              return a + b
            });

            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }

            return map //callback function
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sort top paid vendor for higner order
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });

          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }


        var empty_payment = [{ 'total_results': [], 'total_paid': 0, 'advance_paid': 0, 'taxCgst_info': 0, 'taxSgst_info': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    } else {
      /*--------------------
      User side analytics
      ----------------------*/

      //get data from user analtics
      db.executeQuery("SELECT *  FROM inventory_sales_order INNER JOIN  expense_payment ON (inventory_sales_order.inventory_salesOrder_id = expense_payment.inventory_salesOrder_id) WHERE DATE(created_on)  LIKE '%" + req.params.date + "%' && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {

        if (results.length != 0) {


          //filter only  fully paid datas 
          var paid_total = []
          results.filter(function(item) {
            if (item.payment_status == "fully paid") {
              paid_total.push(item.total_amount)
              return item
            }
          })
          //get tax cgst data
          var tax_cgst = []
          results.filter(function(item) {
            if (item.tax_cgst) {
              tax_cgst.push(parseInt(item.tax_cgst))
              return item
            }
          })
          //get tax sgst data
          var tax_sgst = []
          results.filter(function(item) {
            if (item.tax_sgst) {
              tax_sgst.push(parseInt(item.tax_sgst))
              return item
            }
          })
          //calculate sum of tax_cgst
          if (tax_cgst.length > 0) {
            var taxCgst_info = tax_cgst.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of tax_sgst
          if (tax_sgst.length > 0) {
            var taxSgst_info = tax_sgst.reduce(function(a, b) {
              return a + b;
            });
          }

          //filter only  advance paid datas 
          var advancepaid_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid") {
              advancepaid_total.push(item.received_amount)
              return item
            }
          })


          //filter only  advance paid and unpaid datas
          var balance_total = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
              balance_total.push(item.total_amount - item.received_amount)
              return item
            }
          })


          //filter paid cash for cash
          var paid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cash") {
              paid_cash.push(item.total_amount)
              return item
            }
          })
          //filter paid cash for card
          var paid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "card") {
              paid_card.push(item.total_amount)
              return item
            }
          })
          //filter paid cash for cheque
          var paid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "cheque") {
              paid_cheque.push(item.total_amount)
              return item
            }
          })
          //filter paid cash for online
          var paid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "fully paid" && item.payment_type == "onlineTranscation") {
              paid_online.push(item.total_amount)
              return item
            }
          })

          //filter advance cash
          var advancepaid_cash = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cash") {
              advancepaid_cash.push(item.received_amount)
              return item
            }
          })
          //filter advance card
          var advancepaid_card = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "card") {
              advancepaid_card.push(item.received_amount)
              return item
            }
          })
          //filter advance cheque
          var advancepaid_cheque = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "cheque") {
              advancepaid_cheque.push(item.received_amount)
              return item
            }
          })
          //filter advance  for online
          var advancepaid_online = [];
          results.filter(function(item) {
            if (item.payment_status == "advance paid" && item.payment_type == "onlineTranscation") {
              advancepaid_online.push(item.received_amount)
              return item
            }
          })

          //calculate sum of advancepaid_cash
          if (advancepaid_cash.length > 0) {
            var advancepaid_cashs = advancepaid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of advancepaid_card
          if (advancepaid_card.length > 0) {
            var advancepaid_cards = advancepaid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of advancepaid_cheque
          if (advancepaid_cheque.length > 0) {
            var advancepaid_cheques = advancepaid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of advancepaid_online
          if (advancepaid_online.length > 0) {
            var advancepaid_onlines = advancepaid_online.reduce(function(a, b) {
              return a + b;
            });
          }



          //calculate sum of cashes & cards
          if (paid_cash.length > 0) {
            var paid_cashs = paid_cash.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_card.length > 0) {
            var paid_cards = paid_card.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of cashes & cards
          if (paid_cheque.length > 0) {
            var paid_cheques = paid_cheque.reduce(function(a, b) {
              return a + b;
            });
          }
          //calculate sum of cashes & cards
          if (paid_online.length > 0) {
            var paid_onlines = paid_online.reduce(function(a, b) {
              return a + b;
            });
          }

          //calculate sum of paid_total
          if (paid_total.length > 0) {
            var paid_totals = paid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (advancepaid_total.length > 0) {
            var advancepaid_totals = advancepaid_total.reduce(function(a, b) {
              return a + b;
            });
          }
          if (balance_total.length > 0) {
            var balance_totals = balance_total.reduce(function(a, b) {
              return a + b;
            });
          }

          //store calculated payments in variable
          var total_paid = paid_totals == undefined ? 0 : paid_totals;
          var total_balance = balance_totals == undefined ? 0 : balance_totals;
          var advance_paid = advancepaid_totals == undefined ? 0 : advancepaid_totals;
          /*--------------
          Vendor
          ----------------*/

          //get unique id 
          var vendor_ids = [];
          //filter duplicate ids
          results.map(function(item) {
            if (vendor_ids.indexOf(item.vendor_id) === -1) {
              vendor_ids.push(item.vendor_id)

            }

          })
          // Make a map for get about the today  vendor information
          //here map is a call back function.it will be do manipulated vendor details return  to store selectedNames
          var tagMap = results.reduce(function(map, tag) {
            var total = 0;
            var data = []
            for (var i = 0; i < results.length; i++) {
              if (results[i].vendor_id == tag.vendor_id) {
                total += results[i].total_amount
              }
              data.push(results[i].total_amount)
            }

            var sum = data.reduce(function(a, b) {
              return a + b
            });

            map[tag.vendor_id] = { "vendor_name": tag.vendor_name, 'vendor_id': tag.vendor_id, 'total': total, 'total_percent': (total / sum) * 100 }

            return map //callback function
          }, {});

          // unique id's will be execute like loop which is vendor_id will run one by one 
          //the vendor_id will be return to tagmap function
          //then that tagMapthirdparty function will be perform some manipulations with that vendor_id
          var selectedNames = vendor_ids.map(function(id) {
            return tagMap[id] //return id to another function
          });
          //sort top paid vendor for higner order
          var expense_fulldata = selectedNames.sort(function(a, b) {
            return parseFloat(a.total) - parseFloat(b.total);
          });

          var total_payments = [{ 'total_results': expense_fulldata.reverse(), 'taxCgst_info': taxCgst_info == undefined ? 0 : taxCgst_info, 'taxSgst_info': taxSgst_info == undefined ? 0 : taxSgst_info, 'total_paid': total_paid, 'advance_paid': advance_paid, 'total_balance': total_balance, 'paid_cash': paid_cashs == undefined ? 0 : paid_cashs, 'paid_card': paid_cards == undefined ? 0 : paid_cards, 'paid_cheque': paid_cheques == undefined ? 0 : paid_cheques, 'paid_online': paid_onlines == undefined ? 0 : paid_onlines, 'advancepaid_cash': advancepaid_cashs == undefined ? 0 : advancepaid_cashs, 'advancepaid_card': advancepaid_cards == undefined ? 0 : advancepaid_cards, 'advancepaid_cheque': advancepaid_cheques == undefined ? 0 : advancepaid_cheques, 'advancepaid_online': advancepaid_onlines == undefined ? 0 : advancepaid_onlines }]

        }
        var empty_payment = [{ 'total_results': [], 'total_paid': 0, 'advance_paid': 0, 'taxCgst_info': 0, 'taxSgst_info': 0, 'total_balance': 0, 'paid_cash': 0, 'paid_card': 0, 'paid_cheque': 0, 'paid_online': 0, 'advancepaid_cash': 0, 'advancepaid_card': 0, 'advancepaid_cheque': 0, 'advancepaid_online': 0 }]
        return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
      });

    }
  });



   /*-------------------------------------------
   =============================================

    ODC ANALYTICS

  ===============================================
    -------------------------------------------*/

//get odc analytics datas branch wise
  app.get(apiUrl + '/odc_analytics_data/:date/:staffID/:branch_id', function(req, res) {

    var odccategory = req.params.odccategory;

    if (req.params.date == "LY") {
      var previous_time = 360;
    } else if (req.params.date == "today") {
      var previous_time = 0;
    } else if (req.params.date == "LM") {
      var previous_time = 30;
    } else if (req.params.date == "3MA") {
      var previous_time = 90;
    } else if (req.params.date == "6MA") {
      var previous_time = 180;
    } else if (req.params.date == "LW") {
      var previous_time = 7;
    }

    if (req.params.staffID == "admin") {
      var staffIDs = ''
    } else {
      var staffIDs = req.params.staffID;
    }
    //get data from admin analytics and user

    db.executeQuery("SELECT *  FROM sales_order INNER JOIN  odc_salesorderitem ON (sales_order.salesorder_id = odc_salesorderitem.salesorder_id)  INNER JOIN sales_payment ON (sales_payment.salesorder_id = sales_order.salesorder_id) WHERE DATE(ordertime) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {

      if (results.length != 0) {
        //filter only  all total payment datas 
        var paid_total = [];
        results.filter(function(item) {
          if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
            paid_total.push(parseInt(item.payment_total))
            return item
          }
        })

        //filter only  all total payment datas 
        var fullypaid_total = [];
        results.filter(function(item) {
          if (item.payment_status == "fully paid") {
            fullypaid_total.push(parseInt(item.payment_total))
            return item
          }
        });
        if (fullypaid_total.length > 0) {
          var fullypaid_totals = fullypaid_total.reduce(function(a, b) {
            return a + b
          });
        }

        //get finished events
        var finished_Events = []; //&& a.ordertime < new Date()
        results.filter(function(a) {
          if (new Date(a.odc_deliveryDate) < new Date()) {
            finished_Events.push(a)
          }
          return
        });
        //get upcoming events
        var upcoming_events = [];
        results.filter(function(a) {
          if (new Date(a.odc_deliveryDate) > new Date()) {
            upcoming_events.push(a)
          }
          return
        });

        //get TODAY events
        var today_events = [];
        results.filter(function(a) {
          if (new Date(a.odc_deliveryDate).toDateString() == new Date().toDateString()) {
            today_events.push(a)
          }
          return
        });
        //filter only  tax_cgst datas
        var tax_cgst = [];
        results.filter(function(item) {
          if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
            tax_cgst.push(parseInt(item.tax_rate))
            return item
          }
        })
        //calculate sum of tax_cgst
        if (tax_cgst.length > 0) {
          var tax_info_cgst = tax_cgst.reduce(function(a, b) {
            return a + b;
          });
        }
        //filter only  tax_sgst
        var tax_sgst = [];
        results.filter(function(item) {
          if (item.payment_status == "fully paid" || item.payment_status == "advance paid" || item.payment_status == "unpaid") {
            tax_sgst.push(parseInt(item.tax_sgst))
            return item
          }
        })
        //calculate sum of tax_sgst
        if (tax_sgst.length > 0) {
          var tax_info_sgst = tax_sgst.reduce(function(a, b) {
            return a + b;
          });
        }


        //filter only  received amountin advance
        var received_total = [];
        results.filter(function(item) {
          if (item.payment_status == "advance paid" || item.payment_status == "unpaid") {
            received_total.push(item.payment_received)
            return item
          }
        })

        if (received_total.length > 0) {
          var received_totals = received_total.reduce(function(a, b) {
            return a + b
          });
        }
        if (paid_total.length > 0) {
          var paid_totals = paid_total.reduce(function(a, b) {
            return a + b
          });
        }

        //get uniqueid
        var category_ids = [];
        //filter duplicate ids
        results.map(function(item) {
          if (category_ids.indexOf(item.odc_categoryID) === -1) {
            category_ids.push(item.odc_categoryID)

          }
        })
        var odc_details = results //store full datas of odc data
        // Make a map for get about the  odccategory information
        //here map is a call back function.it will be do manipulated odccategory details return  to store selectedNames
        var tagMap = odc_details.reduce(function(map, tag) {
          var total_category = [];
          for (var i = 0; i < odc_details.length; i++) {
            if (odc_details[i].odc_categoryID == tag.odc_categoryID)
              total_category.push(odc_details[i].odc_categoryID)
          }

          map[tag.odc_categoryID] = { "values": { "TW": total_category.length }, "odc_categoryID": tag.odc_categoryID }
          return map // return callback
        }, {});

        // unique id's will be execute like loop which is category_ids will run one by one 
        //the category_ids will be return to tagmap function
        //then that tagMapthirdparty function will be perform some manipulations with that category_ids
        var selectedNames = category_ids.map(function(id) {
          return tagMap[id] //pass id to another function
        });
        var received_totalss = (received_totals==undefined ? 0 : received_totals) + (fullypaid_totals==undefined ? 0 : fullypaid_totals);
       // console.log("fully"+ received_totalss);
        var total_payments = [{ 'selectedNames': selectedNames, 'today_events': today_events, 'tax_cgst': tax_info_cgst == undefined ? 0 : tax_info_cgst, 'tax_sgst': tax_info_sgst == undefined ? 0 : tax_info_sgst, 'received_totals': received_totalss, 'paid_totals': paid_totals == undefined ? 0 : paid_totals, 'finished_Events': finished_Events.length == 0 ? 0 : finished_Events.length, 'upcoming_events': upcoming_events.length == 0 ? 0 : upcoming_events.length }]
      }
      var empty_payment = [{ 'received_totals': 0, 'today_events': [], 'selectedNames': [{ "values": { "TW": 0 } }], 'paid_totals': 0, 'tax_cgst': 0, 'tax_sgst': 0, 'finished_Events': 0, 'upcoming_events': 0 }]

      return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);

    });

  });


    /*-------------------------------------------
   =============================================

    SMS ANALYTICS

  ===============================================
    -------------------------------------------*/

//get sms analytics data from campaign and campaign details table
     app.get(apiUrl + '/sms_analytics/:date/:staffID/:branch_id', function(req, res) { //WHERE DATE(timestamp) = '2012-05-05'
       if (req.params.staffID == "admin") {
         var staffIDs = ''
       } else {
         var staffIDs = req.params.staffID;
       }
       var request_data = req.params.date;


       if (request_data == 'today' || request_data == 'LW' || request_data == 'LM' || request_data == '3MA' || request_data == '6MA') {
         if (req.params.date == "LM") {
           var previous_time = 30;
         } else if (req.params.date == "today") {
           var previous_time = 0;
         } else if (req.params.date == "3MA") {
           var previous_time = 90;
         } else if (req.params.date == "6MA") {
           var previous_time = 180;
         } else if (req.params.date == "LW") {
           var previous_time = 7;
         }
         //get data from admin and user analtics
         db.executeQuery("SELECT * FROM campaign INNER JOIN campaigndetails ON campaign.campaignID = campaigndetails.campaignID WHERE DATE(createdOn) >= CURDATE() - INTERVAL " + previous_time + " DAY && staffID LIKE '%" + staffIDs + "%' && branch_id LIKE '%" + req.params.branch_id + "%'", function(results) {
           if (results.length != 0) {
             var DELIVERED = [] //get total delivery count
             var FAILED = [] //get total failed count
             var Submitted = [] //get total submitted count
             var totalcount = [] //get total submitted count
             results.map(function(item) {
               if (item.status == 'DELIVERED' && item.senderId != 'whatsapp') {
                 DELIVERED.push(item)
               };
               if (item.status == 'PENDING' && item.senderId != 'whatsapp') {
                 Submitted.push(item)
               };
               if (item.status == 'FAILED' && item.senderId != 'whatsapp') {
                 FAILED.push(item)
               };
               if(item.senderId != 'whatsapp') {
                  totalcount.push(item);
               }
             })
             //calculate all sms status
             var total = DELIVERED.length + FAILED.length + Submitted.length
             var total_payments = [{ 'total': total, 'totalcampaign': totalcount.length, 'DELIVERED': DELIVERED.length, 'PENDING': Submitted.length, 'FAILED': FAILED.length }]
           }
           var empty_payment = [{ 'total': 0, 'totalcampaign': 0, 'DELIVERED': 0, 'PENDING': 0, 'FAILED': 0 }]
           return res.status(200).send(total_payments == undefined ? empty_payment : total_payments);
         });

       }
     });


}
