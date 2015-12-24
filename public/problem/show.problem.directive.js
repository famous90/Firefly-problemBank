(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('showProblem', showProblem);
    
    function showProblem(){
        return {
            restrict: 'EA',
            templateUrl: 'problem/show.problem.html',
            bindToController: {
                problem: '=item',       // problem
                problemIndex: '=index', // the number of the problem
                type: '='               // new, question_only, answer_only, with explanation, all
            },
            controller: ShowProblemController,
            controllerAs: 'ShowProblemVm'
        };
    }
    
    ShowProblemController.$inject = ['categoryFactory', 'stringFactory'];
    
    function ShowProblemController(categoryFactory, stringFactory){
        var vm = this;
        
        vm.getCategoryName = getCategoryName;
        vm.getExampleNumber = getExampleNumber;
        
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