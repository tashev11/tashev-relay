const ansi = {
  bold: '\x1b[1m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m',
};
const color = (code, text) => process.stdout.isTTY ? code + text + ansi.reset : text;

export function printHeader() {
  console.log(color(ansi.bold, 'TASHEV RELAY'));
  console.log(color(ansi.dim, 'Switch AI. Switch machine. Keep working.\n'));
}

export function printState(state) {
  const g = state?.project?.git || {};
  printHeader();
  console.log('Project      ' + (state?.project?.name || 'unknown'));
  console.log('Saved        ' + (state?.savedAt || 'never'));
  console.log('Agent        ' + (state?.session?.agent || 'unknown'));
  console.log('Branch       ' + (g.branch || 'n/a'));
  console.log('Commit       ' + (g.shortCommit || 'n/a'));
  console.log('Dirty        ' + (g.dirty ? 'yes' : 'no'));
  console.log('\nCurrent task');
  console.log(state?.task?.current || 'Not set.');
  console.log('\nNext');
  console.log(state?.task?.next || 'Not set.');
  if (state?.task?.notes?.length) {
    console.log('\nRecent notes');
    for (const n of state.task.notes.slice(-5)) console.log('- ' + n);
  }
}

export function printDoctor(rows) {
  printHeader();
  for (const row of rows) {
    const mark = row.ok ? color(ansi.green, '✓') : row.level === 'warn' ? color(ansi.yellow, '!') : color(ansi.red, '✗');
    console.log(mark + ' ' + row.name.padEnd(18) + ' ' + row.detail);
  }
  const failed = rows.filter(x => !x.ok && x.level !== 'warn').length;
  const warned = rows.filter(x => !x.ok && x.level === 'warn').length;
  const warnings = warned ? ' (' + warned + (warned === 1 ? ' warning)' : ' warnings)') : '';
  console.log('\n' + (failed ? color(ansi.yellow, failed + ' item(s) need attention.' + warnings) : color(ansi.green, 'Safe to continue ✓' + warnings)));
}
