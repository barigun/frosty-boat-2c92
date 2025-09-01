---
title: "Analysis of LsaCallAuthenticationPackage"
description: "When malware authors want to manipulate Windows authentication, one of their most valuable targets is Kerberos. At the heart of Kerberos interactions inside Windows lies the function LsaCallAuthenticationPackage."
pubDate: "Aug 27 2025"
---

## Introduction: A Low-Level Function with High Impact

When attackers want to silently forge or replay Kerberos tickets, they often turn to a powerful but lesser-known Windows function: **LsaCallAuthenticationPackage**. This function is a direct line to LSASS (Local Security Authority Subsystem Service), the process that manages all things authentication on a Windows machine. While it may look like just another API, for attackers, it's the perfect tool for bypassing domain controllers and injecting forged credentials. LSASS stores secrets like password hashes and Kerberos tickets, making it a prime target for attackers.

This post breaks down what this function does, why malware abuses it, and how you can spot the difference between a normal authentication call and a malicious ticket injection.

## Why Attackers Use It

Most legitimate applications never touch **LsaCallAuthenticationPackage**. High-level APIs like `LogonUser()` handle normal authentication requests for them. But attackers, particularly those using tools like Mimikatz or Rubeus, leverage this function for two key malicious purposes:

- **Malicious Use**: Injecting forged Kerberos tickets, such as **Golden** or **Silver Tickets**. This allows authentication to other services or systems without ever sending a request to the domain controller.
- **Attacker Goals**: This technique enables attackers to achieve crucial objectives, including:
  - **Persistence**: Using a long-lived Golden Ticket to maintain access.
  - **Lateral Movement**: Impersonating a service account with a Silver Ticket.
  - **Privilege Escalation**: Gaining high-level administrative access.

## The Anatomy of the Attack

The attack is a multi-step process. Understanding each stage helps in building effective detection rules.

### Stage 1: Preparation

Attackers can't just call this function out of the blue. They first need to set up the attack, which often involves escalating privileges and resolving the function's address dynamically to avoid detection.

```c
// Pseudocode for function resolution
HMODULE hSecur32 = LoadLibrary("secur32.dll");
LsaCallAuthenticationPackage pLsaCall = GetProcAddress(hSecur32, "LsaCallAuthenticationPackage");
```

### Stage 2: The Call

Once prepared, the attacker calls the function, passing in a crafted Kerberos request structure. This is where the magic happens—the forged ticket is directly injected into LSASS memory.

```asm
; x86 assembly snippet
push offset AuthStruct       ; Kerberos request structure, populated with forged ticket data
push AuthPkgHandle           ; handle from LsaLookupAuthenticationPackage
push hLsaConnection          ; handle from LsaRegisterLogonProcess
call ds:LsaCallAuthenticationPackage
```

### Stage 3: Post-Injection Artifacts

Once the call is made, the attack leaves behind some unique forensic artifacts that SOC analysts can hunt for:

- **New Tickets in LSASS**: A new Kerberos ticket appears in LSASS memory without a corresponding request to the domain controller.
- **Network Silence**: There is no network traffic. Specifically, you won't see Kerberos `AS-REQ` (Authentication Service Request) or `TGS-REQ` (Ticket Granting Service Request) on the wire. The authentication material simply "shows up."

## Detection and Hunting

The key to detection is knowing what's normal. A benign application calling this function is extremely rare. Focus on these signals to hunt for malicious activity.

### Host-Based Signals

- **Sysmon Event 10**: Look for a non-system binary trying to open a handle to `lsass.exe`. This is a classic indicator of an attacker trying to interact with LSASS.
- **Command-Line Indicators**: Search for tools like `Rubeus.exe` or `mimikatz` in your command-line logs.

### Event Logs

- **Event ID 4672**: Shows when special privileges, like `SeDebugPrivilege`, are assigned. Look for this event right before a process accesses LSASS.
- **Event IDs 4768/4769**: Check for TGS tickets (`4769`) without a corresponding TGT request (`4768`). This is a strong sign of ticket injection.

### A Practical Hunting Rule

Alert whenever a **non-Microsoft signed process** both:

1. Opens a handle to `lsass.exe`, and
2. Resolves or imports the `LsaCallAuthenticationPackage` function.

---

By correlating these signals, you can quickly identify this sophisticated attack and defend against it.
