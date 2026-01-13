// DOM elementi
const pCheckbox = document.getElementById('p');
const qCheckbox = document.getElementById('q');
const pLabel = document.getElementById('p-label');
const qLabel = document.getElementById('q-label');
const operatorSelect = document.getElementById('operator');
const calculateBtn = document.getElementById('calculate');
const resultValue = document.getElementById('result-value');
const resultText = document.getElementById('result-text');
const truthTableBody = document.getElementById('truth-table-body');
const operatorHeader = document.getElementById('operator-header');

// Inicijalizacija varijabli
let p = false;
let q = false;
let operator = 'and';

// Funkcija za ažuriranje prikaza varijabli
function updateVariableDisplay() {
    pLabel.textContent = p ? 'T' : 'N';
    pLabel.className = `checkbox-label ${p ? 'true' : 'false'}`;
    
    qLabel.textContent = q ? 'T' : 'N';
    qLabel.className = `checkbox-label ${q ? 'true' : 'false'}`;
}

// Funkcija za izračunavanje rezultata na temelju operatora
function calculateResult(pVal, qVal, op) {
    switch(op) {
        case 'and':
            return pVal && qVal;
        case 'or':
            return pVal || qVal;
        case 'implication':
            return !pVal || qVal; // p → q je ekvivalentno sa !p || q
        case 'equivalence':
            return pVal === qVal;
        case 'xor':
            return pVal !== qVal;
        case 'nand':
            return !(pVal && qVal);
        case 'nor':
            return !(pVal || qVal);
        default:
            return false;
    }
}

// Funkcija za dobivanje naziva operatora
function getOperatorName(op) {
    const names = {
        'and': 'Konjukcija (logičko i)',
        'or': 'Disjunkcija (logičko ili)',
        'implication': 'Implikacija',
        'equivalence': 'Ekvivalencija',
        'xor': 'Alternacija',
        
    };
    return names[op] || op;
}

// Funkcija za dobivanje simbola operatora
function getOperatorSymbol(op) {
    const symbols = {
        'and': '∧',
        'or': '∨',
        'implication': '→',
        'equivalence': '↔',
        'xor': '⊕',
        
    };
    return symbols[op] || op;
}

// Funkcija za prikaz rezultata
function displayResult(result) {
    resultValue.textContent = result ? 'TOČNO (T)' : 'NETOČNO (N)';
    resultValue.className = `result-value ${result ? 'result-true' : 'result-false'}`;
    
    const operatorName = getOperatorName(operator);
    const operatorSymbol = getOperatorSymbol(operator);
    const pVal = p ? 'T' : 'N';
    const qVal = q ? 'T' : 'N';
    
    resultText.innerHTML = `
        Formula: <strong>${pVal} ${operatorSymbol} ${qVal}</strong><br>
        Operator: ${operatorName}<br>
        Rezultat: <strong>${result ? 'TOČNO' : 'NETOČNO'}</strong>
    `;
}

// Funkcija za generiranje tablice istinitosti
function generateTruthTable() {
    const operatorSymbol = getOperatorSymbol(operator);
    operatorHeader.textContent = `p ${operatorSymbol} q`;
    
    // Sve moguće kombinacije vrijednosti za p i q
    const combinations = [
        {p: false, q: false},
        {p: false, q: true},
        {p: true, q: false},
        {p: true, q: true}
    ];
    
    // Generiranje redova tablice
    let tableHTML = '';
    
    combinations.forEach(combo => {
        const result = calculateResult(combo.p, combo.q, operator);
        const pVal = combo.p ? 'T' : 'N';
        const qVal = combo.q ? 'T' : 'N';
        const resultVal = result ? 'T' : 'N';
        
        // Označavanje trenutno odabrane kombinacije
        const isCurrent = (combo.p === p && combo.q === q);
        const rowClass = isCurrent ? 'current-row' : '';
        
        tableHTML += `
            <tr class="${rowClass}">
                <td class="${combo.p ? 'true-cell' : 'false-cell'}">${pVal}</td>
                <td class="${combo.q ? 'true-cell' : 'false-cell'}">${qVal}</td>
                <td class="${result ? 'true-cell' : 'false-cell'}">${resultVal}</td>
            </tr>
        `;
    });
    
    truthTableBody.innerHTML = tableHTML;
}

// Event listener-i
pCheckbox.addEventListener('change', function() {
    p = this.checked;
    updateVariableDisplay();
    calculateAndDisplay();
});

qCheckbox.addEventListener('change', function() {
    q = this.checked;
    updateVariableDisplay();
    calculateAndDisplay();
});

operatorSelect.addEventListener('change', function() {
    operator = this.value;
    calculateAndDisplay();
});

calculateBtn.addEventListener('click', calculateAndDisplay);

// Glavna funkcija za izračunavanje i prikaz
function calculateAndDisplay() {
    const result = calculateResult(p, q, operator);
    displayResult(result);
    generateTruthTable();
}

// Inicijalizacija pri pokretanju
function init() {
    updateVariableDisplay();
    calculateAndDisplay();
}

// Pokreni inicijalizaciju kada se stranica učita
document.addEventListener('DOMContentLoaded', init);