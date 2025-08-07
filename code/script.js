// Dimensioni SVG e margini maggiori per non tagliare le sagome
const width  = window.innerWidth;
const height = window.innerHeight;
const margin = { top: 50, right: 50, bottom: 50, left: 50 };

// Steps di visualizzazione: indici delle variabili [X, Y]
const steps = [
  [0, 1], // x1, y1
  [2, 3], // x2, y2
  [4, 5]  // x3, y3
];
let currentStep = 0;  // quale coppia di variabili stiamo usando
let data;             // array di oggetti con id e vars

// Colori per i 10 omini
const pastelColors = [
  "#4464AD", "#A4B0F5", "#FFB347", "#7D4600", "#439A86",
  "#D05353", "#F49AC2", "#DBABBE", "#09A129", "#957FEF"
];
const colorScale = d3.scaleOrdinal()
  .range(pastelColors);

// Seleziona l'SVG e imposta le dimensioni
const svg = d3.select('#canvas')
  .attr('width',  width)
  .attr('height', height);

// Visualizzazione tabella
function renderDataTable(data) {
  const container = d3.select('#data-table');
  
  // Header tabella
  const headerNames = ['ID','X1','Y1','X2','Y2','X3','Y3'];
  
  // Creo <table>
  const table = container.append('table');
  
  // Thead
  const thead = table.append('thead');
  thead.append('tr')
    .selectAll('th')
    .data(headerNames)
    .enter()
    .append('th')
    .text(d => d);
  
  // Tbody con i dati
  const tbody = table.append('tbody');
  const rows = tbody.selectAll('tr')
    .data(data)
    .enter()
    .append('tr');
  
  // Celle
  rows.selectAll('td')
    .data(d => [ d.id, ...d.vars ])
    .enter()
    .append('td')
    .text(d => d);
}

// Crea le scale in base all'indice delle variabili
function createScales(step) {
  const [iX, iY] = steps[step];
  const xExtent = d3.extent(data, d => d.vars[iX]);
  const yExtent = d3.extent(data, d => d.vars[iY]);

  const xScale = d3.scaleLinear()
    .domain(xExtent)
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain(yExtent)
    .range([height - margin.bottom, margin.top]); // origine in basso

  return { xScale, yScale };
}

// Aggiorna posizioni, colori e etichette con transizione
function updatePositions() {
  const { xScale, yScale } = createScales(currentStep);
  const [iX, iY] = steps[currentStep];

  // Seleziono gruppi esistenti
  const gruppi = svg.selectAll('.omino')
    .data(data, d => d.id);

  // Transizione
  gruppi.transition()
    .duration(800)
    .attr('transform', d => {
      const x = xScale(d.vars[iX]);
      const y = yScale(d.vars[iY]);
      return `translate(${x},${y})`;
    });

  // Aggiornamento testo delle etichette
  gruppi.select('text.coord-label')
    .transition()
    .duration(800)
    .text(d => `(${d.vars[iX]}; ${d.vars[iY]})`);
}

// Click su un omino -> cambia coppia di variabili e riposiziona
function onClick() {
  currentStep = (currentStep + 1) % steps.length;
  updatePositions();
}

// Tasto “n” -> ruota in avanti i valori di ogni omino
function onKeyDown(event) {
  if (event.key === 'n' || event.key === 'N') {
    data = data.map((d, i) => {
      const next = data[(i + 1) % data.length];
      return { id: d.id, vars: [...next.vars] };
    });
    updatePositions();
  }
}

// Caricamento dati e inizializzazione della visualizzazione
d3.json('data.json').then(json => {
  data = json;
  colorScale.domain(data.map(d => d.id));

  // Mostra tabella
  renderDataTable(data);

  // Creo un <g> per ogni omino
  const gruppi = svg.selectAll('.omino')
    .data(data, d => d.id)
    .enter()
    .append('g')
      .attr('class', 'omino')
      .on('click', onClick);

  // Testa (cerchio)
  gruppi.append('circle')
    .attr('class', 'omino-head')
    .attr('r', 10)
    .attr('cx', 0)
    .attr('cy', -15)
    .attr('fill', d => colorScale(d.id));

  // Corpo + braccia + gambe (linee)
  gruppi.append('line')
    .attr('class', 'omino-body')
    .attr('x1', 0).attr('y1', -5)
    .attr('x2', 0).attr('y2', 20)
    .attr('stroke', d => colorScale(d.id))
    .attr('stroke-width', 2);

  gruppi.append('line') // braccia
    .attr('class', 'omino-body')
    .attr('x1', -10).attr('y1', 5)
    .attr('x2', 10).attr('y2', 5)
    .attr('stroke', d => colorScale(d.id))
    .attr('stroke-width', 2);

  gruppi.append('line') // gamba sinistra
    .attr('class', 'omino-body')
    .attr('x1', 0).attr('y1', 20)
    .attr('x2', -10).attr('y2', 35)
    .attr('stroke', d => colorScale(d.id))
    .attr('stroke-width', 2);

  gruppi.append('line') // gamba destra
    .attr('class', 'omino-body')
    .attr('x1', 0).attr('y1', 20)
    .attr('x2', 10).attr('y2', 35)
    .attr('stroke', d => colorScale(d.id))
    .attr('stroke-width', 2);

  // Etichetta sotto ogni omino
  gruppi.append('text')
    .attr('class', 'coord-label')
    .attr('y', 45)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', d => colorScale(d.id))
    .text(d => `(${d.vars[0]}; ${d.vars[1]})`);

  // Posiziona inizialmente
  updatePositions();

  // Listener per il tasto “n”
  window.addEventListener('keydown', onKeyDown);
})
.catch(err => console.error('Errore caricamento JSON:', err));
