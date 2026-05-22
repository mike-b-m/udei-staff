const ts = require('typescript');
const fs = require('fs');
const path = 'app/component/add-payment/addpayment.tsx';
const code = fs.readFileSync(path, 'utf8');
const result = ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
const diags = result.diagnostics || [];
console.log('diagnostics count:', diags.length);
for (const d of diags) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    console.log(`Error at ${line+1}:${character+1} - ${msg}`);
  } else console.log('Error:', msg);
}
