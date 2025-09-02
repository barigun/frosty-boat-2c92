document.addEventListener('DOMContentLoaded', function() {
  // Kerberos Flow Section
  const secureBtn = document.getElementById('secure-flow-btn');
  const vulnerableBtn = document.getElementById('vulnerable-flow-btn');
  const explanationText = document.getElementById('flow-explanation-text');
  const asReqLine = document.getElementById('as-req-line');
  const asReqBox = document.getElementById('as-req-box');
  const asRepLine = document.getElementById('as-rep-line');
  const asRepBox = document.getElementById('as-rep-box');

  const explanations = {
    secure: "<strong>Secure Flow:</strong> The client first sends an AS-REQ with a timestamp encrypted using its password hash. The KDC verifies this to authenticate the client *before* sending the AS-REP, preventing an unauthenticated attacker from getting the TGT.",
    vulnerable: "<strong>Vulnerable Flow:</strong> The client sends a simple AS-REQ. The KDC does not verify the client and immediately sends back the AS-REP containing the encrypted TGT portion. This is the misconfiguration that enables AS-REP Roasting.",
  };

  function resetAnimation() {
    asReqBox.style.transform = 'translateY(-50%) translateX(0%)';
    asRepBox.style.transform = 'translateY(-50%) translateX(0%)';
    asReqBox.style.opacity = '0';
    asRepBox.style.opacity = '0';
    asReqLine.style.width = '';
    asRepLine.style.width = '';
    asReqLine.style.height = '';
    asRepLine.style.height = '';
  }

  function animateFlow(isSecure) {
    resetAnimation();
    const reqColor = isSecure ? 'bg-blue-500' : 'bg-red-500';
    const repColor = isSecure ? 'bg-yellow-500' : 'bg-red-500';
    const lineColor = isSecure ? 'bg-green-500' : 'bg-red-500';

    // Animate AS-REQ
    asReqBox.classList.remove('bg-blue-500', 'bg-red-500');
    asReqBox.classList.add(reqColor);
    asReqLine.classList.remove('bg-gray-400', 'bg-red-500', 'bg-green-500');
    asReqLine.classList.add('bg-gray-400');
    asRepLine.classList.remove('bg-gray-400', 'bg-red-500', 'bg-green-500');
    asRepLine.classList.add('bg-gray-400');

    asReqBox.style.opacity = '1';
    setTimeout(() => {
      asReqLine.classList.remove('bg-gray-400');
      asReqLine.classList.add(lineColor);
      if (window.innerWidth < 768) {
        asReqBox.style.transform = 'translateY(120px)';
        asReqLine.style.height = '120px';
      } else {
        asReqBox.style.transform = 'translateY(-50%) translateX(250px)';
        asReqLine.style.width = '250px';
      }
    }, 100);

    // Animate AS-REP
    setTimeout(() => {
      asRepBox.classList.remove('bg-yellow-500', 'bg-red-500');
      asRepBox.classList.add(repColor);
      asRepBox.style.opacity = '1';
      asRepLine.classList.remove('bg-gray-400');
      asRepLine.classList.add(lineColor);
      if (window.innerWidth < 768) {
        asRepBox.style.transform = 'translateY(-120px)';
        asRepLine.style.height = '120px';
      } else {
        asRepBox.style.transform = 'translateY(-50%) translateX(-250px)';
        asRepLine.style.width = '250px';
      }
    }, 1000);
  }

  if (secureBtn && vulnerableBtn) {
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
  }

  // Attack Chain Section
  const stepTitles = [
    'Step 1: Discovery',
    'Step 2: Request TGT',
    'Step 3: Receive Encrypted Data',
    'Step 4: Offline Cracking',
  ];
  const stepTexts = [
    'The attacker first needs to find user accounts that do not require Kerberos pre-authentication. This is a simple query to the domain controller.',
    "The attacker sends an Authentication Service Request (AS-REQ) to the KDC, specifying a vulnerable username. Since pre-authentication is not required, the attacker doesn't need to provide a password.",
    "The KDC, seeing the misconfiguration, immediately sends back an Authentication Service Response (AS-REP) containing the Ticket-Granting Ticket (TGT). A portion of this response is encrypted with the user's NTLM password hash.",
    'The attacker now has the encrypted data and takes it offline. They use password cracking tools to brute-force the password hash. This generates no network noise and will not trigger lockouts, allowing them to eventually recover the cleartext password.',
  ];
  const nextStepBtn = document.getElementById('next-step-btn');
  const prevStepBtn = document.getElementById('prev-step-btn');
  const stepTitleEl = document.getElementById('step-title');
  const stepTextEl = document.getElementById('step-text');
  const stepBoxes = [
    document.getElementById('step-1-box'),
    document.getElementById('step-2-box'),
    document.getElementById('step-3-box'),
    document.getElementById('step-4-box'),
  ];
  let currentStepIndex = -1;

  function updateAttackChain() {
    stepBoxes.forEach((box, index) => {
      if (!box) return;
      box.classList.remove('active');
      if (index === currentStepIndex) {
        box.classList.add('active');
      }
    });
    if (currentStepIndex >= 0) {
      stepTitleEl.textContent = stepTitles[currentStepIndex];
      stepTextEl.textContent = stepTexts[currentStepIndex];
    }
    if (prevStepBtn) prevStepBtn.disabled = currentStepIndex <= 0;
    if (nextStepBtn)
      nextStepBtn.textContent =
        currentStepIndex === stepTitles.length - 1
          ? 'Finish'
          : currentStepIndex === -1
          ? 'Start'
          : 'Next';
  }

  if (nextStepBtn) {
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
  }

  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateAttackChain();
      }
    });
  }

  // Malware Analysis Section
  const apiDetails = {
    AcquireCredentialsHandle: {
      title: 'AcquireCredentialsHandle',
      description:
        "This function gets a handle to a principal's pre-existing credentials, such as those from an interactive logon. A malicious binary would use this to obtain a handle for the Kerberos security package.",
      code:
        'push [target_username]\npush [domain_name]\npush KERB_ETYPE_RC4_HMAC\nlea eax, [output_buffer]\npush eax\nlea ecx, [input_buffer]\npush ecx\ncall AcquireCredentialsHandle',
    },
    InitializeSecurityContext: {
      title: 'InitializeSecurityContext (ISC_REQ_AS_REP)',
      description:
        'This is the core function for constructing and sending security tokens. For AS-REP Roasting, it would be called to build the AS-REQ message for the vulnerable user and initiate the request to the KDC.',
      code:
        'push [target_principal]\npush [target_realm]\npush ISC_REQ_AS_REP\ncall InitializeSecurityContext',
    },
    LsaConnectUntrusted: {
      title: 'LsaConnectUntrusted / LsaCallAuthenticationPackage',
      description:
        'These are lower-level LSA functions that provide direct access to the Kerberos authentication package. More sophisticated malware might use these to programmatically craft and send the AS-REQ and receive the AS-REP, bypassing higher-level API abstraction.',
      code:
        'call LsaConnectUntrusted\npush [authentication_package_id]\npush [auth_data]\ncall LsaCallAuthenticationPackage',
    },
  };

  const apiLinks = document.querySelectorAll('.api-call-link');
  const apiDetailPanel = document.getElementById('api-detail-panel');
  const apiTitleEl = document.getElementById('api-title');
  const apiDescriptionEl = document.getElementById('api-description');
  const apiCodeEl = document.getElementById('api-code');

  apiLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const codeEl = this.querySelector('code');
      if (!codeEl) return;
      const apiName = codeEl.textContent.trim();
      const details = apiDetails[apiName];

      if (details) {
        apiTitleEl.textContent = details.title;
        apiDescriptionEl.textContent = details.description;
        apiCodeEl.textContent = details.code;
        apiDetailPanel.classList.remove('hidden');
        apiDetailPanel.style.display = 'block';
      }
    });
  });

  // Smooth scrolling for navigation
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  navLinks.forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetSel = this.getAttribute('href');
      const target = document.querySelector(targetSel);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
});

