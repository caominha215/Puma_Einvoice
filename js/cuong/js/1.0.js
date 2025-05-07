var app = angular.module('cmp', [
    'ngAnimate', 'ngTouch','ui.grid', 'ui.grid.edit', 'ui.grid.rowEdit', 'ui.grid.cellNav', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.pagination','ui.grid.autoResize',
    'ui.grid.validate', 'ui.grid.exporter', 'ui.grid.importer', 'ui.grid.pinning', 'ngFileUpload',, 'ui.grid.grouping' 
]);

//the following config ensure Laravel takes angularjs ajax request as ajax
app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);

app.controller('mainController', ['$scope','$http','pageService','uiGridExporterConstants', 'Upload',
    function ($scope, $http, pageService,  uiGridExporterConstants) {
    $scope.pageCode = document.getElementById('pageCode').value;
    //$scope.pageTitle  =  '<?php echo $pageTitle ; ?>';
    $scope.dataBox = {};
    //$scope.clickedBtnCode = 'SEARCH';
    $scope.searchTerms = {};
    $scope.buttonList = {'ALLOCATE':{},'SEARCH':{}, 'INSERT': {}, 'DELETE': {}, 'UPDATE': {}, 'TO PDF': {}, 'TO CSV': {}, 'IMPORT':{}, 'COMPUTE':{}, 'GENREPORT':{},
                                        'DOWNREPORT':{}, 'DOWNBILL':{}, 'VIEWBILL': {}, 'VIEWREPORT': {}, 'GENBILL': {}, 'MERGE': {}};
    $scope.isSearchSuccess = false;//used to judge whether search action is through SEARCH BUTTON or after insert(), update(), delete()

    //grid only available in mainController, grid object saves all the default settings for a grid

    $scope.modal = {'header':'', 'content':'', 'type':'', 'gridName':'', 'extraAction': ''};
    $scope.message = {'type':'', 'content':''};
    $scope.touchingGrid = '';//used for import data
    $scope.grid = {};
        //cms properties
        $scope.grid.editedRows = {};//all id and data change (oldValue, newValue) of data
        $scope.grid.selectedRows = [];//would be scanned over to judge whether to be sent to server
        $scope.grid.rowsToInsert = [];//used to send to server
        $scope.grid.rowsToUpdate = [];//used to send to server
        $scope.grid.rowsToMerge = [];//used to send to server
        $scope.grid.idsToDelete = [];//used to send to server
        $scope.grid.newRowCount = 0;//used to set those added rows selected
        $scope.grid.currentCell = null;

            //ui-grid properties
        $scope.grid.showGridFooter = true;
        $scope.grid.enableFiltering= true;
        $scope.grid.enableSorting = true;
        $scope.grid.enableCellEdit = false;
        $scope.grid.paginationPageSizes = [25,50,100,500];
        $scope.grid.enableCellEditOnFocus = true;
        $scope.grid.enableColumnMenus = false;
        $scope.grid.modifierKeysToMultiSelectCells = true;
        $scope.grid.editableCellTemplate = '<div><input type="INPUT_TYPE" style="height: 28px; margin: 1px; width: 99%" ui-grid-editor ng-model="MODEL_COL_FIELD"></div>' ;
    //$scope.grid.enableVerticalScrollbar = true;//add this option create misalign between column header and column content
        //$scope.grid.enableGridMenu = true,
        //$scope.grid.exporterMenuPdf = true,

	
        //$scope.grid.exporterLinkLabel = 'get your csv here',
        $scope.grid.enableGridMenu = true;
        $scope.grid.exporterMenuCsv = false;
        $scope.grid.exporterMenuPdf = false;
        $scope.grid.importerShowMenu = false;

        $scope.grid.exporterPdfDefaultStyle = {fontSize: 9},
        $scope.grid.exporterPdfTableStyle = {margin: [10, 30, 10, 30]},
        $scope.grid.exporterPdfTableHeaderStyle = {fontSize: 10, bold: true, italics: true, color: 'red'},
		
		$scope.grid.exporterPdfHeader= { text: "My Header", style: 'headerStyle' },
		$scope.grid.exporterPdfFooter= function ( currentPage, pageCount ) {
		  return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
		},
		$scope.grid.exporterPdfCustomFormatter= function ( docDefinition ) {
		  docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
		  docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
		  return docDefinition;
		},
		
        $scope.grid.exporterPdfOrientation = 'portrait',
        $scope.grid.exporterPdfPageSize = 'LETTER',
        $scope.grid.exporterCsvFilename = 'LBC-export.csv',
        $scope.grid.exporterPdfFilename = 'LBC-export.pdf',
		
		$scope.grid.exporterPdfMaxGridWidth= 500,
		$scope.grid.exporterCsvLinkElement= angular.element(document.querySelectorAll(".custom-csv-link-location")),
		$scope.grid.exporterExcelFilename= 'LBC-export.xlsx',
		$scope.grid.exporterExcelSheetName= 'Sheet1',
		
        $scope.grid.importerDataAddCallback = function( grid, newObjects ) {
            $scope[$scope.touchingGrid].newRowCount = newObjects.length;
            $scope[$scope.touchingGrid].data = newObjects.concat($scope[$scope.touchingGrid].data);
        }


        $scope.init = function(){
            return pageService.doInit($scope, $http);
        }
        //$scope.init();//execute init() to get initial data for the page, including data to display in controls

        $scope.search = function(statementName, isGrid){
            $scope.isSearchSuccess = true;
            if (isGrid === undefined || isGrid === null)
                isGrid = 1;//if search applied for grid, then selectedRows, editedRows etc. should be refreshed
            return pageService.doSearch($scope, $http, statementName, isGrid);
        }

        $scope.searchWithTime = function(gridName, isGrid){
            $scope.searchTerms.startTime = $('#startTimePicker').val();
            $scope.searchTerms.endTime = $('#endTimePicker').val();
            return $scope.search(gridName, isGrid);
        }

        $scope.delete = function(gridName, extraAction){
            if (extraAction === undefined || extraAction === null)
                extraAction = '';
            return pageService.doDelete($scope, $http, gridName, extraAction);
        }
        $scope.update = function(gridName, updateLatestModifier){
            if (updateLatestModifier === undefined || updateLatestModifier === null)
                updateLatestModifier =  1;
            return pageService.doUpdate($scope, $http, gridName, updateLatestModifier);
        }
        $scope.insert = function(gridName){
            return pageService.doInsert($scope, $http, gridName);
        }

        $scope.merge = function(gridName){
            return pageService.doMerge($scope, $http, gridName);
        }

        $scope.confirmModal = function (type, gridName, extraAction) {//when type = 'UPDATE', extraAction can be 1 or 0 represents if update the latestModifier
            if (extraAction === undefined || extraAction === null)
                extraAction = '';
            return pageService.confirmModal($scope, type, gridName, extraAction);
        }

        $scope.compute = function(gridName){
            return pageService.doCompute($scope, $http, gridName)
        }

        $scope.generateReport = function(gridName){
            return pageService.doGenerateReport($scope, $http, gridName)
        }
        $scope.generateBill = function(gridName){
            return pageService.doGenerateBill($scope, $http, gridName)
        }
        //download form
        $scope.downloadReport = function(gridName){
            return pageService.doDownloadReport($scope, $http, gridName)
        }

        $scope.downloadBill = function(gridName){
            return pageService.doDownloadBill($scope, $http, gridName)
        }

        $scope.viewReport = function(gridName){
            return pageService.doViewReport($scope, $http, gridName)
        }

        $scope.viewBill = function(gridName){
            return pageService.doViewBill($scope, $http, gridName)
        }

        //data of grid which name is gridName only available on $rootScope
        $scope.copy = function(gridName){
            return pageService.doCopy($scope, gridName);
        }

        $scope.toPdf	 = function(gridName){
            //return uiGridExporterService.pdfExport($scope[gridName].gridApi.grid, uiGridExporterConstants.VISIBLE, uiGridExporterConstants.VISIBLE);
            if($scope.buttonList['TO PDF'][gridName] == true)
                $scope[gridName].gridApi.exporter.pdfExport(uiGridExporterConstants.VISIBLE, uiGridExporterConstants.VISIBLE);
            else{
                $scope.message = {
                    type : 'danger',
                    content: "You're illegally using this function."
                };
                $('#infoPanel').show();
            }
        }//end of toPdf

        $scope.toCSV = function(gridName){
            if($scope.buttonList['TO CSV'][gridName] == true)
                $scope[gridName].gridApi.exporter.csvExport(uiGridExporterConstants.VISIBLE, uiGridExporterConstants.VISIBLE);
            else{
                $scope.message = {
                    type : 'danger',
                    content: "You're illegally using this function."
                };
                $('#infoPanel').show();
            }
        }//end of toCSV

        $scope.import = function(gridName){
            if($scope.buttonList['IMPORT'][gridName] == true){
                $scope.touchingGrid = gridName;
                var handleFileSelect = function( event ){
                    $('#importModal').modal('hide');
                    var target = event.srcElement || event.target;

                    if (target && target.files && target.files.length === 1) {
                        var fileObject = target.files[0];
                        $scope[$scope.touchingGrid].gridApi.importer.importFile( fileObject );
                        target.form.reset();
                    }
                };
                var fileChooser = document.querySelectorAll('.import-file-chooser');

                if ( fileChooser.length !== 1 ){
                    console.log('Found > 1 or < 1 file choosers within the menu item, error, cannot continue');
                } else {
                    fileChooser[0].addEventListener('change', handleFileSelect, false);  // TODO: why the false on the end
                }
                $('#importModal').modal();
            }
            else{
                $scope.message = {
                    type : 'danger',
                    content: "You're illegally using this function."
                };
                $('#infoPanel').show();
            }

        }//end of import

            /**
             *
             * @param gridname
             * @param hasAdd to indicates if  it has '+' button
             * @returns {string}
             */
        $scope.gridFooter = function(gridname, hasAdd){
            var html =
            '<div class="pull-left "  style="padding-left: 10px"> Selected Items: {{grid.appScope.'+gridname+'.selectedRows.length}} </div>'+
            '<div class="pull-right" style="margin-right: 10px" ng-show="'+hasAdd+'">'+
            '<a title= "Add row" style="cursor: pointer;" ng-click="grid.appScope.copy(&apos;'+gridname+'&apos;)">' +
            '<span class="glyphicon glyphicon-plus"></span></a></div>';
            return html;
        }//end of gridFooter

        $scope.gridRowToColumn = function(gridName, groupFields, rowField, columnField, decimal){
            return pageService.gridRowToColumn($scope, gridName, groupFields, rowField, columnField, decimal);
        }//end of gridRowToColumn

        /**
         *
         * @param fieldName
         * @param dateTimeFormat ; e.g: yyyy-mm-dd hh:ii:ss
         * @returns {string}
         *
         */
        $scope.dateTimeCellEditing = function(fieldName, dateTimeFormat){
            var html= '<input ui-grid-dateTimeEditor style="height: 25px; margin: 1px" class="dateTimeCellEditing"  ng-model="row.entity.'+fieldName+'" data-date-format="'+dateTimeFormat+'"/>';
            return html;
        }//end of dateTimeCellEditing
        $scope.dateCellEditing = function(fieldName, dateFormat){
            var html= '<input ui-grid-dateEditor style="height: 25px; margin: 1px" class="dateCellEditing"  ng-model="row.entity.'+fieldName+'" data-date-format="'+dateFormat+'"/>'
                ;
            return html;
        }//end of dateCellEditing

        $scope.fileUploadCellEditing = function(uploadType, gridName, acceptFileType){
            if (uploadType === undefined || uploadType === null)
                uploadType =  'template';
            if (acceptFileType === undefined || acceptFileType === null)
                acceptFileType =  '.xls, .xlsx';
            if (gridName === undefined || gridName === null)
                gridName = 'grid1';
            var html= '<input ui-grid-fileUploadEditor type="file" accept="'+acceptFileType+'" ngf-select="upload($file, &apos;'+uploadType+'&apos;, &apos;'+gridName+'&apos;)" />'
            return html;
        }//end of fileUploadCellEditing

        /**
         *
         * @param fieldName
         * @param trueValue, eg: 1
         * @param falseValue, eg: 0
         */
        $scope.checkboxCell = function (fieldName, trueValue, falseValue){
            var html = '<div class="text-center"><input type="checkbox" disabled ng-model="row.entity.'
                +fieldName+'" ng-true-value="'+trueValue+'" ng-false-value="'+falseValue+'"></div>';
            return html;
        }//end of checkboxCell

        /**
         *
         * @param fieldName
         * @param trueValue, eg: 1
         * @param falseValue, eg: 0
         */
        $scope.checkboxCellEditing = function (fieldName, trueValue, falseValue){
            var html = '<div class="text-center"><input ui-grid-editor type="checkbox"  ng-model="row.entity.'
                +fieldName+'" ng-true-value="'+trueValue+'" ng-false-value="'+falseValue+'"></div>';
            return html;
        }//end of checkboxCell

        /**
         *
         * @param fieldName
         * @param dataArray
         * @param name
         * @param value
         * @param hasEmptyOption
         * @param filterValue
         * @returns {string}
         */
        $scope.dropdownCellEditing = function(fieldName, dataArray, name, value, hasEmptyOption, filterValue){
            if (hasEmptyOption === undefined || hasEmptyOption === null)
                hasEmptyOption =  false;
            if (filterValue === undefined || filterValue === null)
                filterValue =  false;
            var html = '<select ui-grid-edit-dropdown style="height: 25px; margin: 1px" ng-model="row.entity.'+fieldName+'">';
            if(hasEmptyOption)
                html = html + '<option></option>';
            html = html + '<option ng-repeat="item in '+dataArray;
            if(filterValue)
                html = html + ' | filter : ' + filterValue;
            html = html + '"  value="{{ item[&apos;'+value+'&apos;] }}">{{item[&apos;'+name+'&apos;]}}</option></select>';
            return html;
        }//end of dropdownCellEditing

        $scope.typeaheadCellEditing = function(gridName, dataArray, returnAttribute, displayAttributes, filterAttributes, widthArray){
            if (filterAttributes === undefined || filterAttributes === null)
                filterAttributes = '';
            if (widthArray === undefined || widthArray === null)
                widthArray =  '';
            var html = '<div><input  ui-grid-typeaheadEditor  ';
            if(filterAttributes != ''){
                filterAttributes = filterAttributes.toString().split(':');//filterAttribute is array now, so in typeaheadInit it is automaticlly converted to  string
                html = html + 'filterValue="';
                for(var i = 0; i< filterAttributes.length; i++){
                    html = html + '{{row.entity.'+filterAttributes[i].toString().trim()+'}}';
                    if(i< filterAttributes.length - 1)
                        html = html + ',';
                }
                html = html + '"';
            }
                //html = html + 'filterValue="{{row.entity.'+filterAttribute+'}}"';
            html = html + ' type="text" class="typeaheadCellEditing" style="height: 25px; margin: 2px; width: 99%" ' +
                'ng-model="MODEL_COL_FIELD" ng-focus="enterSearch()" ng-mouseover="grid.appScope.typeaheadInit(&apos;'+
                gridName+'&apos;,'+dataArray+',&apos;'+returnAttribute+ '&apos;,&apos;'+
                displayAttributes+'&apos;,&apos;'+filterAttributes+'&apos;,&apos;'+widthArray+'&apos;)" /></div>';
            return html;
        }
        $scope.typeaheadInit = function(gridName, dataArray, returnAttribute, displayAttributes, filterAttributes, widthArray, elementClass){
            if (elementClass === undefined || elementClass === null)
                elementClass = 'typeaheadCellEditing';
            if (gridName === undefined || gridName === null)
                gridName = '';
            if (filterAttributes === undefined || filterAttributes === null)
                filterAttributes = '';
            if (widthArray === undefined || widthArray === null)
                widthArray =  '';
            var returnJson = {};
            var mapToDataArray = {};
            var displayLabels = [];
            var label = '';
            var filterValues = $("."+elementClass).attr("filterValue");
            if(filterValues){
                if(filterValues.toString().trim() !='')
                    filterValues = filterValues.toString().split(',');
                if(filterAttributes.toString().trim() !='')
                    filterAttributes = filterAttributes.toString().split(',');
            }

            displayAttributes = displayAttributes.toString().split(":");
            widthArray = widthArray.toString().split(":");
            $( "."+elementClass ).typeahead({
                source: function(query, process){
                    displayLabels = [];
                    for(var i =0; i< dataArray.length; i++){
                        if(filterValues){
                            var matchNumber = 0;
                            for(var index = 0; index < filterAttributes.length; index++){
                                if( filterValues[index].toString().trim() != ''){
                                    if(dataArray[i][filterAttributes[index]] == filterValues[index])
                                        matchNumber++;
                                }
                                else
                                    matchNumber++;
                            }
                            if (matchNumber == filterAttributes.length){
                                label = '';
                                for(var j =0; j< displayAttributes.length; j++){
                                    label = label + dataArray[i][displayAttributes[j]] ;
                                    if(j < displayAttributes.length -1)
                                        label = label + ' | ';
                                }

                                displayLabels.push(label );
                                returnJson[label] = dataArray[i][returnAttribute];
                                mapToDataArray[label] = dataArray[i];
                            }

                        }
                        else if(filterAttributes == ''){
                            label = '';
                            for(var j =0; j< displayAttributes.length; j++){
                                label = label + dataArray[i][displayAttributes[j]] ;
                                if(j < displayAttributes.length -1)
                                    label = label + '  |  ';
                            }

                            displayLabels.push(label );
                            returnJson[label] = dataArray[i][returnAttribute];
                            mapToDataArray[label] = dataArray[i];
                        }
                    }
                    process( displayLabels );
                },
                updater: function (item) {//item is the selected label
                    if(gridName != ''){
                        var currentRowEntity = $scope[gridName].currentCell.row.entity;
                        var itemInDataArray = mapToDataArray[item];
                        var colDefs = $scope[gridName].columnDefs;//colDef as an array
                        for(i = 0; i<colDefs.length; i++){
                            var colDef = colDefs[i];//colDef as json
                            if(itemInDataArray[colDef['field']] && colDef['field'] != 'id')
                                $scope[gridName].data[$scope[gridName].data.indexOf(currentRowEntity)][colDef['field']] = itemInDataArray[colDef['field']];
                        }
                    }
                    return returnJson[item];
                },highlighter: function(item){
                    var p = mapToDataArray[item];
                    var itm =  '<table><tr>';
                    for(var i =0 ; i< displayAttributes.length; i++){
                        if(returnAttribute == displayAttributes[i]){
                            if(i < widthArray.length){
                                itm = itm +'<td class="cmp-typeahead-hint" style="width:'+widthArray[i]+'px"><strong>'+ p[displayAttributes[i]] +'</strong></td>';
                            }else{
                                itm = itm +'<td class="cmp-typeahead-hint" style="width:150px"><strong>'+ p[displayAttributes[i]] +'</strong></td>';
                            }
                        }

                        else{
                            if(i < widthArray.length){
                                itm = itm +'<td class="cmp-typeahead-hint" style="width:'+widthArray[i]+'px">'+ p[displayAttributes[i]] +'</td>';
                            }else{
                                itm = itm +'<td class="cmp-typeahead-hint" style="width:150px">'+ p[displayAttributes[i]] +'</td>';
                            }
                        }
                    }
                    itm  = itm + "</tr></table>";
                    return itm;
                },
                showHintOnFocus: true,
                minLength: 0,
                autoSelect: true
            });
        };

        $scope.setDefaultValueCell = function(fieldName, value){
            var html = '<div ng-init="row.entity.'+fieldName+'= row.entity.'+fieldName+'||\''+value+'\'">{{row.entity.'+fieldName+'}}</div>';
            return html;
        }

		
			
    //$scope.grid.onRegisterApi = function( gridApi ) {
    $scope.onRegisterApi = function( gridName ) {
        $scope[gridName].onRegisterApi = function(gridApi){
            $scope[gridName].gridApi = gridApi;
			
			
            //save the id of edited row to editedRows array
            gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
				if(colDef.name == 'revTypeId')
				{
					var newRevType = null;
					for(var i = 0; i< $scope.dataBox.revType.length; i++)
						if($scope.dataBox.revType[i].id == newValue)
							newRevType = $scope.dataBox.revType[i];
					rowEntity.unitPrice = newRevType.unitPrice;
					rowEntity.costUSD = newRevType.cogsUSD;
					rowEntity.rate = newRevType.rate;
					rowEntity.revenue = rowEntity.unitPrice*rowEntity.revTypeQty;
					if(rowEntity.rate > 0 && rowEntity.costUSD > 0)
						rowEntity.cost = rowEntity.costUSD*rowEntity.rate*rowEntity.revTypeQty;
				}
				else if(colDef.name == 'unitPrice' || colDef.name == 'revTypeQty')
				{
					rowEntity.revenue = rowEntity.unitPrice*rowEntity.revTypeQty;
					rowEntity.originalPrice = rowEntity.unitPrice*rowEntity.revTypeQty;
				}
                if(colDef.name == 'increment') rowEntity.finalValue = Number(rowEntity.computedValue) + Number(rowEntity.increment);//display on page ONLY
                if(colDef.name == 'finalValue') rowEntity.increment = Number(rowEntity.finalValue) - Number(rowEntity.computedValue);//display on page ONLY
                if((newValue != oldValue) && (rowEntity.id)){//if a row is just inserted, its id is blank; if its content is modified, its data should NOT push to editedRows
                    //check if the rowId not exist in the array
                    if($scope[gridName].editedRows.hasOwnProperty(rowEntity.id) ){//row id existed
                        if($scope[gridName].editedRows[rowEntity.id].hasOwnProperty(colDef.name)){//col name existed
                            $scope[gridName].editedRows[rowEntity.id][colDef.name].newValue = newValue; //update newValue only
                            //if data of the increment column changed, data of finalValue changed to
                            if(colDef.name == 'increment'){
                                if($scope[gridName].editedRows[rowEntity.id].hasOwnProperty('finalValue')){
                                    $scope[gridName].editedRows[rowEntity.id]['finalValue'].newValue = rowEntity.finalValue;
                                }
                                else{
                                    $scope[gridName].editedRows[rowEntity.id]['finalValue'] =
                                    {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.finalValue };
                                }
                            }
                            else  if(colDef.name == 'finalValue'){//if data of the finalValue column changed, data of increment changed to
                                if($scope[gridName].editedRows[rowEntity.id].hasOwnProperty('increment')){
                                    $scope[gridName].editedRows[rowEntity.id]['increment'].newValue = rowEntity.increment;
                                }
                                else{
                                    $scope[gridName].editedRows[rowEntity.id]['increment'] =
                                    {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.increment };
                                }
                            }
                            //auto select
                            //$scope[gridName].gridApi.selection.selectRowByVisibleIndex(rowEntity.rowIndex-1 + $scope[gridName].newRowCount);// + $scope[gridName].newRowCount because user may copy rows and edit some others
                            $scope[gridName].gridApi.selection.selectRow($scope[gridName].data[rowEntity.rowIndex-1 + $scope[gridName].newRowCount]);
                        }
                        else{//row id exists AND col name does not exist
                            $scope[gridName].editedRows[rowEntity.id][colDef.name] = {'oldValue': oldValue, 'newValue': newValue};//append new item to row record
                            //if data of the increment column changed, data of finalValue changed to
                            if(colDef.name == 'increment'){
                                if($scope[gridName].editedRows[rowEntity.id].hasOwnProperty('finalValue')){
                                    $scope[gridName].editedRows[rowEntity.id]['finalValue'].newValue = rowEntity.finalValue;
                                }
                                else{
                                    $scope[gridName].editedRows[rowEntity.id]['finalValue'] =
                                    {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.finalValue };
                                }
                            }
                            else  if(colDef.name == 'finalValue'){//if data of the finalValue column changed, data of increment changed to
                                if($scope[gridName].editedRows[rowEntity.id].hasOwnProperty('increment')){
                                    $scope[gridName].editedRows[rowEntity.id]['increment'].newValue = rowEntity.increment;
                                }
                                else{
                                    $scope[gridName].editedRows[rowEntity.id]['increment'] =
                                    {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.increment };
                                }
                            }
                            //auto select
                            //$scope[gridName].gridApi.selection.selectRowByVisibleIndex(rowEntity.rowIndex-1 + $scope[gridName].newRowCount);// + $scope[gridName].newRowCount because user may copy rows and edit some others
                            $scope[gridName].gridApi.selection.selectRow($scope[gridName].data[rowEntity.rowIndex-1 + $scope[gridName].newRowCount]);
                        }
                    }
                    else{
                        var row = {};
                        row[colDef.name] = {'oldValue': oldValue, 'newValue': newValue};
                        $scope[gridName].editedRows[rowEntity.id] = row;
                        //if data of the increment column changed, data of finalValue changed to
                        if(colDef.name == 'increment'){
                            $scope[gridName].editedRows[rowEntity.id]['finalValue'] =
                            {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.finalValue };
                        }
                        else if(colDef.name == 'finalValue'){
                            $scope[gridName].editedRows[rowEntity.id]['increment'] =
                            {'oldValue':rowEntity.finalValue , 'newValue':rowEntity.increment};
                        }
                        //auto select
                        //$scope[gridName].gridApi.selection.selectRowByVisibleIndex(rowEntity.rowIndex-1 + $scope[gridName].newRowCount);// + $scope[gridName].newRowCount because user may copy rows and edit some others
                        $scope[gridName].gridApi.selection.selectRow($scope[gridName].data[rowEntity.rowIndex-1 + $scope[gridName].newRowCount]);
                    }
                }
                $scope.$apply();
            });//end of afterCellEdit

            gridApi.selection.on.rowSelectionChanged($scope,function(row){
                $scope[gridName].selectedRows = gridApi.selection.getSelectedRows();
                if($scope[gridName].selectedRows.length == 0)
                    $scope[gridName].newRowCount = 0;
            });//end of rowSelectionChanged

            gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
                $scope[gridName].selectedRows = gridApi.selection.getSelectedRows();
                //if($scope[gridName].selectedRows.length == 0)
                //    $scope[gridName].newRowCount = 0;
            });//end of rowSelectionChangeBatch

            $scope[gridName].gridApi.grid.registerDataChangeCallback(function(data) {
                //$scope.gridApi.selection.clearSelectedRows();//if this line is used, when a row is edited, other rows edited before will be deselected
                //$scope[gridName].paginationCurrentPage = 1;
                for(index =0; index < $scope[gridName].newRowCount; index++){
                    //$scope[gridName].gridApi.selection.selectRowByVisibleIndex(index);
                    $scope[gridName].gridApi.selection.selectRow($scope[gridName].data[index]);
                }
                $scope.validateGrid($scope[gridName]);
            });//end of registerDataChangeCallback

            gridApi.cellNav.on.viewPortKeyDown($scope, function(e){
                if((e.keyCode===99 || e.keyCode===67) && e.ctrlKey){
                    var cells = $scope[gridName].gridApi.cellNav.getCurrentSelection();
                    var copyString = '',
                        rowId = cells[0].row.uid;
                    angular.forEach(cells,function(cell){
                        if (cell.row.uid !== rowId){
                            copyString += '\n';
                            rowId = cell.row.uid;
                        }
                        copyString += gridApi.grid.getCellValue(cell.row, cell.col).toString();
                        copyString += '\t';

                    })
                    if (window.clipboardData) { // Internet Explorer
                        window.clipboardData.setData ("Text", copyString);
                    }
                    else {
                        document.oncopy = function(event) {
                            event.clipboardData.setData("Text", copyString);
                            event.preventDefault();
                        };
                        document.execCommand ("copy", false, null);
                    }
                    //document.execCommand('copy');
                    document.oncopy = undefined;
                }
            })//end of viewPortKeyDown

            gridApi.cellNav.on.navigate($scope,function(newRowcol, oldRowCol){
                $scope[gridName].currentCell = newRowcol;
            })//end of navigate

        }//end of viewPortKeyDown() for copy

        //gridApi.validate.on.validationFailed($scope,function(rowEntity, colDef, newValue, oldValue){
        //
        //});//end of validationFailed
    };//end of onRegisterApi()

    $scope.validateGrid = function (gridOptions) {
        angular.forEach(gridOptions.data, function (rowEntity) {
            angular.forEach(gridOptions.columnDefs, function (colDef) {
                if(colDef['cellEditableCondition']==true && colDef['enableCellEdit'] == true)
                    gridOptions.gridApi.grid.validate.runValidators(rowEntity, colDef, rowEntity[colDef.field], undefined, gridOptions.gridApi.grid)
            })
        })
    }

    $scope.chart = {};
        $scope.chart.rawData = [];
        $scope.chart.data = {
            x: 'x',
            type: 'bar'//line , spline , step, area, area-spline, area-step,  bar, scatter,  pie,  donut, gauge
        };
        $scope.chart.axis ={
            x: {
                type: 'category'
            }
        };
        $scope.chart.zoom = {
            enabled: true,
            rescale: true
        }
        //chartColumnDataBiding() transform json returned by the server to columns style, and returns the columns
        $scope.chartColumnDataBiding = function(chartId, xKey, chartKey, valueKey){
            return pageService.chartColumnDataBiding($scope, chartId, xKey, chartKey, valueKey);
        }
}]);//end of mainController


//all services defined below
app.service("pageService", function (){

    this.doCopy = function($scope, gridName){
        $scope[gridName].paginationCurrentPage = 1;
        if($scope[gridName].selectedRows.length > 0){
            for(index = 0; index < $scope[gridName].selectedRows.length; index++){
                var newRowData = {};
                var rowJson = $scope[gridName].selectedRows[index];
                $.each(rowJson, function(k,v){//k as a field in columnDef
                    var colDefs = $scope[gridName].columnDefs;//colDef as an array
                    for(i = 0; i<colDefs.length; i++){
                        var colDef = colDefs[i];//colDef as json
                        //if(colDef['field'] == k && colDef['cellEditableCondition']==true && colDef['enableCellEdit'] == true){
						if(colDef['field'] == k && k!='id' && k!='rowIndex'){
                            newRowData[k] = v;
                        }
                    }
                })
                $scope[gridName].data.unshift(newRowData);//add new row to the beginning
                $scope[gridName].newRowCount++;
            }
            $scope[gridName].gridApi.selection.clearSelectedRows();
        }
        else{
            $scope[gridName].newRowCount = 1;
            var newRowData = {};
            var colDefs = $scope[gridName].columnDefs;//colDef as an array
            for(i = 0; i<colDefs.length; i++){
                var colDef = colDefs[i];//colDef as json
                if(colDef['cellEditableCondition']==true && colDef['enableCellEdit'] == true){
                    newRowData[colDef['field']] = '';
                }
            }
            $scope[gridName].data.unshift(newRowData);
        }
    }//end of doCopy()


    this.confirmModal = function($scope, type, gridName, extraAction){
        if(type.toUpperCase() == 'DELETE'){
            if($scope[gridName].selectedRows.length == 0){
                $scope.modal = {
                    'header': 'Delete warning',
                    'content': "No record is selected!",
                    'type': '',
                    'extraAction': extraAction
                };
            }
            else{
                $scope[gridName].idsToDelete = [];
                for(index = 0; index < $scope[gridName].selectedRows.length; index++){
                    var row = $scope[gridName].selectedRows[index];
                    if(row.hasOwnProperty('id')){
                        $scope[gridName].idsToDelete.push(row.id);
                    }
                }
                $scope.modal = {
                    'header': 'Delete confirm',
                    'content': "Your're going to delete "+$scope[gridName].idsToDelete.length+" row(s).",
                    'type': 'DELETE',
                    'gridName': gridName,
                    'extraAction': extraAction
                }
            }
        }//end of DELETE modal configuration
        else if(type.toUpperCase() == 'UPDATE'){
            if($scope[gridName].selectedRows.length == 0){
                $scope.modal = {
                    'header': 'Update warning',
                    'content': "No record is selected!",
                    'type': '',
                    'extraAction': extraAction
                };
            }
            else{
                $scope[gridName].rowsToUpdate = [];
                //count selected records to update, those records HAVE id property
                for(index = 0; index < $scope[gridName].selectedRows.length; index++){
                    var row = $scope[gridName].selectedRows[index];
                    if(row.hasOwnProperty('id')){//if the row HAS id property
                        if($scope[gridName].editedRows.hasOwnProperty(row['id'])){//find data(as json) of this id in editedRows json, ignore all row that doesn't exist in editedRows
                            var rowToUpdate = {};
                            rowToUpdate[row['id']] = $scope[gridName].editedRows[row['id']];
                            $scope[gridName].rowsToUpdate.push(rowToUpdate);
                        }
                    }
                }
                if($scope[gridName].rowsToUpdate.length == 0){
                    $scope.modal = {
                        'header': 'Update warning',
                        'content': "No row need to be updated.",
                        'type': ''
                    }
                }
                else{
                    $scope.modal = {
                        'header': 'Update confirm',
                        'content': "You're going to update "+$scope[gridName].rowsToUpdate.length+ " existing row(s).",
                        'type': 'UPDATE',
                        'gridName': gridName,
                        'extraAction': extraAction
                    };
                }
            }

        }//end of UPDATE modal configuration
        else if(type.toUpperCase() == 'INSERT'){
            if( $scope[gridName].selectedRows.length == 0){
                $scope.modal = {
                    'header': 'Insert warning',
                    'content': "No record is selected!",
                    'type': ''
                };
            }
            else{
                $scope[gridName].rowsToInsert = [];
                //count selected records to insert, those records have no id property
                for(index = 0; index < $scope[gridName].selectedRows.length; index++){
                    var row = $scope[gridName].selectedRows[index];
                    if(! row.hasOwnProperty('id')){//if the row HAS NOT id property, it need to be inserted
                        $scope[gridName].rowsToInsert.push(row);
                    }
                }
                if($scope[gridName].rowsToInsert.length == 0){
                    $scope.modal = {
                        'header': 'Insert warning',
                        'content': "No row need to be inserted.",
                        'type': ''
                    }
                }
                else{
                    $scope.modal = {
                        'header': 'Insert confirm',
                        'content': "You're going to insert "+$scope[gridName].rowsToInsert.length+" row(s).",
                        'type': 'INSERT',
                        'gridName': gridName

                    };
                }
            }

        }//end of INSERT modal configuration
        else if(type.toUpperCase() == 'MERGE'){
            if( $scope[gridName].selectedRows.length == 0){
                $scope.modal = {
                    'header': 'Merge warning',
                    'content': "No record is selected!",
                    'type': ''
                };
            }
            else{
                $scope[gridName].rowsToMerge = [];
                //count selected records to insert, those records have no id property
                for(index = 0; index < $scope[gridName].selectedRows.length; index++){
                    var row = $scope[gridName].selectedRows[index];
                    if(row['mergedTime'] == null || row['mergedTime'].trim() == ''){//if the mergedTime is empty, it need to be merged
                        $scope[gridName].rowsToMerge.push(row);
                    }
                }
                if($scope[gridName].rowsToMerge.length == 0){
                    $scope.modal = {
                        'header': 'Merge warning',
                        'content': "No row need to be merged.",
                        'type': ''
                    }
                }
                else{
                    $scope.modal = {
                        'header': 'Merge confirm',
                        'content': "You're going to merge "+$scope[gridName].rowsToMerge.length+" row(s).",
                        'type': 'MERGE',
                        'gridName': gridName
                    };
                }
            }

        }//end of MERGE modal configuration
        else if(type.toUpperCase() == 'COMPUTE'){
            $scope.modal = {
                'header': 'Compute confirm',
                'content': "You're going to do computation.",
                'type': 'COMPUTE',
                'gridName': gridName

            };
        }//end of COMPUTE modal configuration
        else if(type.toUpperCase() == 'GENREPORT'){
            $scope.modal = {
                'header': 'Report generation confirm',
                'content': "You're going to generate the selected report.",
                'type': 'GENREPORT',
                'gridName': gridName

            };
        }//end of GENREPORT modal configuration
        else if(type.toUpperCase() == 'GENBILL'){
            $scope.modal = {
                'header': 'Bill generation confirm',
                'content': "You're going to generate the selected bill.",
                'type': 'GENBILL',
                'gridName': gridName

            };
        }//end of GENREPORT modal configuration

        $("#confirmModal").modal();
    }//end of confirmModal()

    this.doInit = function($scope, $http){
        $("#processingModal").modal();
        //send searching conditions to the server
        return $http({
            method: 'GET',
            url:'/ajax/init',
            params:{
                pageCode: $scope.pageCode
            }
        }).success(function(data){
            //var dataJson = $.parseJSON(data)
            $.each(data, function(k, v){//e.g: k: grid1, v: []
                if(k == 'message'){
                    $scope.message = v;
                }
                else if( k == 'buttonList'){
                    for(index = 0; index < v.length; index++){ //e.g: v=[{''buttonCode': 'SEARCH', 'gridName':'gridName1'}]
                        //if(v[index]['buttonCode'] == 'SEARCH')
                        //    $scope.buttonList['SEARCH'] = true;//1 SEARCH button do all thing
                        //else{
                        //    $scope.buttonList[v[index]['buttonCode']][v[index]['statementName']] = true;
                        //}
                        $scope.buttonList[v[index]['buttonCode']][v[index]['statementName']] = true;
                    }
                }
                else if(k.substr(0,4).toLowerCase() == 'grid'){
                    $scope[k].data = v;//update data of every grids
                    //add rowIndex for very row
                    var rowIndex = 0;
                    for(i = 0; i<$scope[k].data.length; i++){
                        rowIndex++;
                        $scope[k].data[i]['rowIndex'] = rowIndex;
                    }
                }
                else if(k.substr(0,5).toLowerCase() == 'chart')
                    $scope[k].rawData = v;//update data of every chart
                else{//not grid nor chart
                    $scope.dataBox[k] = v;
                }

            });
            //$scope[gridName].editedRows = {};//empty editedRows
            //$scope[gridName].selectedRows = [];
            //$scope[gridName].rowsToInsert = [];
            //$scope[gridName].rowsToUpdate = [];
            //$scope[gridName].rowsToMerge = [];
            //$scope[gridName].newRowCount = 0;
            $('#infoPanel').show();
            $('#processingModal').modal('hide');
        }).error(function(){
            $scope.message = {
                type : 'danger',
                content: 'Init failed. Please contact the maintenance team.'
            };
            $('#infoPanel').show();
            $('#processingModal').modal('hide');
        });//end of $http
    }//end of doInit()

    this.doSearch = function($scope, $http, statementName, isGrid){
        $("#processingModal").modal();
        //send searching conditions to the server
        //if($scope.buttonList['SEARCH'] == true){
        if($scope.buttonList['SEARCH'][statementName] == true){
            if(statementName.substr(0,4).toLowerCase() == 'grid'){
                $scope[statementName].data = [];
            }
            else if(statementName.substr(0,5).toLowerCase() == 'chart')
                $scope[statementName].rawData = [];//update data of every chart
            else{//not grid nor chart
                $scope.dataBox[statementName] = [];
            }
            return $http({
                method: 'POST',
                url:'/ajax/search',
                data:{
                    pageCode: $scope.pageCode,
                    searchTerms: $scope.searchTerms,
                    statementName: statementName
                }
            }).success(function(data){
                //var dataJson = $.parseJSON(data)
                $.each(data, function(k, v){//e.g: k: grid1, v: []
                    if(k == 'message'){
                        $scope.message = v;
                        $scope.isSearchSuccess = false;//if message is returned, the default message (which is 'search successfully) will not be shown.
                    }
                    else if(k.substr(0,4).toLowerCase() == 'grid'){
                        $scope[k].data = v;//update data of every grids
                        //add rowIndex for very row
                        var rowIndex = 0;
                        var totalChars = {};
                        for(var i = 0; i<$scope[k].data.length; i++){
                            rowIndex++;
                            $scope[k].data[i]['rowIndex'] = rowIndex;
                        }
                    }
                    else if(k.substr(0,5).toLowerCase() == 'chart')
                        $scope[k].rawData = v;//update data of every chart
                    else{//not grid nor chart
                        $scope.dataBox[k] = v;
                    }

                })
                if(isGrid == 1){
                    $scope[statementName].editedRows = {};//empty editedRows
                    $scope[statementName].selectedRows = [];
                    $scope[statementName].rowsToInsert = [];
                    $scope[statementName].rowsToUpdate = [];
                    $scope[statementName].newRowCount = 0;
                }

                if($scope.isSearchSuccess == true ){//display default message
                    $scope.message = {
                        type : 'success',
                        content: 'Search successfully.'
                    };
                    $scope.isSearchSuccess = false;
                }
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            }).error(function(){
                $scope.message = {
                    type : 'danger',
                    content: 'Search failed. Please contact the maintenance team.'
                };
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            });//end of $http
        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    };//end of doSearch

    this.doDelete = function($scope, $http, gridName, extraAction){
        var thisService = this;
        //if($scope.modal.type == 'DELETE' && $scope.buttonList['DELETE'][gridName] == true){
        if($scope.buttonList['DELETE'][gridName] == true){
            $('#processingModal').modal();
            return $http({
                method: 'POST',
                url:'/ajax/delete',
                data: {
                    pageCode: $scope.pageCode,
                    statementName: gridName,
                    rowsToDelete: $scope[gridName].selectedRows,
                    extraAction: extraAction
                }
            }).success(function(data){
                $scope[gridName].editedRows = {};//empty editedRows
                $scope[gridName].selectedRows = [];
                $scope[gridName].rowsToInsert = [];
                $scope[gridName].rowsToUpdate = [];
                $scope[gridName].rowsToMerge = [];
                $scope[gridName].newRowCount = 0;
                thisService.doSearch($scope, $http, gridName);
                $scope.message = data.message;
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            }).error(function(){
                $scope.message = {
                    type : 'danger',
                    content: 'Delete failed. Please contact the maintenance team.'
                };
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            });
        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doDelete()

    this.doUpdate = function($scope, $http, gridName, updateLatestModifier){
        var thisService = this;
        //if($scope.modal.type == 'UPDATE' && $scope.buttonList['UPDATE'][gridName] == true){
        if($scope.buttonList['UPDATE'][gridName] == true){
            $('#processingModal').modal();
            return $http({
                method: 'POST',
                url:'/ajax/update',
                data: {
                    pageCode: $scope.pageCode,
                    statementName: gridName,
                    rowsToUpdate: $scope[gridName].rowsToUpdate,
                    updateLatestModifier: updateLatestModifier
                }
            }).success(function(data){
                $scope[gridName].editedRows = {};//empty editedRows
                $scope[gridName].selectedRows = [];
                $scope[gridName].rowsToInsert = [];
                $scope[gridName].rowsToUpdate = [];
                $scope[gridName].rowsToMerge = [];
                $scope[gridName].newRowCount = 0;
                thisService.doSearch($scope, $http, gridName);
                $scope.message = data.message;
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            }).error(function(){
                $scope.message = {
                    type : 'danger',
                    content: 'Update failed. Please contact the maintenance team.'
                };
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            });
        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doUpdate()

    this.doInsert = function($scope, $http, gridName){
        var thisService = this;
        //if($scope.modal.type == 'INSERT' && $scope.buttonList['INSERT'][gridName] == true){
        if($scope.buttonList['INSERT'][gridName] == true){
            $('#processingModal').modal();
            return $http({
                method: 'POST',
                url:'/ajax/insert',
                data: {
                    pageCode: $scope.pageCode,
                    statementName: gridName,
                    rowsToInsert: $scope[gridName].rowsToInsert
                }
            }).success(function(data){
                $scope[gridName].editedRows = {};//empty editedRows
                $scope[gridName].selectedRows = [];
                $scope[gridName].rowsToInsert = [];
                $scope[gridName].rowsToUpdate = [];
                $scope[gridName].rowsToMerge = [];
                $scope[gridName].newRowCount = 0;
                thisService.doSearch($scope, $http, gridName);
                $scope.message = data.message;
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            }).error(function(){
                $scope.message = {
                    type : 'danger',
                    content: 'Insert failed. Please contact the maintenance team.'
                };
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            });
        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doInsert()

    this.doMerge = function($scope, $http, gridName){
        var thisService = this;
        //if($scope.modal.type == 'MERGE' && $scope.buttonList['MERGE'][gridName] == true){
        if($scope.buttonList['MERGE'][gridName] == true){
            $('#processingModal').modal();
            return $http({
                method: 'POST',
                url:'/ajax/merge',
                data: {
                    pageCode: $scope.pageCode,
                    statementName: gridName,
                    rowsToMerge: $scope[gridName].rowsToMerge
                }
            }).success(function(data){
                $scope[gridName].editedRows = {};//empty editedRows
                $scope[gridName].selectedRows = [];
                $scope[gridName].rowsToInsert = [];
                $scope[gridName].rowsToUpdate = [];
                $scope[gridName].rowsToMerge = [];
                $scope[gridName].newRowCount = 0;
                thisService.doSearch($scope, $http, gridName);
                $scope.message = data.message;
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            }).error(function(){
                $scope.message = {
                    type : 'danger',
                    content: 'Merge failed. Please contact the maintenance team.'
                };
                $('#infoPanel').show();
                $('#processingModal').modal('hide');
            });
        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doMerge()
    /**
     * require: there must be dateTime, dateTimeSuffix, searchTerms.computingType, searchTerms.timeUnit on the page
     * @param $scope
     * @param $http
     * @param gridName
     * @returns {*}
     */
    this.doCompute = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['COMPUTE'][gridName] == true){

            //$scope.searchTerms.time = $('#dateTime').val();
            //if($('#dateTimeSuffix').val() != null)
            //    $scope.searchTerms.time = $scope.searchTerms.time + ' ' + $('#dateTimeSuffix').val();
            if(!$scope.searchTerms.computingType || $scope.searchTerms.computingType == ''){
                $scope.message = {
                    type : 'danger',
                    content: "Computing type has not been set."
                };
                $('#infoPanel').show();
            }
            else if(!$scope.searchTerms.timeUnit || $scope.searchTerms.timeUnit == ''){
                $scope.message = {
                    type : 'danger',
                    content: "Time unit has not been set."
                };
                $('#infoPanel').show();
            }
            else if($scope.searchTerms.time.toString().trim() == ''){
                $scope.message = {
                    type : 'danger',
                    content: "You must set time to compute!"
                };
                $('#infoPanel').show();
            }
            else{
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/compute',
                    data: {
                        computingType: $scope.searchTerms.computingType,
                        timeUnit: $scope.searchTerms.timeUnit,
                        time: $scope.searchTerms.time
                    }
                }).success(function(data){
                    $scope[gridName].editedRows = {};//empty editedRows
                    $scope[gridName].selectedRows = [];
                    $scope[gridName].rowsToInsert = [];
                    $scope[gridName].rowsToUpdate = [];
                    $scope[gridName].rowsToMerge = [];
                    $scope[gridName].newRowCount = 0;
                    thisService.doSearch($scope, $http, gridName);
                    $scope.message = data.message;
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Compute failed. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doCompute()

    this.doGenerateReport = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['GENREPORT'][gridName] == true){

            //var time = $('#dateTime').val();
            //if($('#dateTimeSuffix').val() != null)
            //    time = time + ' ' + $('#dateTimeSuffix').val();
            if(!$scope.searchTerms.templateCode || $scope.searchTerms.templateCode == ''){
                $scope.message = {
                    type : 'danger',
                    content: "You must select a template."
                };
                $('#infoPanel').show();
            }
            else if(!$scope.searchTerms.timeUnit || $scope.searchTerms.timeUnit == ''){
                $scope.message = {
                    type : 'danger',
                    content: "You must select a time unit."
                };
                $('#infoPanel').show();
            }
            else if($scope.searchTerms.time.toString().trim() == ''){
                $scope.message = {
                    type : 'danger',
                    content: "You must set time to generate form!"
                };
                $('#infoPanel').show();
            }
            else{
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/generateReport',
                    data: {
                        templateCode: $scope.searchTerms.templateCode,
                        timeUnit: $scope.searchTerms.timeUnit,
                        time: $scope.searchTerms.time
                    }
                }).success(function(data){
                    $scope[gridName].editedRows = {};//empty editedRows
                    $scope[gridName].selectedRows = [];
                    $scope[gridName].rowsToInsert = [];
                    $scope[gridName].rowsToUpdate = [];
                    $scope[gridName].rowsToMerge = [];
                    $scope[gridName].newRowCount = 0;
                    thisService.doSearch($scope, $http, gridName);
                    $scope.message = data.message;
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Form generation failed. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doGenerateReport()

    this.doGenerateBill = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['GENBILL'][gridName] == true){

            if($scope[gridName].selectedRows.length !=1){
                $scope.message = {
                    type : 'danger',
                    content: "Please select only 1 or 0 row to generate the form."
                };
                $('#infoPanel').show();
            }
            else{
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/generateBill',
                    data: {
                        pageCode: $scope.pageCode,
                        record: $scope[gridName].selectedRows[0],
                        statementName: gridName
                    }
                }).success(function(data){
                    $scope[gridName].editedRows = {};//empty editedRows
                    $scope[gridName].selectedRows = [];
                    $scope[gridName].rowsToInsert = [];
                    $scope[gridName].rowsToUpdate = [];
                    $scope[gridName].rowsToMerge = [];
                    $scope[gridName].newRowCount = 0;
                    thisService.doSearch($scope, $http, gridName);
                    $scope.message = data.message;
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Form generation failed. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doGenerateBill()


    this.doDownloadReport = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['DOWNREPORT'][gridName] == true){
            if($scope[gridName].selectedRows.length != 1){
                $scope.message = {
                    type : 'danger',
                    content: "Please select 1 and only 1 record to download the form."
                };
                $('#infoPanel').show();
            }
            else{
                $scope.message = {};
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/downloadReport',
                    data: {
                        templateCode: $scope[gridName].selectedRows[0].templateCode,
                        timeUnit: $scope[gridName].selectedRows[0].timeUnit,
                        time: $scope[gridName].selectedRows[0].time
                    },
                    responseType: "arraybuffer"
                }).success( function (data, status, headers) {
                    //$scope[gridName].editedRows = {};//empty editedRows
                    //$scope[gridName].selectedRows = [];
                    //$scope[gridName].rowsToInsert = [];
                    //$scope[gridName].rowsToUpdate = [];
                    //$scope[gridName].rowsToMerge = [];
                    //$scope[gridName].newRowCount = 0;
                    //thisService.doSearch($scope, $http, gridName);
                    if(data.message){
                        $scope.message = data.message;
                    }
                    else{
                        var type = headers('Content-Type');
                        var disposition = headers('Content-Disposition');
                        if (disposition) {
                            var match = disposition.match(/.*filename=\"?([^;\"]+)\"?.*/);
                            if (match[1])
                                defaultFileName = match[1];
                        }
                        defaultFileName = defaultFileName.replace(/[<>:"\/\\|?*]+/g, '_');
                        var blob = new Blob([data], { type: type });
                        saveAs(blob, defaultFileName);
                    }
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Download failed. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doDownloadReport()

    this.doDownloadBill = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['DOWNBILL'][gridName] == true){
            if($scope[gridName].selectedRows.length != 1){
                $scope.message = {
                    type : 'danger',
                    content: "Please select 1 and only 1 record to download the bill."
                };
                $('#infoPanel').show();
            }
            else{
                $scope.message = {};
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/downloadBill',
                    data: {
                        pageCode: $scope.pageCode,
                        record: $scope[gridName].selectedRows[0],
                        statementName: gridName
                    },
                    responseType: "arraybuffer"
                }).success( function (data, status, headers) {
                    if(data.message){
                        $scope.message = data.message;
                    }
                    else{
                        var type = headers('Content-Type');
                        var disposition = headers('Content-Disposition');
                        if (disposition) {
                            var match = disposition.match(/.*filename=\"?([^;\"]+)\"?.*/);
                            if (match[1])
                                defaultFileName = match[1];
                            defaultFileName = defaultFileName.replace(/[<>:"\/\\|?*]+/g, '_');
                            var blob = new Blob([data], { type: type });
                            saveAs(blob, defaultFileName);
                        }
                        else{
                            $scope.message = {
                                type : 'danger',
                                content: 'File does not exist! Please generate it first!'
                            };
                        }
                    }
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Download failed. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doDownloadBill()

    this.doViewReport = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['VIEWREPORT'][gridName] == true){
            if($scope[gridName].selectedRows.length != 1){
                $scope.message = {
                    type : 'danger',
                    content: "Please select 1 and only 1 record to view the report."
                };
                $('#infoPanel').show();
            }
            else{
                $scope.message = {};
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/viewReport',
                    data: {
                        templateCode: $scope[gridName].selectedRows[0].templateCode,
                        timeUnit: $scope[gridName].selectedRows[0].timeUnit,
                        time: $scope[gridName].selectedRows[0].time
                    }
                }).success(function(data){
                    document.getElementById('viewFormModalBody').innerHTML = data.formHtml;
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                    $scope.modal.header = 'Report view';
                    $('#viewFormModal').modal();
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Failed to view the report. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doViewReport()

    this.doViewBill = function($scope, $http, gridName){
        var thisService = this;
        if($scope.buttonList['VIEWBILL'][gridName] == true){
            if($scope[gridName].selectedRows.length != 1){
                $scope.message = {
                    type : 'danger',
                    content: "Please select 1 and only 1 record to view the bill."
                };
                $('#infoPanel').show();
            }
            else{
                $scope.message = {};
                $('#processingModal').modal();
                return $http({
                    method: 'POST',
                    url:'/ajax/viewBill',
                    data: {
                        pageCode: $scope.pageCode,
                        record: $scope[gridName].selectedRows[0],
                        statementName: gridName
                    }
                }).success(function(data){
                    if(data.message){
                        $scope.message = data.message;
                        $('#infoPanel').show();
                    }
                    else{
                        document.getElementById('viewFormModalBody').innerHTML = data.formHtml;
                        $scope.modal.header = 'Bill view';
                        $('#viewFormModal').modal();
                    }
                    $('#processingModal').modal('hide');
                }).error(function(){
                    $scope.message = {
                        type : 'danger',
                        content: 'Failed to view the bill. Please contact the maintenance team.'
                    };
                    $('#infoPanel').show();
                    $('#processingModal').modal('hide');
                });
            }

        }
        else{
            $scope.message = {
                type : 'danger',
                content: "You're illegally using this function."
            };
            $('#infoPanel').show();
        }

    }//end of doViewBill()

    this.chartColumnDataBiding = function($scope, chartId, xKey, chartKey, valueKey){//1 chartKey  = 1 chart
        var columns = [];
        var xArray = [];
        var charts = {};
        for(index = 0; index < $scope[chartId].rawData.length; index++){
            var item =  $scope[chartId].rawData[index];
            $.each(item, function(k, v){
                if(k == xKey && xArray.indexOf(v, 0) == -1){//no 'v' in xArray
                    xArray.push(v);
                }
                else if(k == chartKey && !charts.hasOwnProperty(v)){//no 'v' in charts
                    charts[v] = [];
                    charts[v].push(v);
                }
            })
        }
        xArray.sort();
        for(i = 0; i < xArray.length; i++){
            for(index =0; index <  $scope[chartId].rawData.length; index++){
                var item =  $scope[chartId].rawData[index];
                if(item[xKey] == xArray[i]){
                    charts[item[chartKey]].push(item[valueKey]);
                }
            }
        }
        //put all data to columns
        xArray.unshift('x');
        columns.push(xArray);
        $.each(charts, function(k, v){
            columns.push(v);
        })
        return columns;
    }//end of chartColumnDataBiding()

    this.gridRowToColumn = function($scope, gridName, groupFields, rowField, columnField, decimal){//e.g: rowField is time, columnField is finalValue
        var addColumns = [];//columns needs to be added to grid, these are different value of the original rowField column
        for(var i = 0; i< $scope[gridName].data.length; i++){
            if($.inArray($scope[gridName].data[i][rowField], addColumns) == -1)
                addColumns.push($scope[gridName].data[i][rowField]);
        }
        addColumns.sort();
        var groupFields = groupFields.toString().split(':');
        var convertedGridData = [];
        for(var i = 0; i< $scope[gridName].data.length; i++){
            var newRow = {};
            for(var j =0; j< groupFields.length; j++){
                newRow[groupFields[j]] = $scope[gridName].data[i][groupFields[j]];
            }
            var found = false;
            for(var k =0 ;k < convertedGridData.length; k++)
                if(JSON.stringify(convertedGridData[k]) == JSON.stringify(newRow))
                    found = true;
            if(!found)
                convertedGridData.push(newRow);
            //for(var j =0; j < addColumns.length; j++){
            //    if($scope[gridName].data[i][rowField] == addColumns[j])
            //        newRow[addColumns[j]] = $scope[gridName].data[i][columnField];
            //    else if(newRow[addColumns[j]])
            //        newRow[addColumns[j]] = 0;
            //}
        }
        for(var i = 0; i< $scope[gridName].data.length; i++){
            for(var j = 0; j<convertedGridData.length; j ++){
                var matchNo = 0;
                for(var k = 0; k< groupFields.length; k++){
                    if($scope[gridName].data[i][groupFields[k]] == convertedGridData[j][groupFields[k]])
                        matchNo++;
                }
                if(matchNo == groupFields.length){//copy data from $scope[gridName].data[i] to convertedGridData[j]
                    convertedGridData[j][$scope[gridName].data[i][rowField]] = $scope[gridName].data[i][columnField];
                }
            }
        }
        $scope[gridName].data = convertedGridData;
        //remove rowField column and columnField column
        for(var i = 0; i< $scope[gridName].columnDefs.length; i++){
            if($scope[gridName].columnDefs[i]['field'] == rowField || $scope[gridName].columnDefs[i]['field'] == columnField){
                $scope[gridName].columnDefs.splice(i, 1);
                i--;
            }

        }
        //add new columns
        if(decimal === undefined)
            decimal = 0;
        for(var i = 0; i< addColumns.length; i++){
            var found = false;
            for(var k =0 ;k < $scope[gridName].columnDefs.length; k++)
                if($scope[gridName].columnDefs[k]['field'] == addColumns[i])
                    found = true;
            if(!found){
                if(decimal != 0)
                    $scope[gridName].columnDefs.push({'field': addColumns[i], editable: false, width: 150, cellClass: 'text-right', cellFilter: 'number:'+decimal})
                else
                    $scope[gridName].columnDefs.push({'field': addColumns[i], editable: false, width: 150, cellClass: 'text-right'})
            }
        }

    }//end of gridRowToColumn


});//end of pageService

//all directive defined below
app.directive('uiGridDatetimeeditor', ['uiGridConstants', 'uiGridEditConstants',
    function (uiGridConstants, uiGridEditConstants) {
        return {
            scope: true,
            compile: function () {
                return {
                    pre: function ($scope, $elm, $attrs) {
                    },
                    post: function ($scope, $elm, $attrs) {
                        $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function () {

                            $(".dateTimeCellEditing").datetimepicker().on('show', function(){
                                $( ".dateTimeCellEditing" ).click(function( event ) {
                                    event.stopPropagation();
                                });
                                $("body").on('click', function(){
                                    $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                });
                            });
                            $('.dateTimeCellEditing').datetimepicker({
                                format: 'yyyy-mm-dd', startView: 'month', minView: 'hour', maxView: 'decade'
                            });
                            //$('.dateTimeCellEditing').datetimepicker('show');//show lam cho gia tri input thay doi khi click  vao input nhung lai ko dc cap nhat trong cell
                            $(".dateTimeCellEditing").datetimepicker().on('hide', function(){
                                $(".dateTimeCellEditing").focusout(function(){
                                    $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                });
                            });

                        });
                        $scope.$on(uiGridEditConstants.events.END_CELL_EDIT, function () {
                            //$('.dateTimeCellEditing').datetimepicker('hide');
                            $('.dateTimeCellEditing').datetimepicker('hide');
                            $(".dateTimeCellEditing").remove();
                            $("body").off('click');
                        });
                    }
                }
            }
        }
    }]
);//end of uiGridDatetimeeditor directive

app.directive('uiGridDateeditor', ['uiGridConstants', 'uiGridEditConstants',
        function (uiGridConstants, uiGridEditConstants) {
            return {
                scope: true,
                compile: function () {
                    return {
                        pre: function ($scope, $elm, $attrs) {
                        },
                        post: function ($scope, $elm, $attrs) {
                            $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function () {
                                $(".dateCellEditing").datetimepicker().on('show', function(){
                                    $( ".dateCellEditing" ).click(function( event ) {
                                        event.stopPropagation();
                                    });
                                    $("body").on('click', function(){
                                        $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                    });
                                });
                                $('.dateCellEditing').datetimepicker({
                                    format: 'yyyy-mm-dd', startView: 'month', minView: 'month', maxView: 'decade'
                                });
                                //$('.dateCellEditing').datetimepicker('show');//show lam cho gia tri input thay doi khi click  vao input nhung lai ko dc cap nhat trong cell
                                $(".dateCellEditing").datetimepicker().on('hide', function(){
                                    $(".dateCellEditing").focusout(function(){
                                        $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                    });
                                    //$(".datetimepicker.datetimepicker-dropdown-bottom-right.dropdown-menu").remove();
                                });
                            });
                            $scope.$on(uiGridEditConstants.events.END_CELL_EDIT, function () {
                                $('.dateCellEditing').datetimepicker('hide');
                                $(".dateCellEditing").remove();
                                $("body").off('click');
                            });
                        }
                    }
                }
            }
        }]
);//end of uiGridDatetimeeditor directive

app.directive('uiGridFileuploadeditor', ['uiGridConstants', 'uiGridEditConstants','Upload', 'pageService', '$http',//uiGridFileuploadeditor NOT uiGridFileUploadeditor
        function (uiGridConstants, uiGridEditConstants, Upload, pageService, $http) {
            return {
                scope: false,
                compile: function () {
                    return {
                        pre: function ($scope, $elm, $attrs) {
                        },
                        post: function ($scope, $elm, $attrs) {
                            $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function () {
                                $('input[type="file"]').change(function () {
                                    $('#processingModal').modal();
                                    $scope.upload = function(file, uploadType, gridName){
                                        Upload.upload({
                                            url: '/ajax/upload',
                                            data: {file: file, 'uploadType': uploadType, 'version': $scope.row.entity.version, 'templateCode': $scope.row.entity.templateCode}
                                        }).then(function (resp) {
                                            //console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                                            $scope.grid.appScope.$parent.message = resp.data.message;
                                            pageService.doSearch($scope.grid.appScope.$parent, $http, gridName);
                                            $('#infoPanel').show();
                                            $('#processingModal').modal('hide');
                                            //$scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                        }, function (resp) {
                                            //console.log('Error status: ' + resp.status);
                                        }, function (evt) {
                                            //var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                            //console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                                        });
                                    }
                                    $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                });
                            });
                            //$scope.$on(uiGridEditConstants.events.END_CELL_EDIT, function () {
                            //    alert($('input[type="file"]')[0].files[0])
                            //})
                        }
                    }
                }
            }
        }]
);//end of uiGridDatetimeeditor directive

app.directive('uiGridTypeaheadeditor', ['uiGridConstants', 'uiGridEditConstants',
        function (uiGridConstants, uiGridEditConstants) {
            return {
                scope: false,
                compile: function () {
                    return {
                        pre: function ($scope, $elm, $attrs) {
                        },
                        post: function ($scope, $elm, $attrs) {
                            $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function () {
                                $scope.enterSearch = function(){
                                    $(".typeaheadCellEditing").on('mouseleave', function(){
                                        $(".typeahead.dropdown-menu").on('click', function(){
                                            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                        })
                                    });
                                    $(".typeaheadCellEditing").focusout(function(){
                                        $("body").on('click', function(){
                                            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                        });
                                        var typeaheadElement = document.getElementsByClassName('typeahead dropdown-menu');
                                        if(typeaheadElement.length == 0)
                                            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                                    });
                                };

                            });
                            $scope.$on(uiGridEditConstants.events.END_CELL_EDIT, function () {
                                $(".typeaheadCellEditing").remove();
                            });
                        }
                    }
                }
            }
        }]
);//end of uiGridTypeaheadeditor directive

//all filter defined below
app.filter('mapFilter', function() {
    return function(input, array, display, value) {
        if (!input){
            return '';
        } else {
            for(var $i = 0; $i < array.length; $i++){
                if(input == array[$i][value])
                    return array[$i][display];
            }
            return input;
        }
    };
})

//below is jquery function
$(document).ready(function() {
    $('body').bind('DOMSubtreeModified', function(e) {//prevent the width of the page change after search action
        $('body').css('padding-right', '0');
        $('.ui-grid-viewport').css('width', '100%');
        $('.ui-grid-header-viewport').css('width', '100%');
        //.grid1455373217454 .ui-grid-render-container-body .ui-grid-viewport
    });
    //$.ajaxSetup({
    //    headers:
    //    { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') }
    //});
});