var app = angular.module('comma', []);
app.controller("pageController", function($scope, $http){
});
app.controller("dataTableController", function($scope, $http, dataTableService){
  $scope.newTable = dataTableService.newDataTable($scope, $http);
  $scope.removeRow = function(){
    $scope.dataSet.splice(-1,1);
    $('#'+$scope.tableId).dataTable().draw();
  };
})
