(function () {
    'use strict';
 
    angular
        .module('problemBank')
        .controller('RegisterController', RegisterController);
 
    RegisterController.$inject = ['dataFactory', '$location', '$rootScope'];
    
    function RegisterController(dataFactory, $location, $rootScope) {
        var vm = this;
 
        vm.register = register;
 
        function register() {
            vm.dataLoading = true;
            dataFactory.createUser(vm.user).then(function (response) {
                console.log('Registration successful');
                alert('성공적으로 가입했습니다. 로그인하고 서비스를 이용해주세요.');
                $location.path('/home');
            }, function(response){
                console.error(response.data);
                if(response.data == 'username duplication'){
                    alert('중복된 이름이 존재합니다. 다른 이름을 사용해주세요.');
                }else{
                    alert('가입하는데 오류가 발생했습니다. 다시 시도해 주세요.')
                }
                vm.dataLoading = false;
            });
        }
    }
 
})();