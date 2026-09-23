import test from 'node:test';
import assert from 'node:assert/strict';
import {vaccineError,vaccineReminder} from '../src/domain.js';

test('validates vaccination dates against the pet profile',()=>{
 assert.equal(vaccineError({vaccineName:'Rabia',administeredOn:'2025-05-01',nextDueOn:'2026-05-01',notes:''},'2024-01-01','2025-12-31'),'');
 assert.match(vaccineError({vaccineName:'',administeredOn:'2025-05-01',nextDueOn:'',notes:''},'2024-01-01','2025-12-31'),/nombre/i);
 assert.match(vaccineError({vaccineName:'Rabia',administeredOn:'2023-12-31',nextDueOn:'',notes:''},'2024-01-01','2025-12-31'),/nacimiento/i);
 assert.match(vaccineError({vaccineName:'Rabia',administeredOn:'2025-05-01',nextDueOn:'2025-04-30',notes:''},'2024-01-01','2025-12-31'),/próxima dosis/i);
});

test('classifies due dates for the health reminders',()=>{
 assert.deepEqual(vaccineReminder(null,'2025-06-01'),{kind:'NONE',label:''});
 assert.deepEqual(vaccineReminder('2025-05-31','2025-06-01'),{kind:'OVERDUE',label:'Vencida'});
 assert.deepEqual(vaccineReminder('2025-06-01','2025-06-01'),{kind:'DUE',label:'Vence hoy'});
 assert.deepEqual(vaccineReminder('2025-06-15','2025-06-01'),{kind:'DUE',label:'Vence en 14 días'});
 assert.deepEqual(vaccineReminder('2025-07-15','2025-06-01'),{kind:'UPCOMING',label:'Próxima: 2025-07-15'});
});
