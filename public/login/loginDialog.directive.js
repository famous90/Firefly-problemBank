(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('loginDialog', loginDialog);
    
    loginDialog.$inject = ['AUTH_EVENTS'];
    
    function loginDialog(AUTH_EVENTS){
        return{
            restrict: 'A',
            templateUrl: 'view/loginDialog.html',
            link: function(scope){
                scope.visible = false;
                scope.$on(AUTH_EVENTS.notAuthenticated, showDialog);
                scope.$on(AUTH_EVENTS.sessionTimeout, showDialog);
                
                var shoDialog = shoDialog;
             
                function shoDialog(){
                    scope.visible = true;
                }
            }
        };
    }
})();