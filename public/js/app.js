(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'ngFileUpload', 'math']);
    
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
    
    var selectedCategories = new Array();
        
    app.controller('BankController', ['$scope', '$http', function($scope, $http){
        var bank = this;
    }]);
    
    app.directive('insertProblem', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/insert-problem.html',
            controller: ['$scope', '$http', 'Upload', '$window', function($scope, $http, Upload, $window){
                
                $scope.answerType = 'single';
                $scope.answerPlaceHolder = '정답을 입력해 주세요';
                $scope.selections = selectedCategories;
                
                $scope.answerTypeButtonTapped = function(answerType){
                    if($scope.answerType == 'single'){
                        $scope.answerPlaceHolder = '정답인 보기를 입력해 주세요';
                    }else $scope.answerPlaceHolder = '정답을 입력해 주세요';
                };
                
                $scope.submitForm = function(questionImages, explanationImages){
                    
                    if(!selectedCategories.length){
                        alert('카테고리를 선택해주세요');    
                        return;
                    }
                                        
                    var question = $scope.question;
                    var answer = $scope.answer;
                    var explanation = $scope.explanation;
                    
                    var stringWithCategories = '';
                    for(var i=0; i<selectedCategories.length; i++){
                        stringWithCategories = stringWithCategories + selectedCategories[i].cid.toString() + '/';
                    }
                    
                    var stringWithExamples = '';
                    if($scope.answerType == 'multiple'){
                        stringWithExamples = $scope.example1 + '@@' + $scope.example2 + '@@' + $scope.example3 + '@@' + $scope.example4 + '@@';
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
                        
                        $scope.question = '';
                        $scope.answer = '';
                        $scope.explanation = '';
                        $scope.example1 = '';
                        $scope.example2 = '';
                        $scope.example3 = '';
                        $scope.example4 = '';
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
        
    app.directive('showProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/show-problems.html',
            controller: ['$scope', '$http', function($scope, $http){                
                $scope.loadProblems = function(){
                    
//                    var stringWithCategories = '';
//                    for(var i=0; i<selectedCategories.length; i++){
//                        stringWithCategories = stringWithCategories + selectedCategories[i].cid.toString() + '/';
//                    }
//                    
//                    $http.post('/load_problems', {'categories': 'hello'})
//                    .success(function(response){
//
//                        var data = response.data;        
//                        $scope.problems = data;
//                        alert('문제를 성공적으로 불러왔습니다.' + $scope.problems.length);
//                        
//                    }).error(function(response){
//                        
//                        alert('문제를 불러올 수 없습니다. 다시 시도해 주세요.');
//                    });
                    $http.get('/problems').then(function(response){
                        var data = response.data;        
                        $scope.problems = data;
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
            }],
            controllerAs: 'masterProblemsCtrl'
        };
    });
    
    app.directive('selectCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/select-category.html',
            scope: {
                type: '='
            },
//            scope: false,
            controller: ['$scope', '$http', function($scope, $http){
                
                var rowData = [];
                var masterCategory = [];
                
                $http.get('/categories').then(function(response){
                    rowData = response.data;
                    masterCategory = new Category(0, '', '', '');
                    masterCategory.makeCategory(rowData);
                    $scope.categories = masterCategory.categories;
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
                        selectedCategories.splice(theIndex, 1);
                    }else{
                        selectedCategories.push(item);
                    }
                };
                
                this.isSelected = function(item){
                    
                    var cid = item.cid;
                    
                    for(i=0; i<selectedCategories.length; i++){
                        if(selectedCategories[i].cid == cid){
                            return true;   
                        }
                    }
                    return false;
                }
                
                function getIndexOfSelectedCategory (cid){
                    if(selectedCategories.length == 0 || !selectedCategories){
                        return -1;
                    }
                    for(i=0; i<selectedCategories.length; i++){
                        if(selectedCategories[i].cid == cid){
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