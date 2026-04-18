let varijable = [];

let unosRecenice;
let kontejnerVarijabli;
let dodajVarijabluBtn;
let parsirajBtn;
let resetirajBtn;
let izlaz;

function pokreniAplikaciju() {
    unosRecenice = document.getElementById("unosRecenice");
    kontejnerVarijabli = document.getElementById("kontejnerVarijabli");
    dodajVarijabluBtn = document.getElementById("dodajVarijabluBtn");
    parsirajBtn = document.getElementById("parsirajBtn");
    resetirajBtn = document.getElementById("resetirajBtn");
    izlaz = document.getElementById("izlaz");

    dodajVarijabluBtn.addEventListener("click", dodajVarijablu);
    parsirajBtn.addEventListener("click", parsirajRecenicu);
    resetirajBtn.addEventListener("click", resetirajFormu);

    dodajVarijablu();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizirajTekst(tekst) {
    return tekst
        .replace(/[“”„"]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function prikaziVarijable() {
    if (!kontejnerVarijabli) return;

    kontejnerVarijabli.innerHTML = "";

    varijable.forEach((varijabla, indeks) => {
        const div = document.createElement("div");
        div.className = "varijable-input";

        div.innerHTML = `
            <label for="simbol${indeks}">Simbol:</label>
            <input type="text" id="simbol${indeks}" value="${varijabla.simbol}" maxlength="1"
                   data-indeks="${indeks}" data-tip="simbol">
            <span class="uputa">Jedno slovo (A-Z)</span>

            <label for="iskaz${indeks}" style="margin-top: 8px;">Iskaz:</label>
            <input type="text" id="iskaz${indeks}" value="${varijabla.iskaz}"
                   data-indeks="${indeks}" data-tip="iskaz" placeholder="npr. pada kiša">
            <span class="uputa">Točno prepiši dio rečenice</span>

            ${indeks > 0 ? `<button type="button" class="opasni-gumb" data-indeks="${indeks}">Ukloni varijablu</button>` : ""}
        `;

        kontejnerVarijabli.appendChild(div);
    });

    document.querySelectorAll('[data-tip="simbol"]').forEach(input => {
        input.addEventListener("input", azurirajVarijablu);
    });

    document.querySelectorAll('[data-tip="iskaz"]').forEach(input => {
        input.addEventListener("input", azurirajVarijablu);
    });

    document.querySelectorAll(".opasni-gumb").forEach(gumb => {
        gumb.addEventListener("click", function () {
            ukloniVarijablu(parseInt(this.dataset.indeks, 10));
        });
    });
}

function azurirajVarijablu(e) {
    const indeks = parseInt(e.target.dataset.indeks, 10);
    const tip = e.target.dataset.tip;

    if (tip === "simbol") {
        let vrijednost = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 1);
        if (!vrijednost) vrijednost = varijable[indeks].simbol || "A";
        varijable[indeks].simbol = vrijednost;
        e.target.value = vrijednost;
    } else {
        varijable[indeks].iskaz = e.target.value;
    }
}

function ukloniVarijablu(indeks) {
    if (varijable.length <= 1) {
        alert("Morate imati barem jednu varijablu.");
        return;
    }

    varijable.splice(indeks, 1);
    prikaziVarijable();
}

function dodajVarijablu() {
    if (varijable.length >= 3) {
        alert("Možete unijeti najviše 3 varijable.");
        return;
    }

    const koristenaSlova = varijable.map(v => v.simbol);
    let sljedeceSlovo = "A";

    for (let i = 65; i <= 90; i++) {
        const slovo = String.fromCharCode(i);
        if (!koristenaSlova.includes(slovo)) {
            sljedeceSlovo = slovo;
            break;
        }
    }

    varijable.push({
        simbol: sljedeceSlovo,
        iskaz: ""
    });

    prikaziVarijable();

    const zadnjiIndeks = varijable.length - 1;
    const input = document.getElementById(`iskaz${zadnjiIndeks}`);
    if (input) setTimeout(() => input.focus(), 50);
}

function napraviFleksibilniRegexZaIskaz(iskaz) {
    const rijeci = normalizirajTekst(iskaz).split(/\s+/).map(escapeRegExp);
    return new RegExp(rijeci.join("\\s+"), "gi");
}

function zamijeniIskaze(tekst) {
    let rezultat = tekst;

    const sortiraneVarijable = [...varijable]
        .filter(v => v.iskaz && v.iskaz.trim())
        .sort((a, b) => b.iskaz.trim().length - a.iskaz.trim().length);

    sortiraneVarijable.forEach(v => {
        const regex = napraviFleksibilniRegexZaIskaz(v.iskaz);
        rezultat = rezultat.replace(regex, v.simbol);
    });

    return rezultat;
}

function obradiFrazeNegacije(tekst) {
    let rezultat = tekst;

    rezultat = rezultat.replace(/\bnije\s+slučaj\s+da\s+(.+)$/i, (m, p1) => `¬(${p1.trim()})`);
    rezultat = rezultat.replace(/\bne\s+vrijedi\s+da\s+(.+)$/i, (m, p1) => `¬(${p1.trim()})`);
    rezultat = rezultat.replace(/\bnije\s+tako\s+da\s+(.+)$/i, (m, p1) => `¬(${p1.trim()})`);

    return rezultat;
}

function obradiNiNitiKonstrukcije(tekst) {
    let rezultat = tekst;
    const atom = "(?:¬?[A-Z]|\\([^()]+\\))";

    rezultat = rezultat.replace(new RegExp(`\\bniti\\s+(${atom})\\s+niti\\s+(${atom})\\b`, "gi"), "(¬$1 ∧ ¬$2)");
    rezultat = rezultat.replace(new RegExp(`\\bni\\s+(${atom})\\s+ni\\s+(${atom})\\b`, "gi"), "(¬$1 ∧ ¬$2)");
    rezultat = rezultat.replace(new RegExp(`\\bniti\\s+(${atom})\\s+ni\\s+(${atom})\\b`, "gi"), "(¬$1 ∧ ¬$2)");
    rezultat = rezultat.replace(new RegExp(`\\bni\\s+(${atom})\\s+niti\\s+(${atom})\\b`, "gi"), "(¬$1 ∧ ¬$2)");

    return rezultat;
}

function obradiObicnuNegaciju(tekst) {
    let rezultat = tekst;
    const atom = "(?:\\([^()]+\\)|[A-Z])";

    rezultat = rezultat.replace(new RegExp(`\\bne\\s*ću\\s*(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bneću\\s*(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bneće\\s*(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bnece\\s*(${atom})`, "gi"), "¬$1");

    rezultat = rezultat.replace(new RegExp(`\\bnisam\\s+(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bnisi\\s+(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bnije\\s+(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bnismo\\s+(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bniste\\s+(${atom})`, "gi"), "¬$1");
    rezultat = rezultat.replace(new RegExp(`\\bnisu\\s+(${atom})`, "gi"), "¬$1");

    rezultat = rezultat.replace(new RegExp(`\\bne\\s+(${atom})`, "gi"), "¬$1");

    rezultat = rezultat.replace(/¬¬([A-Z])/g, "$1");
    rezultat = rezultat.replace(/¬¬\(/g, "(");

    return rezultat;
}

function obradiPosebneSlucajeve(tekst) {
    let rezultat = tekst;
    const atom = "(?:¬?[A-Z]|\\([^()]+\\))";

    rezultat = rezultat.replace(new RegExp(`\\bbilo\\s+(${atom})\\s+bilo\\s+(${atom})\\b`, "gi"), "($1 ∨ $2)");
    rezultat = rezultat.replace(new RegExp(`\\b(${atom})\\s+ako i samo ako\\s+(${atom})\\b`, "gi"), "($1 ↔ $2)");
    rezultat = rezultat.replace(new RegExp(`\\b(${atom})\\s+samo ako\\s+(${atom})\\b`, "gi"), "($1 → $2)");
    rezultat = rezultat.replace(new RegExp(`^samo ako\\s+(${atom})\\s+(${atom})$`, "i"), "($2 → $1)");
    rezultat = rezultat.replace(new RegExp(`^ako\\s+(${atom})\\s+onda\\s+(${atom})$`, "i"), "($1 → $2)");

    rezultat = rezultat.replace(new RegExp(`^budući da\\s+(${atom})\\s+(${atom})$`, "i"), "($1 → $2)");
    rezultat = rezultat.replace(new RegExp(`^buduci da\\s+(${atom})\\s+(${atom})$`, "i"), "($1 → $2)");
    rezultat = rezultat.replace(new RegExp(`^pod pretpostavkom da\\s+(${atom})\\s+(${atom})$`, "i"), "($1 → $2)");
    rezultat = rezultat.replace(new RegExp(`^u slučaju da\\s+(${atom})\\s+(${atom})$`, "i"), "($1 → $2)");
    rezultat = rezultat.replace(new RegExp(`^u slucaju da\\s+(${atom})\\s+(${atom})$`, "i"), "($1 → $2)");

    return rezultat;
}

function zamijeniMaluRijec(tekst, rijec, zamjena) {
    const regex = new RegExp(`(^|[\\s(])${escapeRegExp(rijec)}(?=[\\s),.;!?]|$)`, "g");
    return tekst.replace(regex, (match, p1) => `${p1}${zamjena}`);
}

function zamijeniLogickeVeznike(tekst) {
    let rezultat = tekst;

    rezultat = zamijeniMaluRijec(rezultat, "i", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "pa", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "te", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "a", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "ali", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "nego", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "no", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "već", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "mada", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "premda", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "iako", "∧");
    rezultat = zamijeniMaluRijec(rezultat, "ili", "∨");

    return rezultat;
}

function tokenizirajIzraz(tekst) {
    const tokeni = [];
    let i = 0;

    while (i < tekst.length) {
        const c = tekst[i];

        if (/\s/.test(c)) {
            i++;
            continue;
        }

        if (c === "¬") {
            tokeni.push({ tip: "NOT", v: "¬" });
            i++;
            continue;
        }

        if (["∧", "∨", "→", "↔"].includes(c)) {
            tokeni.push({ tip: "OP", v: c });
            i++;
            continue;
        }

        if (c === "(") {
            tokeni.push({ tip: "LP", v: "(" });
            i++;
            continue;
        }

        if (c === ")") {
            tokeni.push({ tip: "RP", v: ")" });
            i++;
            continue;
        }

        if (/[A-Z]/.test(c)) {
            tokeni.push({ tip: "VAR", v: c });
            i++;
            continue;
        }

        return [];
    }

    return tokeni;
}

function prioritet(op) {
    if (op === "¬") return 5;
    if (op === "∧") return 4;
    if (op === "∨") return 3;
    if (op === "→") return 2;
    if (op === "↔") return 1;
    return 0;
}

function asocijativnost(op) {
    if (op === "¬" || op === "→") return "R";
    return "L";
}

function napraviASTizTokena(tokeni) {
    const output = [];
    const ops = [];

    function pushOp(opToken) {
        while (ops.length) {
            const top = ops[ops.length - 1];
            if (top.tip !== "OP" && top.tip !== "NOT") break;

            const pTop = prioritet(top.v);
            const pCur = prioritet(opToken.v);

            if (
                (asocijativnost(opToken.v) === "L" && pCur <= pTop) ||
                (asocijativnost(opToken.v) === "R" && pCur < pTop)
            ) {
                output.push(ops.pop());
            } else {
                break;
            }
        }
        ops.push(opToken);
    }

    for (const tok of tokeni) {
        if (tok.tip === "VAR") {
            output.push(tok);
        } else if (tok.tip === "NOT") {
            pushOp({ tip: "NOT", v: "¬" });
        } else if (tok.tip === "OP") {
            pushOp(tok);
        } else if (tok.tip === "LP") {
            ops.push(tok);
        } else if (tok.tip === "RP") {
            while (ops.length && ops[ops.length - 1].tip !== "LP") {
                output.push(ops.pop());
            }
            if (ops.length && ops[ops.length - 1].tip === "LP") {
                ops.pop();
            }
        }
    }

    while (ops.length) {
        const op = ops.pop();
        if (op.tip !== "LP") output.push(op);
    }

    const stack = [];

    for (const tok of output) {
        if (tok.tip === "VAR") {
            stack.push({ tip: "VAR", v: tok.v });
        } else if (tok.tip === "NOT") {
            const a = stack.pop();
            if (!a) throw new Error("Pogrešna negacija");
            stack.push({ tip: "NOT", a });
        } else if (tok.tip === "OP") {
            const b = stack.pop();
            const a = stack.pop();
            if (!a || !b) throw new Error("Pogrešan operator");
            stack.push({ tip: "BIN", op: tok.v, a, b });
        }
    }

    if (stack.length !== 1) {
        throw new Error("Neispravan izraz");
    }

    return stack[0];
}

function ispisiAST(ast) {
    if (ast.tip === "VAR") return ast.v;

    if (ast.tip === "NOT") {
        const unutra = ispisiAST(ast.a);
        if (ast.a.tip === "BIN") return `¬(${unutra})`;
        return `¬${unutra}`;
    }

    if (ast.tip === "BIN") {
        return `(${ispisiAST(ast.a)} ${ast.op} ${ispisiAST(ast.b)})`;
    }

    return "";
}

function dodajZagrade(tekst) {
    try {
        const tokeni = tokenizirajIzraz(tekst);
        if (!tokeni.length) return tekst;
        const ast = napraviASTizTokena(tokeni);
        return ispisiAST(ast);
    } catch {
        return tekst;
    }
}

function ocistiFormat(tekst) {
    return tekst
        .replace(/[.,;!?]+$/g, "")
        .replace(/([∧∨→↔])/g, " $1 ")
        .replace(/¬\s+/g, "¬")
        .replace(/\s+/g, " ")
        .replace(/\s*\(\s*/g, "(")
        .replace(/\s*\)\s*/g, ")")
        .replace(/\(\((.+?)\)\)/g, "($1)")
        .trim();
}

function parsirajRecenicu() {
    const recenica = normalizirajTekst(unosRecenice.value).replace(/[.!?]+$/, "");

    if (!recenica) {
        izlaz.innerHTML = `<span style="color:#e74c3c;">Molimo unesite rečenicu za analizu.</span>`;
        return;
    }

    if (!varijable.some(v => v.iskaz.trim() !== "")) {
        izlaz.innerHTML = `<span style="color:#e74c3c;">Molimo unesite barem jednu varijablu.</span>`;
        return;
    }

    try {
        let rezultat = recenica;

        rezultat = zamijeniIskaze(rezultat);
        rezultat = obradiFrazeNegacije(rezultat);
        rezultat = obradiNiNitiKonstrukcije(rezultat);
        rezultat = obradiObicnuNegaciju(rezultat);
        rezultat = obradiPosebneSlucajeve(rezultat);
        rezultat = zamijeniLogickeVeznike(rezultat);
        rezultat = ocistiFormat(rezultat);
        rezultat = dodajZagrade(rezultat);
        rezultat = ocistiFormat(rezultat);

        izlaz.innerHTML = `<strong>Originalna rečenica:</strong>
${recenica}

<strong>Logički izraz:</strong>
<span class="simbol">${rezultat}</span>`;
    } catch (e) {
        izlaz.innerHTML = `<span style="color:#e74c3c;">Došlo je do greške pri parsiranju.</span>`;
    }
}

function resetirajFormu() {
    if (unosRecenice) unosRecenice.value = "";
    varijable = [];
    dodajVarijablu();
    if (izlaz) izlaz.textContent = "Ovdje će se prikazati logički izraz...";
}

document.addEventListener("DOMContentLoaded", pokreniAplikaciju);
