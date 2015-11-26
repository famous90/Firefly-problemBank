(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('editCategory', editCategory);
    
    function editCategory(){
        return {
            restrict: 'EA',
            templateUrl: 'category/edit.category.html'
        };
    }
})();