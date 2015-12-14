(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('EditCategoryController', EditCategoryController);
    
    EditCategoryController.$inject = ['CATEGORY_TYPES'];
    
    function EditCategoryController(CATEGORY_TYPES){
        var vm = this;
        vm.categoryType = CATEGORY_TYPES.EDIT;
    }
})();