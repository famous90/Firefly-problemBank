(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('problemMasterFactory', problemMasterFactory);
    
    problemMasterFactory.$inject = ['dataFactory', 'arrayFactory'];
    
    function problemMasterFactory(dataFactory, arrayFactory) {
        
        var problemMaster = new ProblemMaster();
        
        return {
            getMasterProblem: getMasterProblem,
            setMasterProblem: setMasterProblem,
            loadProblemsWithCount: loadProblemsWithCount,
            deleteProlblemWithPid: deleteProblemWithPid,
            changeProblem: changeProblem,
            getMasterDataLength: getMasterDataLength
        };
        
        function getMasterProblem(){
            return problemMaster;
        }
        
        function setMasterProblem(data){
            
            var problemData = data.problems;
            var pcdata = data.pcLinks;
            var imagedata = data.problemImages;

            // bind pclink along pid
            var pcLinkArray = arrayFactory.bindPCLinksWithPid(pcdata);

            // bind image along pid
            var problemImageArray = arrayFactory.bindImagesWithPid(imagedata);

            // bind pclinks and images with problems
            var problems = arrayFactory.bindProblemsWithPid(problemData, pcLinkArray, problemImageArray);
            
            problemMaster.masterData = problems;
        }
        
        function loadProblemsWithCount(categories, count, onSuccess, onError) {
            dataFactory.getProblems(categories, count).then(function(response){
                var data = response.data;
                setMasterProblem(data);
                onSuccess();
            }, function(response){
                console.error(response);
                onError();
            });
        }
        
        function deleteProblemWithPid(pid, onSuccess, onError){
            dataFactory.deleteProblem(pid).success(function(response){
                deleteProblem(pid);
                onSuccess();
            }).error(function(response){
                console.error(response);
                onError();
            });
        }
        
        function deleteProblem(pid){
            var indexOfObjectWithPid = getIndexOfPid(pid);
            if(indexOfObjectWithPid){
                problemMaster.masterData.splice(indexOfObjectWithPid, 1);
            }
        }
        
        function changeProblem(item) {
            var indexOfObjectWithPid = getIndexOfPid(item.pid);
            if(indexOfObjectWithPid){
                problemMaster.masterData[indexOfObjectWithPid] = item;    
            }
        }
        
        function getIndexOfPid(pid) {
            if(problemMaster.masterData.length == 0){
                return null;
            }else{
                for(var i=0; i<problemMaster.masterData.length; i++){
                    if(problemMaster.masterData[i].pid == pid){
                        return i;
                    }
                }
                return null;
            }
        }
        
        function getMasterDataLength() {
            return problemMaster.masterData.length;
        }
    }
})();

function ProblemMaster () {
    this.masterData = new Array();
}