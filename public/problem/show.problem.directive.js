(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('showProblem', showProblem);
    
    function showProblem(){
        return {
            restrict: 'EA',
            templateUrl: 'problem/show.problem.html',
            scope: {
                problem: '=item',
                problemIndex: '=index',
                type: '='
            },
            controller: showProblemController
        };
    }
    
    showProblemController.$inject = ['$scope', 'categoryFactory', 'stringFactory'];
    
    function showProblemController($scope, categoryFactory, stringFactory){
        $scope.getCategoryName = getCategoryName;
        $scope.getExampleNumber = getExampleNumber;
        
        function getCategoryName(cid){
            var theCategory = categoryFactory.getCategoryWithCid(cid);
            if(theCategory){
                return theCategory.name;
            }else return 'NO category';
        };

        function getExampleNumber(index){
            return stringFactory.getCircleNumber(index);
        };
    }
                  
})();