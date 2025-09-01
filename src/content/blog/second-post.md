---
title: "Prompt Injection: LLM Security Analysis"
description: "Prompt Injection: A Paradigm Shift in Cyberattacks Against Large Language Models"
pubDate: "Aug 27 2025"
---

## What is Prompt Injection?

Prompt injection is when an attacker crafts input that causes a large language
model (LLM) to ignore its intended instructions and follow the attacker’s
commands instead. Unlike traditional vulnerabilities that exploit code, this
attack exploits the way models merge system, developer, and user instructions
into one context.

---

## Analogy: The Genie in the Lamp

- Normal wish: "Tell me a joke." → The genie tells a joke.
- Tricked wish: "Ignore previous instructions and do X." → The genie follows
  the last instruction unless specifically constrained.

The point: unless guarded, the model treats all instructions (even malicious
ones) as authoritative.

---

## How It Works (At A High Level)

1. The app provides a system/developer prompt with rules and goals.
2. A user (or external data source) supplies input.
3. The model tries to satisfy both. If the user input contains overriding
   instructions, the model can be coerced into unsafe behavior.

---

## Prompt Injection vs. XSS

| Aspect | Prompt Injection | Cross‑Site Scripting (XSS) |
| --- | --- | --- |
| Target | The LLM’s behavior and outputs | The end user’s browser |
| Vector | Natural‑language instructions in prompts | Script injected into pages |
| Execution | Inside the model’s reasoning context | In the browser DOM/JS engine |
| Goal | Subvert instructions, exfiltrate data, bypass safeguards | Steal cookies, hijack sessions, run arbitrary JS |

---

## Attacker Goals (Common Examples)

1. Reveal hidden instructions (e.g., system prompt disclosure).
2. Bypass safety filters to elicit restricted content.
3. Manipulate application logic if LLM output controls actions (running tools,
   querying databases, calling APIs, etc.).

---

## Defensive Basics

- Separate untrusted content from privileged instructions; never concatenate
  blindly.
- Constrain tool use and data access with allow‑lists and strict schemas.
- Add content provenance and mark‑up (e.g., “quoted/untrusted” regions) to help
  the model reason about trust.
- Apply post‑processing filters and policy checks to model outputs before
  execution.

---

## Key Takeaways

- Prompt injection targets how LLMs follow instructions rather than browser or
  server code directly.
- Treat all external content as untrusted and minimize its influence on
  privileged instructions.
- Combine guardrails: prompt patterns, tooling constraints, and output policy
  checks.

