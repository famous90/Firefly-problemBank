(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('LoadProblemController', LoadProblemController);
    
    LoadProblemController.$inject = ['$modal', '$window', 'stringFactory', 'problemMasterFactory', '$rootScope', 'dataFactory', 'CATEGORY_TYPES'];
    
    function LoadProblemController($modal, $window, stringFactory, problemMasterFactory, $rootScope, dataFactory, CATEGORY_TYPES){
        var vm = this;
        vm.categoryType = CATEGORY_TYPES.ONLY_SELECT;
        vm.selectedCategories = [];
        vm.masterProblem = [];
        vm.loadedNumberOfProblems;
        vm.problemType = 'Question';

        vm.loadProblems = loadProblems; 
        vm.deleteProblem = deleteProblem;
        vm.update = update;
        vm.printProblems = printProblems;
        vm.getExampleNumber = getExampleNumber;
        
        function loadProblems(){
            var numberOfProblems = vm.numberOfProblems;
            // default problem Number
            if(numberOfProblems<=0 || numberOfProblems== null) {
                numberOfProblems = 20;
            }

            problemMasterFactory.loadProblemsWithCount(vm.selectedCategories, numberOfProblems, function(problemMaster){
                vm.masterProblem = problemMaster;
                vm.loadedNumberOfProblems = problemMaster.length;
            }, function(error){
                console.error(error);
                alert('문제를 불러오지 못했습니다. 다시 시도해 주세요.');
            });
        };

        function deleteProblem(item){
            problemMasterFactory.deleteProlblemWithPid(item.pid, function(){
                alert('문제를 성공적으로 제거했습니다.');
            }, function(){
                alert('문제 삭제에 실패했습니다. 다시 시도해 주세요.');
            });
        };

        function update(theProblem) {
            
            // problem object insert
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'problem/modal.problem.html',
                controller: 'ModalInstanceCtrl',
                controllerAs: 'ProblemModalVm',
                size: 'lg',
                resolve: {
                    item: function () {
                        var newProblem = new Problem(theProblem);
                        return newProblem;
                    }
                }
            });

            modalInstance.result.then(function (theProblem) {
                problemMasterFactory.changeProblem(theProblem);
            }, function () {
            });
        };

        function printProblems() {
            $window.print();   
        };

        function getExampleNumber(number){
            return stringFactory.getCircleNumber(number);
        };
    }
    
})();