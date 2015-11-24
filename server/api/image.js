var router = require('express').Router();
var fs = require('fs');


router.get('/problemImage?', function(request, response){
    var imageName = request.params.name;
    if(!imageName){
        return;
    }
    
    var imageFile = 'public/asset/images/'+imageName;
    
    fs.exists(imageFile, function(exist){
        if(exist){
            response.sendfile(imageFile);
        }else{
            console.log('image no exist');
            response.status(403).send('Sorry! Can not find image');
        }
    });
});

module.exports = router;