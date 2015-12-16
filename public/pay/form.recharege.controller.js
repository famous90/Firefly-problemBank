(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('RechargeController', RechargeController);
    
    RechargeController.$inject = ['dataFactory'];
    
    function RechargeController(dataFactory) {
        var vm = this;
        
        vm.recharge = recharge;
        
        function recharge(amount){
            vm.dataLoading = true;
            console.log('request recharge');
            dataFactory.recharge(amount).then(function(response){
                console.log('charged '+amount);
                alert('충전을 완료하였습니다.');
                vm.amount = {};
                vm.dataLoading = false;
            }, function(response){
                vm.error = '충전 중 에러가 발생했습니다. 다시 시도해 주세요.';
                vm.dataLoading = false; 
            });
        }
    }
})();