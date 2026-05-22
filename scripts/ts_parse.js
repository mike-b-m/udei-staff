const ts = require('typescript');
const fs = require('fs');
const path = 'app/component/add-payment/addpayment.tsx';
const code = fs.readFileSync(path, 'utf8');
const sf = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = ts.getPreEmitDiagnostics(sf);
console.log('diagnostics count:', diagnostics.length);
for (const d of diagnostics) {
  const { line, character } = sf.getLineAndCharacterOfPosition(d.start || 0);
  console.log(`Error at ${line+1}:${character+1} - ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
