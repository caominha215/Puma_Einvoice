///<reference path="controller.js">
//service to initialize table based on dataSet array
//params:
/// pageId,
/// tableId,
/// dataSet as 2-dimension array returned by the server,
/// order as 2-dimension array
app.service("dataTableService",function(){
    this.newDataTable = function($scope, $http){
      $http.get("dataTable/"+$scope.pageId+"/"+$scope.tableId).then(function(response){
        $scope.dataSet = response.data.dataSet;
        $scope.table = $('#'+ $scope.tableId).DataTable({
          lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Tất cả"] ],
          data: $scope.dataSet,
          stateSave: true,
          pagingType: "full_numbers",
          order: $scope.order,
          scrollY: $scope.scrollY,
          scrollCollapse: true,
          scrollX: true,
          displayLength: $scope.displayLength,
          // createdRow: createdRow,
          dom: "<'row'<'col-md-4'l><'col-md-4'B><'col-md-4'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7'p>>",
            buttons: {
                buttons: [
                    'copy',
                    'csv',
                    'excel',
                    'pdf',
                    {
                        extend: 'print',
                        text: 'In'
                    },
                    {
                        extend: 'selectAll',
                        text: 'Chọn tất cả'
                    },
                    {
                        extend: 'selectNone',
                        text: 'Bỏ chọn tất cả'
                    }
                ],
                dom: {
                    button: {
                        tag: 'a',
                        className: 'btn btn-default btn-sm'
                    }
                }
            },
            select: {
                style: 'multi'
            },
          language: {
            "processing":   "Đang xử lý...",
            "lengthMenu":   "Xem _MENU_ mục",
            "zerorecords":  "Không tìm thấy dòng nào phù hợp",
            "info":         "Đang xem _START_ đến _END_ trong tổng số _TOTAL_ mục",
            "infoempty":    "Đang xem 0 đến 0 trong tổng số 0 mục",
            "infofiltered": "(Được lọc từ _MAX_ mục)",
            "infopostfix":  "",
            "search":       "Tìm:",
            "url":          "",
            "paginate": {
              "first":    "Đầu",
              "previous": "Trước",
              "next":     "Tiếp",
              "last":     "Cuối"
            },
            "decimal": ",",
            "thousands": ".",
            "emptyTable": "Không có dữ liệu",
            select: {
              rows: {
                _: "%d dòng được chọn",
                0: "Nhấp chuột vào dòng để chọn",
                1: "Chỉ có 1 dòng được chọn"
              }
            }
          }

        });//end of table creation
      });
    };//end of newDataTable service
    this.createRow = function(row, data, index){
      if(data[0] == 'name1'){
        $('td', row).eq(0).addClass('danger');
      }
    };
});
app.service("pageService", function(){
  this.query = function($scope, $http){
  };
  this.insert = function($scope, $http){
  };
  this.save = function($scope, $http){
  };
  this.delete = function($scope, $http){
  };

});
