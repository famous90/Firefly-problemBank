(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('nodesRenderer', nodesRenderer);
    
    function nodesRenderer(){
        return {
            restrict: 'E',
            templateUrl: 'view/nodes-renderer.html'
        };
    }
    
})();