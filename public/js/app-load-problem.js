//(function(){
//    
//    var newApp = angular.module('withdraw', []);
//    
//    var selectedCategories = new Array();
//        
//    app.directive('showProblems', function(){
//        return {
//            restrict: 'E',
//            templateUrl: 'view/show-problems.html',
//            controller: ['$scope', '$http', function($scope, $http){                
//                this.loadProblems = function(){
//                    $http.get('/problems').
//                    then(function(response){
//                        var data = response.data;        
//                        this.problems = data;
//                    });
//                };
//            }],
//            controllerAs: 'masterProblemsCtrl'
//        };
//    });
//    
//})();