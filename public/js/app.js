(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'flow', 'ngRoute']);
    
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
            var relativePath = item.relativePath;
            var depth = 0;
            depth = (relativePath.length)/2;
            var relativePathArray = new Array();
            relativePathArray.push(0);
            for(var i=0; i<depth; i++){
                relativePathArray.push(relativePath.charAt(2*i));
            }

            var parentCategory = this;

            for(var j=0; j<=depth; j++){
                var order = relativePathArray[j];

                if(j!=0){
                    if(depth==1){
                        this.categories.push(category);
                    }else{
                        // last leaf
                        if(j == depth){
                            parentCategory.categories.push(category);
                        }   
                    }
                    parentCategory = parentCategory.categories[order];
                }else{
                    parentCategory = this;
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
            controller: ['$scope', '$http', function($scope, $http){
                
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
    
    app.directive('selectCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/select-category.html',
            scope: {
                type: '='
            },
            controller: ['$scope', '$http', '$route', function($scope, $http, $route){
                
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
    
    app.directive('showProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/show-problems.html',
            controller: ['$scope', '$http', function($scope, $http){
                
                this.problemImage = {};
                
                this.loadProblems = function(){
                    $http.get('/problems').
                    then(function(response){
                        var data = response.data;        
                        $scope.problems = data;
                    });
                };
            }],
            controllerAs: 'masterProblemsCtrl'
        };
    });
})();