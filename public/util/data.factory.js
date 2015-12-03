(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('dataFactory', dataFactory);
    
    dataFactory.$inject = ['$http', 'Upload', '$rootScope'];
    
    function dataFactory($http, Upload, $rootScope){
        return {
            setHeaderAuthorization: setHeaderAuthorization,
            authenticate: authenticate,
            deleteAuthorization: deleteAuthorization,
            createUser: createUser,
            getUsers: getUsers,
            getCategories: getCategories,
            insertCategory: insertCategory,
            deleteCategory: deleteCategory,
            insertProblem: insertProblem,
            getProblems: getProblems,
            updateProblem: updateProblem,
            deleteProblem: deleteProblem
        };
        
        // http header
        function setHeaderAuthorization(authdata){
            $http.defaults.headers.common['Authorization'] = 'Basic';   // jshint ignore:line  
//            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line  
        };
        
        
        // login
        function authenticate(credentials){
            return $http.post('/api/authenticate', credentials);
        }
        
        function deleteAuthorization(uid){
            return $http.delete('/api/authorization/' + uid);
        }
        
        
        // user
        function createUser(user){
            return $http.post('/api/user/create', user);
        }
        
        function updateUser(uid, newUser){
            return $http.put('/api/user/'+uid, newUser);
        }
        
        function getUsers(){
            return $http.post('/api/users', {
                uid: $rootScope.globals.currentUser.uid, 
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        // category
        function getCategories() {
            return $http.get('/categories');
        }
        
        function insertCategory(item) {
            return $http.post('/api/category/create', {
                name: item.name, 
                path: item.path,
                uid: $rootScope.globals.currentUser.uid,
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        function deleteCategory(cid) {
            return $http.post('/api/category/delete', {
                cid: cid,
                uid: $rootScope.globals.currentUser.uid,
                authkey: $rootScope.globals.currentUser.authkey
            });
        }
        
        
        // problem
        function insertProblem(problem, images, imageNames) {
            return Upload.upload({
                url: '/problem',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                data: {
                    problem: problem
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function getProblems(categories, count){
            console.log(categories);
            return $http.post('/load_problems', {
                categories: categories, 
                problemNumber: count
            });
        }
        
        function updateProblem(pid, problem, images, imageNames) {
            return Upload.upload({
                url: '/problem/'+pid,
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                data: {
                    problem: problem
                },
                file: images,
                fileFormDataName: imageNames
            });
        }
        
        function deleteProblem(pid) {
            return $http.delete('/problem/'+pid);
        }
    }
    
})();