(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('CheckModalController', CheckModalController);
    
    CheckModalController.$inject = ['$scope', '$modalInstance', 'item', 'categoryFactory'];
    
    function CheckModalController($scope, $modalInstance, item, categoryFactory) {
        
        $scope.category = item;
        
        $scope.deleteCategory = deleteCategory;
        $scope.cancel = cancel;
        
        function deleteCategory() {    
            categoryFactory.deleteCategory(item, function(data){
                $modalInstance.dismiss('deleted');
                console.log('category deleted');
            }, function(error){
                console.error('category delete error');
            });
        };
        
        function cancel() {
            $modalInstance.dismiss('cancel');
        };
    }
})();