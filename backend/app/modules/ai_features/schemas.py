from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LLMConfigSchema(BaseModel):
    provider: str = Field(..., description="Active LLM provider: gemini, groq, mistral, or openai")
    api_key: str = Field(..., description="API key for the provider")

class LLMConfigResponse(BaseModel):
    active_provider: Optional[str] = None
    saved_providers: Dict[str, str] = Field(default_factory=dict, description="Saved providers and their masked API keys")

class ATSAnalysisRequest(BaseModel):
    job_description: str
    student_email: Optional[str] = None

class RAGRecommendation(BaseModel):
    type: str = Field(..., description="Type of resource: batch, note, or book")
    title: str
    description: Optional[str] = None
    link_or_details: Optional[str] = None

class ATSAnalysisResponse(BaseModel):
    score: int
    explanation: str
    matching_keywords: List[str]
    missing_keywords: List[str]
    strengths: List[str]
    suggestions: List[str]
    rag_recommendations: List[RAGRecommendation]

class ResumeSaveRequest(BaseModel):
    personal_info: Dict[str, Any]
    summary: str
    experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    skills: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]
    certifications: List[Dict[str, Any]]
    template: str
    custom_latex_template: Optional[str] = None

class ResumeSaveResponse(BaseModel):
    status: str
    message: str

class TailorResumeRequest(BaseModel):
    job_description: str

class TailorResumeResponse(BaseModel):
    tailored_resume_data: Dict[str, Any]
    explanation: str

class InterviewStartRequest(BaseModel):
    target_role: str
    job_description: Optional[str] = None
    num_questions: Optional[int] = 5
    voice_mode: Optional[bool] = False

class InterviewStartResponse(BaseModel):
    session_id: str
    first_question: str
    audio_content: Optional[str] = None

class InterviewRespondRequest(BaseModel):
    session_id: str
    user_response: str
    voice_mode: Optional[bool] = False

class InterviewFeedback(BaseModel):
    rating: str
    score: int
    strengths: List[str]
    weaknesses: List[str]
    overall_summary: str
    question_breakdowns: List[Dict[str, Any]]

class InterviewRespondResponse(BaseModel):
    next_question: Optional[str] = None
    is_complete: bool
    feedback: Optional[InterviewFeedback] = None
    user_response: Optional[str] = None
    audio_content: Optional[str] = None

class CoachChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class CoachChatResponse(BaseModel):
    response: str
    rag_context: List[RAGRecommendation]

# --- AI Weekly Test Suite Schemas ---

class QuestionSchema(BaseModel):
    question_text: str
    options: List[str] = Field(..., min_length=2, max_length=6)
    correct_option_index: int = Field(..., ge=0, le=5)
    explanation: str

class QuestionResponse(BaseModel):
    question_index: int
    question_text: str
    options: List[str]

class TestResponse(BaseModel):
    id: str
    title: str
    topic: str
    num_questions: int
    marks_per_question: int
    questions: List[QuestionResponse]
    created_by: str
    created_at: Any

class TestSubmitRequest(BaseModel):
    # Maps question index (as string e.g. "0", "1") to student's chosen option index (0-3)
    answers: Dict[str, int]

class GradedQuestion(BaseModel):
    question_index: int
    question_text: str
    options: List[str]
    chosen_option: Optional[int] = None
    correct_option: int
    is_correct: bool
    explanation: str

class TestSubmitResponse(BaseModel):
    score: float
    max_score: float
    correct_count: int
    wrong_count: int
    results: List[GradedQuestion]

class TestSubmissionLedgerEntry(BaseModel):
    id: str
    student_email: str
    student_name: str
    score: float
    max_score: float
    graded_at: Any

class TestResultsResponse(BaseModel):
    test_id: str
    title: str
    submissions: List[TestSubmissionLedgerEntry]

