(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('problemMasterFactory', problemMasterFactory);
    
    problemMasterFactory.$inject = ['dataFactory', 'arrayFactory'];
    
    function problemMasterFactory(dataFactory, arrayFactory) {
        
        var masterData = [];
        
        return {
            getMasterProblem: getMasterProblem,
            loadProblemsWithCount: loadProblemsWithCount,
            deleteProlblemWithPid: deleteProblemWithPid,
            changeProblem: changeProblem
        };
        
        function getMasterProblem(){
            return masterData;
        }
        
        function loadProblemsWithCount(categories, count, onSuccess, onError) {
            dataFactory.getProblems(categories, count).then(function(response){
                setMasterProblemWithData(response.data, function(){
                    onSuccess(masterData);
                }, function(err){
                    onError(err);
                });
            }, function(response){
                onError(response);
            });
        }
        
        function setMasterProblemWithData(data, onSuccess, onError){
            var problems = data.problems;
            var pcdata = data.pcLinks;
            var imagedata = data.problemImages;
                        
            if(!pcdata || !pcdata.length){
                console.error('not pclinks');
                onError('no pcLinks');
            }
            if(!problems || !problems.length){
                console.error('no problems');
                onError('no problems');
            }
                        
            bindProblemsWithPid(problems, pcdata, imagedata, function(results){
                masterData = results;
                onSuccess();
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
                masterData.splice(indexOfObjectWithPid, 1);
            }
        }
        
        function changeProblem(item) {
            var indexOfObjectWithPid = getIndexOfPid(item.pid);
            masterData[indexOfObjectWithPid] = item; 
        }
        
        function getIndexOfPid(pid) {
            if(masterData.length == 0){
                return null;
            }else{
                for(var i=0; i<masterData.length; i++){
                    if(masterData[i].pid == pid){
                        return i;
                    }
                }
                return null;
            }
        }
        
        function bindProblemsWithPid(problemData, pclinks, pImages, callback) {
            var problems = [];
            for(var j=0; j<problemData.length; j++){
                var theProblem = new Problem(problemData[j]);
                theProblem.type = 'load';
                
                var i=0;
                while(i<pclinks.length){
                    if(pclinks[i].pid == theProblem.pid){
                        var pclink = pclinks.splice(i, 1)[0];
                        theProblem.selections.push(pclink.cid);
                    }else i++;
                }
                
                var k=0;
                while(k<pImages.length){
                    if(pImages[k].pid == theProblem.pid){
                        var image = pImages.splice(k, 1)[0];
                        theProblem.addImage(image);
                    }else k++;
                }
                
                problems.push(theProblem);
            }
            
            callback(problems);
        }
    }
})();