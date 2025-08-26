---
title: "Malware Analysis of LsaCallAuthenticationPackage: A SOC Analyst’s Guide"
description: "When malware authors want to manipulate Windows authentication, one of their most valuable targets is Kerberos. At the heart of Kerberos interactions inside Windows lies the function LsaCallAuthenticationPackage."
pubDate: "August 25 2025"
heroImage: "/blog-placeholder-3.jpg"
---
Malware Analysis of LsaCallAuthenticationPackage: A SOC Analyst’s Guide

⸻

Introduction

When malware authors want to manipulate Windows authentication, one of their most valuable targets is Kerberos. At the heart of Kerberos interactions inside Windows lies the function LsaCallAuthenticationPackage.

For most analysts, this API may look like just another entry in secur32.dll. But for attackers, it’s a direct line into LSASS—the Local Security Authority Subsystem Service—which manages logon sessions and Kerberos tickets. Abuse of this function enables attackers to forge tickets, replay them, or quietly persist in Active Directory environments.

This article explains what the function does, why malware abuses it, and how a SOC analyst can spot the difference between legitimate authentication calls and malicious ticket injection.

⸻

Function in Malware Context
	•	Legitimate use: Windows itself and some authentication subsystems use this API to request or validate logon credentials. Typical business apps do not call it directly.
	•	Malicious use: Malware leverages it to inject forged Kerberos tickets (Golden/Silver tickets) or replay stolen ones (Pass-the-Ticket). This bypasses the Domain Controller entirely—no authentication traffic leaves the infected host.
	•	Attacker goals:
	•	Persistence with a long-lived Golden Ticket.
	•	Lateral movement using Silver Tickets.
	•	Privilege escalation by impersonating high-value accounts.

⸻

SOC Analyst’s View

Before the call
	•	The malware usually acquires a handle to LSASS (requires SeDebugPrivilege).
	•	It resolves LsaCallAuthenticationPackage dynamically via GetProcAddress("secur32.dll").
	•	It prepares Kerberos-specific request structures (e.g., KERB_SUBMIT_TKT_REQUEST).

After the call
	•	New Kerberos tickets appear in LSASS memory—without a request to the Domain Controller.
	•	On the wire: no Kerberos AS-REQ/TGS-REQ traffic. The authentication material just “shows up.”
	•	Windows event logs may show mismatches between 4768 (TGT request) and 4769 (TGS request).

Malicious vs. benign
	•	Benign: Very rare outside LSASS itself. High-level APIs like LogonUser() or SSPI functions handle normal auth.
	•	Malicious: Non-system processes invoking this API, especially in combination with LSASS handle access. If you see a third-party process doing it, raise suspicion.

⸻

Reverse Engineering Angle

When reversing malware that calls LsaCallAuthenticationPackage, you’ll often see:
	•	Imports:
	•	Either directly: LsaCallAuthenticationPackage in the IAT.
	•	Or indirectly: resolved at runtime using GetProcAddress.
	•	Assembly patterns (x86 snippet):

push offset AuthStruct       ; Kerberos request structure
push AuthPkgHandle           ; handle from LsaLookupAuthenticationPackage
push hLsaConnection          ; handle from LsaRegisterLogonProcess
call ds:LsaCallAuthenticationPackage


	•	Memory structures:
	•	Malware often fills a KERB_SUBMIT_TKT_REQUEST struct with forged ticket data.
	•	Tools like Rubeus and Mimikatz rely on this approach.
	•	Dynamic behavior:
	•	Syscall traces show LSASS interaction but no DC traffic.
	•	PE strings may reveal "kerberos", "krbtgt", or SPNs like "cifs/", "ldap/".

⸻

Detection & Hunting

Host-based signals
	•	Sysmon Event 10: Process access to lsass.exe from a non-system binary.
	•	Sysmon Event 7: Odd DLLs loaded into LSASS (possible malicious SSPs).
	•	Command-line indicators: Use of tools (Rubeus, mimikatz kerberos::ptt) in logs.

Event logs
	•	4768/4769 anomalies: TGS tickets issued without a TGT request.
	•	4672: Special privileges assigned (SeDebugPrivilege) before LSASS access.
	•	7045: Service creation that may act as a launcher for ticket injection.

Practical hunt rule idea
	•	Alert when a non-Microsoft signed process both:
	•	Opens a handle to lsass.exe, and
	•	Resolves or imports LsaCallAuthenticationPackage.

⸻

Conclusion

LsaCallAuthenticationPackage is a low-level function with high impact. Rare in normal applications, but abused heavily in Kerberos attacks, it represents a perfect case study for malware analysts and SOC defenders.
