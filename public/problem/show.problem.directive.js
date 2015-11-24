(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('showProblem', showProblem);
    
    function showProblem(){
        return {
            restrict: 'EA',
            templateUrl: 'view/show-problem.html',
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
            return theCategory.name;
        };

        function getExampleNumber(index){
            return stringFactory.getCircleNumber(index);
        };
    }
                  
})();