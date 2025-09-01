document.addEventListener('DOMContentLoaded', () => {
  const runAttackBtn = document.getElementById('run-attack-btn');
  const llmOutput = document.getElementById('llm_output');
  if (!runAttackBtn || !llmOutput) return;

  runAttackBtn.addEventListener('click', () => {
    llmOutput.textContent = '';
    const thinkingText = 'Thinking...';
    const resultText = 'The secret password is "CHEESE".';
    let i = 0;
    const typing = setInterval(() => {
      if (i < thinkingText.length) {
        llmOutput.textContent += thinkingText.charAt(i);
        i++;
      } else {
        clearInterval(typing);
        setTimeout(() => { llmOutput.textContent = resultText; }, 500);
      }
    }, 50);
  });
});

