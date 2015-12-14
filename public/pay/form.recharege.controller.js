(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('RechargeController', RechargeController);
    
    RechargeController.$inject = [];
    
    function RechargeController() {
        var vm = this;
        
        vm.recharge = recharge;
        
        function recharge(){
            console.log('request recharge');
        }
//        vm.dataLoading = true;
    }
})();