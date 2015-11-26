(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('insertProblem', insertProblem);
    
    function insertProblem(){
        return {
            restrict: 'EA',
            templateUrl: 'problem/insert.problem.html',
            controller: 'insertProblemController'
        };
    }

})();