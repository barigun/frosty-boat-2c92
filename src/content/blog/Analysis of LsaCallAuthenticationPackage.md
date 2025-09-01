---
title: "Analysis of LsaCallAuthenticationPackage"
description: "When malware authors want to manipulate Windows authentication, one of their most valuable targets is Kerberos. At the heart of Kerberos interactions inside Windows lies the function LsaCallAuthenticationPackage."
pubDate: "Aug 27 2025"
---
        <main class="space-y-12">
            <section class="bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Introduction: A Low-Level Function with High Impact</h2>
                <p class="text-gray-300 leading-relaxed mb-6">When attackers want to silently forge or replay Kerberos tickets, they often turn to a powerful but lesser-known Windows function: <strong>LsaCallAuthenticationPackage</strong>. This function is a direct line to LSASS (Local Security Authority Subsystem Service), the process that manages all things authentication on a Windows machine. While it may look like just another API, for attackers, it's the perfect tool for bypassing domain controllers and injecting forged credentials. LSASS stores secrets like password hashes and Kerberos tickets, making it a prime target for attackers.</p>
                <div class="flex justify-center my-6">
                    
                </div>
                <p class="text-gray-300 leading-relaxed">This post will break down what this function does, why malware abuses it, and how you can spot the difference between a normal authentication call and a malicious ticket injection.</p>
            </section>

            <section class="bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Why Attackers Use It</h2>
                <p class="text-gray-300 leading-relaxed mb-6">Most legitimate applications never touch <strong>LsaCallAuthenticationPackage</strong>. High-level APIs like `LogonUser()` handle normal authentication requests for them. But attackers, particularly those using tools like Mimikatz or Rubeus, leverage this function for two key malicious purposes:</p>
                <ul class="list-disc pl-5 space-y-3 text-gray-300">
                    <li><strong>Malicious Use</strong>: Malware uses it to inject forged Kerberos tickets, such as <strong>Golden</strong> or <strong>Silver Tickets</strong>. This allows them to authenticate to other services or systems without ever sending a request to the domain controller.</li>
                    <li><strong>Attacker Goals</strong>: This technique enables attackers to achieve crucial objectives, including:
                        <ul class="list-circle pl-5 mt-2 space-y-2">
                            <li><strong>Persistence</strong>: Using a long-lived Golden Ticket to maintain access.</li>
                            <li><strong>Lateral Movement</strong>: Impersonating a service account with a Silver Ticket.</li>
                            <li><strong>Privilege Escalation</strong>: Gaining high-level administrative access.</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <section class="bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">The Anatomy of the Attack</h2>
                <p class="text-gray-300 leading-relaxed mb-4">The attack is a multi-step process. Understanding each stage helps in building effective detection rules.</p>

                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">Stage 1: Preparation</h3>
                <p class="text-gray-300 leading-relaxed mb-4">Attackers can't just call this function out of the blue. They first need to set up the attack, which often involves escalating privileges and resolving the function's address dynamically to avoid detection.</p>
                <div class="bg-gray-700 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto mb-6">
                    <pre><code>// Pseudocode for function resolution
HMODULE hSecur32 = LoadLibrary("secur32.dll");
LsaCallAuthenticationPackage pLsaCall = GetProcAddress(hSecur32, "LsaCallAuthenticationPackage");</code></pre>
                </div>

                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">Stage 2: The Call</h3>
                <p class="text-gray-300 leading-relaxed mb-4">Once prepared, the attacker calls the function, passing in a crafted Kerberos request structure. This is where the magic happens—the forged ticket is directly injected into LSASS memory.</p>
                <div class="bg-gray-700 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto mb-6">
                    <pre><code>; x86 assembly snippet
push offset AuthStruct       ; Kerberos request structure, populated with forged ticket data
push AuthPkgHandle           ; handle from LsaLookupAuthenticationPackage
push hLsaConnection          ; handle from LsaRegisterLogonProcess
call ds:LsaCallAuthenticationPackage</code></pre>
                </div>

                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">Stage 3: Post-Injection Artifacts</h3>
                <p class="text-gray-300 leading-relaxed mb-4">Once the call is made, the attack leaves behind some unique forensic artifacts that SOC analysts can hunt for:</p>
                <ul class="list-disc pl-5 space-y-2 text-gray-300">
                    <li><strong>New Tickets in LSASS</strong>: A new Kerberos ticket appears in LSASS memory without a corresponding request to the domain controller.</li>
                    <li><strong>Network Silence</strong>: There is no network traffic. Specifically, you won't see Kerberos `AS-REQ` (Authentication Service Request) or `TGS-REQ` (Ticket Granting Service Request) on the wire. The authentication material simply "shows up."</li>
                </ul>
            </section>

            <section class="bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Detection and Hunting</h2>
                <p class="text-gray-300 leading-relaxed mb-4">The key to detection is knowing what's normal. A benign application calling this function is extremely rare. Focus on these signals to hunt for malicious activity.</p>
                
                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">Host-Based Signals</h3>
                <ul class="list-disc pl-5 space-y-2 text-gray-300 mb-6">
                    <li><strong>Sysmon Event 10</strong>: Look for a non-system binary trying to open a handle to `lsass.exe`. This is a classic indicator of an attacker trying to interact with LSASS.</li>
                    <li><strong>Command-Line Indicators</strong>: Search for tools like `Rubeus.exe` or `mimikatz` in your command-line logs.</li>
                </ul>

                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">Event Logs</h3>
                <ul class="list-disc pl-5 space-y-2 text-gray-300 mb-6">
                    <li><strong>Event ID 4672</strong>: This event shows when special privileges, like `SeDebugPrivilege`, are assigned. Look for this event right before a process accesses LSASS.</li>
                    <li><strong>Event IDs 4768/4769</strong>: Check for TGS tickets (`4769`) without a corresponding TGT request (`4768`). This is a strong sign of ticket injection.</li>
                </ul>

                <h3 class="text-xl md:text-2xl font-semibold text-white mb-2">A Practical Hunting Rule</h3>
                <p class="text-gray-300 leading-relaxed">A powerful hunting rule would be to alert whenever a <strong>non-Microsoft signed process</strong> both:</p>
                <div class="bg-indigo-900 bg-opacity-30 p-4 rounded-lg mt-4 text-white font-semibold">
                    <p>1. Opens a handle to `lsass.exe`, and</p>
                    <p>2. Resolves or imports the `LsaCallAuthenticationPackage` function.</p>
                </div>
            </section>

            <section class="text-center text-gray-500 mt-12">
                <p class="mb-2">By correlating these signals, you can quickly identify this sophisticated attack and defend against it.</p>
            </section>
        </main>
    </div>

    <footer class="text-center py-8 text-gray-500 text-sm border-t border-gray-700 mt-12">
        <p>&copy; 2025. All rights reserved.</p>
    </footer>
</body>
