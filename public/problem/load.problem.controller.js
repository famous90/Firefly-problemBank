(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('loadProblemController', loadProblemController);
    
    loadProblemController.$inject = ['$scope', '$modal', '$log', '$window', 'stringFactory', 'problemMasterFactory'];
    
    function loadProblemController($scope, $modal, $log, $window, stringFactory, problemMasterFactory){                
        $scope.category = {};
        $scope.category.selections = new Array();
        $scope.masterProblem = [];
        $scope.problemType = 'Question';

        $scope.loadProblems = loadProblems; 
        $scope.deleteProblem = deleteProblem;
        $scope.updateProblem = updateProblem;
        $scope.printProblems = printProblems;
        $scope.getExampleNumber = getExampleNumber;
        
        function loadProblems(){
            var categoriesWithJSON = angular.toJson($scope.category.selections);
            var problemNumber = $scope.problemNumber;
            // default problem Number
            if(problemNumber<=0 || problemNumber== null) {
                problemNumber = 20;
            }

            problemMasterFactory.loadProblemsWithCount(categoriesWithJSON, problemNumber, function(){
               $scope.masterProblem = problemMasterFactory.getMasterProblem(); 
            }, function(){
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

        function updateProblem(item) {
            var newProblem = new Problem(item);
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'problem/modal.problem.html',
                controller: 'ModalInstanceCtrl',
                size: 'lg',
                resolve: {
                    item: function () {
                        return newProblem;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $log.info('Modal success');
                problemMasterFactory.changeProblem(selectedItem);
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
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