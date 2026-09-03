export default function EvidenceDrawer({ caseData, onClose }: { caseData: any, onClose: () => void }) {
  return (
    <div className="w-1/3 min-w-[400px] border-l border-border bg-white shadow-xl flex flex-col h-full absolute right-0 top-0">
      <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg">Case Details</h3>
        <button onClick={onClose} className="text-muted hover:text-foreground">&times;</button>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div>
          <p className="text-sm text-muted">Case ID</p>
          <p className="font-mono">{caseData.case_id}</p>
        </div>

        <div className="border border-border rounded p-4 bg-gray-50">
          <h4 className="font-bold mb-2">Deterministic Evidence</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">Payment</p>
              <p className="font-mono text-xs">{caseData.payment_id}</p>
            </div>
            <div>
              <p className="text-muted">Settlement</p>
              <p className="font-mono text-xs">{caseData.settlement_id || 'None'}</p>
            </div>
            <div>
              <p className="text-muted">Method</p>
              <p>{caseData.match_method}</p>
            </div>
          </div>
        </div>

        {caseData.ai_recommendation && (
          <div className="border border-blue-200 rounded p-4 bg-blue-50">
            <h4 className="font-bold mb-2 text-brand flex items-center">
              <span className="mr-2">✨</span> Gemini Investigation
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Recommendation:</span>
                <span className="font-bold">{caseData.ai_recommendation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Confidence:</span>
                <span>{(caseData.ai_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded p-4 bg-gray-50">
          <h4 className="font-bold mb-2 flex items-center">
            🛡️ Control Gate
          </h4>
          <p className={`font-bold ${caseData.control_result === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
            {caseData.control_result}
          </p>
          {caseData.control_result === 'BLOCK' && (
            <ul className="list-disc ml-5 mt-2 text-sm text-red-600">
              <li>Multiple candidates or high value</li>
            </ul>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-bold mb-1 text-sm text-muted">FINAL ARIVO DECISION</h4>
          <p className={`text-xl font-bold ${
            caseData.status === 'MATCHED' ? 'text-green-600' :
            caseData.status === 'REVIEW' ? 'text-orange-500' :
            'text-red-600'
          }`}>
            {caseData.status}
          </p>
        </div>
      </div>
    </div>
  );
}
