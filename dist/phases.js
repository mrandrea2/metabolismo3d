export const colors = {
  carbon: "#a491ff",
  oxygen: "#f58c9b",
  product: "#63e8cc",
  phosphate: "#ffcb75",
  electron: "#72d8ff",
  proton: "#f9a0cf",
  co2: "#fb9b92",
  nadh: "#8ccaff",
  fadh: "#fcb3df"
};

export const phases = {
  glycolysis: {
    number: 1,
    title: "Glicolisi",
    location: "Citosol",
    accent: "#b8a9ff",
    ink: "#4f389f",
    rgb: "184 169 255",
    camera: { yaw: -.18, pitch: -.21, zoom: 1 },
    summary: "Un glucosio a sei atomi di carbonio diventa due piruvati a tre atomi di carbonio. La glicolisi non usa direttamente ossigeno.",
    legend: [[colors.carbon, "Carbonio"], [colors.oxygen, "Ossigeno"], [colors.phosphate, "Fosfato / ATP"], [colors.nadh, "NADH"]],
    unit: "Per 1 glucosio",
    metrics: [["2 piruvati", "Prodotti a 3 carboni"], ["+2 ATP netti", "4 formati, 2 consumati"], ["2 NADH", "Trasportatori di elettroni"]],
    source: "7-2-glycolysis",
    legendInk: ["#684bbd", "#af3d54", "#94601a", "#246597"],
    steps: [
      ["Investimento di energia", "La cellula usa 2 ATP per aggiungere due gruppi fosfato. Dopo alcune reazioni il glucosio è diventato fruttosio-1,6-bisfosfato, pronto a essere diviso."],
      ["Scissione in due triosi", "Lo scheletro a 6 carboni si divide in due molecole a 3 carboni. Una delle due viene convertita in gliceraldeide-3-fosfato, così entrambe proseguono lungo la stessa via."],
      ["Recupero di energia", "Le due triosi vengono ossidate. Due NAD⁺ ricevono elettroni e diventano NADH. Nei passaggi successivi il trasferimento di fosfati all’ADP produce in totale 4 ATP."],
      ["Due piruvati", "Dopo l’investimento iniziale restano 2 ATP netti, insieme a 2 NADH e 2 piruvati. Nella respirazione aerobica i piruvati entrano nel mitocondrio."]
    ]
  },
  krebs: {
    number: 2,
    title: "Ciclo di Krebs",
    location: "Matrice mitocondriale",
    accent: "#73e6cd",
    ink: "#06675b",
    rgb: "115 230 205",
    camera: { yaw: -.13, pitch: -.23, zoom: 1 },
    summary: "L’acetile entra in un ciclo che rigenera l’ossalacetato. Gran parte dell’energia recuperata passa ai trasportatori NADH e FADH₂.",
    legend: [[colors.product, "Intermedi del ciclo"], [colors.co2, "CO₂"], [colors.nadh, "NADH"], [colors.fadh, "FADH₂"], [colors.phosphate, "GTP o ATP"]],
    unit: "Per 1 giro · 2 giri per glucosio",
    metrics: [["3 NADH + 1 FADH₂", "Trasportatori ridotti"], ["1 GTP o ATP", "Energia subito utilizzabile"], ["2 CO₂", "Rilasciate nel ciclo"]],
    source: "7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle",
    legendInk: ["#087b65", "#ae433a", "#246597", "#a53c77", "#94601a"],
    steps: [
      ["Dal piruvato all’acetil-CoA", "Prima del ciclo, ogni piruvato a 3 carboni dà un acetil-CoA con un gruppo acetile a 2 carboni, una CO₂ e un NADH. Il bilancio sotto riguarda un giro del ciclo, a partire dall’acetil-CoA."],
      ["Ingresso e formazione del citrato", "Il gruppo acetile a 2 carboni si unisce all’ossalacetato a 4 carboni. Si forma il citrato a 6 carboni e il coenzima A viene liberato."],
      ["Ossidazioni e rilascio di CO₂", "Il citrato viene trasformato in isocitrato. Due reazioni successive rilasciano 2 CO₂ e producono 2 NADH. Il passaggio da succinil-CoA a succinato produce 1 GTP o ATP."],
      ["Rigenerazione dell’ossalacetato", "Dal succinato si passa a fumarato, malato e infine ossalacetato. In questi passaggi si formano 1 FADH₂ e 1 NADH. L’ossalacetato è pronto per un nuovo giro."]
    ]
  },
  oxidative: {
    number: 3,
    title: "Fosforilazione ossidativa",
    location: "Membrana mitocondriale interna",
    accent: "#ffcb83",
    ink: "#824516",
    rgb: "255 203 131",
    camera: { yaw: -.19, pitch: -.09, zoom: 1 },
    summary: "Gli elettroni alimentano una catena di trasporto. Il gradiente di protoni che ne risulta permette all’ATP sintasi di produrre ATP.",
    legend: [[colors.electron, "Elettroni (e⁻)"], [colors.proton, "Protoni (H⁺)"], [colors.phosphate, "ATP"]],
    unit: "Per 1 glucosio · resa indicativa",
    metrics: [["≈26–28 ATP", "Dalla fosforilazione ossidativa"], ["O₂", "Accettore finale degli elettroni"], ["H₂O", "Formata al complesso IV"]],
    source: "7-4-oxidative-phosphorylation",
    legendInk: ["#147091", "#a43773", "#94601a"],
    steps: [
      ["Ingresso degli elettroni", "Il NADH cede elettroni al complesso I. Gli elettroni del FADH₂ legato al complesso II entrano dalla seconda via. Entrambi i percorsi passano al coenzima Q."],
      ["Accumulo di protoni", "Dal coenzima Q gli elettroni passano al complesso III, al citocromo c e al complesso IV. I complessi I, III e IV usano l’energia del trasferimento per spostare H⁺ dalla matrice allo spazio intermembrana."],
      ["L’ossigeno forma acqua", "Al complesso IV l’ossigeno è l’accettore finale degli elettroni. Combinandosi con elettroni e protoni della matrice, forma acqua."],
      ["L’ATP sintasi produce ATP", "Gli H⁺ ritornano nella matrice attraverso l’ATP sintasi. Il loro flusso fa ruotare parte dell’enzima e permette di unire ADP e fosfato inorganico per formare ATP."]
    ]
  }
};
