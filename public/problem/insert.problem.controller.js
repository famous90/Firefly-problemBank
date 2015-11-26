(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('insertProblemController', insertProblemController);
    
    insertProblemController.$inject = ['$scope', '$window', 'dataFactory'];
                                                 
    function insertProblemController($scope, $window, dataFactory){       
        
        // initialize problem
        if(!$scope.problem){
            $scope.problem = new Problem();
        }
         
        $scope.setImageFiles = setImageFiles; 
        $scope.answerTypeButtonTapped = answerTypeButtonTapped; 
        $scope.submitForm = submitForm; 
         
        function setImageFiles(files, type){
            var imageArray = [];
            if(type == 'question'){
                $scope.problem.images.questions = new Array();
                imageArray = $scope.problem.images.questions;
            }else if(type == 'explanation'){
                $scope.problem.images.explanations = new Array();
                imageArray = $scope.problem.images.explanations;
            }

            if(files){
                for(var i=0; i<files.length; i++){
                    var theImageFile = new ImageFile();
                    theImageFile.imageType = 'new';
                    theImageFile.image = files[i];
                    imageArray.push(theImageFile);          
                }
            }
        };
         
        function answerTypeButtonTapped(type){
            if(type != $scope.problem.answerType){
                $scope.problem.changeAnswerType();
            }
        };
         
        function submitForm(questionImages, explanationImages){

            if(!$scope.problem.selections.length){
                alert('카테고리를 선택해주세요');    
                return;
            }
            if(!$scope.problem.question){
                alert('문제 입력은 필수입니다');    
                return;
            }
            if(!$scope.problem.answer){
                alert('답을 입력해주세요');    
                return;
            }
            if(!$scope.problem.explanation){
                alert('해설 입력은 필수입니다');    
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
            
            uploadProblem();
            
            function uploadProblem(){
                dataFactory
                    .insertProblem($scope.problem, imageFiles, formDataNames)
                    .success(function(response){
                        if(imageFiles.length){
                            $window.alert(imageFiles.length + '개 이미지와 문제 업로드 성공');
                        }else {
                            $window.alert('이미지 없는 문제 업로드 성공');
                        }

                    // initialize problem
                        var selections = $scope.problem.selections;
                        $scope.problem = new Problem();
                        $scope.problem.selections = selections;
                        $scope.questionImages = [];
                        angular.element($('#questionImages')[0]).val(null);
                        angular.element($('#explanationImages')[0]).val(null);

                }).error(function(response){
                    $window.alert('업로드에 실패했습니다. 다시 시도해 주세요.');
                });
            }
        };
    }

})();


function ImageFile (data){
    this.imgid, this.pid, this.imageType, this.image, this.location, this.s3_object_key;

    if(arguments.length){
        var data = arguments[0];
        this.imgid = data.imgid;
        this.pid = data.pid;
        this.imageType = data.imageType;
        this.location = data.location;
        this.s3_object_key = data.s3_object_key;
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

