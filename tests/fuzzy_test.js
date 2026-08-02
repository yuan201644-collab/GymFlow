/* 模糊搜索单元测试（§16.9 验收） — vm 加载 exercises/search_index/synonyms/utils */
const fs = require('fs');
const vm = require('vm');
const SRC = '../js';
const sandbox = { console, Math, Set, Array, Object, String, parseInt };
const c = vm.createContext(sandbox);
['exercises.js', 'search_index.js', 'synonyms.js', 'utils.js'].forEach(f => vm.runInContext(fs.readFileSync(SRC + '/' + f, 'utf8'), c));
const DB = vm.runInContext('EXERCISE_DB', c);
const search = vm.runInContext('fuzzySearchExercises', c);

let pass = 0, fail = 0;
function t(name, query, expectIncludes, expectFirstContains) {
  const res = search(query, DB).map(e => e.name);
  const ok = expectIncludes.every(x => res.some(n => n.includes(x)));
  const first = res[0] || '';
  const firstOk = !expectFirstContains || first.includes(expectFirstContains);
  const status = ok && firstOk ? '✅' : '❌';
  if (status === '✅') pass++; else fail++;
  console.log(`${status} "${query}" → ${res.length}条 | 首条: ${first.slice(0, 18)} | 含[${expectIncludes}]: ${ok} ${!expectFirstContains ? '' : '| 首条含[' + expectFirstContains + ']: ' + firstOk}`);
}

console.log('=== 拼音 / 首字母 ===');
t('全拼', 'wotui', ['卧推'], '卧推');
t('首字母', 'wt', ['卧推'], '卧推');
t('器械首字母', 'zztxj', ['坐姿推胸机']);
t('多字首字母', 'glpbwt', ['杠铃平板卧推'], '杠铃平板卧推');

console.log('=== 错别字容错 ===');
t('错别字', '握推', ['卧推'], '卧推');

console.log('=== 同义词（AI 离线表） ===');
t('英文 bench', 'bench', ['卧推'], '卧推');
t('口语 推胸', '推胸', ['卧推'], '卧推');
t('英文 pullup', 'pullup', ['引体']);

console.log('=== 精确/相关性排序 ===');
t('精确名', '杠铃平板卧推', ['杠铃平板卧推'], '杠铃平板卧推');

console.log('=== 多关键词 AND ===');
const multi = search('哑铃 推', DB).map(e => e.name);
const noBarbell = multi.every(n => !n.includes('杠铃'));  // 容错修复：不应混入杠铃
const allDumbbell = multi.every(n => { const ex = DB.find(x => x.name === n); return n.includes('哑铃') || (ex && ex.equipment && ex.equipment.includes('哑铃')); });
if (noBarbell && allDumbbell) { pass++; console.log(`✅ "哑铃 推" → ${multi.length}条 全部哑铃相关（名字或器械）、无杠铃混入`); }
else { fail++; console.log(`❌ "哑铃 推" → ${multi.length}条 混入杠铃:${multi.filter(n => n.includes('杠铃')).slice(0, 3).join(',')} 或非哑铃:${multi.filter(n => { const ex = DB.find(x => x.name === n); return !n.includes('哑铃') && !(ex && ex.equipment && ex.equipment.includes('哑铃')); }).slice(0, 3).join(',')}`); }

console.log('=== 边界 ===');
const empty = search('', DB).length;
const full = DB.length;
if (empty === full) { pass++; console.log(`✅ 空查询 → 返回全部 ${empty}/${full}`); }
else { fail++; console.log(`❌ 空查询 → ${empty}/${full}`); }
const none = search('zzzz不存在', DB).length;
if (none === 0) { pass++; console.log(`✅ 无结果 → ${none}条`); }
else { fail++; console.log(`❌ 无结果 → ${none}条`); }

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
