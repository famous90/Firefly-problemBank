(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('editCategory', editCategory);
    
    function editCategory(){
        return {
            restrict: 'E',
            templateUrl: 'view/edit-category.html'
        };
    }
})();