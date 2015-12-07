function StringController (){
}

StringController.prototype.getQueryForMultiCondition = getQueryForMultiCondition;
StringController.prototype.getQueryForMultiConditionInProblems = getQueryForMultiConditionInProblems;

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

module.exports = StringController;