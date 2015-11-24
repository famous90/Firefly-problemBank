describe('category.factory', function(){
    beforeEach(module('app'))
    varcategoryFactory
    
    beforeEach(inject(function(_categoryFactory_){
        categoryFactory = _categoryFactory_
    }))
    
    describe('#getCategories', function(){
        it('exists', function(){
            expect(categoryFactory.getCategories).to.exist
        })
    })
})