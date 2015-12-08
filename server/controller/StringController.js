function StringController (){
}

StringController.prototype.getQueryForMultiCondition = getQueryForMultiCondition;
StringController.prototype.getQueryForMultiConditionInProblems = getQueryForMultiConditionInProblems;
StringController.prototype.getUpdateLogWithUid = getUpdateLogWithUid;

function getQueryForMultiCondition(array, type){
    
    var query = "(";
    for(var i=0; i<array.length; i++){
        if(i>0){
            query += ", ";
        }
        
        if(type == 'string'){
            query += "'";   
        }
        query += array[i];
        if(type == 'string'){
            query += "'";   
        }
    }
    query += ")";
    
    return query;
};

function getQueryForMultiConditionInProblems(problems){
    
    var query = "(";
    for(var i=0; i<problems.length; i++){
        if(i>0){
            query += ", ";
        }
        
        query += problems[i].pid;
    }
    query += ")";
    
    return query;
};

function getUpdateLogWithUid(uid, type){
    var now = new Date();
    var updateInfo = {};
    if(type == 'create'){
        updateInfo = {createdAt:now.getTime(), createdBy:uid};   
    }else {
        updateInfo = {updatedAt:now.getTime(), updatedBy:uid};
    }
    var updatedLog = JSON.stringify(updateInfo);
    
    return updatedLog;
}

module.exports = StringController;