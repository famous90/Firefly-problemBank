(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('insertProblemController', insertProblemController);
    
    insertProblemController.$inject = ['$window', 'dataFactory', 'CATEGORY_TYPES'];
                                                 
    function insertProblemController($window, dataFactory, CATEGORY_TYPES){       
        var vm = this;
        // initialize problem
        if(!vm.problem){
            vm.problem = new Problem();
        }
        
        // set answer type
        setAnswerTypeWithType(vm.problem.answerType);  
        vm.answerTypePlaceholder = {
            single: '정답을 입력해 주세요',
            multiple: '정답인 보기를 입력해 주세요'
        }
        
        // set category type
        vm.categoryType = CATEGORY_TYPES.ONLY_SELECT;
        
        vm.setImageFiles = setImageFiles; 
        vm.answerTypeButtonTapped = answerTypeButtonTapped; 
        vm.submitForm = submitForm; 
        vm.setExcelFile = setExcelFile;
        vm.submitExcelFile = submitExcelFile;
        
        function setAnswerTypeWithType(type){
            vm.answerType = type;
        }
         
        function setImageFiles(files, type){
            var imageArray = [];
            if(type == 'question'){
                vm.problem.images.questions = [];
                imageArray = vm.problem.images.questions;
            }else if(type == 'explanation'){
                vm.problem.images.explanations = [];
                imageArray = vm.problem.images.explanations;
            }

            if(files){
                for(var i=0; i<files.length; i++){
                    var theImageFile = {
                        imageType: 'new',
                        image: files[i]
                    }
                    imageArray.push(theImageFile);          
                }
            }
        };
         
        function answerTypeButtonTapped(type){
            if(type == vm.problem.answerType){
                return;
            } else {
                setAnswerTypeWithType(type);
            }
        };
         
        function submitForm(questionImages, explanationImages){

            var formDataNames = [];
            var imageFiles = [];
            
            if(!checkProblemForm()){
                return;
            }
            
            setImageFileAndFormNames();
            uploadProblem(vm.problem, imageFiles, formDataNames);
            
            function setImageFileAndFormNames(){
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
            };
        };
        
        function checkProblemForm(){
            if(!vm.problem.selections.length){
                alert('카테고리를 선택해주세요');    
                return false;
            }
            if(!vm.problem.question){
                alert('문제 입력은 필수입니다');    
                return false;
            }
            if(!vm.problem.answer){
                alert('답을 입력해주세요');    
                return false;
            }
            if(!vm.problem.explanation){
                alert('해설 입력은 필수입니다');    
                return false;
            }
            return true;
        };
        
        function uploadProblem(theProblem, images, imageNames){
            dataFactory
                .insertProblem(theProblem, images, imageNames)
                .success(function(response){
                    if(images.length){
                        $window.alert(images.length + '개 이미지와 문제 업로드 성공');
                    }else {
                        $window.alert('이미지 없는 문제 업로드 성공');
                    }

                // initialize problem
                    var selections = vm.problem.selections;
                    vm.problem = new Problem();
                    vm.problem.selections = selections;
                    vm.questionImages = [];
                    angular.element($('#questionImages')[0]).val(null);
                    angular.element($('#explanationImages')[0]).val(null);

            }).error(function(response){
                $window.alert('업로드에 실패했습니다. 다시 시도해 주세요.');
            });
        };
        
        function setExcelFile(file){
        };
        
        function submitExcelFile(file){
            if(!vm.problem.selections.length){
                alert('카테고리를 선택해주세요');    
                return;
            }
            
            dataFactory.insertProblemsWithExcel(file, vm.problem.selections).then(function(response){
                angular.element($('#problemsExcel')[0]).val(null);
                $window.alert('문제를 성공적으로 입력하였습니다.');
            }, function(response){
                $window.alert('문제 입력에 실패했습니다. 다시 시도해 주세요.');
            });
        };
    } 
})();