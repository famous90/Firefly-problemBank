(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .controller('SolveProblemController', SolveProblemController);
    
    SolveProblemController.$inject = ['dataFactory'];
    
    function SolveProblemController(dataFactory){
        var vm = this;
        vm.step = 'first';
        vm.selections = [];
        vm.selectedExNumber;
        vm.isCorrect = {};
        vm.startTime = {};
        vm.replyForSingle = {};
        vm.noReply = false;
        
        vm.showCategory = showCategory;
        vm.startSolveProblem = startSolveProblem;
        vm.clickExample = clickExample;
        vm.isSelectedExample = isSelectedExample;
        vm.submitReply = submitReply;
        vm.goToPrevious = goToPrevious;
        vm.idontknow = idontknow;
        
        function showCategory(){
            vm.step = 'second';
        }
        
        function startSolveProblem(){
            vm.step = 'third';
            dataFactory.getStartProblemToSolve(vm.selections[0]).then(function(response){ 
                console.log(response);
                setProblemWithData(response.data[0]);
            }, function(response){
                console.error(response);
                alert('다시 시도해 주세요');
            });
        }
        
        function setProblemWithData(data){
            vm.problem = new Problem(data);
            vm.startTime = Date.now();
            vm.isCorrect = {};
            vm.selectedExNumber = 0;
            vm.replyForSingle = "";
            console.log(vm.problem); 
        }
        
        function clickExample(theIndex){
            if(isSelectedExample(theIndex)){
                vm.selectedExNumber = 0;
            } else {
                vm.selectedExNumber = theIndex+1;
            }
        }
        
        function isSelectedExample(theIndex){
            if(vm.selectedExNumber){
                if(vm.selectedExNumber == (theIndex+1)){
                    return true;
                }else return false;   
            } else {
                return false;
            }
        }
        
        function submitReply(){
            var timeDifference = Date.now() - vm.startTime;
            
            if(vm.problem.answerType == 'single'){
                if(typeof vm.replyForSingle == undefined){
                    alert('답을 입력해 주세요');
                    return;
                }
                
                if(vm.problem.answer == vm.replyForSingle){
                    vm.isCorrect = true;
                }else vm.isCorrect = false;
            } else if(vm.problem.answerType == 'multiple'){
                if(!vm.selectedExNumber){
                    alert('답을 선택해 주세요');
                    return;
                }
                
                if(vm.problem.answerOfMultiple == vm.selectedExNumber){
                    vm.isCorrect = true;
                }else vm.isCorrect = false;
            }
            
            // I dont know
            if(vm.noReply){
                vm.isCorrect = false;
            }
                        
            dataFactory.getProblemToSolveWithLastIsCorrect(vm.isCorrect, vm.problem.pid, timeDifference, vm.noReply).then(function(response){
                setProblemWithData(response.data[0]);           
            }, function(response){
                console.error(response);
                alert('다시 시도해 주세요');
            });
        }
        
        function goToPrevious(){
            console.log('go to previous');
        }
        
        function idontknow(){
            if(!vm.noReply){
                vm.replyForSingle = '모름';   
            }else vm.replyForSingle = '';
            
            vm.noReply = !vm.noReply;
        }
    }
                  
})();