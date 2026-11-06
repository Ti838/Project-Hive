# 15: HIVEMIND MULTIMODAL AI ARCHITECTURE

> **Document Classification:** AI Systems Engineering & Cascading Inference Specification  
> **Inference Providers:** Groq Cloud, Google AI Studio (Gemini), OpenRouter, W3C Web Speech API  
> **Extraction Evidence Level:** `[VERIFIED]` Direct Source Code & Live Runtime Testing  

---

## 1. Cascading AI Engine Overview

The ProjectHive **HiveMind AI Engine** is designed to provide high-throughput, low-latency software engineering intelligence while running 100% within free-tier infrastructure. To eliminate rate limit disruptions (HTTP 429) and provider outages (HTTP 503), the engine implements an automated **4-Tier Cascading Failover Sequence**:

```mermaid
flowchart TD
    UserPrompt["Student Prompt / Attachment (frontend)"] --> ClientVoice{"Voice Input?"}
    
    ClientVoice -- Yes --> WebSpeechSTT["Browser Web Speech API (SpeechRecognition)"]
    WebSpeechSTT --> PromptPayload["Prompt Payload { capability, prompt, imageBase64? }"]
    ClientVoice -- No --> PromptPayload

    PromptPayload --> HTTPSGateway["POST /api/ai/execute (Express Gateway)"]
    HTTPSGateway --> RateCheck{"User Rate Limit < 60 ops/hr?"}
    
    RateCheck -- No --> RateLimitErr["HTTP 429: AI Rate Limit Reached"]
    RateCheck -- Yes --> Sanitizer["Zero-Leak In-Memory Prompt Sanitizer (sanitizer.service.js)"]
    
    Sanitizer --> MaskSensitive["Mask API Keys, Private Keys, DB URIs with Tokens"]
    MaskSensitive --> MultimodalCheck{"Image Attachment Present?"}

    %% Multimodal Route
    MultimodalCheck -- Yes --> VisionTier1["Tier 1 Vision: Google Gemini 2.0 Flash"]
    VisionTier1 -.->|Failover on Error| VisionTier2["Tier 2 Vision: OpenRouter Vision Pool"]

    %% Text & Code Route
    MultimodalCheck -- No --> TextTier1["Tier 1: Groq Cloud (openai/gpt-oss-20b, 120b)"]
    TextTier1 -.->|Failover on 429 / 503| TextTier2["Tier 2: Google Gemini 2.0 Flash"]
    TextTier2 -.->|Failover on Outage| TextTier3["Tier 3: OpenRouter Free Failover Pool"]

    VisionTier1 --> Desanitizer["In-Memory Desanitizer (Restores Redacted Tokens)"]
    VisionTier2 --> Desanitizer
    TextTier1 --> Desanitizer
    TextTier2 --> Desanitizer
    TextTier3 --> Desanitizer

    Desanitizer --> ResponseJSON["JSON Response { ok: true, output, provider, model }"]
    ResponseJSON --> MarkdownRenderer["Frontend Markdown & Syntax Highlighter"]
    MarkdownRenderer --> ClientTTS{"Speech Output Clicked?"}
    ClientTTS -- Yes --> WebSpeechTTS["Browser Web Speech API (speechSynthesis)"]
    ClientTTS -- No --> Finished["Rendered UI Output"]
```

---

## 2. Provider Hierarchy & Model Mapping

| Cascade Tier | Provider Name | Primary Models | Specialty & Target Task | Timeout Limit | Failover Condition |
|---|---|---|---|---|---|
| **Tier 1 (Text/Code)** | Groq Cloud | `openai/gpt-oss-20b`<br>`openai/gpt-oss-120b`<br>`groq/compound` | Ultra-fast code generation, syntax debugging, architecture design. | 12,000 ms | HTTP 429 (Rate Limit), 503 (Unavailable), or 12s timeout. |
| **Tier 2 (Vision/Text)**| Google AI Studio | `gemini-2.0-flash`<br>`gemini-1.5-flash` | Multimodal screenshot diagnosis, UI critique, ER diagrams, fallback text. | 12,000 ms | HTTP 429 (Rate Limit), 401/403, or 12s timeout. |
| **Tier 3 (Zero-Limit)** | OpenRouter | `openrouter/free` | Zero-rate-limit failover pool guaranteeing service continuity. | 12,000 ms | Model output parsing errors. |
| **Tier 4 (Hardware)** | Browser Hardware | Native Web Speech API | Client-side speech-to-text (STT) and text-to-speech (TTS). | Zero Cloud | Unsupported browser falls back to keyboard input. |

---

## 3. Confidential Computing & Zero-Leak Prompt Sanitizer

`[VERIFIED]` `server/services/crypto/sanitizer.service.js` enforces in-memory prompt masking before sending payloads to external AI providers:
- **Maximum Scan Length:** Bounded to 500 KB to mitigate Regular Expression Denial of Service (ReDoS).
- **Benign Whitelist:** Preserves educational placeholders like `example.com`, `<API_KEY>`, `localhost`, `mysecretpassword`.
- **Sensitive Token Masking:** Detects and masks:
  - PEM RSA/EC private keys (`-----BEGIN PRIVATE KEY-----`) -> `{{PH_REDACTED_PRIVATE_KEY_N}}`
  - Database connection strings (`postgres://user:pass@host:5432/db`) -> `{{PH_REDACTED_DB_URL_N}}`
  - AWS access keys (`AKIA...`) -> `{{PH_REDACTED_AWS_KEY_N}}`
  - GitHub personal access tokens (`ghp_...`, `gho_...`) -> `{{PH_REDACTED_GITHUB_TOKEN_N}}`
  - Google Gemini API keys (`AIza...`) -> `{{PH_REDACTED_GOOGLE_API_KEY_N}}`
  - Supabase JWT service tokens (`sbp_...`) -> `{{PH_REDACTED_SUPABASE_KEY_N}}`
- **Reversible Desanitization:** When the external model returns its completion, `desanitizeOutputPayload` restores any masked placeholders before delivering the response to the student.

---

## 4. The 11 Unified HiveMind AI Capabilities

All capabilities route through the standard contract `POST /api/ai/execute`:

| # | Capability Identifier | Specialized Role Definition | Primary Output Structure |
|---|---|---|---|
| 1 | `project_generator` | Hive AI Project Generator | Complete project blueprint: Problem Statement, MVP Scope, Architecture, Tech Stack, Milestones, Database Schema, and Testing Strategy. |
| 2 | `idea_analyzer` | Project Idea & Feasibility Analyst | Evaluates project novelty, feasibility score (1–10), competitive landscape, and technical risks. |
| 3 | `project_critic` | Lead Technical Architect & Red Team Critic | Brutal critique identifying architectural flaws, scalability bottlenecks, security vulnerabilities, and deployment pitfalls. |
| 4 | `research_assistant` | Academic Literature & Research Copilot | Synthesizes academic papers, formulates formal methodologies, and suggests research citations. |
| 5 | `documentation_ai` | Principal Technical Writer | Generates production-grade GitHub `README.md`, setup manuals, badges, architecture diagrams, and OpenAPI specs. |
| 6 | `code_assistant` | Senior Staff Systems Engineer | Precision debugging, syntax corrections, unit test generation, and algorithmic refactoring. |
| 7 | `architecture_design` | Cloud Solutions Architect | Generates normalized PostgreSQL/Supabase database schemas with foreign keys, indexes, RLS policies, and Mermaid topologies. |
| 8 | `project_health` | Engineering Metrics & CI/CD Specialist | Analyzes repository structure, commits, pull requests, and test runs to provide an actionable health diagnostic. |
| 9 | `team_ai` | Agile Delivery Coach | Analyzes squad velocity, milestone allocation, and resolves inter-member engineering blockers. |
| 10 | `career_ai` | Senior Technical Recruiter & Mentor | Tailors student resumes for internships, generates elevator pitches, and conducts mock technical interview scenarios. |
| 11 | `copilot_chat` | Hive AI Engineering Copilot | General pair programming, debugging, and conversational technical guidance. |

---

## 5. Client-Side Speech Engine (`voiceEngine.ts`)

- **Speech-to-Text (STT):** Intercepts student speech using `window.SpeechRecognition` or `window.webkitSpeechRecognition`. Supports continuous real-time interim results and emits text into the active AI prompt composer.
- **Text-to-Speech (TTS):** Uses `window.speechSynthesis` and `SpeechSynthesisUtterance`. Parses markdown to strip code blocks, rendering natural speech output through the student's hardware audio device without incurring cloud API costs.

