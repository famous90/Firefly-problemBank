(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('stringFactory', stringFactory);
    
    function stringFactory(){
        return {
            getCircleNumber: getCircleNumber
        };
        
        function getCircleNumber(index) {
            var baseASCIINumber = 9312 + index - 1;
            return String.fromCharCode(baseASCIINumber);
        }
    }
    
})();