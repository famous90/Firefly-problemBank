(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'ngFileUpload', 'math', 'ngRoute']);
    
//    app.config(function($routeProvider) {
//        $routeProvider
//
//            // route for the home page
//            .when('/', {
//                templateUrl : 'view/home.html',
//                controller  : 'mainController'
//            })
//
//            // route for the about page
//            .when('/about', {
//                templateUrl : 'view/about.html',
//                controller  : 'aboutController'
//            })
//
//            // route for the contact page
//            .when('/contact', {
//                templateUrl : 'view/contact.html',
//                controller  : 'contactController'
//            });
//    });
    
//    app.controller('mainController', function($scope) {
//        // create a message to display in our view
//        $scope.message = 'Everyone come and see how good I look!';
//    });
//
//    app.controller('aboutController', function($scope) {
//        $scope.message = 'Look! I am an about page.';
//    });
//
//    app.controller('contactController', function($scope) {
//        $scope.message = 'Contact us! JK. This is just a demo.';
//    });
    
    app.factory('stringFactory', function(){
        
        function getCircleNumber(index) {
            var baseASCIINumber = 9312 + index - 1;
            return String.fromCharCode(baseASCIINumber);
        };
        
        return {
            getCircleNumber: getCircleNumber
        };
    });
    
    app.factory('httpFactory', ['$http', function($http){
        
        function getHttp(url) {
            return $http.get(url);
        };
        
        return {
            getHttp: getHttp    
        };    
    }]);
    
    app.factory('categoryFactory', ['$http', '$q', function($http, $q){
        
        var masterCategory = new Category(0, '', '', '');
        var rowCategory = [];
        var deferred = $q.defer();
                
        $http.get('/categories').then(function(response){
            rowCategory = response.data;
            masterCategory.makeCategory(response.data);
            deferred.resolve({
                rowData: rowCategory,
                masterCategory: masterCategory
            });
        });
        
        function addCategory(item) {
            $http.post('/category', {'parentId':item.parentId, 'name':item.name, 'path':item.absPath, 'parentRelativePath': item.relPath})
            .success(function(response){
                alert('카테고리를 성공적으로 추가했습니다.');
            }).error(function(response){
                alert('카테고리를 새로 만들지 못했습니다. 다시 시도해 주세요.');
            });
        }
        
        function getCategory(cid) {
            for(var i=0; i<rowCategory.length; i++){
                if(rowCategory[i].cid == cid){
                    return rowCategory[i];
                }
            }
            return null;
        }
        
        function getCategoryName(cid) {
            for(var i=0; i<rowCategory.length; i++){
                if(rowCategory[i].cid == cid){
                    return rowCategory[i].name;
                }
            }
            return '';
        }
        
        function getCidIndexOf(items, cid) {
            return items.indexOf(cid);
        }
        
        function removeCidOf(items, cid) {
            var theIndex = items.indexOf(cid);
            if(theIndex != -1){
                items.splice(theIndex, 1);
            }
        }
        
        function removeCidsOf(items, cids) {
            for(var i=0; i<cids.length; i++){
                var theIndex = items.indexOf(cids[i]);
                if(theIndex != -1){
                    items.splice(theIndex, 1);
                }
            }
        }
        
        function extractCidsOf(items, cids) {
            var newItems = new Array();
            for(var i=0; i<cids.length; i++){
                if(items.indexOf(cids[i]) != -1){
                    newItems.push(cids[i]);
                }
            }
            return newItems;
        }
        
        function insertCategory(item) {
            masterCategory.insertCategory(item);
        }
        
        function deleteCategory(item) {
            masterCategory.deleteCategory(item);
        }
        
        return {
            getCategories: deferred.promise,
            getCategory: getCategory,
            getCategoryName: getCategoryName,
            getCidIndexOf: getCidIndexOf,
            removeCidOf: removeCidOf,
            removeCidsOf: removeCidsOf,
            extractCidsOf: extractCidsOf,
            insertCategory: insertCategory,
            deleteCategory: deleteCategory
        };
    }]);
    
    function Category(cid, name, path) {
        this.cid = cid;
        this.name = name;
        this.path = path;
        this.selectedCategorySet = [];
        this.categories = [];
    }
    
    Category.prototype.makeCategory = function(data){
        for(var k=0; k<data.length; k++){
            var item = data[k];
            var category = new Category(item.cid, item.name, item.path);
            
            var absPath = item.path;
            var parentIdsArray = new Array();
            
            
            // separate parents ids
            var tempId = '';
            for(i=0 ;i<absPath.length; i++){
                if(absPath.charAt(i)=='/'){
                    parentIdsArray.push(tempId);
                    tempId = '';
                }else{
                    tempId = tempId.concat(absPath.charAt(i));
                }
            }
            
            var parentCategory = this;
            
            for(var j=0; j<=parentIdsArray.length; j++){
                
                var parentId = parentIdsArray[j];

                // last leaf
                if(j == parentIdsArray.length){
                    parentCategory.categories.push(category);
                }else{
                    // parentCategory change
                    for(var l=0; l<parentCategory.categories.length; l++){
                        if(parentCategory.categories[l].cid == parentId){
                            parentCategory = parentCategory.categories[l];
                        }
                    }        
                }   
            }            
        }
    };
    
    Category.prototype.getParentId = function(){
        
        if(this.path.length && this.path){

            var parentId = {};
            var pathStringLength = this.path.length;
            var lastSlashIndex = pathStringLength - 1;
            var beforeLastSlashIndex = lastSlashIndex - 1;
            
            var parentIdFirstIndex = 0;
            var parentIdLength = 0;
        
            for(i=0; i<lastSlashIndex; i++){
                if(beforeLastSlashIndex == 0){

                    parentIdLength = lastSlashIndex;
                    parentIdFirstIndex = 0;
                    break;

                }else if(this.path.charAt(beforeLastSlashIndex) == '/'){

                    parentIdFirstIndex = beforeLastSlashIndex + 1;
                    parentIdLength = lastSlashIndex - parentIdFirstIndex;
                    break;

                }else {
                    beforeLastSlashIndex--;
                }
            }
            
            parentId = this.path.substr(parentIdFirstIndex, parentIdLength);
            
            return parentId;
            
        }else return 0;
    };
    
    Category.prototype.insertCategory = function(item){
        var parentIdsArray = new Array();
            
        // separate parents ids
        var tempId = '';
        for(i=0 ;i<item.path.length; i++){
            if(item.path.charAt(i)=='/'){
                parentIdsArray.push(tempId);
                tempId = '';
            }else{
                tempId = tempId.concat(item.path.charAt(i));
            }
        }

        var parentCategory = this;

        for(var j=0; j<=parentIdsArray.length; j++){

            var parentId = parentIdsArray[j];

            // last leaf
            if(j == parentIdsArray.length){
                parentCategory.categories.push(item);
            }else{
                // parentCategory change
                for(var l=0; l<parentCategory.categories.length; l++){
                    if(parentCategory.categories[l].cid == parentId){
                        parentCategory = parentCategory.categories[l];
                    }
                }        
            }   
        }
    };
    
    Category.prototype.deleteCategory = function(item){
        var cid = item.cid;
        
        // separate parents ids
        var tempId = '';
        var pathIds = new Array();
        for(i=0 ;i<item.path.length; i++){
            if(item.path.charAt(i)=='/'){
                pathIds.push(tempId);
                tempId = '';
            }else{
                tempId = tempId.concat(item.path.charAt(i));
            }
        }
        pathIds.push(item.cid);
        
        var parentCategory = this;
        for(var j=0; j<pathIds.length; j++){
            var theId = pathIds[j];
            for(var i=0; i<parentCategory.categories.length; i++){
                var theCategory = parentCategory.categories[i];
                if(theCategory.cid == theId){
                    // last id
                    if(theId == pathIds[pathIds.length - 1]){
                        parentCategory.categories.splice(i, 1);
                    }else{
                        parentCategory = theCategory;
                    }
                }
            }
        }
    };
    
    function ImageFile (data){
        this.imgid = '', this.pid = '', this.name = '', this.imageType = '', this.image;
        
        if(arguments.length){
            var data = arguments[0];
            this.imgid = data.imgid;
            this.pid = data.pid;
            this.name = data.name;
            this.imageType = data.imageType;
            this.image;
        }
    }
    
    function Problem (){
        
        this.pid = '', this.question = '', this.answer = '', this.explanation = '', this.answerType = 'single', this.answerPlaceholder = '정답을 입력해 주세요', this.examples = [], this.notAnswerExamples = [];
        this.type = 'new';
        this.selections = new Array();
        this.alterSelections = {
            new: [],
            delete: [],
            exist: []
        };
        this.images = {
            questions: [],
            explanations: []
        };
        this.answerOfMultiple = 0;
        
        if(arguments.length){
            var data = arguments[0];
            this.pid = data.pid;
            this.question = data.question;
            this.answer = data.answer;
            this.explanation = data.explanation;
            this.answerType = data.answerType;
            this.setNotAnswerExamples(data.notAnswerExamples);
            if(data.type){
                this.type = data.type;
            }
            if(data.selections){
                this.selections = data.selections;
                for(var i=0; i<data.selections.length; i++){
                    this.alterSelections.exist.push(data.selections[i]);
                }
            }
            if(data.images){
                this.images = data.images;
            }
        }else {
            this.setNotAnswerExamples('');
        }
    }
    
    Problem.prototype.setNotAnswerExamples = function (jsonExamples) {
        if(this.answerType == 'multiple'){
            this.answerPlaceholder = '정답인 보기를 입력해 주세요';
            this.notAnswerExamples = angular.fromJson(jsonExamples);
            this.setExamples();
        }else{
            this.notAnswerExamples = [{content:''}, {content:''}, {content:''}, {content:''}];
        }
    };
    
    Problem.prototype.setExamples = function () {
        for(var i=0; i<this.notAnswerExamples.length; i++){
            this.examples.push(this.notAnswerExamples[i]);
        }
        this.insertAnswerToExamples();
    };
    
    Problem.prototype.shuffleExamples = function () {
        var currentIndex = this.examples.length, tempExample, randomIndex ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            tempExample = this.examples[currentIndex];
            this.examples[currentIndex] = this.examples[randomIndex];
            this.examples[randomIndex] = tempExample;
        }
    }
    
    Problem.prototype.insertAnswerToExamples = function () {
        var countOfExamples = this.notAnswerExamples.length + 1;
        var answerIndex = Math.floor(Math.random() * countOfExamples);
        
        this.answerOfMultiple = answerIndex + 1;
        var answerExample = {
            content: this.answer,
            type: 'answer'
        };
        this.examples.splice(answerIndex, 0, answerExample);
    }
    
    Problem.prototype.changeAnswerType = function(){
        if(this.answerType == 'single'){
            this.answerType == 'multiple';
            this.answerPlaceholder = '정답인 보기를 입력해 주세요';        
        }else {
            this.answerType == 'single';
            this.answerPlaceholder = '정답을 입력해 주세요';        
        }  
    };
    
    Problem.prototype.getExamplesToJson = function() {
        if(this.answerType == 'single'){
            return '';
        }else {
            return angular.toJson(this.notAnswerExamples);
        }
    };
    
    Problem.prototype.getValuesToJson = function(){
        var jsonArray = {
            question: this.question,
            answer: this.answer,
            explanation: this.explanation,
            categories : this.selections,
            notAnswerExamples : this.getExamplesToJson(),
            answerType : this.answerType,
            alterCategories: this.alterSelections
        };
        
        return angular.toJson(jsonArray);
    };
    
    Problem.prototype.getSelectionCidOf = function(cid){
        if(this.selections.length){
            for(i=0; i<this.selections.length; i++){
                if(this.selections[i].cid == cid){
                    return i;
                }
            }
        } 
        return -1;
    };
    
    Problem.prototype.selectedCidOf = function (item){
        var theIndex = this.getSelectionCidOf(item.cid);
        if(theIndex != -1){
            this.selections.push(item);
            this.insertSelection(item);
        }else{
            this.selections.splice(theIndex, 1);
            this.removeSelection(item);
        }
    }
    
    Problem.prototype.insertSelection = function (item){
        if(this.alterSelections.delete.length){
            for(var i=0; i<this.alterSelections.delete.length; i++){
                if(this.alterSelections.delete[i].cid == item.cid){
                    this.alterSelections.delete.splice(i, 1);
                }
            }   
        }
        this.alterSelections.new.push(item);
    }
    
    Problem.prototype.removeSelection = function (item){
        if(this.alterSelections.new.length){
            for(var i=0; i<this.alterSelections.new.length; i++){
                if(this.alterSelections.new[i].cid == item.cid){
                    this.alterSelections.new.splice(i, 1);
                }
            }   
        }
        this.alterSelections.delete.push(item);
    }
    
    
        
    function ProblemMaster () {
        this.masterData = new Array();
    }
    
    ProblemMaster.prototype.getLastObject = function(){
        return this.masterData[this.masterData.length - 1];
    };
    
    ProblemMaster.prototype.getObjectPidOf = function(pid){
        if(this.masterData.length == 0){
            return null;
        }else{
            for(var i=0; i<this.masterData.length; i++){
                if(this.masterData[i].pid == item.pid){
                    return this.masterData[i];
                }
            }
            return null;
        }
    }
    
    ProblemMaster.prototype.push = function (item){
        this.masterData.push(item);
    };
    
    ProblemMaster.prototype.changeProblem = function (item) {
        if(this.masterData.length == 0){
            return;
        }
        
        for(var i=0; i<this.masterData.length; i++){
            if(this.masterData[i].pid == item.pid){
                this.masterData[i] = item;
            }
        }  
    };
    
    ProblemMaster.prototype.setMasterProblem = function (data){
        var problemData = data.problems;
        var pcdata = data.pcLinks;
        var imagedata = data.problemImages;
        
        function pcSet (){
            this.pid;
            this.cids = new Array();
        }
        var pcLinkArray = new Array();
        var thePcSet = new pcSet();
        for(var i=0; i<pcdata.length; i++){
            var theData = pcdata[i];
            if(i == 0){
                thePcSet.pid = theData.pid;
            }else if(theData.pid != thePcSet.pid){
                pcLinkArray.push(thePcSet);
                thePcSet = new pcSet();
                thePcSet.pid = theData.pid;
            }
            thePcSet.cids.push(theData.cid);
            if(i == pcdata.length-1){
                pcLinkArray.push(thePcSet);
            }
        }
        
        function imageSet () {
            this.pid = {};
            this.questions = new Array();
            this.explanations = new Array();
        }
        
        imageSet.prototype.addImage = function (data){
            if(data.imageType == 'question'){
                this.questions.push(data);
            }else if(data.imageType == 'explanation'){
                this.explanations.push(data);
            }
        };
        
        var problemImageArray = new Array();
        var theImageSet = new imageSet();
        if(imagedata.length){
            for(var i=0; i<imagedata.length; i++){
                var theData = imagedata[i];
                if(i == 0){
                    theImageSet.pid = theData.pid;
                }else if(theData.pid != theImageSet.pid){
                    problemImageArray.push(theImageSet);
                    theImageSet = new imageSet();
                    theImageSet.pid = theData.pid;
                }
                var theImageFile = new ImageFile(theData);
                theImageSet.addImage(theImageFile);
                if(i == imagedata.length-1){
                    problemImageArray.push(theImageSet);
                }
            }
        }
    
        var problems = [];
        angular.forEach(problemData, function(problem){
            var theProblem = new Problem(problem);
            theProblem.type = 'load';
            angular.forEach(pcLinkArray, function(theSet){
                if(theSet.pid == theProblem.pid){
                    theProblem.selections = theSet.cids;
                }
            });
            
            angular.forEach(problemImageArray, function(theSet){
                if(theSet.pid == theProblem.pid){
                    theProblem.images.questions = theSet.questions;
                    theProblem.images.explanations = theSet.explanations;
                }
            });
            
            problems.push(theProblem);
        });
        this.masterData = problems;
    };
    
    ProblemMaster.prototype.getLength = function (){
        return this.masterData.length;  
    };
    
    ProblemMaster.prototype.getMasterData = function (){
        return this.masterData;  
    };
        
    app.controller('BankController', ['$scope', '$http', function($scope, $http){
        var bank = this;
    }]);
    
    app.directive('insertProblem', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/insert-problem.html',
            controller: ['$scope', '$http', 'Upload', '$window', function($scope, $http, Upload, $window){       
                
                $scope.setImageFiles = function(files, type){
                    
                    var imageArray = [];
                    if(type == 'question'){
                        $scope.problem.images.questions = new Array();
                        imageArray = $scope.problem.images.questions;
                    }else if(type == 'explanation'){
                        $scope.problem.images.explanations = new Array();
                        imageArray = $scope.problem.images.explanations;
                    }
                    
                    angular.forEach(files, function(theImage){
                        var theImageFile = new ImageFile();
                        theImageFile.imageType = 'new';
                        theImageFile.image = theImage;
                        imageArray.push(theImageFile);      
                    });
                };
                
                if($scope.problem){
                }else {
                    $scope.problem = new Problem();
                }
                                
                $scope.answerTypeButtonTapped = function(type){
                    if(type != $scope.problem.answerType){
                        $scope.problem.changeAnswerType();
                    }
                };
                
                $scope.submitForm = function(questionImages, explanationImages){
                    
                    if(!$scope.problem.selections.length){
                        alert('카테고리를 선택해주세요');    
                        return;
                    }
                    
                    var formDataNames = [];
                    var imageFiles = [];
                    if(questionImages){
                        for(var i=0; i<questionImages.length; i++){
                            formDataNames.push('questionAttached');    
                            imageFiles.push(questionImages[i]);
                        }                        
                    }
                    if(explanationImages){
                        for(var i=0; i<explanationImages.length; i++){
                            formDataNames.push('explanationAttached');
                            imageFiles.push(explanationImages[i]);
                        }                        
                    }
                    
                    $scope.upload = Upload.upload({
                        url: '/problem',
                        method: 'POST',
                        headers: {
                            'Content-Type': undefined
                        },
                        fields: {
                            data: $scope.problem.getValuesToJson()
                        },
                        file: imageFiles,
                        fileFormDataName: formDataNames
                    }).success(function(response){
                        
                        if(imageFiles.length){
                            $window.alert(imageFiles.length + '개 이미지와 문제 업로드 성공');
                        }else {
                            $window.alert('이미지 없는 문제 업로드 성공');
                        }
                        
                        var selections = $scope.problem.selections;
                        $scope.problem = new Problem();
                        $scope.problem.selections = selections;
//                        $scope.problem = new Problem({selections: selections});
                        $scope.questionImages = [];
                        angular.element($('#questionImages')[0]).val(null);
                        angular.element($('#explanationImages')[0]).val(null);
                        
                    }).error(function(response){
                        $window.alert('업로드에 실패했습니다. 다시 시도해 주세요.');
                    });   
                };
                
            }],
            controllerAs: 'problemCtrl'
        };
    });

    app.directive('editCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/edit-category.html',
            controller: ['$scope', '$http', function($scope, $http){
                                
                $scope.submitCategory = function(){
                    
                    var cname = this.cateObject.name;
                    var cpath = this.cateObject.path;
                
                    $http.post('/category', {'path':cpath, 'name':cname}).
                    success(function(response){
                        alert('request complete');
                        this.cateObject = {};
                    }).
                    error(function(response){
                        
                    });
                };            
            }],
            controllerAs: 'cateCtrl'
        };
    });
        
    app.directive('loadProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/load-problems.html',
            controller: ['$scope', '$http', '$modal', '$log', 'categoryFactory', '$window', 'stringFactory', function($scope, $http, $modal, $log, categoryFactory, $window, stringFactory){                
                $scope.category = {};
                $scope.category.selections = new Array();
                $scope.masterProblem = [];
                $scope.problemType = 'Question';
                    
                $scope.loadProblems = function(){
                    
                    var problemNumber = $scope.problemNumber;
                    // default problem Number
                    if(problemNumber<=0 || problemNumber== null) {
                        problemNumber = 20;
                    }
                    
                    $http.post('/load_problems', {'categories': angular.toJson($scope.category.selections), 'problemNumber':problemNumber})
                    .then(function(response){

                        var data = response.data;
                        console.log(data);
                        
                        $scope.masterProblem = new ProblemMaster();
                        $scope.masterProblem.setMasterProblem(data);
                        
                        console.log(JSON.parse(JSON.stringify($scope.masterProblem)));
                    });
                };
                
                $scope.deleteProblem = function(item){
                    
                    $http.delete('/problem/'+item.pid)
                    .success(function(response){
                        alert('문제를 성공적으로 제거했습니다.');
                    }).error(function(response){
                        alert('문제 삭제에 실패했습니다. 다시 시도해 주세요.');
                    });
                };
                
                $scope.updateProblem = function (item) {
                    
                    // problem deep copy
                    var newProblem = new Problem(jQuery.extend(true, {}, item));
//                    var newProblem = new Problem(item);
                    
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'view/edit-problem-modal.html',
                        controller: 'ModalInstanceCtrl',
                        size: 'lg',
                        resolve: {
                            item: function () {
                                return newProblem;
                            }
                        }
                    });

                    modalInstance.result.then(function (selectedItem) {
                        $log.info('Modal success');
                        $scope.masterProblem.changeProblem(selectedItem);
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                };
                
                $scope.printProblems = function() {
                    $window.print();   
                };
                
                $scope.getExampleNumber = function (number){
                    return stringFactory.getCircleNumber(number);
                };

            }],
            controllerAs: 'masterProblemsCtrl'
        };
    });
    
    
    app.controller('ModalInstanceCtrl', ['$scope', '$http', '$modalInstance', 'item', 'categoryFactory', 'Upload', '$window', function ($scope, $http, $modalInstance, item, categoryFactory, Upload, $window) {
        $scope.problem = item;
        $scope.update = function (item) {
            
            categoryFactory.removeCidsOf(item.alterSelections.new, item.alterSelections.exist);
            item.alterSelections.delete = categoryFactory.extractCidsOf(item.alterSelections.delete, item.alterSelections.exist);
            
            var formDataNames = [];
            var imageFiles = [];
            if(item.images.questions.length){
                for(var i=0; i<item.images.questions.length; i++){
                    var imageData = item.images.questions[i];
                    if(imageData.imageType == 'new'){
                        formDataNames.push('questionAttached');    
                        imageFiles.push(imageData.image);   
                    }
                }                        
            }
            if(item.images.explanations.length){
                for(var i=0; i<item.images.explanations.length; i++){
                    var imageData = item.images.explanations[i];
                    if(imageData.imageType == 'new'){
                        formDataNames.push('explanationAttached');
                        imageFiles.push(imageData.image);
                    }
                }                        
            }

            var url = '/problem/'+item.pid;
            $scope.upload = Upload.upload({
                url: url,
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                fields: {
                    data: item.getValuesToJson()
                },
                file: imageFiles,
                fileFormDataName: formDataNames
            }).success(function(response){

                if(imageFiles.length){
                    $window.alert(imageFiles.length + '개 이미지와 문제를 성공적으로 수정하였습니다.');
                    $modalInstance.close($scope.problem);
                }else {
                    $window.alert('이미지 없는 문제를 성공적으로 수정하였습니다.');
                }

                $scope.problem = new Problem();
            }).error(function(response){
                console.log('Modal update error ' +response);
                $window.alert('문제 수정에 실패했습니다. 다시 시도해 주세요.');
            }); 
            
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
    
    app.directive('showProblem', function(){
        return {
            restrict: 'EA',
            templateUrl: 'view/show-problem.html',
            scope: {
                problem: '=item',
                problemIndex: '=index',
                type: '='
            },
            controller: ['$scope', 'categoryFactory', 'stringFactory', function($scope, categoryFactory, stringFactory){
                $scope.getCategoryName = function (cid){
                    return categoryFactory.getCategoryName(cid);
                };
                
                $scope.getExampleNumber = function (index){
                    return stringFactory.getCircleNumber(index);
                };
            }]
        };
    });
    
    app.directive('selectCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/select-category.html',
            scope: {
                type: '=',
                selections: '=',
                alters: '='
            },
            controller: ['$scope', '$http', 'categoryFactory', '$modal', function($scope, $http, categoryFactory, $modal){
                $scope.categories = [];
                categoryFactory.getCategories.then(function(data){
                    $scope.categories = data.masterCategory.categories;
                    console.log(JSON.parse(JSON.stringify($scope.categories)));
                }, function(data){
                    alert('카테고리를 불러오지 못했습니다. 다시 시도해 주세요.');
                });
                
                $scope.addBroCategory = function(item){
                    var name = item.newBroCategoryName;
                    var theCategory = new Category(item.cid, item.name, item.path);
                    var parentId = theCategory.getParentId();
                    var parentRelativePath = '';
                    if(parentId != 0){
                        parentRelativePath = rowData[parentId -1].relativePath;   
                    }
                      
                    httpPostCategory(parentId, name, theCategory.path, function(response){
                        var newCid = response.cid;
                        var newCategory = new Category(newCid, name, theCategory.path);
                        categoryFactory.insertCategory(newCategory);
                        
                        item.newBroCategoryName = '';
                        item.isCollapsed = !item.isCollapsed;
                    });
                };
                
                $scope.addChildCategory = function(item){
                    var name = item.newChildCategoryName;
                    var newPath = item.path + item.cid.toString() + '/';
                    httpPostCategory(item.cid, name, newPath, function(response){
                        var newCid = response.cid;
                        var newCategory = new Category(newCid, name, newPath);
                        categoryFactory.insertCategory(newCategory);
                        
                        item.newChildCategoryName = '';
                        item.isChildCollapsed = !item.isChildCollapsed;
                    });
                };
                
                $scope.deleteCategory = function(item){
                    
                    var checkModal = $modal.open({
                        animation: true,
                        templateUrl: 'view/check-modal.html',
                        controller: 'CheckModalCtrl',
                        size: 'sm',
                        resolve: {
                            item: function () {
                                return item;
                            }
                        }
                    });

                    checkModal.result.then(function (selectedItem) {
                        console.log('Check Modal Success');
                        categoryFactory.deleteCategory(selectedItem);
                    }, function () {
                        console.error('Modal dismissed at: ' + new Date());
                    });
                };
                
                $scope.selectCategory = function(cid){
                    
                    var theIndex = $scope.selections.indexOf(cid);
                     
                    if(theIndex != -1){
                        // already has category
                        $scope.selections.splice(theIndex, 1);
                        if($scope.alters){
                            categoryFactory.removeCidOf($scope.alters.new, cid);
                            categoryFactory.removeCidOf($scope.alters.delete, cid);
                            $scope.alters.delete.push(cid);    
                        }
                        
                    }else{
                        // not have category
                        $scope.selections.push(cid);
                        if($scope.alters){
                            categoryFactory.removeCidOf($scope.alters.delete, cid);
                            $scope.alters.new.push(cid);   
                        }
                    }
                };
                
                $scope.isSelected = function(cid){
                    return $scope.selections.indexOf(cid);
                }
                
                function httpPostCategory (parentId, name, absPath, callback){
                    $http.post('/category', {'parentId':parentId, 'name':name, 'path':absPath})
                    .success(function(response){
                        alert('카테고리를 성공적으로 입력했습니다.');
                        callback(response);
                    }).error(function(response){
                        alert('카테고리를 입력하지 못했습니다. 다시 시도해 주세요.');
                    });
                };
                
                $scope.clickedAddChildCategory = function(item){
                    if(!item.nodeCollapsed){
                        item.nodeCollapsed = !item.nodeCollapsed;
                    }
                    if(item.isCollapsed){
                        item.isCollapsed = !item.isCollapsed;
                    }
                    item.isChildCollapsed = !item.isChildCollapsed; 
                };
                
                $scope.clickedAddBroCategory = function(item){
                    item.isCollapsed = !item.isCollapsed;
                    if(item.isChildCollapsed){
                        item.isChildCollapsed = !item.isChildCollapsed; 
                    }
                }

            }],
            controllerAs: 'selectCategoryCtrl'
        };
    });
    
    app.controller('CheckModalCtrl', ['$scope', '$http', '$modalInstance', 'item', function ($scope, $http, $modalInstance, item) {
        
        $scope.category = item;
        
        $scope.deleteCategory = function () {
            
            $http.delete('/category/'+item.cid)
            .success(function(response){
                $modalInstance.close(item);  
            }).error(function(response){
                alert('카테고리를 삭제하지 못했습니다. 다시 시도해 주세요.');
            });
        };
        
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
    
    app.directive('nodesRenderer', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/nodes-renderer.html'
        };
    });
    
    app.directive('imageFrame', function(){
        return {
            restrict: 'EA',
            templateUrl: 'view/image-frame.html',
            scope: {
                imageFile: '=',
                width: '='
            }
        };
    });
    
})();