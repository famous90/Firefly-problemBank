(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .service('Session', session);
    
    function session(){
        this.create = create;
        this.destroy = destroy;
        
        function create(sessionId, userId, userRole){
            this.id = sessionId;
            this.userId = userId;
            this.userRole = userRole;
        }
        
        function destroy(){
            this.id = null;
            this.userId = null;
            this.userRole = null;
        }
    }
})();