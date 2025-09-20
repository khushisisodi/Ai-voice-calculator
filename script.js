class Calculator {
    constructor() {
        this.previousOperandElement = document.getElementById('previous-operand');
        this.currentOperandElement = document.getElementById('current-operand');
        this.voiceStatusElement = document.getElementById('voice-status');
        this.voiceInstructionsElement = document.getElementById('voice-instructions');
        
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
        
        this.recognition = this.setupVoiceRecognition();
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Button clicks
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const number = button.getAttribute('data-number');
                
                if (number) {
                    this.inputNumber(number);
                } else if (action) {
                    this.handleAction(action);
                }
                
                this.updateDisplay();
            });
        });
        
        // Keyboard support
        document.addEventListener('keydown', (event) => {
            if (/[0-9]/.test(event.key)) {
                this.inputNumber(event.key);
            } else if (event.key === '.') {
                this.inputNumber('.');
            } else if (event.key === '+' || event.key === '-') {
                this.chooseOperation(event.key);
            } else if (event.key === '*' || event.key === 'x') {
                this.chooseOperation('*');
            } else if (event.key === '/') {
                this.chooseOperation('/');
            } else if (event.key === 'Enter' || event.key === '=') {
                this.calculate();
            } else if (event.key === 'Escape') {
                this.clear();
            } else if (event.key === 'Backspace') {
                this.backspace();
            }
            
            this.updateDisplay();
        });
    }
    
    inputNumber(number) {
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }
        
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number;
        }
    }
    
    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'voice-input':
                this.startVoiceInput();
                break;
            case 'speak-result':
                this.speakResult();
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                this.chooseOperation(action);
                break;
            case 'calculate':
                this.calculate();
                break;
        }
    }
    
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
    }
    
    backspace() {
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }
    
    chooseOperation(operation) {
        if (this.currentOperand === '0') return;
        
        if (this.previousOperand !== '') {
            this.calculate();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.shouldResetScreen = true;
    }
    
    calculate() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    computation = 'Error';
                } else {
                    computation = prev / current;
                }
                break;
            default:
                return;
        }
        
        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }
    
    updateDisplay() {
        this.currentOperandElement.textContent = this.formatDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            const operatorSymbol = this.getOperationSymbol(this.operation);
            this.previousOperandElement.textContent = 
                `${this.formatDisplayNumber(this.previousOperand)} ${operatorSymbol}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }
    
    formatDisplayNumber(number) {
        if (number === 'Error') return number;
        
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '0';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }
    
    getOperationSymbol(operation) {
        switch (operation) {
            case '+': return '+';
            case '-': return '−';
            case '*': return '×';
            case '/': return '÷';
            default: return '';
        }
    }
    
    setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.voiceStatusElement.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            this.voiceInstructionsElement.textContent = 'Voice recognition not supported in this browser';
            return null;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            document.body.classList.add('listening');
            this.voiceStatusElement.innerHTML = '<i class="fas fa-microphone"></i> Listening...';
        };
        
        recognition.onend = () => {
            document.body.classList.remove('listening');
            this.voiceStatusElement.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            this.processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.voiceStatusElement.innerHTML = '<i class="fas fa-microphone-slash"></i> Error';
        };
        
        return recognition;
    }
    
    startVoiceInput() {
        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Speech recognition start failed', error);
            }
        } else {
            this.voiceInstructionsElement.textContent = 'Voice recognition not available';
        }
    }
    
    processVoiceCommand(transcript) {
        console.log('Voice command:', transcript);
        
        // Process mathematical expressions
        const expression = transcript
            .replace(/plus/gi, '+')
            .replace(/add/gi, '+')
            .replace(/minus/gi, '-')
            .replace(/subtract/gi, '-')
            .replace(/times/gi, '*')
            .replace(/multiplied by/gi, '*')
            .replace(/multiply/gi, '*')
            .replace(/divided by/gi, '/')
            .replace(/divide/gi, '/')
            .replace(/over/gi, '/')
            .replace(/to the power/gi, '^')
            .replace(/squared/gi, '^2')
            .replace(/cubed/gi, '^3')
            .replace(/percent/gi, '%')
            .replace(/\\s+/g, '')
            .replace(/[^0-9+\-*/.^%()]/g, '');
        
        try {
            // Simple evaluation for demonstration (in a real app, use a more secure method)
            if (expression) {
                // For basic operations only
                if (/^[\d+\-*/.]+$/.test(expression)) {
                    const result = eval(expression);
                    this.currentOperand = result.toString();
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.updateDisplay();
                    this.speakResult();
                }
            }
        } catch (error) {
            console.error('Error processing voice command', error);
        }
    }
    
    speakResult() {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = `The result is ${this.currentOperand}`;
            utterance.volume = 1;
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            window.speechSynthesis.speak(utterance);
        } else {
            this.voiceInstructionsElement.textContent = 'Speech synthesis not supported';
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});