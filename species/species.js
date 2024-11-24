const options = [
  { type: "planets", fields: ["name", "population"] },
  { type: "species", fields: ["name", "classification", "language"] },
  { type: "people", fields: ["name", "height", "mass"] },
  { type: "starships", fields: ["name", "model", "manufacturer"] },
  { type: "vehicles", fields: ["name", "model", "manufacturer", "cost_in_credits"] },
  { type: "films", fields: ["title", "episode_id", "producer", "created"] },
];

const button = document.querySelector(".more");

const limitManager = {
  baseLimit: 5,
  addedLimit: 5,
  get addedLimitValue() {
    return this.baseLimit;
  },
  addLim() {
    this.baseLimit += this.addedLimit;
  },
};

async function fetchTopLevelData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error("Error fetching top-level data:", error);
    return [];
  }
}

async function fetchNestedData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
    const data = await response.json();
    const match = options.find((option) => url.includes(option.type));
    if (match) {
      const { fields } = match;
      const limitedData = fields.map((field) => `${field}: ${data[field] || "N/A"}`).join(", ");
      return limitedData;
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Error fetching nested data from ${url}:`, error);
    return `Error fetching data`;
  }
}

async function updateHTML(dataArray, limit) {
  const container = document.getElementById("data-container");
  container.innerHTML = "";
  dataArray = dataArray.slice(0, limit);
  for (const item of dataArray) {
    const cardWrapper = document.createElement("div");
    cardWrapper.classList.add("card-wrapper");
    cardWrapper.style.position = "relative";
    const card = document.createElement("div");
    card.classList.add("card", "collapsed");
    card.style.maxHeight = "150px";
    card.style.overflow = "hidden";
    card.style.transition = "max-height 0.3s ease-in-out";
    const content = await Promise.all(
      Object.entries(item).map(async ([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `<div class=${key}><h3>${key}</h3><p>Information unavailable (no data provided)</p></div>`;
          }
          const arrayContent = await Promise.all(
            value.map(async (url) => {
              if (isLink(url)) {
                return `<li>${await fetchNestedData(url)}</li>`;
              }
              return `<li>${url}</li>`;
            })
          );
          return `
            <div class=${key}>
              <h3>${key}</h3>
              <ul>${arrayContent.join("")}</ul>
            </div>
          `;
        } else if (typeof value === "object" && value !== null) {
          if (Object.keys(value).length === 0) {
            return `<div class=${key}><h3>${key}</h3><p>Information unavailable (no data provided)</p></div>`;
          }
          return `<div class=${key}><h3>${key}</h3><p>${JSON.stringify(value)}</p></div>`;
        } else if (isLink(value)) {
          return `<div class=${key}><h3>${key}</h3><ul>${await fetchNestedData(value)}</ul></div>`;
        } else {
          return `<div class=${key}><h3>${key}</h3><p>${value || "Information unavailable (no data provided)"}</p></div>`;
        }
      })
    );
    card.innerHTML = content.join("");
    cardWrapper.appendChild(card);
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("card-toggle");
    toggleButton.textContent = "Extend";
    toggleButton.style.position = "absolute";
    toggleButton.style.bottom = "10px";
    toggleButton.style.right = "10px";
    toggleButton.addEventListener("click", () => {
      const isCollapsed = card.classList.contains("collapsed");
      if (isCollapsed) {
        card.style.maxHeight = `${card.scrollHeight}px`;
      } else {
        card.style.maxHeight = "150px";
      }
      card.classList.toggle("collapsed");
      card.classList.toggle("expanded");
      toggleButton.textContent = isCollapsed ? "Collapse" : "Extend";
    });
    cardWrapper.appendChild(toggleButton);
    container.appendChild(cardWrapper);
  }
}

async function handleNestedData(array) {
  return Promise.all(
    array.map(async (item) => {
      if (isLink(item)) {
        const fetchedData = await fetchNestedData(item);
        console.log(fetchedData);
        return `<li>${fetchedData}</li>`;
      } else {
        return `<li>${item}</li>`;
      }
    })
  );
}

async function fetchAndRenderData() {
  const url = "https://swapi.dev/api/species/";
  const data = await fetchTopLevelData(url);
  updateHTML(data, limitManager.addedLimitValue);
  const characterData = await fetchTopLevelData("https://swapi.dev/api/people/1/");
  console.log(characterData);
}

function isLink(value) {
  return typeof value === "string" && /^(http|https):\/\//.test(value);
}

button.addEventListener("click", () => {
  limitManager.addLim();
  fetchAndRenderData();
});

(async function () {
  fetchAndRenderData();
})();
