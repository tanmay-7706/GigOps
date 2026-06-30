#input_type_name: ApplyTriageInput
#output_type_name: ApplyTriageResult
#function_name: apply_triage

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class ApplyTriageInput(BaseModel):
    record_id: str
    severity: str
    issueType: str = ""
    keyDetails: str = ""
    confidence: float = 0.0
    recommendedAction: str = ""


class ApplyTriageResult(BaseModel):
    ok: bool
    record_id: str


async def apply_triage(ctx: FunctionContext, data: ApplyTriageInput) -> ApplyTriageResult:
    pod = Pod.from_env()
    pod.table("feedback").update(
        data.record_id,
        {
            "status": "triaged",
            "severity": data.severity,
            "triage_result": {
                "feedbackId": data.record_id,
                "severity": data.severity,
                "issueType": data.issueType,
                "keyDetails": data.keyDetails,
                "confidence": data.confidence,
                "recommendedAction": data.recommendedAction,
            },
        },
    )
    return ApplyTriageResult(ok=True, record_id=data.record_id)
