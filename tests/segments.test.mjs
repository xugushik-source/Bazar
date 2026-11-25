import test from 'node:test';
import assert from 'node:assert/strict';
import {segmentsOf,customersCsv,segmentLabels,segmentRules} from '../src/customers.mjs';
import {sourceFromQuery} from '../public/attribution.js';

const day=n=>new Date(Date.UTC(2026,10,1)+n*864e5).toISOString();
const base=(over)=>({completed:0,first_completed_at:null,last_completed_at:null,source:'direct',...over});
const NOW=Date.UTC(2026,10,30);

test('one completed order is «one_order», cancelled orders are not counted', ()=>{
 assert.deepEqual(segmentsOf(base({completed:1,first_completed_at:day(0),last_completed_at:day(0)}),NOW).filter(k=>k!=='lapsed'),['one_order']);
 assert.deepEqual(segmentsOf(base({completed:0}),NOW),[]);
});

test('three completed orders about weekly make a regular buyer who is also recurring', ()=>{
 // three orders over 14 days: an average gap of 7 days
 const s=segmentsOf(base({completed:3,first_completed_at:day(-14),last_completed_at:day(0)}),NOW);
 assert.ok(s.includes('regular'));assert.ok(s.includes('recurring'));assert.ok(!s.includes('one_order'));
});

test('three completed orders spread over months are regular but not recurring', ()=>{
 const s=segmentsOf(base({completed:3,first_completed_at:day(-200),last_completed_at:day(-10)}),NOW);
 assert.ok(s.includes('regular'));assert.ok(!s.includes('recurring'));
});

test('a buyer whose last completed order is older than the lapse window is «lapsed»', ()=>{
 const old=new Date(NOW-(segmentRules.lapsedDays+1)*864e5).toISOString();
 assert.ok(segmentsOf(base({completed:1,first_completed_at:old,last_completed_at:old}),NOW).includes('lapsed'));
 const fresh=new Date(NOW-(segmentRules.lapsedDays-1)*864e5).toISOString();
 assert.ok(!segmentsOf(base({completed:1,first_completed_at:fresh,last_completed_at:fresh}),NOW).includes('lapsed'));
});

test('a buyer who came by a friend’s link is «referral», whatever else holds', ()=>{
 assert.ok(segmentsOf(base({source:'friend',completed:1,first_completed_at:day(29),last_completed_at:day(29)}),NOW).includes('referral'));
 assert.ok(!segmentsOf(base({source:'instagram',completed:1,first_completed_at:day(29),last_completed_at:day(29)}),NOW).includes('referral'));
});

test('CSV gets a segments column with readable labels and keeps the old columns in place', ()=>{
 const row={name:'Анна',phone:'+995555000111',address:'Ахалкалаки',source:'friend',first_at:day(0),last_at:day(29),orders:1,completed:1,cancelled:0,revenue:1500,marketing:true,first_completed_at:day(29),last_completed_at:day(29)};
 const csv=customersCsv([row]).split('\n');
 const header=csv[0].replace(/^﻿/,'').split(';');
 assert.equal(header.at(-1),'Сегменты');assert.equal(header.length,12);
 const cells=csv[1].split(';');
 assert.equal(cells[3],'friend');assert.equal(cells.at(-1),segmentLabels.one_order+', '+segmentLabels.referral);
});

test('storefront mark: src first, utm_source as fallback, junk ignored', ()=>{
 assert.equal(sourceFromQuery('?src=instagram'),'instagram');
 assert.equal(sourceFromQuery('?utm_source=Facebook&utm_medium=cpc'),'facebook');
 assert.equal(sourceFromQuery('?src=tiktok&utm_source=instagram'),'tiktok');
 assert.equal(sourceFromQuery('?src=<script>&utm_source=flyer'),'flyer');
 assert.equal(sourceFromQuery('?src=a&utm_source=x'),'');
 assert.equal(sourceFromQuery('?utm_source=' + 'a'.repeat(40)),'');
 assert.equal(sourceFromQuery(''),'');
 assert.equal(sourceFromQuery(undefined),'');
});
