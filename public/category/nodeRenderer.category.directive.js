(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('nodesRenderer', nodesRenderer);
    
    function nodesRenderer(){
        return {
            restrict: 'EA',
            templateUrl: 'category/nodeRenderer.category.html'
        };
    }
    
})();