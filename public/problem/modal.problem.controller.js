(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('ModalInstanceCtrl', ModalInstanceCtrl);
        
    ModalInstanceCtrl.$inject = ['$scope', '$modalInstance', 'item', 'arrayFactory', '$window', 'dataFactory'];
    
    function ModalInstanceCtrl($scope, $modalInstance, item, arrayFactory, $window, dataFactory) {
        $scope.problem = item;
        
        $scope.update = updateProblem; 
        $scope.cancel = cancel;
        
        function updateProblem(item) {
            
            arrayFactory.removeCidsOf(item.alterSelections.new, item.alterSelections.exist);
            item.alterSelections.delete = arrayFactory.extractCidsOf(item.alterSelections.delete, item.alterSelections.exist);
            
            var formDataNames = [];
            var imageFiles = [];
            if(item.images.questions.length){
                for(var i=0; i<item.images.questions.length; i++){
                    var imageData = item.images.questions[i];
                    if(imageData.imageType == 'new'){
                        formDataNames.push('questionAttached');    
                        imageFiles.push(imageData.image);   
                    }
                }                        
            }
            if(item.images.explanations.length){
                for(var i=0; i<item.images.explanations.length; i++){
                    var imageData = item.images.explanations[i];
                    if(imageData.imageType == 'new'){
                        formDataNames.push('explanationAttached');
                        imageFiles.push(imageData.image);
                    }
                }                        
            }

            dataFactory
                .updateProblem(item.pid, item, imageFiles, formDataNames)
                .success(function(response){
                    if(imageFiles.length){
                        $window.alert(imageFiles.length + '개 이미지와 문제를 성공적으로 수정하였습니다.');
                    }else {
                        $window.alert('이미지 없는 문제를 성공적으로 수정하였습니다.');
                    }
                    $modalInstance.close($scope.problem);
                    $scope.problem = new Problem();
            }).error(function(response){
                console.log('Modal update error ' +response);
                $window.alert('문제 수정에 실패했습니다. 다시 시도해 주세요.');
            });   
        };

        function cancel() {
            $modalInstance.dismiss('cancel');
        };
    }
   
})();