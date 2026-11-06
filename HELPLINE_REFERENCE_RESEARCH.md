# PROJECTHIVE: HELPLINE REFERENCE RESEARCH & BENCHMARK INTELLIGENCE

**Analysis Scope:** Customer Support & Agent Workspaces (Intercom, Zendesk, Crisp, Help Scout, Linear, Freshdesk)  
**Auditor:** Principal Customer Support Systems Architect & Senior Full-Stack Engineer

---

## 1. Executive Reference Matrix

| Benchmark Platform | URL | Observed Architecture & Interaction Patterns | ProjectHive Adaptation |
| :--- | :--- | :--- | :--- |
| **Intercom Helpdesk** | https://www.intercom.com/helpdesk/inbox | Unified inbox, split conversation view, customer profile telemetry, private internal notes. | Admin Support Center inbox, tabbed states, private notes toggle. |
| **Zendesk Agent Workspace** | https://support.zendesk.com/ | Ticket statuses, unique human-readable IDs, conversation timeline, user context panel. | Human-readable IDs (e.g. `PH-2026-XXXXXX`), state machine transitions. |
| **Crisp Chat** | https://crisp.chat/ | Real-time dual delivery, lightweight async fallback, presence indicator, instant typing events. | Socket.IO support events (`support:ticket:id`), asynchronous persistence. |
| **Help Scout** | https://www.helpscout.com/inbox/ | Clean conversation bubbles, collision detection, saved replies, collision prevention. | Threaded replies, distinction between Admin responses and User inquiries. |
