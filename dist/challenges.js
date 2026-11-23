export const challenges = {
  glycolysis: {
    question: "Un glucosio contiene 6 carboni. Dove li ritrovi alla fine della glicolisi?",
    choices: ["In due piruvati da 3 carboni", "In sei molecole di CO₂", "In una molecola di ATP"],
    explanations: [
      "Esatto. Conta le due terne nel modello: 2 × 3 restituisce i 6 carboni iniziali. La glicolisi produce anche ATP e NADH.",
      "La CO₂ viene liberata più avanti, nella trasformazione del piruvato in acetil-CoA e nel ciclo di Krebs. Qui i 6 carboni restano nei prodotti organici.",
      "L’ATP si forma trasferendo un fosfato all’ADP. Per seguire il carbonio del glucosio, conta invece i carboni dei due piruvati."
    ],
    correct: 0, step: 3
  },
  krebs: {
    question: "Il citrato contiene 6 carboni e l’acetile ne porta 2. Chi fornisce gli altri 4?",
    choices: ["Due molecole di CO₂", "L’ossalacetato", "Il coenzima A"],
    explanations: [
      "Due molecole di CO₂ contengono in tutto 2 carboni. All’inizio del giro serve una molecola a 4 carboni che accolga il gruppo acetile.",
      "Esatto. I 4 carboni dell’ossalacetato e i 2 dell’acetile formano il citrato. A fine giro si rigenera ossalacetato e può entrare un altro acetile.",
      "Il coenzima A trasporta il gruppo acetile e viene liberato al momento della formazione del citrato. I restanti 4 carboni provengono dall’ossalacetato."
    ],
    correct: 1, step: 1
  },
  oxidative: {
    question: "Quali particelle attraversano l’ATP sintasi e in quale direzione?",
    choices: ["Elettroni verso l’ossigeno", "Protoni verso lo spazio intermembrana", "Protoni verso la matrice"],
    explanations: [
      "Gli elettroni arrivano all’ossigeno al complesso IV. Nell’ATP sintasi passa un’altra particella: osserva gli H⁺ evidenziati in rosa.",
      "Hai individuato le particelle. Il pompaggio verso lo spazio intermembrana è compito dei complessi della catena. Segui ora il percorso di ritorno.",
      "Esatto. I protoni tornano nella matrice seguendo il loro gradiente elettrochimico. Il flusso alimenta la rotazione che permette di formare ATP da ADP e fosfato."
    ],
    correct: 2, step: 3
  }
};

export function showChallenge(key, phaseName) {
  const challenge = challenges[key];
  const answers = document.getElementById("answers");
  const feedback = document.getElementById("feedback");
  document.getElementById("challenge-phase").textContent = "Verifica la tua idea · " + phaseName;
  document.getElementById("challenge-title").textContent = challenge.question;
  feedback.textContent = "";
  answers.replaceChildren(...challenge.choices.map((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      for (const sibling of answers.children) {
        sibling.setAttribute("aria-pressed", String(sibling === button));
        delete sibling.dataset.result;
      }
      button.dataset.result = index === challenge.correct ? "correct" : "retry";
      feedback.textContent = challenge.explanations[index];
    });
    return button;
  }));
}
