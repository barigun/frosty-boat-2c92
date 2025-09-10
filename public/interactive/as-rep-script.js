// Self-contained JavaScript for AS-REP Roasting interactive page

document.addEventListener('DOMContentLoaded', function() {
    const secureBtn = document.getElementById('secure-flow-btn');
    const vulnerableBtn = document.getElementById('vulnerable-flow-btn');
    const explanationText = document.getElementById('flow-explanation-text');
    const asReqLine = document.getElementById('as-req-line');
    const asReqBox = document.getElementById('as-req-box');
    const asRepLine = document.getElementById('as-rep-line');
    const asRepBox = document.getElementById('as-rep-box');
    const preAuthStatus = document.getElementById('pre-auth-status');
    const messageBox = document.getElementById('message-box');

    const explanations = {
        secure: "<strong>Secure Flow:</strong> The client first sends an AS-REQ with a timestamp encrypted using its password hash. The KDC verifies this to authenticate the client *before* sending the AS-REP, preventing an unauthenticated attacker from getting the TGT.",
        vulnerable: "<strong>Vulnerable Flow:</strong> The client sends a simple AS-REQ. The KDC does not verify the client and immediately sends back the AS-REP containing the encrypted TGT portion. This is the misconfiguration that enables AS-REP Roasting."
    };

    function showMessage(text, color) {
        messageBox.textContent = text;
        messageBox.style.backgroundColor = color;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 2000);
    }

    function resetAnimation() {
        asReqBox.style.transform = '';
        asReqBox.style.opacity = '0';
        asRepBox.style.transform = '';
        asRepBox.style.opacity = '0';
        preAuthStatus.textContent = '';
        preAuthStatus.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-10 md:mt-0 text-sm font-semibold p-1 px-2 rounded-full text-white';

        asReqLine.style.width = '0';
        asReqLine.style.height = '0';
        asReqLine.classList.remove('bg-green-500', 'bg-red-500');

        asRepLine.style.width = '0';
        asRepLine.style.height = '0';
        asRepLine.classList.remove('bg-green-500', 'bg-red-500');
    }

    function animateFlow(isSecure) {
        resetAnimation();
        const reqColor = isSecure ? 'bg-blue-500' : 'bg-red-500';
        const repColor = isSecure ? 'bg-yellow-500' : 'bg-red-500';
        const lineColor = isSecure ? 'bg-green-500' : 'bg-red-500';

        // Step 1: Client sends AS-REQ
        setTimeout(() => {
            asReqBox.classList.add(reqColor);
            asReqBox.style.opacity = '1';
            if (window.innerWidth < 768) {
                asReqBox.style.transform = 'translateY(120px)';
            } else {
                asReqBox.style.transform = 'translateX(250px)';
            }
        }, 100);

        // Step 2: Line animates to KDC
        setTimeout(() => {
            asReqLine.classList.add(lineColor);
            if (window.innerWidth < 768) {
                asReqLine.style.height = '120px';
            } else {
                asReqLine.style.width = '250px';
            }
        }, 200);

        // Step 3: KDC processes request, checks pre-auth
        setTimeout(() => {
            if (isSecure) {
                preAuthStatus.textContent = 'Pre-Auth: Required';
                preAuthStatus.classList.add('bg-green-500');
                showMessage('KDC validates credentials.', 'rgb(34, 197, 94)');
            } else {
                preAuthStatus.textContent = 'Pre-Auth: Disabled';
                preAuthStatus.classList.add('bg-red-500');
                showMessage('KDC skips validation.', 'rgb(239, 68, 68)');
            }
        }, 1000);

        // Step 4: KDC sends AS-REP
        setTimeout(() => {
            asRepBox.classList.add(repColor);
            asRepBox.style.opacity = '1';
            asRepLine.classList.add(lineColor);
            if (window.innerWidth < 768) {
                asRepBox.style.transform = 'translateY(-120px)';
                asRepLine.style.height = '120px';
            } else {
                asRepBox.style.transform = 'translateX(-250px)';
                asRepLine.style.width = '250px';
            }
        }, 2000);
    }
    
    secureBtn.addEventListener('click', () => {
        explanationText.innerHTML = explanations.secure;
        secureBtn.classList.add('bg-blue-600', 'text-white');
        secureBtn.classList.remove('bg-gray-200', 'text-gray-700');
        vulnerableBtn.classList.remove('bg-blue-600', 'text-white');
        vulnerableBtn.classList.add('bg-gray-200', 'text-gray-700');
        animateFlow(true);
    });

    vulnerableBtn.addEventListener('click', () => {
        explanationText.innerHTML = explanations.vulnerable;
        vulnerableBtn.classList.add('bg-blue-600', 'text-white');
        vulnerableBtn.classList.remove('bg-gray-200', 'text-gray-700');
        secureBtn.classList.remove('bg-blue-600', 'text-white');
        secureBtn.classList.add('bg-gray-200', 'text-gray-700');
        animateFlow(false);
    });

    const stepTitles = [
        '1. Discovery: Find users with pre-auth disabled',
        '2. Request: Attacker sends AS-REQ for the vulnerable user',
        '3. Response: KDC returns AS-REP with encrypted TGT portion',
        '4. Crack: Attacker brute-forces the hash offline to get the password'
    ];
    const stepTexts = [
        "The attacker first needs to find user accounts that do not require Kerberos pre-authentication. This is a simple query to the domain controller.",
        "The attacker sends an Authentication Service Request (AS-REQ) to the KDC, specifying a vulnerable username. Since pre-authentication is not required, the attacker doesn't need to provide a password.",
        "The KDC, seeing the misconfiguration, immediately sends back an Authentication Service Response (AS-REP) containing the Ticket-Granting Ticket (TGT). A portion of this response is encrypted with the user's NTLM password hash.",
        "The attacker now has the encrypted data and takes it offline. They use password cracking tools to brute-force the password hash. This generates no network noise and won't trigger lockouts, allowing them to eventually recover the cleartext password."
    ];
    const stepCodes = [
        "impacket-GetNPUsers -dc-ip 192.168.1.10 -request",
        "powershell -c \"Add-Type -AssemblyName System.IdentityModel; New-Object System.DirectoryServices.AccountManagement.PrincipalContext('Domain', 'DC-SERVER') | Get-ADUser -Filter 'DoesNotRequirePreAuth -eq $true'\"",
        "AcquireCredentialsHandle",
        "hashcat -m 18200 hash.txt wordlist.txt"
    ];

    const stepToApiMap = {
        0: 'LsaConnectUntrusted',
        1: 'InitializeSecurityContext',
        2: 'AcquireCredentialsHandle',
        3: ''
    };

    const apiToStepMap = {
        'AcquireCredentialsHandle': 2,
        'InitializeSecurityContext': 1,
        'LsaConnectUntrusted': 0
    };

    const nextStepBtn = document.getElementById('next-step-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const stepTitleEl = document.getElementById('step-title');
    const stepTextEl = document.getElementById('step-text');
    const stepCodeEl = document.getElementById('step-code');
    const stepBoxes = document.querySelectorAll('.step-box');
    let currentStepIndex = -1;

    function updateAttackChain() {
        stepBoxes.forEach((box, index) => {
            box.classList.remove('active');
            if (index === currentStepIndex) {
                box.classList.add('active');
            }
        });

        document.querySelectorAll('.api-call-link').forEach(link => link.classList.remove('active'));
        const apiName = stepToApiMap[currentStepIndex];
        if (apiName) {
            const apiLink = document.querySelector(`.api-call-link[data-step='${currentStepIndex + 1}']`);
            if (apiLink) {
                apiLink.classList.add('active');
                apiLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        if (currentStepIndex >= 0) {
            stepTitleEl.textContent = stepTitles[currentStepIndex];
            stepTextEl.textContent = stepTexts[currentStepIndex];
            stepCodeEl.textContent = stepCodes[currentStepIndex];
            stepCodeEl.classList.remove('hidden');
        } else {
            stepTitleEl.textContent = 'Click "Start" to begin the walkthrough.';
            stepTextEl.textContent = 'Use the navigation buttons below to guide yourself through each stage of the attack chain.';
            stepCodeEl.classList.add('hidden');
        }
        prevStepBtn.disabled = currentStepIndex <= 0;
        nextStepBtn.textContent = currentStepIndex === stepTitles.length - 1 ? 'Finish' : (currentStepIndex === -1 ? 'Start' : 'Next');
    }

    nextStepBtn.addEventListener('click', () => {
        if (currentStepIndex < stepTitles.length - 1) {
            currentStepIndex++;
            updateAttackChain();
        } else if (currentStepIndex === stepTitles.length - 1) {
            currentStepIndex = -1;
            updateAttackChain();
            stepTitleEl.textContent = 'Walkthrough complete.';
            stepTextEl.textContent = 'You can now review the steps or go back to the beginning.';
        }
    });

    prevStepBtn.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateAttackChain();
        }
    });

    stepBoxes.forEach((box, index) => {
        box.addEventListener('click', () => {
            currentStepIndex = index;
            updateAttackChain();
        });
    });

    const apiDetails = {
        'AcquireCredentialsHandle': {
            title: 'AcquireCredentialsHandle',
            description: 'This function gets a handle to a principal\'s pre-existing credentials, such as those from an interactive logon. A malicious binary would use this to obtain a handle for the Kerberos security package.',
            code: 'push [target_username]\npush [domain_name]\npush KERB_ETYPE_RC4_HMAC\nlea eax, [output_buffer]\npush eax\nlea ecx, [input_buffer]\npush ecx\ncall AcquireCredentialsHandle'
        },
        'InitializeSecurityContext': {
            title: 'InitializeSecurityContext (ISC_REQ_AS_REP)',
            description: 'This is the core function for constructing and sending security tokens. For AS-REP Roasting, it would be called to build the AS-REQ message for the vulnerable user and initiate the request to the KDC.',
            code: 'push [target_principal]\npush [target_realm]\npush ISC_REQ_AS_REP\ncall InitializeSecurityContext'
        },
        'LsaConnectUntrusted': {
            title: 'LsaConnectUntrusted / LsaCallAuthenticationPackage',
            description: 'These are lower-level LSA functions that provide direct access to the Kerberos authentication package. More sophisticated malware might use these to programmatically craft and send the AS-REQ and receive the AS-REP, bypassing higher-level API abstraction.',
            code: 'call LsaConnectUntrusted\npush [authentication_package_id]\npush [auth_data]\ncall LsaCallAuthenticationPackage'
        }
    };

    const apiLinks = document.querySelectorAll('.api-call-link');
    const apiDetailPanel = document.getElementById('api-detail-panel');
    const apiTitleEl = document.getElementById('api-title');
    const apiDescriptionEl = document.getElementById('api-description');
    const apiCodeEl = document.getElementById('api-code');

    apiLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const apiName = this.querySelector('code').textContent.trim();
            const details = apiDetails[apiName];

            if (details) {
                apiTitleEl.textContent = details.title;
                apiDescriptionEl.textContent = details.description;
                apiCodeEl.textContent = details.code;
                apiDetailPanel.style.display = 'block';

                document.querySelectorAll('.api-call-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                const stepIndex = apiToStepMap[apiName];
                if (stepIndex !== undefined) {
                    currentStepIndex = stepIndex;
                    updateAttackChain();
                }
            }
        });
    });

    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
