(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('insertProblem', insertProblem);
    
    function insertProblem(){
        return {
            restrict: 'EA',
            bindToController: {
//                categories: '=',
                problem: '='
            },
            templateUrl: 'problem/insert.problem.html',
            controller: 'insertProblemController',
            controllerAs: 'InsertProblemVm'
        };
    }

})();