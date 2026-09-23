import test from 'node:test';
import assert from 'node:assert/strict';
import {BREED_OTHER,CAT_BREEDS,DOG_BREEDS,breedsForSpecies} from '../src/breeds.js';

test('el catálogo separa razas de perro y gato y conserva la salida manual',()=>{
 assert.ok(DOG_BREEDS.length>300);
 assert.ok(CAT_BREEDS.length>70);
 assert.ok(DOG_BREEDS.includes('Labrador Retriever'));
 assert.ok(CAT_BREEDS.includes('Siamés'));
 assert.equal(breedsForSpecies('DOG'),DOG_BREEDS);
 assert.equal(breedsForSpecies('CAT'),CAT_BREEDS);
 assert.deepEqual(breedsForSpecies('OTHER'),[]);
 assert.equal(BREED_OTHER,'__OTHER_BREED__');
});
