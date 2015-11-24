var api = require('../support/api')

describe('server.api.category', function(){
    describe('GET /api/categories', function(){
        it('exist', function(done){
            api.get('/api/category').expect(200).end(done)
        })
    })
})
