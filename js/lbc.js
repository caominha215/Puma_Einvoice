	
var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
    var s = $scope;
		var h = $http;
		s.step = 'SCAN';
		s.error = '';
		s.receipt_header = null;
		s.receipt_detail = null;
		s.token = null;
		s.store_no = 1;
		s.server = "https://puma-einvoice.ngrok.app";
		s.filepath = "D:\\EInvoice\\EInvoice Front-end\\queries\\";
		s.workstation = "";
		s.init = function()
		{
			// var settings = {
                // "url": s.server +"/prism/api/auth/get-token",
                // "method": "POST",
                // "timeout": 0,
                // "headers": {
                  // "Content-Type": "application/json"
                // },
                // "data": JSON.stringify({"username":"admin","password":"1qaz@WSX"}),
              // };
			  // s.step = 'INPUT';
              /*
              $.ajax(settings).done(function (response) {
				s.token = response.accessToken;

				s.receipt_companyName = '';
				s.receipt_companyAddr = '';
				s.receipt_companyTaxCode = '';
				s.receipt_email = '';
			  });
			  */
			  
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get("id");
			const store_no = urlParams.get("store_no");
			if (id) {
				if(store_no == 3) 
				{
					s.server = "https://lotte-puma-einvoice.ngrok.app";
				}
				if(store_no == 2) 
				{
					s.server = "https://quang-trung-einvoice.ngrok.app";
				}
				s.reportFilters = [];
				s.receipt_sid = id
				s.reportFilters.push({filterName:"#INVC_SID",filterOperator:"=",filterValue:s.receipt_sid});
				s.reportFilters.push({filterName:"#STORE_NO",filterOperator:"=",filterValue:s.store_no});
			
					
				settings = {
					"url": s.server +"/prism/api/customer/get-invoice",
					"method": "POST",
					"timeout": 0,
					"headers": {
						"Content-Type": "application/json"
					},
					"data": JSON.stringify(
						{
							"billSid":s.receipt_sid
						}),
				};
				  
				  $.ajax(settings).done(function (response) {
					  if(response.datas.length > 0)
					  {
							if (response.datas[0].EINVOICE_NO) {
									setTimeout(function () {
										s.error = 'E-INVOICE ISSUED';
										s.$apply();
									}, 100);
							} else {
								setTimeout(function () {
										s.receipt_no = response.datas[0].RECEIPT_NO;
										s.receipt_store = response.datas[0].RECEIPT_STORE;
										s.receipt_datetime = response.datas[0].RECEIPT_DATETIME;
										s.receipt_amount = response.datas[0].RECEIPT_AMOUNT;
										s.einvoice_no = response.datas[0].EINVOICE_NO;
										s.invc_sid = response.datas[0].INVC_SID;
										s.customer = response.datas[0].CUSTOMER_NAME;
										s.ref_sale_sid = response.datas[0].REF_SALE_SID;
										s.step = 'INPUT';
										//when scan successfully, clear previous entered data
										s.receipt_companyName = '';
										s.receipt_companyAddr = '';
										s.receipt_companyTaxCode = '';
										s.receipt_email = '';
										s.$apply();
									}, 100);
								
							}
							
					  }
					  else
					  { 
						setTimeout(function () {
							s.error = 'NOT FOUND';
							s.$apply();
						}, 100);
					  }
				  }).fail(function (jqXHR, textStatus, errorThrown) { 
					  
					  setTimeout(function () {
							s.error = 'CONNECTION FAILED';
							s.$apply();
						}, 100);
				   });
				
				
			 

				
			} else {
				setTimeout(function () {
					s.error = 'NOT FOUND';
					s.$apply();
				}, 100);

				
			}

		};
		s.getVatInfo = function (){
					let taxCode = s.receipt_companyTaxCode;
                    let dataURI = `https://api.vietqr.io/v2/business/${taxCode}`;
                    
                    return $http({
                        method: 'GET',
                        url: dataURI,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(function (res) {
                        console.log(res);
                        
                        if ((!res) || res.data.code !== "00") {
                            alert(`Không tìm thấy thông tin mã số thuế ${taxCode}`);
                        } else {
							
							
                            // Extracting the relevant data from the response
                            let companyData = res.data.data;
							
							setTimeout(function () {
								s.receipt_companyName = companyData.name || '';
								s.receipt_companyAddr = companyData.address || '';
								s.$apply();
							}, 100);
                            
                            

                            // Debugging output
                            console.log("Company Name: " + $scope.taxInfo.companyName);
                            console.log("Address: " + $scope.taxInfo.address);
                            console.log("Tax Code: " + $scope.taxInfo.taxCode);
							
									
                        }
                    }, function (err) {
                        $LoadingScreen.Enable = false;
                        alert("Xảy ra lỗi trong quá trình kiểm tra thông tin mã số thuế. Xin vui lòng thử lại sau!");
                        console.log(err);
                        return null;
                    });
		}
		s.inputDone = function()
		{
			if(s.receipt_companyName==''||s.receipt_companyAddr==''||s.receipt_companyTaxCode==''||s.receipt_email=='')
			{
				var r = alert("Thông tin xuất hóa đơn chưa đầy đủ. Vui lòng điền thêm thông tin.");
				
			}
			else
				s.step = 'REVIEW';
			
		};
		
		s.reInput = function()
		{
		//	s.receipt_sid = "";
			s.step = 'INPUT';
		};
		s.issue = function()
		{
			s.issueing = 1;
			if (s.ref_sale_sid){
								
				settings = {
					"url": s.server+"/prism/api/customer/adj-einvoice",
					"method": "POST",
					"timeout": 0,
					"headers": {
					"Content-Type": "application/json"
					},
					"data": JSON.stringify(
						{
							"CompanyVatName": s.receipt_companyName,
							"CompanyVatCode": s.receipt_companyTaxCode,
							"CompanyVatAddress": s.receipt_companyAddr,
							"VatEmail": s.receipt_email,
							"Terminal": s.workstation,
							"BillSid":s.invc_sid
							
						}),
				};
			  
				$.ajax(settings)
				  .done(function (response) {
				    s.issueing = 0;
				
				    if (response.eInvoiceNo !== null) {
				      alert("Hóa đơn sẽ được gởi vào email quí khách vừa cung cấp. Xin cám ơn quí khách!\n\nThe invoice will be sent to the email you just provided. Thank you!");
				      s.step = 'SCAN';
				      s.receipt_sid = "";
				    } else {
				      alert("Hóa đơn xuất không thành công! Xin vui lòng liên hệ nhân viên để được hỗ trợ!\n\nInvoice issuance failed! Please contact staff for assistance.");
				    }
				
				    s.$apply();
				  })
				  .fail(function (jqXHR, textStatus, errorThrown) {
				    s.issueing = 0;
				    alert("Lỗi kết nối đến máy chủ! Vui lòng thử lại hoặc liên hệ hỗ trợ.");
				    console.error("AJAX Error:", textStatus, errorThrown);
				    s.$apply();
				  });

				
			} else {
					
				settings = {
					"url": s.server+"/prism/api/customer/create-einvoice",
					"method": "POST",
					"timeout": 0,
					"headers": {
					"Content-Type": "application/json"
					},
					"data": JSON.stringify(
						{
							"CompanyVatName": s.receipt_companyName,
							"CompanyVatCode": s.receipt_companyTaxCode,
							"CompanyVatAddress": s.receipt_companyAddr,
							"VatEmail": s.receipt_email,
							"Terminal": s.workstation,
							"BillSid":s.invc_sid
							
						}),
				};
			  
				$.ajax(settings)
					  .done(function (response) {
					    s.issueing = 0;
					
					    if (response.eInvoiceNo !== null) {
					      alert("Hóa đơn sẽ được gởi vào email quí khách vừa cung cấp. Xin cám ơn quí khách!\n\nThe invoice will be sent to the email you just provided. Thank you!");
					      s.step = 'SCAN';
					      s.receipt_sid = "";
					    } else {
					      alert("Hóa đơn xuất không thành công! Xin vui lòng liên hệ nhân viên để được hỗ trợ!\n\nInvoice issuance failed! Please contact staff for assistance.");
					    }
					
					    s.$apply();
					  })
					  .fail(function (jqXHR, textStatus, errorThrown) {
					    s.issueing = 0;
					    alert("Lỗi kết nối đến máy chủ! Vui lòng thử lại hoặc liên hệ hỗ trợ.");
					    console.error("AJAX Error:", textStatus, errorThrown);
					    s.$apply();
					  });

			}
			
			
		};
		
		
			
		$(document).ready(function(){
			$scope.init();
			$('#receipt_sid').bind('keypress', function(e) {
				$scope.$apply(function(){
				   
				   if(e.keyCode==13){
						s.reportFilters = [];
						s.reportFilters.push({filterName:"#INVC_SID",filterOperator:"=",filterValue:s.receipt_sid});
						s.reportFilters.push({filterName:"#STORE_NO",filterOperator:"=",filterValue:s.store_no});
						//get token
						settings = {
							"url": s.server +"/prism/api/auth/get-token",
							"method": "POST",
							"timeout": 0,
							"headers": {
							  "Content-Type": "application/json"
							},
							"data": JSON.stringify({"username":"admin","password":"1qaz@WSX"}),
						  };
						  
						  $.ajax(settings).done(function (response) {
							s.token = response.accessToken;
							
							settings = {
								"url": s.server +"/prism/api/GetPrismData/filter",
								"method": "POST",
								"timeout": 0,
								"headers": {
									"Authorization": "Bearer " + s.token,
									"Content-Type": "application/json"
								},
								"data": JSON.stringify(
									{
										"filepath":s.filepath+"EInvoice_searchSingleReceipt.txt",
										"folderpath": "string",
										"fileExtention":"string",
										"reportFilters":s.reportFilters
									}),
							};
						  
						  $.ajax(settings).done(function (response) {
							  if(response.datas[0].data.length > 0)
							  {
								  if(response.datas[0].data[0].HD.trim() !='' )
								  {
									s.error = 'E-INVOICE ISSUED';
								  }
								  else{
									s.receipt_no = response.datas[0].data[0].RECEIPT_NO;
									s.receipt_store = response.datas[0].data[0].RECEIPT_STORE;
									s.receipt_datetime = response.datas[0].data[0].RECEIPT_DATETIME;
									s.receipt_amount = response.datas[0].data[0].RECEIPT_AMOUNT;
									s.receipt_disc_amt = response.datas[0].data[0].DISC_AMT;
									s.receipt_disc_perc = response.datas[0].data[0].DISC_PERC;
									s.invc_sid = response.datas[0].data[0].INVC_SID;
									s.step = 'INPUT';
									
									//when scan successfully, clear previous entered data
									s.receipt_companyName = '';
									s.receipt_companyAddr = '';
									s.receipt_companyTaxCode = '';
									s.receipt_email = '';
								  }
								
							  }
							  else
							  {
								s.error = 'NOT FOUND';
							  }
						  });
						
						
						//  s.receipt_sid = "";
						s.$apply();
						
						setTimeout(function () {
							 $("#receipt_sid").blur();// Bỏ focus khỏi input
						}, 100);

						
					  }).fail(function (jqXHR, textStatus, errorThrown) { 
						  s.error = 'CONNECTION FAILED';
					   });
						
						
					}
				});
			
			});
		});
		
});





















