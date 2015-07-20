(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'ngFileUpload', 'math']);
    
    app.factory('categoryFactory', ['$http', '$q', function($http, $q){
        
        var masterCategory = new Category(0, '', '', '');
        var rowCategory = [];
        var deferred = $q.defer();
                
        $http.get('/categories').then(function(response){
            rowCategory = response.data;
            masterCategory.makeCategory(response.data);
            deferred.resolve({
                rowData: rowCategory,
                masterCategory: masterCategory
            });
        });
        
        function getCategory(cid) {
            for(var i=0; i<rowCategory.length; i++){
                if(rowCategory[i].cid == cid){
                    return rowCategory[i];
                }
            }
            return null;
        }
        
        return {
            getCategories: deferred.promise,
            getCategory: getCategory
        };
    }]);
    
    function Category(cid, name, path, relPath) {
        this.cid = cid;
        this.name = name;
        this.path = path;
        this.relativePath = relPath;
        this.selectedCategorySet = [];
        this.categories = [];
    }
    
    Category.prototype.makeCategory = function(data){
        for(var k=0; k<data.length; k++){
            var item = data[k];
            var category = new Category(item.cid, item.name, item.path, item.relativePath);
            
            var absPath = item.path;
            var parentIdsArray = new Array();
            
            
            // separate parents ids
            var tempId = '';
            for(i=0 ;i<absPath.length; i++){
                if(absPath.charAt(i)=='/'){
                    parentIdsArray.push(tempId);
                    tempId = '';
                }else{
                    tempId = tempId.concat(absPath.charAt(i));
                }
            }
            
            var parentCategory = this;
            
            for(var j=0; j<=parentIdsArray.length; j++){
                
                var parentId = parentIdsArray[j];

                // last leaf
                if(j == parentIdsArray.length){
                    parentCategory.categories.push(category);
                }else{
                    // parentCategory change
                    for(var l=0; l<parentCategory.categories.length; l++){
                        if(parentCategory.categories[l].cid == parentId){
                            parentCategory = parentCategory.categories[l];
                        }
                    }        
                }   
            }            
        }
    };
    Category.prototype.getParentId = function(){
        
        if(this.path.length && this.path){

            var parentId = {};
            var pathStringLength = this.path.length;
            var lastSlashIndex = pathStringLength - 1;
            var beforeLastSlashIndex = lastSlashIndex - 1;
            
            var parentIdFirstIndex = 0;
            var parentIdLength = 0;
        
            for(i=0; i<lastSlashIndex; i++){
                if(beforeLastSlashIndex == 0){

                    parentIdLength = lastSlashIndex;
                    parentIdFirstIndex = 0;
                    break;

                }else if(this.path.charAt(beforeLastSlashIndex) == '/'){

                    parentIdFirstIndex = beforeLastSlashIndex + 1;
                    parentIdLength = lastSlashIndex - parentIdFirstIndex;
                    break;

                }else {
                    beforeLastSlashIndex--;
                }
            }
            
            parentId = this.path.substr(parentIdFirstIndex, parentIdLength);
            
            return parentId;
            
        }else return 0;
    };
    
    function Problem (pid, question, answer, explanation, strExamples){
        this.pid = pid;
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
        this.examples = [];
        this.answerType = 'single';
        this.answerPlaceholder = '정답을 입력해 주세요';
                            
    }
    
    Problem.prototype.setExamples = function (strExamples) {
        if(strExamples.length){
            this.answerType = 'multiple';
            this.answerPlaceholder = '정답인 보기를 입력해 주세요';
            
            var stringExamples = strExamples;
            var tempExample = '';
            for(var j=0 ;j<stringExamples.length; j++){
                if(stringExamples.charAt(j)=='@'){
                    this.examples.push({content: tempExample});
                    tempExample = '';
                }else{
                    tempExample = tempExample.concat(stringExamples.charAt(j));
                }
            }
            
        }else{
            this.examples = [{content:''}, {content:''}, {content:''}, {content:''}];
        }
    };
    
    function ProblemMaster () {
        this.masterData = new Array();
    }
    
    ProblemMaster.prototype.push = function (item){
        this.masterData.push(item);
    };
    
    ProblemMaster.prototype.getMasterData = function () {
        return this.masterData;  
    };
        
    app.controller('BankController', ['$scope', '$http', function($scope, $http){
        var bank = this;
    }]);
    
    app.directive('insertProblem', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/insert-problem.html',
            controller: ['$scope', '$http', 'Upload', '$window', function($scope, $http, Upload, $window){
                
                $scope.initProblem = function(){
                    $scope.problem = {};
                    $scope.problem.question = '';
                    $scope.problem.answer = '';
                    $scope.problem.explanation = '';
                    $scope.problem.examples = [{content:''}, {content:''}, {content:''}, {content:''}];   
                    $scope.problem.answerType = 'single';
                    $scope.problem.answerPlaceholder = '정답을 입력해 주세요';
                    $scope.problem.selections = new Array();
                };
                
                if($scope.problem){
                }else {
                    $scope.initProblem();
                }
                                
                $scope.answerTypeButtonTapped = function(type){
                    if(type == 'multiple' && $scope.problem.answerType == 'single'){
                        type = 'multiple';
                        $scope.problem.answerPlaceholder = '정답인 보기를 입력해 주세요';
                    }else if(type == 'single' && $scope.problem.answerType == 'multiple'){
                        type = 'single';
                        $scope.problem.answerPlaceholder = '정답을 입력해 주세요';
                    }
                };
                
                $scope.submitForm = function(questionImages, explanationImages){
                    
                    if(!$scope.problem.selections.length){
                        alert('카테고리를 선택해주세요');    
                        return;
                    }
                                        
                    var question = $scope.problem.question;
                    var answer = $scope.problem.answer;
                    var explanation = $scope.problem.explanation;
                    
                    var stringWithCategories = '';
                    for(var i=0; i<$scope.problem.selections.length; i++){
                        stringWithCategories = stringWithCategories + $scope.problem.selections[i].cid.toString() + '/';
                    }
                    
                    var stringWithExamples = '';
                    if($scope.problem.answerType == 'multiple'){
                        for(var i=0; i<$scope.problem.examples.length; i++){
                            stringWithExamples += $scope.problem.examples[i].content + '@';    
                        }
                    }
                    
                    var formDataNames = [];
                    var imageFiles = [];
                    if(questionImages){
                        for(var i=0; i<questionImages.length; i++){
                            formDataNames.push('questionAttached');    
                            imageFiles.push(questionImages[i]);
                        }                        
                    }
                    if(explanationImages){
                        for(var i=0; i<explanationImages.length; i++){
                            formDataNames.push('explanationAttached');
                            imageFiles.push(explanationImages[i]);
                        }                        
                    }
                    
                    $scope.upload = Upload.upload({
                        url: '/problem',
                        method: 'POST',
                        headers: {
                            'Content-Type': undefined
                        },
                        fields: {
                            question: question,
                            answer: answer,
                            explanation: explanation,
                            categories:stringWithCategories,
                            examples:stringWithExamples
                        },
                        file: imageFiles,
                        fileFormDataName: formDataNames
                    }).success(function(response){
                        
                        if(imageFiles.length){
                            $window.alert(imageFiles.length + '개 이미지와 문제 업로드 성공');
                        }else $window.alert('이미지 없는 문제 업로드 성공');
                        
                        $scope.initProblem();
                    });   
                };
                
            }],
            controllerAs: 'problemCtrl'
        };
    });

    app.directive('editCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/edit-category.html',
            controller: ['$scope', '$http', function($scope, $http){
                                
                this.submitCategory = function(){
                    
                    var cname = this.cateObject.name;
                    var cpath = this.cateObject.path;
                
                    $http.post('/category', {'path':cpath, 'name':cname}).then(function(){
                        alert('request complete');
                        this.cateObject = {};
                    });
                };            
            }],
            controllerAs: 'cateCtrl'
        };
    });
        
    app.directive('loadProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/load-problems.html',
            controller: ['$scope', '$http', '$modal', '$log', 'categoryFactory', function($scope, $http, $modal, $log, categoryFactory){                
                
                $scope.category = {};
                $scope.category.selections = new Array();
                    
                $scope.loadProblems = function(){
                    
                    $http.post('/load_problems', {'categories': angular.toJson($scope.category.selections)})
                    .then(function(response){

                        var data = response.data;        
                        
                        $scope.problems = [];

                        for(var i=0; i<data.length; i++){
                            
                            var theData = data[i];
                            
                            if(i != 0){
                                var lastProblem = $scope.problems[$scope.problems.length-1];
                                if(lastProblem.pid != theData.pid){
                                    var theProblem = {};
                                    theProblem.pid = theData.pid;
                                    theProblem.question = theData.question;
                                    theProblem.answer = theData.answer;
                                    theProblem.explanation = theData.explanation;
                                    theProblem.examples = [];
                                    theProblem.answerType = 'single';
                                    theProblem.answerPlaceholder = '정답을 입력해 주세요';
                                    theProblem.selections = new Array();
                                    theProblem.selections.push(categoryFactory.getCategory(theData.cid));

                                    if(theData.examples.length){
                                        theProblem.answerType = 'multiple';
                                        theProblem.answerPlaceholder = '정답인 보기를 입력해 주세요';
                                        var stringExamples = theData.examples;
                                        var tempExample = '';
                                        for(var j=0 ;j<stringExamples.length; j++){
                                            if(stringExamples.charAt(j)=='@'){
                                                theProblem.examples.push({content: tempExample});
                                                tempExample = '';
                                            }else{
                                                tempExample = tempExample.concat(stringExamples.charAt(j));
                                            }
                                        }
                                    }else{
                                        theProblem.examples = [{content:''}, {content:''}, {content:''}, {content:''}];
                                    }

                                    $scope.problems.push(theProblem);   
                                }else{
                                    lastProblem.selections.push(categoryFactory.getCategory(theData.cid));
                                }
                            }else{
                                var theProblem = {};
                                theProblem.pid = theData.pid;
                                theProblem.question = theData.question;
                                theProblem.answer = theData.answer;
                                theProblem.explanation = theData.explanation;
                                theProblem.examples = [];
                                theProblem.answerType = 'single';
                                theProblem.answerPlaceholder = '정답을 입력해 주세요';
                                theProblem.selections = new Array();
                                theProblem.selections.push(categoryFactory.getCategory(theData.cid));

                                if(theData.examples.length){
                                    theProblem.answerType = 'multiple';
                                    theProblem.answerPlaceholder = '정답인 보기를 입력해 주세요';
                                    var stringExamples = theData.examples;
                                    var tempExample = '';
                                    for(var j=0 ;j<stringExamples.length; j++){
                                        if(stringExamples.charAt(j)=='@'){
                                            theProblem.examples.push({content: tempExample});
                                            tempExample = '';
                                        }else{
                                            tempExample = tempExample.concat(stringExamples.charAt(j));
                                        }
                                    }
                                }else{
                                    theProblem.examples = [{content:''}, {content:''}, {content:''}, {content:''}];
                                }
                                $scope.problems.push(theProblem);   
                            }
                        }

                    }).error(function(response){
                        
                        alert('문제를 불러올 수 없습니다. 다시 시도해 주세요.');
                    });
                };
                
                $scope.deleteProblem = function(item){
                    
                    $http.delete('/problem/'+item.pid)
                    .success(function(response){
                        alert('문제를 성공적으로 제거했습니다.');
                    }).error(function(response){
                        alert('문제 삭제에 실패했습니다. 다시 시도해 주세요.');
                    });
                };
                
                $scope.updateProblem = function (item) {
                    
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'view/edit-problem-modal.html',
                        controller: 'ModalInstanceCtrl',
                        size: 'lg',
                        resolve: {
                            item: function () {
                                return item;
                            }
                        }
                    });

                    modalInstance.result.then(function (selectedItem) {
                        $scope.problem = selectedItem;
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                };

            }],
            controllerAs: 'masterProblemsCtrl'
        };
    });
    
    app.controller('ModalInstanceCtrl', ['$scope', '$http', '$modalInstance', 'item', function ($scope, $http, $modalInstance, item) {
        $scope.problem = item;
        $scope.update = function (item) {
            
            var stringWithExamples = '';
            if(item.answerType == 'multiple'){
                for(var i=0; i<item.examples.length; i++){
                    stringWithExamples += item.examples[i].content + '@';    
                }
            }
            
            $http.put('/problem/'+item.pid, {pid:item.pid, question:item.question, answer:item.answer, explanation:item.explanation, examples:stringWithExamples})
            .success(function(response){
                alert('문제를 성공적으로 수정하였습니다.');
                $modalInstance.close(); 
            }).error(function(response){
                alert('문제를 수정하지 못했습니다. 다시 시도해주세요.' + response.error);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
    
    app.directive('showProblem', function(){
        return {
            restrict: 'EA',
            templateUrl: 'view/show-problem.html',
            scope: {
                problem: '=item',
            }
        };
    });
    
    app.directive('selectCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/select-category.html',
            scope: {
                type: '=',
                selections: '='
            },
            controller: ['$scope', '$http', 'categoryFactory', function($scope, $http, categoryFactory){
                
                categoryFactory.getCategories.then(function(data){
                    console.log(data);
                    $scope.categories = data.masterCategory.categories;
                }, function(data){
                    alert('load category error');
                });
                
                this.addCategory = function(name, item){
                    var theCategory = new Category(item.cid, item.name, item.path, item.relativePath);
                    var parentId = theCategory.getParentId();
                    var parentRelativePath = '';
                    if(parentId != 0){
                        parentRelativePath = rowData[parentId -1].relativePath;   
                    }
                      
                    httpPostCategory(parentId, name, theCategory.path, parentRelativePath);
                };
                
                this.addChildCategory = function(name, item){
                    
                    var newPath = item.path + item.cid.toString() + '/';
                    httpPostCategory(item.cid, name, newPath, item.relativePath);
                };
                
                this.deleteCategory = function(item){
                    $http.delete('/category/'+item.cid)
                    .success(function(response){
                        alert('delete category SUCCESS');
                    }).error(function(response){
                        alert('delete category ERROR');
                    });
                };
                
                this.selectCategory = function(item){
                    
                    var theIndex = getIndexOfSelectedCategory(item.cid);
                    if(theIndex >= 0){
                        $scope.selections.splice(theIndex, 1);
                    }else{
                        $scope.selections.push(item);
                    }
                };
                
                this.isSelected = function(item){
                    
                    var cid = item.cid;
                    
                    for(i=0; i<$scope.selections.length; i++){
                        if($scope.selections[i].cid == cid){
                            return true;   
                        }
                    }
                    return false;
                }
                
                function getIndexOfSelectedCategory (cid){
                    if($scope.selections.length == 0 || !$scope.selections){
                        return -1;
                    }
                    for(i=0; i<$scope.selections.length; i++){
                        if($scope.selections[i].cid == cid){
                            return i;   
                        }
                    }
                    return -1;   
                };
                
                function httpPostCategory (parentId, name, absPath, relPath){
                    $http.post('/category', {'parentId':parentId, 'name':name, 'path':absPath, 'parentRelativePath': relPath})
                    .success(function(response){
                        alert('insert category SUCCESS');
                    }).error(function(response){
                        alert('insert category error');
                    });
                };

            }],
            controllerAs: 'selectCategoryCtrl'
        };
    });
    
    app.directive('nodesRenderer', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/nodes-renderer.html'
        };
    });
    
})();