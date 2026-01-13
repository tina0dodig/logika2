const logickiVeznici = {
    konjukcija: {
        simbol: "∧",
        rijeci: ["i", "pa", "te", "ni", "niti", "a", "ali", "nego", "no", "već", "mada", "premda", "iako"]
    },
    negacija: {
        simbol: "¬",
        rijeci: ["nije slučaj da", "ne vrijedi da", "nije tako da", "ne"]
    },
    disjunkcija: {
        simbol: "∨",
        rijeci: ["ili", "bilo"]
    },
    implikacija: {
        simbol: "→",
        rijeci: ["ako", "onda", "budući da", "pod pretpostavkom da", "u slučaju da"]
    },
    ekvivalencija: {
        simbol: "↔",
        rijeci: ["ako i samo ako"]
    }
};

let varijable = [];

let unosRecenice, kontejnerVarijabli, dodajVarijabluBtn, parsirajBtn, resetirajBtn, izlaz;

function pokreniAplikaciju() {
    unosRecenice = document.getElementById('unosRecenice');
    kontejnerVarijabli = document.getElementById('kontejnerVarijabli');
    dodajVarijabluBtn = document.getElementById('dodajVarijabluBtn');
    parsirajBtn = document.getElementById('parsirajBtn');
    resetirajBtn = document.getElementById('resetirajBtn');
    izlaz = document.getElementById('izlaz');

    dodajVarijabluBtn.addEventListener('click', dodajVarijablu);
    parsirajBtn.addEventListener('click', parsirajRecenicu);
    resetirajBtn.addEventListener('click', resetirajFormu);

    dodajVarijablu();
}

function prikaziVarijable() {
    if (!kontejnerVarijabli) return;

    kontejnerVarijabli.innerHTML = '';

    varijable.forEach((varijabla, indeks) => {
        const varijablaDiv = document.createElement('div');
        varijablaDiv.className = 'varijable-input';

        varijablaDiv.innerHTML = `
            <label for="simbol${indeks}">Simbol (npr. T, P, K):</label>
            <input type="text" id="simbol${indeks}" value="${varijabla.simbol}" maxlength="2" 
                   data-indeks="${indeks}" data-tip="simbol">
            <span class="uputa">Jedno slovo (A-Z)</span>
            
            <label for="iskaz${indeks}" style="margin-top: 8px;">Iskaz:</label>
            <input type="text" id="iskaz${indeks}" value="${varijabla.iskaz}" 
                   data-indeks="${indeks}" data-tip="iskaz" placeholder="npr. pada kiša">
            <span class="uputa">Unesite iskaz s razmacima između riječi</span>
            
            ${indeks > 0 ? `<button type="button" class="opasni-gumb" data-indeks="${indeks}">Ukloni varijablu</button>` : ''}
        `;

        kontejnerVarijabli.appendChild(varijablaDiv);
    });

    document.querySelectorAll('[data-tip="simbol"]').forEach(input => {
        input.addEventListener('input', azurirajVarijablu);
    });

    document.querySelectorAll('[data-tip="iskaz"]').forEach(input => {
        input.addEventListener('input', azurirajVarijablu);
    });

    document.querySelectorAll('.opasni-gumb').forEach(gumb => {
        gumb.addEventListener('click', function () {
            const indeks = parseInt(this.getAttribute('data-indeks'));
            ukloniVarijablu(indeks);
        });
    });
}

function azurirajVarijablu(e) {
    const indeks = parseInt(e.target.dataset.indeks);
    const tip = e.target.dataset.tip;
    const vrijednost = e.target.value;

    if (tip === 'simbol') {
        const cistaVrijednost = vrijednost.replace(/[^A-Za-z]/g, '').toUpperCase();
        varijable[indeks].simbol = cistaVrijednost;
        e.target.value = cistaVrijednost;
    } else {
        varijable[indeks].iskaz = vrijednost;
    }
}

function ukloniVarijablu(indeks) {
    if (varijable.length > 1) {
        varijable.splice(indeks, 1);
        prikaziVarijable();
    } else {
        alert("Morate imati barem jednu varijablu!");
    }
}

function dodajVarijablu() {
    const koristenaSlova = varijable.map(v => v.simbol);
    let sljedeceSlovo = 'A';

    for (let i = 65; i <= 90; i++) {
        const slovo = String.fromCharCode(i);
        if (!koristenaSlova.includes(slovo)) {
            sljedeceSlovo = slovo;
            break;
        }
    }

    varijable.push({
        simbol: sljedeceSlovo,
        iskaz: ''
    });

    prikaziVarijable();

    const zadnjiIndeks = varijable.length - 1;
    const zadnjiInput = document.getElementById(`iskaz${zadnjiIndeks}`);
    if (zadnjiInput) {
        setTimeout(() => {
            zadnjiInput.focus();
        }, 100);
    }
}

function parsirajRecenicu() {
    if (!unosRecenice || !izlaz) return;

    const recenica = unosRecenice.value.trim();

    if (!recenica) {
        izlaz.innerHTML = `<span style="color: #e74c3c;">Molimo unesite rečenicu za analizu.</span>`;
        return;
    }

    if (varijable.length === 0) {
        izlaz.innerHTML = `<span style="color: #e74c3c;">Molimo definirajte barem jednu varijablu.</span>`;
        return;
    }

    try {
        let rezultat = recenica;

        rezultat = zamijeniIskaze(rezultat);
        rezultat = obradiNegaciju(rezultat);
        rezultat = obradiPosebneSlucajeve(rezultat);
        rezultat = zamijeniLogickeVeznike(rezultat);
        rezultat = dodajZagrade(rezultat);
        rezultat = ocistiFormat(rezultat);

        izlaz.innerHTML = `<strong>Originalna rečenica:</strong>\n${recenica}\n\n<strong>Logički izraz:</strong>\n<span class="simbol">${rezultat}</span>`;

    } catch (pogreska) {
        izlaz.innerHTML = `<span style="color: #e74c3c;">Došlo je do greške pri parsiranju.</span>`;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function napraviFleksibilniRegexZaIskaz(iskaz) {
    const rijeci = iskaz.trim().split(/\s+/).map(escapeRegExp);
    const pattern = rijeci.join('\\s+');
    return new RegExp(pattern, 'gi');
}

function zamijeniIskaze(tekst) {
    let rezultat = tekst;

    const sortiraneVarijable = [...varijable].sort((a, b) => (b.iskaz || '').length - (a.iskaz || '').length);

    sortiraneVarijable.forEach(varijabla => {
        if (varijabla.iskaz && varijabla.iskaz.trim()) {
            const cistiIskaz = varijabla.iskaz.trim();
            const bezRazmaka = cistiIskaz.replace(/\s+/g, '');

            const regexFleks = napraviFleksibilniRegexZaIskaz(cistiIskaz);
            rezultat = rezultat.replace(regexFleks, varijabla.simbol);

            const regexBezRazmaka = new RegExp(escapeRegExp(bezRazmaka), 'gi');
            rezultat = rezultat.replace(regexBezRazmaka, varijabla.simbol);
        }
    });

    return rezultat;
}

function obradiNegaciju(tekst) {
    let rezultat = tekst;


    rezultat = rezultat.replace(/\bnije\s+slučaj\s+da\s+/gi, '¬');
    rezultat = rezultat.replace(/\bne\s+vrijedi\s+da\s+/gi, '¬');
    rezultat = rezultat.replace(/\bnije\s+tako\s+da\s+/gi, '¬');


    rezultat = rezultat.replace(/\bne\s*ću\s*([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bneću\s*([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bneće\s*([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bnece\s*([A-Z(¬])/gi, '¬$1');

    rezultat = rezultat.replace(/\bnisam\s+([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bnisi\s+([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bnije\s+([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bnismo\s+([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bniste\s+([A-Z(¬])/gi, '¬$1');
    rezultat = rezultat.replace(/\bnisu\s+([A-Z(¬])/gi, '¬$1');


    return rezultat;
}

function obradiPosebneSlucajeve(tekst) {
    let rezultat = tekst;

    const biloBiloRegex = /bilo\s+([A-Z¬(][^,.]*?)\s+bilo\s+([A-Z¬(][^,.]*?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(biloBiloRegex, '($1 ∨ $2)');

    const akoSamoAkoSredina = /(\([^()]+\)|¬?[A-Z])\s*ako i samo ako\s*(\([^()]+\)|¬?[A-Z])/gi;
    rezultat = rezultat.replace(akoSamoAkoSredina, '($1 ↔ $2)');

    const akoSamoAkoPocetak = /^ako i samo ako\s+([A-Z¬])\s+([A-Z¬])/gi;
    rezultat = rezultat.replace(akoSamoAkoPocetak, '($1 ↔ $2)');

    const samoAkoSredina = /([A-Z¬])\s+samo ako\s+([A-Z¬])/gi;
    rezultat = rezultat.replace(samoAkoSredina, '($1 → $2)');

    const samoAkoPocetak = /^samo ako\s+([A-Z¬])\s+([A-Z¬])/gi;
    rezultat = rezultat.replace(samoAkoPocetak, '($2 → $1)');

    const akoOndaPocetak = /^ako\s+([A-Z¬(][^,.]*?)\s+onda\s+([A-Z¬(][^,.]*?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(akoOndaPocetak, '($1 → $2)');

    const akoOndaSredina = /ako\s+([^,.]+?)\s+onda\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(akoOndaSredina, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    const uSlucajuDaPocetak = /^u slučaju da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(uSlucajuDaPocetak, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    const uSlucajuDaSredina = /u slučaju da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(uSlucajuDaSredina, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    const buduciDaPocetak = /^budući da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(buduciDaPocetak, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    const buduciDaSredina = /budući da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(buduciDaSredina, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });
    const podPretpostavkomDaPocetak = /^pod pretpostavkom da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(podPretpostavkomDaPocetak, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    const podPretpostavkomDaSredina = /pod pretpostavkom da\s+([^,.]+?)\s+([^,.]+?)(?=[,.]|$)/gi;
    rezultat = rezultat.replace(podPretpostavkomDaSredina, (match, p1, p2) => {
        return `(${p1.trim()} → ${p2.trim()})`;
    });

    return rezultat;
}

function zamijeniLogickeVeznike(tekst) {
    let rezultat = tekst;

    Object.values(logickiVeznici).forEach(veznik => {
        veznik.rijeci.forEach(rijec => {
            const posebniVeznici = ["samo ako", "ako i samo ako", "bilo", "ako", "onda",
                "u slučaju da", "budući da", "pod pretpostavkom da"];

            if (!posebniVeznici.includes(rijec)) {
                const regex = new RegExp(`\\b${escapeRegExp(rijec)}\\b`, 'gi');
                rezultat = rezultat.replace(regex, function (match) {
                    const varijableSimboli = varijable.map(v => v.simbol);
                    if (varijableSimboli.includes(match.toUpperCase())) {
                        return match;
                    }
                    return veznik.simbol;
                });
            }
        });
    });

    return rezultat;
}

function tokenizirajIzraz(tekst) {
    const t = tekst
        .replace(/([()∧∨→↔])/g, ' $1 ')
        .replace(/¬\s+/g, '¬')
        .replace(/\s+/g, ' ')
        .trim();

    const sirovi = t.split(' ').filter(Boolean);
    const tokeni = [];

    for (let i = 0; i < sirovi.length; i++) {
        const s = sirovi[i];

        if (s === '¬') {
            tokeni.push({ tip: 'NOT', v: '¬' });
        } else if (s === '∧' || s === '∨' || s === '→' || s === '↔') {
            tokeni.push({ tip: 'OP', v: s });
        } else if (s === '(') {
            tokeni.push({ tip: 'LP', v: s });
        } else if (s === ')') {
            tokeni.push({ tip: 'RP', v: s });
        } else if (/^[A-Z]$/.test(s)) {
            tokeni.push({ tip: 'VAR', v: s });
        } else if (/^¬[A-Z]$/.test(s)) {
            tokeni.push({ tip: 'NOT', v: '¬' });
            tokeni.push({ tip: 'VAR', v: s.slice(1) });
        } else {
            tokeni.push({ tip: 'TXT', v: s });
        }
    }

    return tokeni;
}

function prioritet(op) {
    if (op === '¬') return 5;
    if (op === '∧') return 4;
    if (op === '∨') return 3;
    if (op === '→') return 2;
    if (op === '↔') return 1;
    return 0;
}

function asocijativnost(op) {
    if (op === '¬') return 'R';
    if (op === '→') return 'R';
    return 'L';
}

function napraviASTizTokena(tokeni) {
    const output = [];
    const ops = [];

    function pushOp(opToken) {
        while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.tip !== 'OP' && top.tip !== 'NOT') break;

            const topOp = top.v;
            const curOp = opToken.v;

            const pTop = prioritet(topOp);
            const pCur = prioritet(curOp);

            if (
                (asocijativnost(curOp) === 'L' && pCur <= pTop) ||
                (asocijativnost(curOp) === 'R' && pCur < pTop)
            ) {
                output.push(ops.pop());
            } else {
                break;
            }
        }
        ops.push(opToken);
    }

    for (let i = 0; i < tokeni.length; i++) {
        const tok = tokeni[i];

        if (tok.tip === 'VAR') {
            output.push(tok);
        } else if (tok.tip === 'NOT') {
            pushOp({ tip: 'NOT', v: '¬' });
        } else if (tok.tip === 'OP') {
            pushOp(tok);
        } else if (tok.tip === 'LP') {
            ops.push(tok);
        } else if (tok.tip === 'RP') {
            while (ops.length && ops[ops.length - 1].tip !== 'LP') {
                output.push(ops.pop());
            }
            if (ops.length && ops[ops.length - 1].tip === 'LP') ops.pop();
        } else {

        }
    }

    while (ops.length) {
        const op = ops.pop();
        if (op.tip !== 'LP') output.push(op);
    }

    const stack = [];

    for (const tok of output) {
        if (tok.tip === 'VAR') {
            stack.push({ tip: 'VAR', v: tok.v });
        } else if (tok.tip === 'NOT') {
            const a = stack.pop();
            if (!a) throw new Error("Pogrešna negacija");
            stack.push({ tip: 'NOT', a });
        } else if (tok.tip === 'OP') {
            const b = stack.pop();
            const a = stack.pop();
            if (!a || !b) throw new Error("Pogrešan operator");
            stack.push({ tip: 'BIN', op: tok.v, a, b });
        }
    }

    if (stack.length !== 1) throw new Error("Neispravan izraz");
    return stack[0];
}

function ispisiAST(ast) {
    if (ast.tip === 'VAR') return ast.v;
    if (ast.tip === 'NOT') {
        const unutra = ispisiAST(ast.a);
        if (ast.a.tip === 'BIN') return `¬(${unutra})`;
        return `¬${unutra}`;
    }
    if (ast.tip === 'BIN') {
        const lijevo = ispisiAST(ast.a);
        const desno = ispisiAST(ast.b);
        return `(${lijevo} ${ast.op} ${desno})`;
    }
    return '';
}

function dodajZagrade(tekst) {
    let rezultat = tekst;

    rezultat = rezultat.replace(/¬\s+/g, '¬');

    try {
        const tokeni = tokenizirajIzraz(rezultat).filter(t => t.tip !== 'TXT');
        if (tokeni.length === 0) return rezultat;

        const ast = napraviASTizTokena(tokeni);
        rezultat = ispisiAST(ast);

        rezultat = rezultat.replace(/\(\(([^()]+)\)\)/g, '($1)');

        return rezultat;
    } catch (e) {
        const izraziBezZagrada = rezultat.match(/([A-Z¬][^()]+?)(?=[,.]|$)/g);

        if (izraziBezZagrada) {
            izraziBezZagrada.forEach(izraz => {
                const cistiIzraz = izraz.trim();

                if ((cistiIzraz.includes('→') ||
                    cistiIzraz.includes('∧') ||
                    cistiIzraz.includes('∨') ||
                    cistiIzraz.includes('↔')) &&
                    !cistiIzraz.includes('(') && !cistiIzraz.includes(')')) {

                    rezultat = rezultat.replace(cistiIzraz, `(${cistiIzraz})`);
                }
            });
        }

        rezultat = rezultat.replace(/¬\s+/g, '¬');
        rezultat = rezultat.replace(/\(\(([^)]+)\)\)/g, '($1)');
        rezultat = rezultat.replace(/\(¬\)([A-Z])/g, '¬$1');

        return rezultat;
    }
}

function ocistiFormat(tekst) {
    let rezultat = tekst;

    rezultat = rezultat.replace(/[.,;!?]$/, '');
    rezultat = rezultat.replace(/([∧∨→↔])/g, ' $1 ');
    rezultat = rezultat.replace(/¬\s+/g, '¬');
    rezultat = rezultat.replace(/\s+/g, ' ');
    rezultat = rezultat.replace(/\s*\(\s*/g, '(');
    rezultat = rezultat.replace(/\s*\)\s*/g, ')');
    rezultat = rezultat.replace(/\(([A-Z])\s+↔\s+¬\)\s*([A-Z])/g, '($1 ↔ ¬$2)');

    const varijableSimboli = varijable.map(v => v.simbol);
    const preostaleRijeci = [
        "ako", "samo", "onda", "i", "da", "a",
        "neću", "nece", "neće", "ne",
        "nisam", "nisi", "nije", "nismo", "niste", "nisu"
    ];

    preostaleRijeci.forEach(rijec => {
        if (!varijableSimboli.includes(rijec.toUpperCase())) {
            const regex = new RegExp(`\\s*\\b${escapeRegExp(rijec)}\\b\\s*`, 'gi');
            rezultat = rezultat.replace(regex, ' ');
        }
    });

    rezultat = rezultat.replace(/\(\((.+?)\)\)/g, '($1)');

    return rezultat.replace(/\s+/g, ' ').trim();
}

function resetirajFormu() {
    if (unosRecenice) {
        unosRecenice.value = '';
    }

    varijable = [];
    dodajVarijablu();

    if (izlaz) {
        izlaz.textContent = 'Ovdje će se prikazati logički izraz...';
    }
}

document.addEventListener('DOMContentLoaded', pokreniAplikaciju);
