---
title: "Analysis of LsaEnumerateLogonSessions"
description: "Analysis of LsaEnumerateLogonSessions"
pubDate: "Aug 27 2025"
heroImage: "/blog-placeholder-4.jpg"
---

Analysis of LsaEnumerateLogonSessions

⸻

🎯 Why This Function Matters

LsaEnumerateLogonSessions is an API in secur32.dll that lists all active logon sessions on a Windows system.
	•	Legitimate use: Windows itself and some diagnostic tools may query session info.
	•	Malware use: Attackers abuse this function to map out which users are logged in—a first step before stealing Kerberos tickets, credentials, or impersonating accounts.
	•	Think of it as the “who’s home right now?” API.

⸻

🦠 Malware Context

How attackers use it:
	1.	Call LsaEnumerateLogonSessions → get session IDs (LUIDs).
	2.	Pair it with LsaGetLogonSessionData to pull usernames, domains, and ticket details.
	3.	Choose high-value sessions (Domain Admin, service accounts) to target for dumping or ticket injection.

Why it’s dangerous:
	•	Lets malware silently discover privileged accounts without touching the Domain Controller.
	•	Common in tools like Mimikatz and Rubeus.

⸻

🔍 SOC Analyst’s Lens

What happens before the call
	•	Process loads secur32.dll.
	•	Often follows suspicious LSASS access (OpenProcess on lsass.exe).
	•	Privilege escalation may occur (SeDebugPrivilege enabled).

What happens after the call
	•	A list of session identifiers (LUIDs) is returned.
	•	Attacker then typically calls LsaGetLogonSessionData.
	•	Next actions may include ticket dumping, Pass-the-Ticket, or privilege escalation.

Benign vs Malicious

Indicator	Normal (Benign)	Suspicious (Malicious)
Caller	LSASS or legit diagnostic tools	Random unsigned binary
Follow-up	Nothing further	Immediately calling LsaGetLogonSessionData or touching LSASS memory
Frequency	Rare	Multiple rapid enumerations


⸻

🛠 Reverse Engineering Angle

In a PE file (static view):
	•	Look for imports from secur32.dll → LsaEnumerateLogonSessions.
	•	Or runtime resolution: GetProcAddress("LsaEnumerateLogonSessions").

In assembly (x86 snippet):

push pLogonCount   ; receives number of sessions
push pLogonList    ; receives pointer to LUID array
call ds:LsaEnumerateLogonSessions

	•	Returned: pointer to an array of LUIDs (Locally Unique Identifiers) representing sessions.

Dynamic behavior:
	•	Follow-on API: LsaGetLogonSessionData almost always appears next.
	•	Sandbox trace: may show nothing outward (no network), since it’s purely local reconnaissance.

⸻

🕵️ Detection & Hunting

Windows Event IDs
	•	No direct event for the API itself.
	•	Look for indirect signs:
	•	4672 (privilege assigned) right before enumeration.
	•	4624/4634 (logons/logoffs) that don’t align with normal user activity.

Sysmon / EDR Signals
	•	Sysmon 10: suspicious process accessing lsass.exe.
	•	Sysmon 7: dynamic DLL loading (secur32.dll) by non-system process.

Hunt Tips
	•	Flag unsigned binaries resolving both LsaEnumerateLogonSessions and LsaGetLogonSessionData.
	•	Build detection on process ancestry: script host → suspicious binary → LSASS interaction.

⸻

📝 Quick Recap
	•	What it does: Lists all active logon sessions (LUIDs).
	•	Why attackers care: Helps them spot valuable accounts to impersonate or dump.
	•	How to detect: Look for unusual processes calling this API, especially if followed by LsaGetLogonSessionData.
	•	SOC takeaway: If you see this outside of LSASS or trusted tools, it’s almost always bad news.