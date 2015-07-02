(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'flow']);
//    var url = 'http://52.68.87.103:52273';
    var url = 'http://127.0.0.1:52273';
    
    function Category(cid, name, path, relPath) {
        this.cid = cid;
        this.name = name;
        this.path = path;
        this.relativePath = relPath;
        this.selectedCategorySet = [];
        this.categories = [];
        
        this.makeCategory = function(data){
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
    }
    
    app.controller('BankController', ['$http', function($http){
        var bank = this;
        
        $http.get(url+'/categories').then(function(response){
            var data = response.data;
            var masterCategory = new Category(0, '', '', '');
            masterCategory.makeCategory(data);
            bank.categories = masterCategory.categories;
        });
    }]);
    
    app.directive('insertProblem', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/insert-problem.html',
            controller: function(){
            },
            controllerAs: 'problemCtrl'
        };
    });

    app.directive('editCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/edit-category.html',
            controller: ['$http', function($http){
                
                this.submitCategory = function(){
                    
                    var cname = this.cateObject.name;
                    var cpath = this.cateObject.path;
                
                    $http.post(url+'/category', {'path':cpath, 'name':cname}).then(function(){
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
            templateUrl: 'view/select-category.html'
//            controller: function(){
//                this.selectedCidArray = new Array();
//                
//                this.selectCategory = function(cid){
//                    alert(cid);
//                    this.selectedCidArray.push(cid);
//                };
//            },
//            controllerAs: 'selectCateCtrl'
        };
    });
    
    app.directive('nodesRenderer', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/nodes-renderer.html',
            controller: function(){
                this.selectedCidArray = new Array();
                
                this.selectCategory = function(cid){
                    alert(cid);
                    this.selectedCidArray.push(cid);
                };
                
                this.isSelect = function(cid){
                    for(var theId in this.selectedCidArray){
                        if(theId == cid){
                            return 1;
                        }
                    }
                    return null;
                };
            },
            controllerAs: 'nodeCtrl'
        };
    });
    
    app.directive('showProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/show-problems.html',
            controller: ['$scope', '$http', function($scope, $http){
                
                this.problemImage = {};
                
                this.loadProblems = function(){
                    $http.get(url+'/problems').
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